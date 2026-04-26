// src/app/page.tsx

import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  BASE: "https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.svg",
};

const FEEDBACK_COPY: Record<
  string,
  { title: string; description: string; icon: any; color: string }
> = {
  created: {
    title: "TARGET LOCKED",
    description: "Whale masuk radar.",
    icon: CheckCircle2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  deleted: {
    title: "TARGET ELIMINATED",
    description: "Target dihapus.",
    icon: Trash2,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  invalid: {
    title: "INVALID COORDS",
    description: "Cek alamat/network.",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  failed: {
    title: "CORE ERROR",
    description: "Gagal tersambung database/API.",
    icon: AlertCircle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
};

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

async function createWalletAction(formData: FormData) {
  "use server";
  let feedback = "failed";
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const chatId = String(formData.get("chatId") ?? "").trim();
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  if (!address || !name || !network || !isValidAddress(address, network)) {
    redirect("/?feedback=invalid");
  }

  try {
    const normalized =
      network === "SOLANA" || network === "BITCOIN"
        ? address
        : address.toLowerCase();
    let balance = 0;

    try {
      if (network === "BITCOIN") balance = await getBTCBalance(normalized);
      else if (network === "SOLANA")
        balance = await getSolanaBalance(normalized);
      else balance = await getEVMBalance(normalized, network);
    } catch (apiError) {
      balance = 0;
    }

    await prisma.wallet.upsert({
      where: { address_network: { address: normalized, network } },
      update: { name, chatId, lastBalance: balance, isActive: true },
      create: {
        address: normalized,
        name,
        network,
        chatId,
        lastBalance: balance,
        isActive: true,
      },
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken && chatId) {
      const sym =
        network === "BITCOIN" ? "₿" : network === "SOLANA" ? "◎" : "Ξ";
      const msg = `🎯 *TARGET LOCKED*\n👤 *Name:* ${name}\n💰 *Bal:* ${sym} ${Number(balance).toFixed(4)}`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg,
          parse_mode: "Markdown",
        }),
      });
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
  let feedback = "failed";
  try {
    const id = String(formData.get("id"));
    await prisma.transaction.deleteMany({ where: { walletId: id } });
    await prisma.wallet.delete({ where: { id } });
    revalidatePath("/");
    feedback = "deleted";
  } catch (e) {
    console.error(e);
  }
  redirect(`/?feedback=${feedback}`);
}

export default async function Page({ searchParams }: { searchParams: any }) {
  noStore();
  const params = await searchParams;
  const feedback = params.feedback
    ? FEEDBACK_COPY[params.feedback as string]
    : null;

  // LOGIKA PAGINATION MAKSIMAL 5 DATA PER HALAMAN
  const page = parseInt(params?.page as string) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const [wallets, totalWallets] = await Promise.all([
    prisma.wallet
      .findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
    prisma.wallet.count().catch(() => 0),
  ]);

  const totalPages = Math.ceil(totalWallets / limit);

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-10 bg-[#050505] text-white overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Neural Link
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
            Predator <span className="text-emerald-400">Tracker</span>
          </h1>
        </div>
        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl w-fit">
          <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">
            Monitored
          </p>
          <p className="text-xl font-black">
            {totalWallets}{" "}
            <span className="text-xs font-normal text-white/40 italic">
              WHALES
            </span>
          </p>
        </div>
      </header>

      {feedback && (
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border animate-in fade-in slide-in-from-top-4 ${feedback.color}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <section className="lg:col-span-4 h-fit sticky top-10">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl backdrop-blur-3xl">
            <h2 className="text-xl font-black uppercase mb-8 flex items-center gap-4">
              <Shield className="text-emerald-400" /> Acquisition
            </h2>
            <form action={createWalletAction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1">
                  Wallet Address
                </label>
                <input
                  name="address"
                  required
                  placeholder="BTC, SOL, or EVM..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none font-mono text-sm focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1">
                    Network
                  </label>
                  <select
                    name="network"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 font-bold outline-none cursor-pointer text-sm"
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
                  <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1">
                    Alias Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Whale #1"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none text-sm focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Send className="w-3 h-3 text-cyan-400" /> Telegram ID
                </label>
                <input
                  name="chatId"
                  required
                  placeholder="12345678"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none text-sm focus:border-cyan-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
              >
                START RADAR <ChevronRight />
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <h3 className="flex items-center gap-2 text-sm font-black opacity-60 uppercase tracking-[0.2em] px-2">
            <Activity className="text-cyan-400" /> Live Watchlist
          </h3>
          {wallets.length === 0 ? (
            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 text-center text-white/40 italic uppercase tracking-widest text-xs">
              <Radio className="mx-auto mb-4 animate-pulse" />
              Scanning Targets...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                {wallets.map((w) => {
                  const config = NETWORK_OPTIONS.find(
                    (n) => n.value === w.network,
                  );
                  return (
                    <div
                      key={w.id}
                      className="group bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="w-full">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                              Target Whale
                            </p>
                            <h4 className="text-xl font-black group-hover:text-emerald-400 transition-colors uppercase truncate pr-4">
                              {w.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-3">
                              <img
                                src={NETWORK_LOGOS[w.network as WalletNetwork]}
                                alt=""
                                className="w-6 h-6 rounded-full bg-white p-0.5"
                              />
                              <span
                                className={`text-lg font-black tracking-tight ${config?.color}`}
                              >
                                {w.network === "BITCOIN"
                                  ? `₿ ${Number(w.lastBalance).toFixed(8)}`
                                  : w.network === "SOLANA"
                                    ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                                    : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-[9px] font-black px-3 py-1 rounded-full border border-white/10 bg-black/60 tracking-tighter uppercase ${config?.color}`}
                            >
                              {w.network}
                            </span>
                            <form action={deleteWalletAction}>
                              <input type="hidden" name="id" value={w.id} />
                              <button
                                type="submit"
                                className="p-2 text-white/20 hover:text-rose-500 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* WARNA DITERANGKAN BIAR JELAS DI LAYAR HP */}
                        <div className="flex items-center gap-3 mt-5 relative z-10">
                          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-center">
                            <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">
                              Win Rate
                            </p>
                            <p
                              className={`text-base font-black tracking-tight ${w.winRate >= 50 ? "text-emerald-400" : w.winRate > 0 ? "text-amber-400" : "text-white"}`}
                            >
                              {Number(w.winRate).toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-center">
                            <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">
                              Trades (W/Total)
                            </p>
                            <p className="text-base font-black tracking-tight text-white">
                              <span
                                className={
                                  w.successTrades > 0
                                    ? "text-emerald-400"
                                    : "text-white"
                                }
                              >
                                {w.successTrades}
                              </span>
                              <span className="text-white/40 mx-1.5">/</span>
                              <span>{w.totalTrades}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5 relative z-10">
                        <code className="text-[10px] text-white/60 font-mono tracking-tighter">
                          {formatAddress(w.address)}
                        </code>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                          <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">
                            Live
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION NAVIGATION BUTTONS < > */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-6 pt-8 pb-4">
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
      </div>
    </main>
  );
}
