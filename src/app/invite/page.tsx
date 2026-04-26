// src/app/invite/page.tsx

import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Send,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const NETWORK_OPTIONS = [
  { value: "BITCOIN", label: "Bitcoin" },
  { value: "SOLANA", label: "Solana" },
  { value: "ETHEREUM", label: "Ethereum" },
  { value: "BASE", label: "Base" },
] as const;

type WalletNetwork = (typeof NETWORK_OPTIONS)[number]["value"];

function isValidAddress(address: string, network: WalletNetwork): boolean {
  if (network === "BITCOIN")
    return /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address);
  if (network === "SOLANA")
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function registerPublicWalletAction(formData: FormData) {
  "use server";
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const chatId = String(formData.get("chatId") ?? "").trim();
  const network = String(
    formData.get("network") ?? "",
  ).toUpperCase() as WalletNetwork;

  if (
    !address ||
    !name ||
    !network ||
    !chatId ||
    !isValidAddress(address, network)
  ) {
    redirect("/invite?status=invalid");
  }

  let isSuccess = false; // Pengaman redirect

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
      const msg = `🎉 *WELCOME TO PREDATOR RADAR* 🎉\n\nHalo ${name}! Dompet target lo \`${normalized}\` udah berhasil masuk ke sistem pengawasan gue.\n\nTunggu notif paus pergerakan selanjutya! 🐳💸`;
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
    isSuccess = true;
  } catch (e) {
    console.error(e);
  }

  // 🔥 PERBAIKAN BUGS: Redirect dipindah ke luar blok try/catch
  if (isSuccess) {
    redirect(`/invite/${chatId}`);
  } else {
    redirect("/invite?status=failed");
  }
}

export default async function PublicInvitePage({
  searchParams,
}: {
  searchParams: any;
}) {
  const params = await searchParams;
  const status = params.status;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#080808] text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-lg z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-[0.3em] uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Public Access
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
            Predator <span className="text-emerald-400">Radar</span>
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Daftarkan dompet target untuk diawasi 24/7.
          </p>
        </div>

        {status === "invalid" && (
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase">DATA TIDAK VALID</h4>
              <p className="text-xs opacity-90">
                Cek alamat dompet atau ID Telegram.
              </p>
            </div>
          </div>
        )}

        <div className="bg-[#121212] border border-white/10 rounded-[32px] p-6 shadow-2xl">
          <div className="mb-8 p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
            <h3 className="text-sm font-black uppercase text-cyan-400 flex items-center gap-2">
              <Search className="w-4 h-4" /> Step 1: Dapatkan Telegram ID
            </h3>
            <p className="text-xs text-white/60">
              Sistem butuh ID rahasia akun Telegram lo biar bot bisa ngirim
              notif ke HP lo.
            </p>
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-bold transition-all text-sm uppercase tracking-wider"
            >
              Buka Telegram & Cari ID <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <form action={registerPublicWalletAction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1">
                Wallet Address Target
              </label>
              <input
                name="address"
                required
                placeholder="BTC, SOL, or EVM..."
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none font-mono text-sm focus:border-emerald-500/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1">
                  Network
                </label>
                <select
                  name="network"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-4 font-bold outline-none text-sm text-white"
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
                  Alias/Nama Temen Lo
                </label>
                <input
                  name="name"
                  required
                  placeholder="Paus 1"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none text-sm focus:border-emerald-500/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Send className="w-3 h-3 text-cyan-400" /> Telegram ID Lo
              </label>
              <input
                name="chatId"
                required
                placeholder="Tempel ID lo disini"
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none text-sm focus:border-cyan-500/50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
            >
              AKTIFKAN RADAR <Shield className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
