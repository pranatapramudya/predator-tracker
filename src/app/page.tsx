import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Shield,
  Radio,
  Activity,
  Wallet as WalletIcon,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
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

// --- URL GAMBAR LOGO KOIN ---
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
    description: "Wallet paus berhasil masuk radar dan sistem notifikasi.",
    icon: CheckCircle2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  deleted: {
    title: "TARGET ELIMINATED",
    description: "Wallet berhasil dihapus dari sistem.",
    icon: Trash2,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  invalid: {
    title: "INVALID COORDS",
    description: "Cek kembali alamat (BTC/SOL/ETH) dan network.",
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

// --- HELPERS ---
function isValidAddress(address: string, network: WalletNetwork): boolean {
  if (network === "BITCOIN")
    return /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address);
  if (network === "SOLANA")
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

// --- SERVER ACTIONS ---
async function createWalletAction(formData: FormData) {
  "use server";
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const chatId = String(formData.get("chatId") ?? "").trim();
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  if (!address || !name || !network || !isValidAddress(address, network)) {
    redirect("/?feedback=invalid");
  }

  let success = false;
  try {
    const normalized =
      network === "SOLANA" || network === "BITCOIN"
        ? address
        : address.toLowerCase();

    // --- STEP: AMBIL SALDO MULTI-CHAIN ---
    let balance = 0;
    if (network === "SOLANA") balance = await getSolanaBalance(normalized);
    else if (network === "ETHEREUM" || network === "BASE")
      balance = await getEVMBalance(normalized, network);
    else if (network === "BITCOIN") balance = await getBTCBalance(normalized);

    console.log(
      `[PREDATOR DEBUG] New Target: ${name} | Net: ${network} | Bal: ${balance}`,
    );

    // 1. Simpan ke Database
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

    // 2. Kirim Notifikasi Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken && chatId) {
      let balSymbol =
        network === "SOLANA" ? "◎" : network === "BITCOIN" ? "₿" : "Ξ";
      let balDecimals = network === "BITCOIN" ? 8 : 4;

      const message =
        `🎯 *TARGET LOCKED: PAUS BARU!*\n\n` +
        `👤 *Name:* ${name}\n` +
        `🌐 *Network:* ${network}\n` +
        `💰 *Balance:* ${balSymbol} ${Number(balance).toFixed(balDecimals)}\n` +
        `📍 *Address:* \`${normalized}\`\n\n` +
        `_Lumestack Predator Tracker is now active._`;

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
  const id = String(formData.get("id"));
  try {
    await prisma.wallet.delete({ where: { id } });
    revalidatePath("/");
    redirect("/?feedback=deleted");
  } catch (e) {
    redirect("/?feedback=failed");
  }
}

// --- PAGE ---
export default async function Page({ searchParams }: { searchParams: any }) {
  noStore();
  const params = await searchParams;
  const feedback = params.feedback
    ? FEEDBACK_COPY[params.feedback as string]
    : null;

  let wallets: any[] = [];
  try {
    wallets = await prisma.wallet.findMany({ orderBy: { createdAt: "desc" } });
  } catch (e) {
    console.error("DB Error:", e);
  }

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-10 bg-[#050505] text-white">
      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] text-white/80 uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Lumestack Neural Link Active
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
            PREDATOR <span className="text-emerald-400">TRACKER</span>
          </h1>
        </div>
        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
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
          className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 ${feedback.color}`}
        >
          <feedback.icon className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-black text-sm tracking-widest uppercase">
              {feedback.title}
            </h4>
            <p className="text-sm opacity-90">{feedback.description}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <section className="lg:col-span-4">
          <div className="sticky top-10 bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase">
                Acquisition
              </h2>
            </div>
            <form action={createWalletAction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black opacity-60 uppercase tracking-widest ml-1">
                  Wallet Address
                </label>
                <input
                  name="address"
                  required
                  placeholder="Paste BTC, SOL, or EVM address..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-base font-bold focus:ring-2 focus:ring-emerald-500/60 outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black opacity-60 uppercase tracking-widest ml-1">
                    Network
                  </label>
                  <select
                    name="network"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold outline-none cursor-pointer"
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
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
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
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500/60"
                />
              </div>
              <button className="group relative w-full py-5 bg-white text-black font-black rounded-2xl transition-all hover:bg-emerald-400 active:scale-95">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  START TRACKING{" "}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-black opacity-60 tracking-[0.2em] uppercase">
              <Activity className="w-4 h-4 text-cyan-400" /> Live Watchlist
            </h3>
          </div>
          {wallets.length === 0 ? (
            <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 text-center text-white/40 italic">
              <Radio className="w-10 h-10 mx-auto mb-4 animate-pulse" />
              Scanning for high-value targets...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map((wallet) => {
                const config = NETWORK_OPTIONS.find(
                  (n) => n.value === wallet.network,
                );
                return (
                  <div
                    key={wallet.id}
                    className="group bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all shadow-xl relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          Target Whale
                        </p>
                        <h4 className="text-xl font-black group-hover:text-emerald-400 transition-colors">
                          {wallet.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <img
                            src={NETWORK_LOGOS[wallet.network as WalletNetwork]}
                            alt={wallet.network}
                            className="w-5 h-5 rounded-full bg-white p-0.5"
                          />
                          <span
                            className={`text-sm font-bold ${config?.color}`}
                          >
                            {wallet.network === "BITCOIN"
                              ? `₿ ${Number(wallet.lastBalance).toFixed(8)}`
                              : wallet.network === "SOLANA"
                                ? `◎ ${Number(wallet.lastBalance).toFixed(2)}`
                                : `Ξ ${Number(wallet.lastBalance).toFixed(4)}`}{" "}
                            {wallet.network === "SOLANA"
                              ? "SOL"
                              : wallet.network === "BITCOIN"
                                ? "BTC"
                                : "ETH"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 bg-black/40 ${config?.color}`}
                        >
                          {wallet.network}
                        </span>
                        <form action={deleteWalletAction}>
                          <input type="hidden" name="id" value={wallet.id} />
                          <button className="p-2 text-white/20 hover:text-rose-500 transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                      <code className="text-xs text-white/60 font-mono">
                        {formatAddress(wallet.address)}
                      </code>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">
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
