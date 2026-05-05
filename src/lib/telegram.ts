// src/lib/telegram.ts
import { getRequiredEnv } from "./env";

type WhaleAlertMessageInput = {
  network: string;
  walletLabel: string;
  action: "BUY" | "SELL";
  amount: number;
  tokenSymbol: string;
  txUrl: string;
};

// STRUKTUR BARU BUAT PANIC ALERT
type MegaAlertMessageInput = {
  tokenSymbol: string;
  walletCount: number;
  timeframeHours: number;
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount >= 1 ? 4 : 8,
  }).format(amount);
}

// FUNGSI LAMA (AMAN)
export function buildWhaleAlertMessage(input: WhaleAlertMessageInput): string {
  return [
    "🚨 WHALE ACTIVITY DETECTED!",
    `- Network: ${input.network}`,
    `- Wallet: ${input.walletLabel}`,
    `- Action: ${input.action}`,
    `- Amount: ${formatAmount(input.amount)} ${input.tokenSymbol}`,
    `- TX: ${input.txUrl}`,
  ].join("\n");
}

// TEMPLATE BARU KHUSUS MEGA EXIT
export function buildMegaAlertMessage(input: MegaAlertMessageInput): string {
  return [
    "🚨🔴 MASSIVE EXIT DETECTED! 🔴🚨",
    `⚠️ Panic Sell Warning for: $${input.tokenSymbol}`,
    `👀 ${input.walletCount} Smart Money wallets just DUMPED this token`,
    `⏱️ Timeframe: Last ${input.timeframeHours} Hour(s)`,
    `🏃‍♂️ Consider taking profits or managing risk NOW!`,
  ].join("\n");
}

// FUNGSI LAMA (Ke Global .env chat ID - AMAN)
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getRequiredEnv("TELEGRAM_CHAT_ID");

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
      signal: AbortSignal.timeout(3_000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error (${response.status}): ${errorText}`);
  }
}

// FUNGSI BARU (Buat SaaS - Tembak ke Channel User Spesifik)
export async function sendTargetedTelegramMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
      signal: AbortSignal.timeout(3_000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram API error targeted (${response.status}): ${errorText}`,
    );
  }
}
