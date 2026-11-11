import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWhaleTrade } from "../pnl";
import { analyzeWhaleAction } from "@/lib/scanner";
import { auditTokenSecurity } from "@/lib/rugcheck";

export const maxDuration = 60;

async function getTokenMarketInfo(tokenAddress: string) {
  if (!tokenAddress || tokenAddress === "solana") return null;
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
    );
    const data = await res.json();
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      return {
        priceUsd: parseFloat(pair.priceUsd || "0"),
        tokenSymbol: pair.baseToken?.symbol || "MEME",
        fdv: pair.fdv || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0,
        pairCreatedAt: pair.pairCreatedAt || null,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

function buildKeyboard(tokenAddress: string, explorerUrl: string) {
  return [
    [
      { text: "🔍 Solscan Tx", url: explorerUrl },
      {
        text: "📊 DexScreener",
        url: `https://dexscreener.com/solana/${tokenAddress}`,
      },
    ],
    [
      { text: "⚡ Jupiter", url: `https://jup.ag/swap/SOL-${tokenAddress}` },
      {
        text: "🤖 BonkBot",
        url: `https://t.me/bonkbot_bot?start=ref_${tokenAddress}`,
      },
    ],
    [
      {
        text: "🐦 Search X",
        url: `https://twitter.com/search?q=${tokenAddress}`,
      },
      {
        text: "🫧 Bubblemaps",
        url: `https://app.bubblemaps.io/sol/token/${tokenAddress}`,
      },
    ],
  ];
}

async function sendTelegramMessage(
  chatId: string,
  message: string,
  inline_keyboard: any[] = [],
) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
          reply_markup:
            inline_keyboard.length > 0 ? { inline_keyboard } : undefined,
        }),
      },
    );
  } catch (err) {
    console.error("[TELEGRAM ERROR]", err);
  }
}

