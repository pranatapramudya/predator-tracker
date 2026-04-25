import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Shield,
  Radio,
  Activity,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
} from "lucide-react";

// --- CONFIG ---
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
    description: "Wallet paus masuk radar.",
    icon: CheckCircle2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  deleted: {
    title: "TARGET ELIMINATED",
    description: "Target dihapus dari sistem.",
    icon: Trash2,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  invalid: {
    title: "INVALID COORDS",
    description: "Cek kembali alamat dan network.",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  failed: {
    title: "CORE ERROR",
    description: "Gagal tersambung ke database atau API.",
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
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const chatId = String(formData.get("chatId") ?? "").trim();
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  if (!address || !name || !network || !isValidAddress(address, network))
    redirect("/?feedback=invalid");

  let success = false;
  try {
    const normalized =
      network === "SOLANA" || network === "BITCOIN"
        ? address
        : address.toLowerCase();

    let balance = 0;
    if (network === "SOLANA") balance = await getSolanaBalance(normalized);
    else if (network === "ETHEREUM" || network === "BASE")
      balance = await getEVMBalance(normalized, network);
    else if (network === "BITCOIN") balance = await getBTCBalance(normalized);

    // Kirim debug log ke Vercel dashboard
    console.log(
      `[PREDATOR] Net: ${network} | Bal: ${balance} | Addr: ${normalized}`,
    );

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
      const message = `🎯 *TARGET LOCKED*\n👤 *Name:* ${name}\n🌐 *Net:* ${network}\n💰 *Bal:* ${sym} ${Number(balance).toFixed(network === "BITCOIN" ? 8 : 4)}\n📍 *Addr:* \`${normalized}\``;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });
    }
    revalidatePath("/");
    success = true;
  } catch (e) {
    console.error("Action Error:", e);
  }
  redirect(success ? "/?feedback=created" : "/?feedback=failed");
}

async function deleteWalletAction(formData: FormData) {
  "use server";
  try {
    await prisma.wallet.delete({ where: { id: String(formData.get("id")) } });
    revalidatePath("/");
    redirect("/?feedback=deleted");
  } catch (e) {
    redirect("/?feedback=failed");
  }
}

export default async function Page({ searchParams }: { searchParams: any }) {
  noStore();
  const params = await searchParams;
  const feedback = params.feedback
    ? FEEDBACK_COPY[params.feedback as string]
    : null;
  const wallets = await prisma.wallet
    .findMany({ orderBy: { createdAt: "desc" } })
    .catch(() => []);

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-10 bg-[#050505] text-white">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Neural Link Active
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
            PREDATOR <span className="text-emerald-400">TRACKER</span>
          </h1>
        </div>
        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">
            Monitored Targets
          </p>
          <p className="text-xl font-black">
            {wallets.length}{" "}
            <span className="text-xs font-normal text-white/40">WHALES</span>
          </p>
        </div>
      </header>

      {feedback && (
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border animate-in fade-in slide-in-from-top-4 ${feedback.color}`}
        >
          <feedback.icon className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-black text-sm uppercase">{feedback.title}</h4>
            <p className="text-sm opacity-90">{feedback.description}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <section className="lg:col-span-4">
          <div className="sticky top-10 bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-3xl">
            <h2 className="text-xl font-black uppercase mb-8 flex items-center gap-4">
              <Shield className="text-emerald-400" /> Acquisition
            </h2>
            <form action={createWalletAction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black opacity-60 uppercase tracking-widest ml-1">
                  Wallet Address
                </label>
                <input
                  name="address"
                  required
                  placeholder="BTC, SOL, or EVM..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black opacity-60 uppercase tracking-widest ml-1">
                    Network
                  </label>
                  <select
                    name="network"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 font-bold outline-none cursor-pointer"
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
                  <label className="text-[11px] font-black opacity-60 uppercase tracking-widest ml-1">
                    Alias Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Whale #1"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black opacity-60 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Send className="w-3 h-3 text-cyan-400" /> Telegram Chat ID
                </label>
                <input
                  name="chatId"
                  required
                  placeholder="e.g. 12345678"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-cyan-500/60"
                />
              </div>
              <button className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                START TRACKING <ChevronRight />
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <h3 className="flex items-center gap-2 text-sm font-black opacity-60 uppercase tracking-[0.2em]">
            <Activity className="text-cyan-400" /> Live Watchlist
          </h3>
          {wallets.length === 0 ? (
            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 text-center text-white/40 italic">
              <Radio className="mx-auto mb-4 animate-pulse" />
              Scanning...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map((w) => {
                const config = NETWORK_OPTIONS.find(
                  (n) => n.value === w.network,
                );
                return (
                  <div
                    key={w.id}
                    className="group bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase">
                          Target Whale
                        </p>
                        <h4 className="text-xl font-black group-hover:text-emerald-400 transition-colors">
                          {w.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <img
                            src={NETWORK_LOGOS[w.network as WalletNetwork]}
                            alt=""
                            className="w-5 h-5 rounded-full bg-white p-0.5"
                          />
                          <span
                            className={`text-sm font-bold ${config?.color}`}
                          >
                            {w.network === "BITCOIN"
                              ? `₿ ${Number(w.lastBalance).toFixed(8)}`
                              : w.network === "SOLANA"
                                ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                                : `Ξ ${Number(w.lastBalance).toFixed(4)}`}{" "}
                            {w.network}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 bg-black/40 ${config?.color}`}
                        >
                          {w.network}
                        </span>
                        <form action={deleteWalletAction}>
                          <input type="hidden" name="id" value={w.id} />
                          <button className="p-2 text-white/20 hover:text-rose-500 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                      <code className="text-xs text-white/60 font-mono">
                        {formatAddress(w.address)}
                      </code>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                        <span className="text-[10px] font-bold opacity-60 uppercase">
                          Live
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
