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
  let feedback = "failed";
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  if (!address || !name || !network || !isValidAddress(address, network)) {
    return redirect("/?feedback=invalid");
  }

  try {
    const normalized =
      network === "SOLANA" || network === "BITCOIN"
        ? address
        : address.toLowerCase();
    let balance = 0;
    if (network === "BITCOIN") balance = await getBTCBalance(normalized);
    else if (network === "SOLANA") balance = await getSolanaBalance(normalized);
    else balance = await getEVMBalance(normalized, network);

    await prisma.wallet.upsert({
      where: { address_network: { address: normalized, network } },
      update: { name, lastBalance: balance, isActive: true },
      create: {
        address: normalized,
        name,
        network,
        lastBalance: balance,
        isActive: true,
      },
    });
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
  const wallets = await prisma.wallet
    .findMany({ orderBy: { createdAt: "desc" } })
    .catch(() => []);

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto space-y-10 bg-[#050505] text-white">
      <header className="flex justify-between items-end border-b border-white/10 pb-10">
        <h1 className="text-5xl font-black italic tracking-tighter">
          PREDATOR <span className="text-emerald-400">TRACKER</span>
        </h1>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-right">
          <p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">
            Targets
          </p>
          <p className="text-2xl font-black">{wallets.length}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 bg-white/5 border border-white/10 p-8 rounded-[32px] h-fit sticky top-10">
          <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
            <Shield className="text-emerald-400" /> Acquisition
          </h2>
          <form action={createWalletAction} className="space-y-4">
            <input
              name="address"
              required
              placeholder="Address..."
              className="w-full bg-black border border-white/10 p-4 rounded-2xl font-mono text-sm"
            />
            <select
              name="network"
              className="w-full bg-black border border-white/10 p-4 rounded-2xl font-bold"
            >
              {NETWORK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              name="name"
              required
              placeholder="Alias Name"
              className="w-full bg-black border border-white/10 p-4 rounded-2xl font-bold"
            />
            <button className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-emerald-400 transition-all uppercase">
              Start Radar
            </button>
          </form>
        </section>

        <section className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((w) => {
            const config = NETWORK_OPTIONS.find((n) => n.value === w.network);
            return (
              <div
                key={w.id}
                className="bg-white/5 border border-white/10 p-6 rounded-[28px] hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h4 className="text-xl font-black uppercase tracking-tight">
                      {w.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={NETWORK_LOGOS[w.network as WalletNetwork]}
                        alt=""
                        className="w-5 h-5"
                      />
                      <p className={`text-lg font-black ${config?.color}`}>
                        {w.network === "BITCOIN"
                          ? `₿ ${Number(w.lastBalance).toFixed(8)}`
                          : w.network === "SOLANA"
                            ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                            : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
                      </p>
                    </div>
                    <code className="text-[10px] opacity-30 mt-3 block font-mono">
                      {formatAddress(w.address)}
                    </code>
                  </div>
                  <form action={deleteWalletAction}>
                    <input type="hidden" name="id" value={w.id} />
                    <button className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                      <Trash2 size={18} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
