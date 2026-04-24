import { getRequiredEnv } from "./env";

type WhaleAlertMessageInput = {
  network: string;
  walletLabel: string;
  action: "BUY" | "SELL";
  amount: number;
  tokenSymbol: string;
  txUrl: string;
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount >= 1 ? 4 : 8,
  }).format(amount);
}

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

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getRequiredEnv("TELEGRAM_CHAT_ID");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
    signal: AbortSignal.timeout(3_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error (${response.status}): ${errorText}`);
  }
}
