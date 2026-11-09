// src/lib/telegram.ts
import { getRequiredEnv } from "./env";
import { RugAuditResult } from "./rugcheck";

export type WhaleAlertMessageInput = {
  network: string;
  walletLabel: string;
  action: "BUY" | "SELL";
  amount: number;
  tokenSymbol: string;
  txUrl: string;
};

export type MegaAlertMessageInput = {
  tokenSymbol: string;
  walletCount: number;
  timeframeHours: number;
};

export interface PredatorAlertPayload {
  network: "SOLANA" | "BASE" | "ETHEREUM";
  whaleName: string;
  walletAddress: string;
  action: "BUY" | "SELL";
  tokenSymbol: string;
  tokenAddress: string;
  amount: number;
  usdValue: number;
  txUrl: string;
  rugAudit?: RugAuditResult | null;
  confluenceCount?: number;
  recentWalletsIn?: string[];
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount >= 1 ? 2 : 6,
  }).format(amount);
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
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

export function buildMegaAlertMessage(input: MegaAlertMessageInput): string {
  return [
    "🚨🔴 MASSIVE EXIT DETECTED! 🔴🚨",
    `⚠️ Panic Sell Warning for: $${input.tokenSymbol}`,
    `👀 ${input.walletCount} Smart Money wallets just DUMPED this token`,
    `⏱️ Timeframe: Last ${input.timeframeHours} Hour(s)`,
    `🏃‍♂️ Consider taking profits or managing risk NOW!`,
  ].join("\n");
}

/**
 * Format sinyal Alpha Predator lengkap dengan Anti-Rugpull Guard & Confluence Tracker
 */
export function buildPredatorAlertMessage(p: PredatorAlertPayload): string {
  const actionEmoji = p.action === "BUY" ? "🟢 BUY" : "🔴 SELL";
  const networkTag =
    p.network === "SOLANA"
      ? "⚡ SOLANA"
      : p.network === "BASE"
        ? "🔵 BASE"
        : "🔷 ETH";

  // Header
  const lines: string[] = [
    `👑 *PREDATOR SMART MONEY ALERT* | ${networkTag}`,
    `──────────────────────────`,
    `👤 *Whale:* ${p.whaleName} (\`${formatAddress(p.walletAddress)}\`)`,
    `📈 *Action:* ${actionEmoji}`,
    `🪙 *Token:* $${p.tokenSymbol}`,
    `💰 *Value:* $${p.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `📦 *Amount:* ${formatAmount(p.amount)} ${p.tokenSymbol}`,
    `📍 *Contract:* \`${p.tokenAddress}\``,
  ];

  // 1. Confluence Multi-Wallet Check
  if (p.action === "BUY") {
    const confluence = p.confluenceCount || 1;
    if (confluence >= 2) {
      lines.push(
        `\n🔥 *CONFLUENCE DETECTED: ${confluence} WALLETS IN!*`,
        `👥 Smart Money akumulasi bersamaan (High Probability Setup)`,
      );
    } else {
      lines.push(
        `\n⚠️ *SINGLE WALLET ENTRY* (1 Smart Money)`,
        `ℹ️ Belum ada konfirmasi akumulasi dari dompet paus lain`,
      );
    }
  }

  // 2. Anti-Rugpull Security Audit
  if (p.rugAudit) {
    const audit = p.rugAudit;
    const verdictEmoji =
      audit.verdict === "SAFE"
        ? "🟢 PASSED ANTI-RUG"
        : audit.verdict === "CAUTION"
          ? "🟡 CAUTION / MEDIUM RISK"
          : "🔴 DANGER / HIGH RUG RISK";

    lines.push(
      `\n🛡️ *ANTI-RUGPULL SECURITY AUDIT:*`,
      `Status: *${verdictEmoji}* (Score: ${audit.score >= 0 ? audit.score : "N/A"})`,
      `• *Liquidity:* ${audit.lpStatus}`,
      `• *Mint Authority:* ${audit.mintStatus}`,
      `• *Freeze Authority:* ${audit.freezeStatus}`,
      `• *Top 10 Holders:* ${audit.top10Status}`,
    );

    if (audit.warnings.length > 0) {
      lines.push(`⚠️ *Warnings:* ${audit.warnings.join(", ")}`);
    }
  }

  // 3. Tactical Micro-Sizing Recommendation (SOP Psikologis Rp 30k - Rp 50k)
  if (p.action === "BUY") {
    lines.push(
      `\n🎯 *TACTICAL SIZING (SOP MICRO-SIZING):*`,
      `💵 *Alokasi:* $2 – $3 (Rp 30.000 – Rp 50.000)`,
      `🎯 *Take Profit:* Tangga 20% – 50% (Ambil modal cepat, biarkan sisa moonbag)`,
      `🛑 *Stop Loss / Cut:* Jika dev dump / dev wallet mulai jual`,
    );
  }

  // Footer & Solscan
  lines.push(
    `\n🔍 *Tx Explorer:* [View on Explorer](${p.txUrl})`,
    `\n⚠️ _DYOR: On-chain signal radar. Bukan ajakan finansial (NFA)._`,
  );

  return lines.join("\n");
}

export function buildInlineKeyboard(
  network: "SOLANA" | "BASE" | "ETHEREUM",
  tokenAddress: string,
  txUrl: string,
) {
  if (network === "SOLANA" && tokenAddress && tokenAddress !== "solana") {
    return [
      [
        {
          text: "📊 DexScreener",
          url: `https://dexscreener.com/solana/${tokenAddress}`,
        },
        {
          text: "⚡ Jupiter Swap",
          url: `https://jup.ag/swap/SOL-${tokenAddress}`,
        },
      ],
      [
        {
          text: "🤖 BonkBot",
          url: `https://t.me/bonkbot_bot?start=ref_${tokenAddress}`,
        },
        {
          text: "🫧 Bubblemaps",
          url: `https://app.bubblemaps.io/sol/token/${tokenAddress}`,
        },
      ],
      [
        {
          text: "🛡️ RugCheck Full",
          url: `https://rugcheck.xyz/tokens/${tokenAddress}`,
        },
        { text: "🔍 Solscan Tx", url: txUrl },
      ],
    ];
  }

  if (network === "BASE" && tokenAddress) {
    return [
      [
        {
          text: "📊 DexScreener Base",
          url: `https://dexscreener.com/base/${tokenAddress}`,
        },
        { text: "🔍 Basescan Tx", url: txUrl },
      ],
    ];
  }

  return [[{ text: "🔍 View Transaction", url: txUrl }]];
}

export async function sendTelegramNotification(params: {
  chatId?: string;
  text: string;
  replyMarkup?: any;
}): Promise<void> {
  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = params.chatId || getRequiredEnv("TELEGRAM_CHAT_ID");

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: params.text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: params.replyMarkup,
      }),
      signal: AbortSignal.timeout(6_000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error (${response.status}): ${errorText}`);
  }
}

// Global default wrapper
export async function sendTelegramMessage(text: string): Promise<void> {
  await sendTelegramNotification({ text });
}

export async function sendTargetedTelegramMessage(
  chatId: string,
  text: string,
): Promise<void> {
  await sendTelegramNotification({ chatId, text });
}
