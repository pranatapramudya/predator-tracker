// src/app/page.tsx
import UpgradeModal from "@/components/UpgradeModal";
import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";
// Sesuaikan import ini kalau lu naruh fungsinya di src/lib/scanner.ts
import { getOrFetchTokenIntel } from "@/lib/gemini";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import PnLChart from "@/components/PnLChart";
import { auditHistoricalWinRate } from "@/lib/scanner";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
  Shield,
  Radio,
  Activity,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  ExternalLink,
  Ghost,
  Flame, // Icon Api buat Trending
  BrainCircuit, // Icon AI buat narasi
  TrendingUp, // Icon Chart naik
} from "lucide-react";

export const dynamic = "force-dynamic";

const NETWORK_OPTIONS = [
  { value: "BITCOIN", label: "Bitcoin", color: "text-orange-500" },
  { value: "SOLANA", label: "Solana", color: "text-emerald-400" },
  { value: "ETHEREUM", label: "Ethereum", color: "text-cyan-400" },
  { value: "BASE", label: "Base", color: "text-indigo-400" },
] as const;

type WalletNetwork = (typeof NETWORK_OPTIONS)[number]["value"];

const NETWORK_LOGOS: Record<WalletNetwork, string> = {
  BITCOIN: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035",
  SOLANA: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035",
  ETHEREUM: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
  BASE: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

const FEEDBACK_COPY: Record<
  string,
  { title: string; description: string; icon: any; color: string }
> = {
  created: {
    title: "TARGET LOCKED",
    description: "Whale successfully added to radar.",
    icon: CheckCircle2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  deleted: {
    title: "TARGET ELIMINATED",
    description: "Target has been removed.",
    icon: Trash2,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  invalid: {
    title: "INVALID COORDS",
    description: "Please check the wallet address or network.",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  failed: {
    title: "CORE ERROR",
    description: "Failed to connect to the database or API.",
    icon: AlertCircle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  limit_reached: {
    title: "LIMIT REACHED",
    description: "Radar is full! Upgrade your tier to add more targets.",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  locked: {
    title: "TARGET LOCKED",
    description:
      "FREE accounts can only lock 1 permanent target. Upgrade tier to swap or add more whales.",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  too_fast: {
    title: "SLOW DOWN!",
    description:
      "Anti-DDoS system triggered. You are submitting too fast. Wait a minute.",
    icon: AlertCircle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
};

export function getTradeStyleBadge(transactions: any[]) {
  if (!transactions || transactions.length < 2) {
    return {
      label: "Unknown",
      color: "bg-white/10 text-white/50 border border-white/5",
      icon: "❓",
    };
  }

  let totalHoldTimeHours = 0;
  let pairCount = 0;

  const tokenGroups: Record<string, any[]> = {};
  transactions.forEach((tx) => {
    if (!tx.tokenAddress || tx.tokenAddress === "solana") return;
    if (!tokenGroups[tx.tokenAddress]) tokenGroups[tx.tokenAddress] = [];
    tokenGroups[tx.tokenAddress].push(tx);
  });

  for (const token in tokenGroups) {
    const txs = tokenGroups[token].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    let firstBuyTime = null;
    for (const tx of txs) {
      if (tx.type === "BUY" && !firstBuyTime) {
        firstBuyTime = tx.createdAt.getTime();
      } else if (tx.type === "SELL" && firstBuyTime) {
        const sellTime = tx.createdAt.getTime();
        const diffInHours = (sellTime - firstBuyTime) / (1000 * 60 * 60);
        totalHoldTimeHours += diffInHours;
        pairCount++;
        firstBuyTime = null;
      }
    }
  }

  if (pairCount === 0) {
    return {
      label: "Diamond Hands",
      color: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
      icon: "💎",
    };
  }

  const avgHoldTime = totalHoldTimeHours / pairCount;

  if (avgHoldTime < 24) {
    return {
      label: "Scalper",
      color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      icon: "⚡",
    };
  } else if (avgHoldTime >= 24 && avgHoldTime <= 168) {
    return {
      label: "Swing Trader",
      color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      icon: "🏄‍♂️",
    };
  } else {
    return {
      label: "Diamond Hands",
      color: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
      icon: "💎",
    };
  }
}

function isValidAddress(address: string, network: WalletNetwork): boolean {
  if (network === "BITCOIN")
    return /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address);
  if (network === "SOLANA")
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatAddress(address: string): string {
  return address.length <= 12
    ? address
    : `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function getWhaleTag(winRate: number, totalTrades: number) {
  if (totalTrades < 3)
    return {
      text: "UNRANKED",
      style:
        "bg-white text-black font-black border-none shadow-[0_0_12px_rgba(255,255,255,0.4)]",
    };
  if (winRate >= 70)
    return {
      text: "THE ORACLE",
      style:
        "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]",
    };
  if (winRate >= 40)
    return {
      text: "THE GRINDER",
      style: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    };
  return {
    text: "EXIT LIQUIDITY",
    style: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };
}

async function createWalletAction(formData: FormData) {
  "use server";
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(userId);
      if (!success) {
        console.warn(`[SECURITY] User ${userId} spamming Add Wallet form!`);
        redirect("/?feedback=too_fast");
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT")
      throw error;
    console.error("Redis Error:", error);
  }

  let feedback = "failed";
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  let chatId = String(formData.get("chatId") ?? "").trim();
  let alphaChannelId = String(formData.get("alphaChannelId") ?? "").trim();
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  if (!chatId || !alphaChannelId) {
    const existingUserWallets = await prisma.wallet.findMany({
      where: { userId: userId },
      select: { chatId: true, alphaChannelId: true },
    });

    if (!chatId) {
      chatId = existingUserWallets.find((w) => w.chatId)?.chatId || "";
    }
    if (!alphaChannelId) {
      alphaChannelId =
        existingUserWallets.find((w) => w.alphaChannelId)?.alphaChannelId || "";
    }
  }

  if (!address || !name || !network || !isValidAddress(address, network)) {
    redirect("/?feedback=invalid");
  }

  try {
    const normalized =
      network === "SOLANA" || network === "BITCOIN"
        ? address
        : address.toLowerCase();

    const userStatus = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { wallets: true } } },
    });

    if (!userStatus) {
      redirect("/?feedback=failed");
    }

    const isWalletExist = await prisma.wallet.findUnique({
      where: {
        address_network_userId: { address: normalized, network, userId },
      },
    });

    if (
      !isWalletExist &&
      userStatus.role !== "OWNER" &&
      userStatus._count.wallets >= userStatus.maxWallets
    ) {
      redirect("/?feedback=limit_reached");
    }

    let balance = 0;

    try {
      if (network === "BITCOIN") balance = await getBTCBalance(normalized);
      else if (network === "SOLANA")
        balance = await getSolanaBalance(normalized);
      else balance = await getEVMBalance(normalized, network);
    } catch (apiError) {
      balance = 0;
    }

    const savedWallet = await prisma.wallet.upsert({
      where: {
        address_network_userId: {
          address: normalized,
          network,
          userId,
        },
      },
      update: {
        name,
        chatId,
        alphaChannelId,
        lastBalance: balance,
        isActive: true,
      },
      create: {
        address: normalized,
        name,
        network,
        chatId,
        alphaChannelId,
        lastBalance: balance,
        isActive: true,
        userId,
      },
    });

    auditHistoricalWinRate(
      savedWallet.id,
      savedWallet.address,
      savedWallet.network,
    );

    if (chatId && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const welcomeMsg = `🎯 *NEW TARGET LOCKED!*\n\nYou've successfully added a new whale to the Predator Radar:\n\n👤 *Alias:* ${name}\n🌐 *Network:* ${network}\n📍 *Address:* \`${normalized}\`\n\nThe system is now monitoring this wallet 24/7. Standby for alpha signals! 🚀🐋`;

        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: welcomeMsg,
              parse_mode: "Markdown",
            }),
          },
        );
      } catch (error) {
        console.error("Failed to send add wallet notification:", error);
      }
    }

    revalidatePath("/");
    feedback = "created";
  } catch (e) {
    console.error(e);
  }
  redirect(`/?feedback=${feedback}`);
}

async function deleteWalletAction(formData: FormData) {
  "use server";
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let feedback = "failed";
  try {
    const id = String(formData.get("id"));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, role: true },
    });

    if (user?.tier === "FREE" && user?.role !== "OWNER") {
      redirect("/?feedback=locked");
    }

    await prisma.wallet.deleteMany({ where: { id, userId } });
    revalidatePath("/");
    feedback = "deleted";
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") {
      throw e;
    }
    console.error(e);
  }
  redirect(`/?feedback=${feedback}`);
}