const FALLBACK_SOLANA_WHALES = [
  {
    id: "smart-money-alpha-1",
    name: "Smart Money Alpha #1",
    address: "HjxaEDvdje644vhUmE3VpjpteWLBmWgSsgvYhf6LVw2L",
    network: "SOLANA",
    minAlertUsd: 100,
    chatId: "2079693450",
    alphaChannelId: "-1003737826938",
    winRate: 33.3,
    totalTrades: 3,
  },
  {
    id: "smart-money-alpha-2",
    name: "Smart Money Alpha #2",
    address: "A3EkubssaFS1UP1DfYCEVsjndSZ7SYWbWTqDDUER73mv",
    network: "SOLANA",
    minAlertUsd: 100,
    chatId: "2079693450",
    alphaChannelId: "-1003737826938",
    winRate: 40.0,
    totalTrades: 5,
  },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ success: true, message: "Ping received" });
    }

    const globalAlphaChatId =
      process.env.TELEGRAM_ALPHA_CHANNEL_ID ||
      process.env.TELEGRAM_ALPHA_CHAT_ID;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID || "2079693450";
    const asistenMinDefault = Number(process.env.ASISTEN_MIN_USD || 100);
    const alphaMinDefault = Number(process.env.ALPHA_FEED_MIN_USD || 1000);

    for (const tx of body) {
      const signature = tx.signature;
      if (!signature) continue;

      const accountData = tx.accountData || [];
      const involvedAccounts: string[] = accountData.map((a: any) => a.account);

      let whales: any[] = [];
      try {
        whales = await prisma.wallet.findMany({
          where: {
            isActive: true,
            network: "SOLANA",
            address: { in: involvedAccounts },
          },
        });
      } catch {
        console.warn(
          "[HELIUS WEBHOOK] DB unreachable, falling back to watchlist config",
        );
      }

      if (!whales || whales.length === 0) {
        whales = FALLBACK_SOLANA_WHALES.filter((w) =>
          involvedAccounts.some(
            (acc: string) => acc?.toLowerCase() === w.address?.toLowerCase(),
          ),
        );
      }

      if (whales.length === 0) continue;

      const tokenTransfers = tx.tokenTransfers || [];

      for (const whale of whales) {
        let isExists = false;
        try {
          const found = await prisma.transaction.findFirst({
            where: { signature },
          });
          if (found) isExists = true;
        } catch {}
        if (isExists) continue;

        let isBuy = false;
        let isSell = false;
        let targetToken = "";
        let tokenAmount = 0;

        for (const transfer of tokenTransfers) {
          if (
            transfer.mint === "So11111111111111111111111111111111111111112" ||
            transfer.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ||
            transfer.mint === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
          ) {
            continue;
          }

          if (transfer.toUserAccount === whale.address) {
            isBuy = true;
            targetToken = transfer.mint;
            tokenAmount = Number(transfer.tokenAmount || 0);
          } else if (transfer.fromUserAccount === whale.address) {
            isSell = true;
            targetToken = transfer.mint;
            tokenAmount = Number(transfer.tokenAmount || 0);
          }
        }

        if (!targetToken) continue;

        const marketInfo = await getTokenMarketInfo(targetToken);
        const tokenSymbol = marketInfo?.tokenSymbol || "MEME";
        const currentPrice = marketInfo?.priceUsd || 0;
        const usdValue = tokenAmount * currentPrice;

        const minThreshold = whale.minAlertUsd ?? asistenMinDefault;
        if (usdValue < minThreshold) {
          console.log(
            `[KILL SWITCH] Tx Solana ${whale.name} diabaikan: $${usdValue.toFixed(2)} (< $${minThreshold})`,
          );
          continue;
        }

        try {
          await processWhaleTrade(
            whale.id,
            targetToken,
            tokenSymbol,
            isBuy ? "BUY" : "SELL",
            tokenAmount,
            usdValue,
          );
        } catch {}

        const explorerUrl = `https://solscan.io/tx/${signature}`;

        try {
          await prisma.transaction.create({
            data: {
              walletId: whale.id,
              dedupeKey: `${whale.id}-${signature}`,
              signature,
              type: isBuy ? "BUY" : "SELL",
              amount: tokenAmount,
              tokenSymbol,
              tokenAddress: targetToken,
              usdValue,
              explorerUrl,
              priceAtTx: currentPrice || null,
            },
          });
        } catch {}

        let totalRealizedPnl = 0;
        try {
          const pnlAggregate = await prisma.tokenPosition.aggregate({
            where: { walletId: whale.id },
            _sum: { realizedPnlUsd: true },
          });
          totalRealizedPnl = Number(pnlAggregate._sum.realizedPnlUsd ?? 0);
        } catch {}

        const winRateText =
          whale.totalTrades > 0
            ? `${Number(whale.winRate).toFixed(1)}%`
            : "N/A (No Sells Yet)";
        const pnlText =
          totalRealizedPnl >= 0
            ? `+$${totalRealizedPnl.toFixed(2)} 🤑`
            : `-$${Math.abs(totalRealizedPnl).toFixed(2)} 🩸`;

        let securityBlock = "";
        let confluenceBlock = "";

        if (isBuy) {
          try {
            const audit = await auditTokenSecurity(targetToken);
            const verdictEmoji =
              audit.verdict === "SAFE"
                ? "🟢 PASSED ANTI-RUG"
                : audit.verdict === "CAUTION"
                  ? "🟡 CAUTION"
                  : "🔴 DANGER / RUG RISK";

            securityBlock =
              `\n\n🛡️ *ANTI-RUGPULL SECURITY AUDIT*\n` +
              `Status: *${verdictEmoji}* (Score: ${audit.score >= 0 ? audit.score : "N/A"})\n` +
              `• *Liquidity:* ${audit.lpStatus}\n` +
              `• *Mint Authority:* ${audit.mintStatus}\n` +
              `• *Freeze Authority:* ${audit.freezeStatus}\n` +
              `• *Top 10 Holders:* ${audit.top10Status}` +
              (audit.warnings.length > 0
                ? `\n⚠️ *Warnings:* ${audit.warnings.join(", ")}`
                : "");
          } catch {
            securityBlock = `\n\n🛡️ *ANTI-RUGPULL AUDIT:* Rate Limited / Offline`;
          }

          // Check multi-wallet confluence in DB
          try {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const smartMoneyCount = await prisma.transaction.groupBy({
              by: ["walletId"],
              where: {
                tokenAddress: targetToken,
                type: "BUY",
                createdAt: { gte: twoHoursAgo },
              },
            });
            if (smartMoneyCount.length >= 2) {
              confluenceBlock = `\n\n🔥 *CONFLUENCE DETECTED: ${smartMoneyCount.length} WALLETS ACCUMULATING!*`;
            }
          } catch {}
        }

        const actionText = isBuy ? "🟢 BUY" : "🔴 SELL";
        const microSizingBlock = isBuy
          ? `\n\n🎯 *PANDUAN EKSEKUSI PRIBADI (SOP):*\n💵 *Alokasi Modal:* $2 – $3 (Rp 30.000 – Rp 50.000)\n🎯 *Take Profit:* Tangga 20% – 50% (Tarik modal awal!)\n🛑 *Cut Loss Segera:* Jika dev atau paus mulai dump`
          : "";

        const keyboard = buildKeyboard(targetToken, explorerUrl);

        // ========================================================
        // ⚡ STRICT DUAL ROUTING (PEMILAHAN INFORMASI TANPA REDUNDANSI)
        // 1. Alpha Feed Channel: KHUSUS Transaksi Mega-Whale >= $1,000 USD
        // 2. Asisten Crypto DM: KHUSUS Transaksi Taktis Harian $100 - $999 USD
        // ========================================================
        const asistenChatId = whale.chatId || defaultChatId;
        const alphaTargetChatId = whale.alphaChannelId || globalAlphaChatId;
        const hasSeparateAlpha =
          Boolean(alphaTargetChatId) && alphaTargetChatId !== asistenChatId;

        const isAlphaTrade = usdValue >= alphaMinDefault;

        if (isAlphaTrade && hasSeparateAlpha) {
          // RUTE 1: MURNI VIP PREDATOR ALPHA FEED (>= $1,000)
          const approxIdr = (usdValue * 16200).toLocaleString("id-ID", {
            maximumFractionDigits: 0,
          });

          const alphaMessage =
            `👑 *PREDATOR ALPHA FEED (MEGA WHALE)*\n` +
            `🚨 *HIGH-CONVICTION ACCUMULATION (>= $1,000 USD)*\n` +
            `──────────────────────────\n` +
            `👤 *Paus Alpha:* ${whale.name ?? "Target"}\n` +
            `📍 *Address:* \`${whale.address}\`\n` +
            `📈 *Action:* ${isBuy ? "🟢 MEGA BUY" : "🔴 MEGA SELL"}\n` +
            `🪙 *Token:* $${tokenSymbol}\n` +
            `💰 *Value:* $${usdValue.toFixed(2)} (~Rp ${approxIdr})\n` +
            `📍 *Contract:* \`${targetToken}\`\n\n` +
            `🏆 *WHALE STATS*\n` +
            `🎯 *Winrate:* ${winRateText} (${whale.totalTrades || 0} Trades)\n` +
            `💰 *Total PnL:* ${pnlText}` +
            confluenceBlock +
            securityBlock +
            `\n\n🔍 [View on Solscan](${explorerUrl})\n` +
            `⚠️ *Eksklusif VIP Predator Alpha Feed (>= $1,000). DYOR.*`;

          await sendTelegramMessage(alphaTargetChatId!, alphaMessage, keyboard);
        } else if (asistenChatId && usdValue >= minThreshold) {
          // RUTE 2: MURNI ASISTEN CRYPTO PERSONAL DM ($100 - $999)
          const asistenMessage =
            `🤖 *ASISTEN CRYPTO (TACTICAL RADAR)*\n` +
            `🎯 *Sinyal Taktis Harian ($100 – $999 USD)*\n` +
            `──────────────────────────\n` +
            `👤 *Target:* ${whale.name ?? "Target"}\n` +
            `📈 *Action:* ${actionText}\n` +
            `🪙 *Token:* $${tokenSymbol}\n` +
            `💰 *Value:* $${usdValue.toFixed(2)}\n` +
            `📍 *Contract:* \`${targetToken}\`` +
            confluenceBlock +
            securityBlock +
            microSizingBlock +
            `\n\n🔍 [View on Solscan](${explorerUrl})\n` +
            `⚠️ *Asisten Taktis Harian. Bukan nasihat finansial.*`;

          await sendTelegramMessage(asistenChatId, asistenMessage, keyboard);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("[HELIUS WEBHOOK FATAL]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 },
    );
  }
}
