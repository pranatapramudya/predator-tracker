// src/app/invite/[chatId]/page.tsx

import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { Radio, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";

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

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

// 🔥 FUNGSI HAPUS KHUSUS UNTUK CLIENT
async function deleteClientWalletAction(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id"));
    await prisma.transaction.deleteMany({ where: { walletId: id } });
    await prisma.wallet.delete({ where: { id } });
    revalidatePath("/", "layout"); // Reset cache biar langsung ilang
  } catch (e) {
    console.error(e);
  }
}

export default async function PrivateWatchlistPage({
  params,
  searchParams,
}: {
  params: { chatId: string };
  searchParams: any;
}) {
  noStore();
  const { chatId } = await params;
  const sParams = await searchParams;

  const page = parseInt(sParams?.page as string) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const [myWallets, totalWallets] = await Promise.all([
    prisma.wallet.findMany({
      where: { chatId: String(chatId) },
      skip,
      take: limit,
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wallet.count({ where: { chatId: String(chatId) } }),
  ]);

  const totalPages = Math.ceil(totalWallets / limit);

  return (
    <main className="min-h-screen p-4 md:p-10 bg-[#080808] text-white">
      <header className="max-w-4xl mx-auto mb-10 flex justify-between items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Client Mode
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
            Private <span className="text-emerald-400">Radar</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-2">
            ID: {chatId}
          </p>
        </div>
        <Link
          href="/invite"
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all mb-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </header>

      <section className="max-w-4xl mx-auto space-y-6">
        {myWallets.length === 0 ? (
          <div className="border-2 border-dashed border-white/5 rounded-[32px] p-20 text-center text-white/40 uppercase tracking-widest text-xs">
            <Radio className="mx-auto mb-4 animate-pulse text-white/20" /> No
            Targets Found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myWallets.map((w) => {
                const config = NETWORK_OPTIONS.find(
                  (n) => n.value === w.network,
                );
                return (
                  <div
                    key={w.id}
                    className="bg-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                            Target Name
                          </p>
                          <h4 className="text-xl font-black uppercase truncate text-white">
                            {w.name}
                          </h4>
                        </div>

                        {/* 🔥 TOMBOL HAPUS & LOGO JARINGAN */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`text-[9px] font-black px-2 py-1 rounded-full border border-white/10 bg-black/60 uppercase shrink-0 ${config?.color}`}
                          >
                            {w.network}
                          </span>
                          <form action={deleteClientWalletAction}>
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

                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-5">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 text-center">
                          Live Balance
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <img
                            src={NETWORK_LOGOS[w.network as WalletNetwork]}
                            alt=""
                            className="w-6 h-6 rounded-full bg-white p-0.5 shrink-0"
                          />
                          <p
                            className={`text-2xl font-black text-center ${config?.color}`}
                          >
                            {w.network === "SOLANA"
                              ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                              : w.network === "BITCOIN"
                                ? `₿ ${Number(w.lastBalance).toFixed(8)}`
                                : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                          Recent Activity
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {w.transactions.map((tx, idx) => (
                            // 🔥 SPAN DIGANTI JADI TAG "A" BIAR BISA DI-KLIK!
                            <a
                              key={tx.id}
                              href={tx.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={`${tx.type} ${tx.tokenSymbol}`}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase transition-colors hover:brightness-125
                               ${tx.type === "BUY" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-rose-500/30 text-rose-400 bg-rose-500/10"} 
                               ${idx === 0 ? "ring-1 ring-white opacity-100" : "opacity-60"}`}
                            >
                              {tx.type === "BUY" ? "🟢" : "🔴"}{" "}
                              {tx.tokenSymbol.slice(0, 5)}
                            </a>
                          ))}
                          {w.transactions.length === 0 && (
                            <span className="text-[10px] text-white/20 italic">
                              No activity yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-white/5 flex justify-between items-center">
                      <code className="text-[10px] text-white/40 font-mono truncate max-w-[150px]">
                        {formatAddress(w.address)}
                      </code>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold opacity-60 uppercase">
                          Tracking
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 pt-8 pb-4">
                {page > 1 ? (
                  <a
                    href={`/invite/${chatId}?page=${page - 1}`}
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
                    href={`/invite/${chatId}?page=${page + 1}`}
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
    </main>
  );
}
