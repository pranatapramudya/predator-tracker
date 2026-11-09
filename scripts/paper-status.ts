// scripts/paper-status.ts
/**
 * 📊 PREDATOR TRACKER - PAPER TRADING PERFORMANCE ANALYZER
 * Mengevaluasi performa sinyal whale yang tertangkap radar tanpa risiko modal.
 */

import fs from "fs";
import path from "path";

interface SignalLog {
  timestamp: string;
  network: string;
  whaleName: string;
  walletAddress: string;
  action: string;
  tokenSymbol: string;
  tokenAddress: string;
  usdValue: number;
  priceUsd: number;
  txUrl: string;
  rugVerdict: string;
  confluenceCount: number;
}

const SIGNALS_PATH = path.resolve(process.cwd(), "data/signals.json");
const SIMULATED_ENTRY_USD = 3.0; // Standar SOP micro-sizing $3 per entri

async function fetchCurrentPrice(tokenAddress: string): Promise<number | null> {
  if (!tokenAddress || tokenAddress === "solana") return null;
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      {
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.pairs && data.pairs.length > 0) {
      return parseFloat(data.pairs[0].priceUsd || "0");
    }
  } catch {}
  return null;
}

function formatRoi(roi: number): string {
  if (roi >= 50) return `\x1b[32m+${roi.toFixed(1)}% 🚀 (TP2)\x1b[0m`;
  if (roi >= 20) return `\x1b[32m+${roi.toFixed(1)}% 🟢 (TP1)\x1b[0m`;
  if (roi >= 0) return `\x1b[36m+${roi.toFixed(1)}% ⚪\x1b[0m`;
  if (roi <= -50) return `\x1b[31m${roi.toFixed(1)}% 🩸 (RUG/DUMP)\x1b[0m`;
  return `\x1b[33m${roi.toFixed(1)}% 🟡\x1b[0m`;
}

async function main() {
  console.log("==================================================");
  console.log("📊 PREDATOR TRACKER: PAPER TRADING AUDIT REPORT 📊");
  console.log(
    `💵 Asumsi Ukuran Entri: $${SIMULATED_ENTRY_USD.toFixed(2)} (Rp ${(SIMULATED_ENTRY_USD * 16200).toLocaleString("id-ID")})`,
  );
  console.log("==================================================\n");

  if (!fs.existsSync(SIGNALS_PATH)) {
    console.log("Belum ada data sinyal tersimpan di data/signals.json.");
    console.log(
      "Jalankan `npm run daemon` terlebih dahulu untuk mulai merekam sinyal masuk.\n",
    );
    return;
  }

  const rawData = fs.readFileSync(SIGNALS_PATH, "utf-8");
  const signals: SignalLog[] = JSON.parse(rawData);

  if (signals.length === 0) {
    console.log(
      "Belum ada data sinyal. Pantau radar dengan `npm run daemon`.\n",
    );
    return;
  }

  const buySignals = signals.filter(
    (s) => s.action === "BUY" && s.priceUsd > 0,
  );

  if (buySignals.length === 0) {
    console.log(
      `Ditemukan ${signals.length} sinyal, tapi belum ada sinyal BUY dengan data harga valid.\n`,
    );
    return;
  }

  console.log(
    `Sedang mengambil harga real-time untuk ${buySignals.length} sinyal BUY...\n`,
  );

  let totalSimulatedPnl = 0;
  let winCount = 0;
  let rugFilteredCount = 0;

  console.log(
    "------------------------------------------------------------------------------------------------------",
  );
  console.log(
    "WAKTU               TOKEN     ENTRY PRICE    CURRENT PRICE   ROI %         ANTI-RUG    CONFLUENCE",
  );
  console.log(
    "------------------------------------------------------------------------------------------------------",
  );

  for (const sig of buySignals.slice(0, 20)) {
    const currentPrice = await fetchCurrentPrice(sig.tokenAddress);
    const dateStr = new Date(sig.timestamp).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!currentPrice || sig.priceUsd === 0) {
      console.log(
        `${dateStr.padEnd(19)} $${sig.tokenSymbol.padEnd(8)} $${sig.priceUsd.toFixed(6).padEnd(13)} N/A            N/A           ${sig.rugVerdict.padEnd(11)} ${sig.confluenceCount} Wallets`,
      );
      continue;
    }

    const roi = ((currentPrice - sig.priceUsd) / sig.priceUsd) * 100;
    const pnlUsd = (roi / 100) * SIMULATED_ENTRY_USD;
    totalSimulatedPnl += pnlUsd;

    if (roi >= 20) winCount++;
    if (sig.rugVerdict === "DANGER") rugFilteredCount++;

    const formattedRoiStr = formatRoi(roi);
    console.log(
      `${dateStr.padEnd(19)} $${sig.tokenSymbol.padEnd(8)} $${sig.priceUsd.toFixed(6).padEnd(13)} $${currentPrice.toFixed(6).padEnd(14)} ${formattedRoiStr.padEnd(20)} ${sig.rugVerdict.padEnd(11)} ${sig.confluenceCount >= 2 ? "🔥 " + sig.confluenceCount + " Wallets" : "1 Wallet"}`,
    );
  }

  const winRate =
    buySignals.length > 0 ? (winCount / buySignals.length) * 100 : 0;

  console.log(
    "------------------------------------------------------------------------------------------------------\n",
  );
  console.log("🏆 REKAPITULASI PAPER TRADING:");
  console.log(`• Total Sinyal Buy: ${buySignals.length}`);
  console.log(
    `• Sinyal Mencapai Target TP (>= +20%): ${winCount} (${winRate.toFixed(1)}%)`,
  );
  console.log(`• Koin DANGER Dicegat Satpam Anti-Rug: ${rugFilteredCount}`);
  console.log(
    `• Estimasi Total PnL ($${SIMULATED_ENTRY_USD}/posisi): ${totalSimulatedPnl >= 0 ? "+" : ""}$${totalSimulatedPnl.toFixed(2)} (Rp ${(totalSimulatedPnl * 16200).toLocaleString("id-ID")})`,
  );
  console.log(
    "\n💡 TIPS: Evaluasi koin yang lolos filter 'SAFE' vs 'DANGER' untuk melihat seberapa akurat sistem menyaring risiko.\n",
  );
}

main().catch(console.error);