export default async function Page({ searchParams }: { searchParams: any }) {
  noStore();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress || "no-email";

  const isAdmin = userEmail === "pranajaya52@gmail.com";

  const ghostUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (ghostUser && ghostUser.id !== userId) {
    console.log("Removing legacy ghost data for:", userEmail);
    await prisma.wallet.deleteMany({ where: { userId: ghostUser.id } });
    await prisma.user.delete({ where: { id: ghostUser.id } });
  }

  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: userEmail,
      name: clerkUser?.firstName || "Whale Hunter",
      ...(isAdmin ? { role: "OWNER" } : {}),
    },
    create: {
      id: userId,
      email: userEmail,
      name: clerkUser?.firstName || "Whale Hunter",
      role: isAdmin ? "OWNER" : "MEMBER",
    },
  });

  const params = await searchParams;
  const feedback = params.feedback
    ? FEEDBACK_COPY[params.feedback as string]
    : null;

  const page = parseInt(params?.page as string) || 1;
  const limit = 4;
  const skip = (page - 1) * limit;

  // 🔥 FETCH WALLET DATA 🔥
  const [wallets, totalWallets, userWalletsRecord, privateAlphaLogs] =
    await Promise.all([
      prisma.wallet
        .findMany({
          where: { userId: userId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            transactions: { orderBy: { createdAt: "desc" }, take: 50 },
            positions: true,
          },
        })
        .catch(() => []),
      prisma.wallet.count({ where: { userId: userId } }).catch(() => 0),
      prisma.wallet
        .findMany({
          where: { userId: userId },
          select: { chatId: true, alphaChannelId: true },
        })
        .catch(() => []),
      prisma.transaction
        .findMany({
          where: {
            usdValue: { gte: 1000 },
            wallet: { userId: userId },
          },
          include: { wallet: true },
          orderBy: { createdAt: "desc" },
          take: 15,
        })
        .catch(() => []),
    ]);

  // 🔥 KAITO & NANSEN ENGINE: FETCH TOP TRENDING TOKENS + AI INTEL 🔥
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const trendingBuys = await prisma.transaction.groupBy({
    by: ["tokenAddress", "tokenSymbol"],
    where: {
      type: "BUY",
      createdAt: { gte: twentyFourHoursAgo },
      tokenAddress: {
        notIn: ["solana", "eth", "btc", "USDC", "USDT", "WETH", "DAI"],
      },
    },
    _count: { walletId: true },
    orderBy: { _count: { walletId: "desc" } },
    take: 3,
  });

  // Eksekusi asinkron ke Gemini untuk dapet narasi
  const smartMoneyTrends = await Promise.all(
    trendingBuys.map(async (t) => {
      let intel = null;
      try {
        // 🔥 Tambahin "as string" di sini biar TypeScript nggak bawel
        intel = await getOrFetchTokenIntel(
          t.tokenAddress as string,
          t.tokenSymbol as string,
        );
      } catch (e) {
        console.error("Gagal load AI Intel", e);
      }
      return {
        symbol: t.tokenSymbol || "UNKNOWN",
        address: t.tokenAddress as string,
        buyCount: t._count.walletId,
        narrative: intel?.narrative || "Scanning...",
        mindshare: intel?.mindshare || "TBD",
      };
    }),
  );

  const totalPages = Math.ceil(totalWallets / limit);

  const savedChatId = userWalletsRecord.find((w) => w.chatId)?.chatId || "";
  const savedAlphaId =
    userWalletsRecord.find((w) => w.alphaChannelId)?.alphaChannelId || "";

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-[1600px] mx-auto space-y-10 bg-[#080808] text-white overflow-x-hidden transition-colors duration-300">
      <header className="flex flex-row items-center justify-between gap-4 pb-8 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse will-change-opacity transform-gpu" />{" "}
            Targeting System Online
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">
            Predator <span className="text-emerald-400">Tracker</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:block px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-right">
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">
              Your Whales
            </p>
            <p className="text-xl font-black">
              {totalWallets}{" "}
              <span className="text-xs font-normal text-white/40 italic">
                TARGETS
              </span>
            </p>
          </div>

          <UpgradeModal />

          <div className="border border-white/20 rounded-full p-1 hover:border-emerald-500/50 transition-colors bg-white/5">
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "w-10 h-10 md:w-12 md:h-12" },
              }}
            />
          </div>
        </div>
      </header>

      {feedback && (
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border bg-transparent animate-in fade-in slide-in-from-top-4 ${feedback.color}`}
        >
          <feedback.icon className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-tight">
              {feedback.title}
            </h4>
            <p className="text-sm opacity-90">{feedback.description}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 relative">
        <section className="lg:col-span-4 xl:col-span-3 h-fit lg:sticky lg:top-10">
          <div className="bg-[#121212] border border-white/10 rounded-[32px] p-6 shadow-2xl transition-colors">
            <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-3">
              <Shield className="text-emerald-400 w-5 h-5" /> Acquisition
            </h2>
            <form
              action={createWalletAction}
              className="space-y-5"
              autoComplete="off"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">
                  Wallet Address
                </label>
                <input
                  name="address"
                  required
                  autoComplete="new-password"
                  placeholder="BTC, SOL, or EVM..."
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none font-mono text-sm focus:border-emerald-500/50 transition-all text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">
                  Network
                </label>
                <select
                  name="network"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-4 font-bold outline-none cursor-pointer text-sm text-white"
                >
                  {NETWORK_OPTIONS.map((n) => (
                    <option
                      key={n.value}
                      value={n.value}
                      className="bg-zinc-900"
                    >
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">
                  Alias Name
                </label>
                <input
                  name="name"
                  required
                  autoComplete="off"
                  placeholder="Whale #1"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none text-sm focus:border-emerald-500/50 transition-all text-white"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Send className="w-3 h-3 text-cyan-400" /> Telegram ID
                  </label>
                  {!savedChatId && (
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 flex items-center gap-1"
                    >
                      🔍 Auto Find
                    </a>
                  )}
                </div>
                <input
                  name="chatId"
                  required={!savedChatId}
                  defaultValue={savedChatId}
                  readOnly={!!savedChatId}
                  placeholder="Example: 12345678"
                  className={`w-full rounded-2xl px-5 py-4 font-bold outline-none text-sm transition-all ${
                    savedChatId
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                      : "bg-black/60 border border-white/10 text-white focus:border-cyan-500/50"
                  }`}
                />
                {savedChatId && (
                  <p className="text-[8px] text-emerald-400/80 uppercase tracking-widest mt-2 ml-1 italic font-bold">
                    🔒 ID Locked (Auto-Sync)
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                    👑 Alpha Group ID (Optional)
                  </label>
                  {!savedAlphaId && (
                    <details className="group relative">
                      <summary className="text-[9px] font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer list-none outline-none [&::-webkit-details-marker]:hidden">
                        ❓ How to get ID
                      </summary>
                      <div className="absolute z-50 top-full right-0 mt-2 w-[280px] bg-[#121212] border border-amber-500/30 rounded-2xl p-4 shadow-2xl text-xs text-white/80 normal-case hidden group-open:block">
                        <p className="font-black text-amber-400 mb-2 uppercase tracking-widest text-[10px]">
                          Tutorial:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1.5 text-[10px] font-medium">
                          <li>Create a new Telegram Group/Channel.</li>
                          <li>
                            Add{" "}
                            <span className="text-amber-400 font-bold">
                              @RawDataBot
                            </span>{" "}
                            to the group.
                          </li>
                          <li>
                            The bot will send your Group ID (starts with{" "}
                            <code className="bg-black/50 px-1 py-0.5 rounded text-white">
                              -100...
                            </code>
                            ).
                          </li>
                          <li>Copy and paste it here.</li>
                          <li>
                            Don't forget to invite your Predator Tracker bot to
                            that group too!
                          </li>
                        </ol>
                      </div>
                    </details>
                  )}
                </div>
                <input
                  name="alphaChannelId"
                  defaultValue={savedAlphaId}
                  readOnly={!!savedAlphaId}
                  placeholder="Example: -100xxxxxx"
                  className={`w-full rounded-2xl px-5 py-4 font-bold outline-none text-sm transition-all ${
                    savedAlphaId
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-not-allowed"
                      : "bg-black/60 border border-white/10 text-white focus:border-amber-500/50"
                  }`}
                />
                {savedAlphaId ? (
                  <p className="text-[8px] text-amber-400/80 uppercase tracking-widest mt-2 ml-1 italic font-bold">
                    🔒 ID Locked (Auto-Sync)
                  </p>
                ) : (
                  <p className="text-[8px] text-white/40 uppercase tracking-widest mt-2 ml-1 italic font-bold">
                    *Leave blank to receive Alpha alerts in the standard chat
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-2 bg-white text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
              >
                START RADAR <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        <section className="block xl:hidden lg:col-span-8 w-full mt-2">
          {/* 🔥 TRENDING MOBILE/TABLET VIEW 🔥 */}
          <div className="bg-[#121212] border border-orange-500/30 rounded-[24px] p-5 shadow-2xl mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-xs font-black text-orange-400 tracking-widest flex items-center gap-2 uppercase">
                <Flame className="w-4 h-4" /> Smart Trends
              </h2>
              <span className="text-[8px] text-orange-400/50 uppercase tracking-widest font-bold border border-orange-500/20 px-2 py-1 rounded bg-orange-500/10">
                AI Mindshare
              </span>
            </div>
            <div className="space-y-2 relative z-10">
              {smartMoneyTrends.map((trend, i) => (
                <div
                  key={trend.address}
                  className="p-3 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white/40">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-black text-white">
                        {trend.symbol}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-white/50 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />{" "}
                      {trend.buyCount} Whales
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> {trend.narrative}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-2 py-1 rounded uppercase border ${trend.mindshare.includes("Hype") ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}
                    >
                      {trend.mindshare}
                    </span>
                  </div>
                </div>
              ))}
              {smartMoneyTrends.length === 0 && (
                <p className="text-[9px] text-white/30 text-center py-2 font-bold uppercase">
                  Gathering Data...
                </p>
              )}
            </div>
          </div>

          <details className="group">
            <summary className="list-none cursor-pointer bg-[#121212] border border-emerald-500/30 p-5 rounded-[24px] flex items-center justify-between font-black text-emerald-400 uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:border-emerald-400 transition-all outline-none">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span>📱 Open Alpha Feed</span>
              </div>
              <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform duration-300" />
            </summary>

            <div className="mt-4 bg-[#121212] border border-white/10 rounded-[24px] p-5 shadow-2xl animate-in fade-in slide-in-from-top-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {privateAlphaLogs.map((log) => (
                  <div
                    key={log.id}
                    className="group p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-xs font-bold text-white/80 group-hover:text-emerald-400 transition-colors uppercase truncate pr-2">
                        {log.wallet.name}
                      </p>
                      <span
                        suppressHydrationWarning
                        className="text-[9px] text-white/40 font-mono"
                      >
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 border rounded-md text-[9px] font-black tracking-widest ${log.type === "BUY" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}
                      >
                        {log.type === "BUY" ? "BUY" : "SELL"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white leading-none mb-1">
                          {log.tokenSymbol}
                        </span>
                        <span className="text-[10px] font-bold text-white/50 font-mono">
                          ${Number(log.usdValue).toLocaleString()}
                        </span>
                      </div>
                      <a
                        href={log.explorerUrl}
                        target="_blank"
                        className="ml-auto p-2 bg-white/5 rounded-xl opacity-50 hover:opacity-100 transition-opacity hover:bg-emerald-500/20 text-emerald-400"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}

                {privateAlphaLogs.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
                      No private signals yet...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </details>
        </section>

        <section className="lg:col-span-8 xl:col-span-6 space-y-6">
          <h3 className="flex items-center gap-2 text-sm font-black text-white/60 uppercase tracking-[0.2em] px-2">
            <Activity className="text-cyan-400 w-4 h-4" /> Your Watchlist
          </h3>
          {wallets.length === 0 ? (
            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 text-center text-white/40 italic uppercase tracking-widest text-xs">
              <Radio className="mx-auto mb-4 animate-pulse will-change-opacity" />
              Scanning Targets...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                {wallets.map((w) => {
                  const config = NETWORK_OPTIONS.find(
                    (n) => n.value === w.network,
                  );
                  const whaleTag = getWhaleTag(w.winRate, w.totalTrades);
                  const safeName = w.name || "Target";
                  const tradeStyle = getTradeStyleBadge(w.transactions);

                  // 🔥 KALKULASI FOMO METER (SHADOW BALANCE) 🔥
                  const totalInvested = w.positions.reduce(
                    (sum, p) => sum + Number(p.totalInvestedUsd),
                    0,
                  );
                  const totalPnl = w.positions.reduce(
                    (sum, p) => sum + Number(p.realizedPnlUsd),
                    0,
                  );
                  const roiPercent =
                    totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

                  // Base shadow balance lu ambil dari dbUser, kalau belum ada kita kasih default $100
                  const baseShadow = dbUser.shadowBalance || 100;
                  const shadowProfit = (baseShadow * roiPercent) / 100;
                  const shadowTotal = baseShadow + shadowProfit;
                  const isFomoPositive = shadowProfit >= 0;

                  return (
                    <div
                      key={w.id}
                      className="group bg-[#121212] border border-white/5 p-5 rounded-3xl hover:border-white/20 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between transform-gpu will-change-transform contain-content"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4 relative z-10 gap-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
                                Target Whale
                              </p>
                              <span
                                className={`text-[8px] px-2 py-0.5 rounded border tracking-widest whitespace-nowrap ${whaleTag.style}`}
                              >
                                {whaleTag.text}
                              </span>
                            </div>
                            <h4
                              className="text-lg font-black group-hover:text-emerald-400 transition-colors uppercase truncate block"
                              title={safeName}
                            >
                              {safeName}
                            </h4>

                            <div className="flex flex-col gap-2 mt-2">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    NETWORK_LOGOS[w.network as WalletNetwork]
                                  }
                                  alt=""
                                  className="w-5 h-5 rounded-full bg-white p-0.5 shrink-0 shadow-sm"
                                />
                                <span
                                  className={`text-base font-black tracking-tight truncate ${config?.color}`}
                                >
                                  {w.network === "BITCOIN"
                                    ? `₿ ${Number(w.lastBalance).toFixed(8)}`
                                    : w.network === "SOLANA"
                                      ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                                      : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
                                </span>
                              </div>
                              <div
                                className={`text-[9px] px-2 py-1 rounded w-fit uppercase font-bold tracking-widest flex items-center gap-1.5 shadow-sm ${tradeStyle.color}`}
                              >
                                <span>{tradeStyle.icon}</span>{" "}
                                {tradeStyle.label}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-[8px] font-black px-2 py-1 rounded-full border border-white/10 bg-black/60 tracking-tighter uppercase ${config?.color}`}
                            >
                              {w.network}
                            </span>

                            {dbUser.tier === "FREE" &&
                            dbUser.role !== "OWNER" ? (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 text-white/20 cursor-not-allowed transition-colors"
                                title="Slot locked! Upgrade your radar to SCOUT/PREDATOR to change targets."
                              >
                                🔒
                              </button>
                            ) : (
                              <form action={deleteWalletAction}>
                                <input type="hidden" name="id" value={w.id} />
                                <button
                                  type="submit"
                                  className="p-1.5 text-white/20 hover:text-rose-500 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 relative z-10">
                          <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
                            <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-1">
                              Win Rate
                            </p>
                            <p
                              className={`text-sm font-black tracking-tight ${w.winRate >= 70 ? "text-amber-400" : w.winRate >= 40 ? "text-cyan-400" : w.winRate > 0 ? "text-rose-400" : "text-white"}`}
                            >
                              {Number(w.winRate).toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
                            <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-1">
                              Trades
                            </p>
                            <p className="text-sm font-black tracking-tight text-white">
                              <span
                                className={
                                  w.successTrades > 0
                                    ? "text-emerald-400"
                                    : "text-white"
                                }
                              >
                                {w.successTrades}
                              </span>
                              <span className="text-white/40 mx-1">/</span>
                              <span>{w.totalTrades}</span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">
                            PnL Performance
                          </p>
                          <PnLChart
                            data={(w.positions || []).map((p) => ({
                              tokenSymbol: p.tokenSymbol || "TOKEN",
                              pnl: Number(p.realizedPnlUsd) || 0,
                            }))}
                          />
                        </div>

                        {/* 🔥 FOMO CARD / SHADOW MODE UI 🔥 */}
                        <div
                          className={`mt-4 p-3 border rounded-xl flex justify-between items-center relative overflow-hidden transition-all ${isFomoPositive ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}
                        >
                          <div
                            className={`absolute -right-4 -top-4 w-16 h-16 blur-xl rounded-full ${isFomoPositive ? "bg-emerald-500/20" : "bg-rose-500/20"}`}
                          />
                          <div className="relative z-10">
                            <p
                              className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${isFomoPositive ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              <Ghost className="w-3 h-3" /> Shadow Mode (Base: $
                              {baseShadow})
                            </p>
                            <p className="text-xs font-bold text-white/80">
                              If copied:{" "}
                              <span
                                className={`font-black text-sm ${isFomoPositive ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                ${shadowTotal.toFixed(2)}
                              </span>
                            </p>
                          </div>
                          <div className="text-right relative z-10">
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                              Est. Profit
                            </p>
                            <p
                              className={`text-sm font-black ${isFomoPositive ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              {isFomoPositive ? "+" : ""}
                              {shadowProfit.toFixed(2)} USD
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">
                            Recent Activity
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {w.transactions.length > 0 ? (
                              w.transactions.slice(0, 10).map((tx, idx) => (
                                <div
                                  key={tx.id}
                                  className="flex items-center gap-1"
                                >
                                  <a
                                    href={tx.explorerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`${tx.type} ${tx.tokenSymbol}`}
                                    className={`relative text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border transition-all hover:brightness-110 
                                  ${tx.type === "BUY" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}
                                  ${idx === 0 ? "ring-1 ring-white shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-100" : "opacity-60"}`}
                                  >
                                    {tx.type === "BUY" ? "🟢" : "🔴"}{" "}
                                    {tx.tokenSymbol.slice(0, 5)}
                                  </a>
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-white/20 italic">
                                No recent trades
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 relative z-10">
                        <code className="text-[9px] text-white/60 font-mono tracking-tighter truncate max-w-[120px]">
                          {formatAddress(w.address)}
                        </code>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse will-change-opacity transform-gpu" />
                          <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">
                            Live
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 pt-8 pb-4 transform-gpu">
                  {page > 1 ? (
                    <a
                      href={`/?page=${page - 1}`}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </a>
                  ) : (
                    <div className="p-3 bg-white/5 opacity-30 rounded-xl border border-white/10 cursor-not-allowed">
                      <ChevronLeft className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-white/80 uppercase tracking-widest">
                    Page {page} <span className="text-white/30 mx-1">/</span>{" "}
                    {totalPages}
                  </span>
                  {page < totalPages ? (
                    <a
                      href={`/?page=${page + 1}`}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </a>
                  ) : (
                    <div className="p-3 bg-white/5 opacity-30 rounded-xl border border-white/10 cursor-not-allowed">
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <section className="hidden xl:block xl:col-span-3 h-fit sticky top-10">
          {/* 🔥 TRENDING DESKTOP VIEW 🔥 */}
          <div className="bg-[#121212] border border-orange-500/30 rounded-[32px] p-6 shadow-2xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-sm font-black text-orange-400 tracking-widest flex items-center gap-2 uppercase">
                <Flame className="w-4 h-4" /> Smart Trends
              </h2>
              <span className="text-[9px] text-orange-400/50 uppercase tracking-widest font-bold border border-orange-500/20 px-2 py-1 rounded bg-orange-500/10">
                AI Mindshare
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {smartMoneyTrends.map((trend, i) => (
                <div
                  key={trend.address}
                  className="p-3 bg-black/40 border border-white/5 rounded-2xl hover:border-orange-500/30 transition-all flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white/40">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-black text-white">
                        {trend.symbol}
                      </span>
                    </div>
                    <div className="text-[9px] font-bold text-white/50 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />{" "}
                      {trend.buyCount} Whales
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> {trend.narrative}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-2 py-1 rounded uppercase border ${trend.mindshare.includes("Hype") ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}
                    >
                      {trend.mindshare}
                    </span>
                  </div>
                </div>
              ))}

              {smartMoneyTrends.length === 0 && (
                <p className="text-[10px] text-white/30 text-center py-4 font-bold uppercase">
                  Accumulating Data...
                </p>
              )}
            </div>
          </div>

          <aside className="w-full bg-[#121212] border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-emerald-400 tracking-widest flex items-center gap-2 uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Alpha Feed
              </h2>
              <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">
                Live Sync
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {privateAlphaLogs.map((log) => (
                <div
                  key={log.id}
                  className="group p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold text-white/80 group-hover:text-emerald-400 transition-colors uppercase truncate pr-2">
                      {log.wallet.name}
                    </p>
                    <span
                      suppressHydrationWarning
                      className="text-[9px] text-white/40 font-mono"
                    >
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2 py-1 border rounded-md text-[9px] font-black tracking-widest ${log.type === "BUY" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}
                    >
                      {log.type === "BUY" ? "BUY" : "SELL"}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white leading-none mb-1">
                        {log.tokenSymbol}
                      </span>
                      <span className="text-[10px] font-bold text-white/50 font-mono">
                        ${Number(log.usdValue).toLocaleString()}
                      </span>
                    </div>

                    <a
                      href={log.explorerUrl}
                      target="_blank"
                      className="ml-auto p-2 bg-white/5 rounded-xl opacity-50 hover:opacity-100 transition-opacity hover:bg-emerald-500/20 text-emerald-400"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}

              {privateAlphaLogs.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
                    No private signals yet...
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
