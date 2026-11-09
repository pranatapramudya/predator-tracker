// scripts/test-alert.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import {
  buildPredatorAlertMessage,
  buildInlineKeyboard,
  sendTelegramNotification,
} from "../src/lib/telegram";
import { auditTokenSecurity } from "../src/lib/rugcheck";

async function main() {
  const tokenAddress =
    process.argv[2] || "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // default Bonk

  console.log(
    `[AUDIT] Mengambil data pasar real-time untuk ${tokenAddress}...`,
  );

  // Ambil data pasar asli dari DexScreener
  const dexRes = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
  );
  const dexData = await dexRes.json();
  const pair =
    dexData.pairs && dexData.pairs.length > 0 ? dexData.pairs[0] : null;

  const tokenSymbol = pair?.baseToken?.symbol || "TOKEN";
  const currentPrice = parseFloat(pair?.priceUsd || "0");
  const testTradeUsd = 50.0; // Simulasi entri $50
  const tokenAmount = currentPrice > 0 ? testTradeUsd / currentPrice : 0;

  console.log(
    `[AUDIT] Menjalankan Satpam Anti-Rugpull untuk $${tokenSymbol}...`,
  );
  const rugAudit = await auditTokenSecurity(tokenAddress);
  console.log(`[AUDIT] Hasil: ${rugAudit.verdict} | LP: ${rugAudit.lpStatus}`);

  const txUrl = `https://solscan.io/token/${tokenAddress}`;

  const message = buildPredatorAlertMessage({
    network: "SOLANA",
    whaleName: "Smart Money Monitor",
    walletAddress: pair?.pairAddress || tokenAddress,
    action: "BUY",
    tokenSymbol,
    tokenAddress,
    amount: tokenAmount,
    usdValue: testTradeUsd,
    txUrl,
    rugAudit,
    confluenceCount: 1,
  });

  const keyboard = buildInlineKeyboard("SOLANA", tokenAddress, txUrl);

  console.log("Mengirim verifikasi ke Telegram...");
  // 1. Kirim ke Chat Pribadi (Asisten Crypto)
  await sendTelegramNotification({
    chatId: process.env.TELEGRAM_CHAT_ID || "2079693450",
    text: message,
    replyMarkup: { inline_keyboard: keyboard },
  });

  // 2. Kirim ke Channel (Predator Alpha Feed)
  const alphaChannelId =
    process.env.TELEGRAM_ALPHA_CHANNEL_ID || "-1003737826938";
  await sendTelegramNotification({
    chatId: alphaChannelId,
    text: message,
    replyMarkup: { inline_keyboard: keyboard },
  }).catch((err) => console.error("Gagal kirim ke channel:", err.message));

  console.log(
    "✅ Pesan verifikasi data real terkirim ke Asisten Crypto & Predator Alpha Feed!",
  );
}

main().catch((err) => {
  console.error("❌ Gagal:", err.message);
  process.exit(1);
});
