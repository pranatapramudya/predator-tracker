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
} from "lucide-react";

// --- CONFIG ---
const NETWORK_OPTIONS = [
  { value: "BITCOIN", label: "Bitcoin", color: "text-orange-500" },
  { value: "SOLANA", label: "Solana", color: "text-emerald-400" },
  { value: "ETHEREUM", label: "Ethereum", color: "text-cyan-400" },
  { value: "BASE", label: "Base", color: "text-indigo-400" },
] as const;

type WalletNetwork = (typeof NETWORK_OPTIONS)[number]["value"];

const FEEDBACK_COPY: Record<
  string,
  { title: string; description: string; icon: any; color: string }
> = {
  created: {
    title: "TARGET LOCKED",
    description: "Wallet paus berhasil masuk radar.",
    icon: CheckCircle2,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  updated: {
    title: "SYSTEM SYNCED",
    description: "Data wallet sudah diperbarui.",
    icon: Info,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  invalid: {
    title: "INVALID COORDS",
    description: "Cek kembali alamat dan network.",
    icon: AlertCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  failed: {
    title: "CORE ERROR",
    description: "Gagal tersambung ke database.",
    icon: AlertCircle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
};

// --- HELPERS ---
function isValidAddress(address: string, network: WalletNetwork): boolean {
  return network === "SOLANA"
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
    : /^0x[a-fA-F0-9]{40}$/.test(address);
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
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  // Validasi Awal
  if (!address || !name || !network || !isValidAddress(address, network)) {
    redirect("/?feedback=invalid");
  }

  let isSuccess = false;

  try {
    const normalized = network === "SOLANA" ? address : address.toLowerCase();

    // Operasi Database
    await prisma.wallet.upsert({
      where: { address_network: { address: normalized, network } },
      update: { name, isActive: true },
      create: { address: normalized, name, network, isActive: true },
    });

    // Paksa UI update
    revalidatePath("/");
    isSuccess = true;
  } catch (e) {
    console.error("Action Error:", e);
    // Kita biarkan isSuccess tetap false
  }

  // REDIRECT DI LUAR TRY-CATCH (WAJIB!)
  if (isSuccess) {
    redirect("/?feedback=created");
  } else {
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
    wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (dbError) {
    console.error("Database Connection Failed:", dbError);
  }

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-10">
      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] text-white/80 uppercase mb-4 shadow-lg shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Neural Link Active
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
            PREDATOR{" "}
            <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              TRACKER
            </span>
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2 font-medium">
            Real-time multi-chain surveillance system for high-value targets.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-5 py-3 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-xl shadow-xl">
            <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">
              Monitored
            </p>
            <p className="text-xl font-black text-white">
              {wallets.length}{" "}
              <span className="text-xs font-normal text-white/60 uppercase">
                Whales
              </span>
            </p>
          </div>
        </div>
      </header>

      {feedback && (
        <div
          className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-500 ${feedback.color}`}
        >
          <feedback.icon className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-black text-sm tracking-widest uppercase text-white">
              {feedback.title}
            </h4>
            <p className="text-sm text-white/90 font-medium">
              {feedback.description}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <section className="lg:col-span-4">
          <div className="sticky top-10 bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white drop-shadow-md">
                ACQUISITION
              </h2>
            </div>

            <form action={createWalletAction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-white/90 uppercase tracking-widest ml-1">
                  Wallet Address
                </label>
                <input
                  name="address"
                  required
                  placeholder="0x... or Solana Address"
                  className="w-full bg-black/60 border border-white/20 rounded-2xl px-5 py-4 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all placeholder:text-white/40 font-mono shadow-inner"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-white/90 uppercase tracking-widest ml-1">
                    Network
                  </label>
                  <select
                    name="network"
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 appearance-none cursor-pointer"
                  >
                    {NETWORK_OPTIONS.map((n) => (
                      <option
                        key={n.value}
                        value={n.value}
                        className="bg-slate-900 font-bold text-white"
                      >
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-white/90 uppercase tracking-widest ml-1">
                    Target Whale
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Wintermute"
                    className="w-full bg-black/60 border border-white/20 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all placeholder:text-white/40 shadow-inner"
                  />
                </div>
              </div>
              <button className="group relative w-full py-5 bg-white text-black font-black rounded-2xl transition-all hover:bg-emerald-400 active:scale-95 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  START TRACKING{" "}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-white/80 tracking-[0.2em] uppercase">
              <Activity className="w-4 h-4 text-cyan-400" /> Live Watchlist
            </h3>
            <span className="h-[1px] flex-grow mx-4 bg-white/20" />
          </div>

          {wallets.length === 0 ? (
            <div className="border-2 border-dashed border-white/10 rounded-[32px] p-20 text-center bg-black/20">
              <div className="inline-block p-6 bg-white/5 rounded-full mb-4">
                <Radio className="w-10 h-10 text-white/40 animate-pulse" />
              </div>
              <p className="text-white/60 font-medium italic text-lg">
                Scanning for targets... No wallets added yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map((wallet) => (
                <div
                  key={wallet.address}
                  className="group bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                        Target Name Whale
                      </p>
                      <h4 className="text-xl font-black text-white drop-shadow-md group-hover:text-emerald-400 transition-colors">
                        {wallet.name}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 bg-black/40 ${NETWORK_OPTIONS.find((n) => n.value === wallet.network)?.color}`}
                    >
                      {wallet.network}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                    <code className="text-sm text-white/80 font-mono tracking-wider font-bold">
                      {formatAddress(wallet.address)}
                    </code>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                      <span className="text-[10px] font-bold text-white/80 uppercase">
                        Monitored
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>
    </main>
  );
}
