import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWhaleTrade } from "../pnl";
import { analyzeWhaleAction } from "@/lib/scanner";

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
      { text: "📊 DexScreener", url: `https://dexscreener.com/solana/${tokenAddress}` },
    ],
    [
      { text: "⚡ Jupiter", url: `https://jup.ag/swap/SOL-${tokenAddress}` },
      { text: "🤖 BonkBot", url: `https://t.me/bonkbot_bot?start=ref_${tokenAddress}` },
    ],
    [
      { text: "🐦 Search X", url: `https://twitter.com/search?q=${tokenAddress}` },
      { text: "🫧 Bubblemaps", url: `https://app.bubblemaps.io/sol/token/${tokenAddress}` },
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ success: true, message: "Ping received" });
    }

    const globalAlphaChatId = process.env.TELEGRAM_ALPHA_CHAT_ID;

    for (const tx of body) {
      const signature = tx.signature;
      if (!signature) continue;

      const accountData = tx.accountData || [];
      const involvedAccounts = accountData.map((a: any) => a.account);

      const whales = await prisma.wallet.findMany({
        where: {
          isActive: true,
          network: "SOLANA",
          address: { in: involvedAccounts },
        },
      });

      if (whales.length === 0) continue;

      const tokenTransfers = tx.tokenTransfers || [];

      for (const whale of whales) {
        const isExists = await prisma.transaction.findFirst({
          where: { signature },
        });
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

        if (usdValue < 3000) {
          console.log(
            `[KILL SWITCH] Tx Solana ${whale.name} diabaikan: $${usdValue.toFixed(2)} (< $3000)`,
          );
          continue;
        }

        await processWhaleTrade(
          whale.id,
          targetToken,
          tokenSymbol,
          isBuy ? "BUY" : "SELL",
          tokenAmount,
          usdValue,
        );

        const explorerUrl = `https://solscan.io/tx/${signature}`;

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

        const pnlAggregate = await prisma.tokenPosition.aggregate({
          where: { walletId: whale.id },
          _sum: { realizedPnlUsd: true },
        });
        const totalRealizedPnl = Number(pnlAggregate._sum.realizedPnlUsd ?? 0);
        const winRateText =
          whale.totalTrades > 0
            ? `${Number(whale.winRate).toFixed(1)}%`
            : "N/A (No Sells Yet)";
        const pnlText =
          totalRealizedPnl >= 0
            ? `+$${totalRealizedPnl.toFixed(2)} 🤑`
            : `-$${Math.abs(totalRealizedPnl).toFixed(2)} 🩸`;

        let securityBlock = "";
        try {
          const analysis = await analyzeWhaleAction(
            targetToken,
            `$${((marketInfo?.liquidityUsd || 0) / 1000).toFixed(1)}k`,
            "1h",
          );
          securityBlock = `\n\n🔍 *SECURITY CHECK:*\n✅ Mint: ${analysis.security.mint}\n✅ Freeze: ${analysis.security.freeze}\n🔥 LP: ${analysis.security.lp}\n🛡️ Honeypot: ${analysis.security.honeypot}\n\n🤖 *AI Score:* ${analysis.aiScore}/100\n💡 *AI Insight:* ${analysis.aiInsight}`;
        } catch {
          securityBlock = `\n\n🤖 *AI Score:* N/A (Rate Limited)`;
        }

        const actionText = isBuy ? "🟢 BUY" : "🔴 SELL";
        const message =
          `👑 *ALPHA PREDATOR (HELIUS WEBHOOK)*\n\n` +
          `👤 *Whale:* ${whale.name ?? "Target"}\n` +
          `📍 *Address:* \`${whale.address}\`\n` +
          `📈 *Action:* ${actionText}\n` +
          `🪙 *Token:* $${tokenSymbol}\n` +
          `💰 *Value:* $${usdValue.toFixed(2)}\n\n` +
          `🏆 *WHALE STATS*\n` +
          `🎯 *Winrate:* ${winRateText} (${whale.totalTrades || 0} Trades)\n` +
          `💰 *Total PnL:* ${pnlText}` +
          securityBlock +
          `\n\n⚠️ *DYOR! Auto-generated from Helius.*`;

        const keyboard = buildKeyboard(targetToken, explorerUrl);
        const targetChatId =
          (whale as any).alphaChannelId || whale.chatId || globalAlphaChatId || process.env.TELEGRAM_CHAT_ID;

        if (targetChatId) {
          await sendTelegramMessage(targetChatId, message, keyboard);
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
