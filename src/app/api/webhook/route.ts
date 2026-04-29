// src/app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSolanaBalance,
  getEVMBalance,
  getBTCBalance,
  getSolanaLatestSwap,
  getEVMLatestTokenTx,
} from "@/lib/crypto";
import { processWhaleTrade } from "./pnl"; // Sinkronisasi dengan Akuntan PnL

export const dynamic = "force-dynamic";

// ==========================================
// 🔥 MODUL: DEXSCREENER API (MARKET CAP)
// ==========================================
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
        fdv: pair.fdv || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0,
        pairCreatedAt: pair.pairCreatedAt || null,
      };
    }
    return null;
  } catch (error) {
    console.error(`[DEXSCREENER] Error token ${tokenAddress}`);
    return null;
  }
}

// ==========================================
// 🔥 MODUL: HELIUS INSIDER RISK DETECTIVE
// ==========================================
async function checkSolanaInsiderRisk(tokenAddress: string): Promise<string> {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return "";

    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

    const supplyRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenSupply",
        params: [tokenAddress],
      }),
    });
    const supplyData = await supplyRes.json();
    const totalSupply = supplyData?.result?.value?.uiAmount;

    if (!totalSupply) return "";

    const accountsRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [tokenAddress],
      }),
    });
    const accountsData = await accountsRes.json();
    const largestAccounts = accountsData?.result?.value;

    if (!largestAccounts || !Array.isArray(largestAccounts)) return "";

    let insiderAmount = 0;
    const top10 = largestAccounts.slice(1, 11);
    for (const acc of top10) {
      insiderAmount += acc.uiAmount || 0;
    }

    const insiderPercentage = (insiderAmount / totalSupply) * 100;

    if (insiderPercentage > 30) {
      return `\n☠️ *INSIDER RISK:* 🔴 EXTREME DANGER! (Top 10 holds ${insiderPercentage.toFixed(1)}%)`;
    } else if (insiderPercentage > 15) {
      return `\n⚠️ *INSIDER RISK:* 🟡 Caution (Top 10 holds ${insiderPercentage.toFixed(1)}%)`;
    } else {
      return `\n🛡️ *INSIDER RISK:* 🟢 Safe (Healthy Distribution)`;
    }
  } catch (error) {
    return "";
  }
}

// ==========================================
// 🔥 MODUL: TELEGRAM SENDER (ENGLISH FORMAT & DOUBLE ALPHA FIX)
// ==========================================
async function sendTelegramAlert({
  wallet,
  targetChatId,
  alphaChatId,
  network,
  usdAmount,
  tokenAddress,
  tokenSymbol,
  actionText,
  explorerUrl,
  whaleStatsBlock,
  metricsBlock,
  liquidityWarning,
}: any) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const isAlphaWorthy = usdAmount >= 1000;
  const notificationTargets: { id: string; customLabel: string }[] = [];
  const userAlphaChatId = wallet.alphaChannelId;

  // Fix Double Alpha: Prioritas pengiriman
  if (isAlphaWorthy) {
    let sentToAlpha = false;
    if (userAlphaChatId && userAlphaChatId !== targetChatId) {
      notificationTargets.push({
        id: userAlphaChatId,
        customLabel: "👑 ALPHA PREDATOR",
      });
      sentToAlpha = true;
    } else if (alphaChatId && alphaChatId !== targetChatId) {
      notificationTargets.push({
        id: alphaChatId,
        customLabel: "👑 ALPHA PREDATOR",
      });
      sentToAlpha = true;
    }
    if (!sentToAlpha && targetChatId) {
      notificationTargets.push({
        id: targetChatId,
        customLabel: "👑 ALPHA PREDATOR",
      });
    }
  } else {
    if (targetChatId) {
      notificationTargets.push({ id: targetChatId, customLabel: "🚨 WHALE" });
    }
  }

  const titleText = isAlphaWorthy
    ? "👑 *ALPHA PREDATOR ALERT!*"
    : "🚨 *WHALE ALERT* 🚨";
  const dyorFooter = `\n\n⚠️ *DISCLAIMER:*\n_Auto-generated from blockchain data. Not financial advice (NFA). Do your own research (DYOR)!_`;

  for (const target of notificationTargets) {
    const message =
      `${titleText}\n\n` +
      `👤 *Whale:* ${wallet.name ?? "Unknown Target"}\n` +
      `📍 *Address:* \`${wallet.address}\`\n` +
      `📈 *Action:* ${actionText}\n` +
      `🪙 *Token:* ${tokenSymbol}\n` +
      `💰 *Value:* $${usdAmount.toFixed(2)}${liquidityWarning}` +
      whaleStatsBlock +
      metricsBlock +
      dyorFooter;

    let inline_keyboard = [];
    if (network === "SOLANA") {
      inline_keyboard = [
        [
          { text: "🔍 View Transaction", url: explorerUrl },
          {
            text: "📊 Chart on DexScreener",
            url: `https://dexscreener.com/solana/${tokenAddress}`,
          },
        ],
        [
          {
            text: "⚡ Web3: Jupiter",
            url: `https://jup.ag/swap/SOL-${tokenAddress}`,
          },
          {
            text: "🤖 TG Bot: BonkBot",
            url: `https://t.me/bonkbot_bot?start=${tokenAddress}`,
          },
        ],
      ];
    } else {
      inline_keyboard = [
        [{ text: "🔍 View Transaction on Explorer", url: explorerUrl }],
        [
          {
            text: "📊 Chart on DexScreener",
            url: `https://dexscreener.com/ethereum/${tokenAddress}`,
          },
        ],
      ];
    }

    try {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: target.id,
            text: message,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            reply_markup: { inline_keyboard },
          }),
        },
      );
      // Kasih jeda 50ms biar gak kena rate limit Telegram
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (err) {
      console.error(`Gagal kirim notif ke ${target.id}`, err);
    }
  }
}

// ==========================================
// 🔥 MAIN ENGINE: SWEEPER (GET)
// ==========================================
export async function GET(request: Request) {
  try {
    const wallets = await prisma.wallet.findMany({ where: { isActive: true } });
    const alphaChatId = process.env.TELEGRAM_CHAT_ID;

    for (const wallet of wallets) {
      try {
        const threshold = (wallet as any).minAlertUsd || 100;
        const targetChatId = wallet.chatId;
        let isSwapOrTokenAlertSent = false;

        // ------------------------------------------
        // 1. SMART MONEY SWAP (SOLANA)
        // ------------------------------------------
        if (wallet.network === "SOLANA") {
          const swapData = await getSolanaLatestSwap(wallet.address);
          if (swapData) {
            const isExists = await prisma.transaction.findFirst({
              where: { signature: swapData.signature },
            });

            if (!isExists) {
              isSwapOrTokenAlertSent = true;
              let usdAmount = (swapData as any).usdValue || 0;
              const amountToken = (swapData as any).amount || 0;
              const tokenAddress = (swapData as any).tokenAddress || "solana";
              const tokenSymbol = (swapData as any).tokenSymbol || "MEME_COIN";
              const isBuy =
                !swapData.description.toUpperCase().includes("FOR SOL") &&
                !swapData.description.toUpperCase().includes("FOR USDC");

              let liquidityWarning = "";
              let metricsBlock = "";
              const marketInfo = await getTokenMarketInfo(tokenAddress);

              if (usdAmount === 0 && tokenAddress !== "solana" && marketInfo) {
                usdAmount = amountToken * marketInfo.priceUsd;
              }

              if (isBuy && tokenAddress !== "solana") {
                let multibaggerScore = 0;
                let volumeMcapRatio = 0;
                let tokenAgeHours = 0;

                if (marketInfo) {
                  if (
                    marketInfo.liquidityUsd < 10000 &&
                    marketInfo.liquidityUsd > 0
                  )
                    liquidityWarning = `\n⚠️ *LIQUIDITY:* [HIGH RISK] < $10k`;
                  else if (marketInfo.liquidityUsd >= 10000)
                    liquidityWarning = `\n💧 *Liquidity:* $${(marketInfo.liquidityUsd / 1000).toFixed(1)}k`;

                  if (marketInfo.pairCreatedAt) {
                    tokenAgeHours =
                      (Date.now() - marketInfo.pairCreatedAt) /
                      (1000 * 60 * 60);
                    if (tokenAgeHours < 24) multibaggerScore += 1;
                  }
                  if (marketInfo.marketCap > 0)
                    volumeMcapRatio =
                      (marketInfo.volume24h / marketInfo.marketCap) * 100;
                }

                const insiderWarning =
                  await checkSolanaInsiderRisk(tokenAddress);
                const smartMoneyCount = await prisma.tokenPosition.count({
                  where: { tokenAddress, tokenAmount: { gt: 0 } },
                });
                if (smartMoneyCount >= 2) multibaggerScore += 2;

                metricsBlock =
                  `\n\n📊 *ON-CHAIN METRICS*\n💎 *Score:* ${multibaggerScore}/3 Points\n🐳 *Smart Money:* ${smartMoneyCount} Wallets\n⏳ *Age:* ${tokenAgeHours > 0 ? tokenAgeHours.toFixed(1) + "h" : "N/A"}\n📈 *Vol/MCap:* ${volumeMcapRatio > 0 ? volumeMcapRatio.toFixed(1) + "%" : "N/A"} ` +
                  (volumeMcapRatio > 50 ? `(🔥 Hot)` : `(🧊 Normal)`) +
                  insiderWarning;
              }

              // PANGGIL AKUNTAN (pnl.ts) BUKAN NGITUNG MANUAL
              if (tokenAddress !== "solana" && usdAmount > 0) {
                await processWhaleTrade(
                  wallet.id,
                  tokenAddress,
                  tokenSymbol,
                  isBuy ? "BUY" : "SELL",
                  amountToken,
                  usdAmount,
                );
              }

              if (usdAmount > 0 && usdAmount >= threshold) {
                await prisma.transaction.create({
                  data: {
                    walletId: wallet.id,
                    dedupeKey: `${wallet.id}-${swapData.signature}`,
                    signature: swapData.signature,
                    type: "SWAP",
                    amount: amountToken,
                    tokenSymbol,
                    tokenAddress,
                    usdValue: usdAmount,
                    explorerUrl: `https://solscan.io/tx/${swapData.signature}`,
                  },
                });

                // TARIK WHALE RAPOR DARI DB SETELAH DIHITUNG AKUNTAN
                const whaleData = await prisma.wallet.findUnique({
                  where: { id: wallet.id },
                  select: { winRate: true, totalTrades: true },
                });
                const allPositions = await prisma.tokenPosition.findMany({
                  where: { walletId: wallet.id },
                  select: { realizedPnlUsd: true },
                });
                const totalRealizedPnl = allPositions.reduce(
                  (sum, pos) => sum + Number(pos.realizedPnlUsd),
                  0,
                );

                const winRateText =
                  whaleData && whaleData.totalTrades > 0
                    ? `${Number(whaleData.winRate).toFixed(1)}%`
                    : "N/A (No Sells Yet)";
                const pnlText =
                  totalRealizedPnl >= 0
                    ? `+$${totalRealizedPnl.toFixed(2)} 🤑`
                    : `-$${Math.abs(totalRealizedPnl).toFixed(2)} 🩸`;
                const whaleStatsBlock = `\n\n🏆 *WHALE STATS*\n🎯 *Winrate:* ${winRateText} (${whaleData?.totalTrades || 0} Trades)\n💰 *Total PnL:* ${pnlText}`;

                const actionText = isBuy ? "🟢 BUY" : "🔴 SELL";

                await sendTelegramAlert({
                  wallet,
                  targetChatId,
                  alphaChatId,
                  network: "SOLANA",
                  usdAmount,
                  tokenAddress,
                  tokenSymbol,
                  actionText,
                  explorerUrl: `https://solscan.io/tx/${swapData.signature}`,
                  whaleStatsBlock,
                  metricsBlock,
                  liquidityWarning,
                });
              }
            }
          }
        }

        // ------------------------------------------
        // 2. SMART MONEY TOKEN (ETH & BASE)
        // ------------------------------------------
        else if (wallet.network === "ETHEREUM" || wallet.network === "BASE") {
          const tokenTx = await getEVMLatestTokenTx(
            wallet.address,
            wallet.network as any,
          );
          if (tokenTx) {
            const isExists = await prisma.transaction.findFirst({
              where: { signature: tokenTx.signature },
            });

            if (!isExists) {
              isSwapOrTokenAlertSent = true;
              let usdAmount = (tokenTx as any).usdValue || 0;
              const amountToken = (tokenTx as any).amount || 0;
              const tokenAddress = (tokenTx as any).tokenAddress;
              const tokenSymbol = (tokenTx as any).tokenSymbol || "TOKEN";
              const isBuy = tokenTx.description.includes("🟢");

              const marketInfo = await getTokenMarketInfo(tokenAddress);
              if (usdAmount === 0 && tokenAddress && marketInfo) {
                usdAmount = amountToken * marketInfo.priceUsd;
              }

              // PANGGIL AKUNTAN (pnl.ts) BUKAN NGITUNG MANUAL
              if (tokenAddress && usdAmount > 0) {
                await processWhaleTrade(
                  wallet.id,
                  tokenAddress,
                  tokenSymbol,
                  isBuy ? "BUY" : "SELL",
                  amountToken,
                  usdAmount,
                );
              }

              if (usdAmount > 0 && usdAmount >= threshold) {
                await prisma.transaction.create({
                  data: {
                    walletId: wallet.id,
                    dedupeKey: `${wallet.id}-${tokenTx.signature}`,
                    signature: tokenTx.signature,
                    type: "ERC20_TRANSFER",
                    amount: amountToken,
                    tokenSymbol,
                    tokenAddress,
                    usdValue: usdAmount,
                    explorerUrl: tokenTx.explorerUrl,
                  },
                });

                // TARIK WHALE RAPOR DARI DB
                const whaleData = await prisma.wallet.findUnique({
                  where: { id: wallet.id },
                  select: { winRate: true, totalTrades: true },
                });
                const allPositions = await prisma.tokenPosition.findMany({
                  where: { walletId: wallet.id },
                  select: { realizedPnlUsd: true },
                });
                const totalRealizedPnl = allPositions.reduce(
                  (sum, pos) => sum + Number(pos.realizedPnlUsd),
                  0,
                );

                const winRateText =
                  whaleData && whaleData.totalTrades > 0
                    ? `${Number(whaleData.winRate).toFixed(1)}%`
                    : "N/A (No Sells Yet)";
                const pnlText =
                  totalRealizedPnl >= 0
                    ? `+$${totalRealizedPnl.toFixed(2)} 🤑`
                    : `-$${Math.abs(totalRealizedPnl).toFixed(2)} 🩸`;
                const whaleStatsBlock = `\n\n🏆 *WHALE RAPOR*\n🎯 *Winrate:* ${winRateText} (${whaleData?.totalTrades || 0} Trades)\n💰 *Total PnL:* ${pnlText}`;

                const actionText = isBuy ? "🟢 BUY" : "🔴 SELL";

                await sendTelegramAlert({
                  wallet,
                  targetChatId,
                  alphaChatId,
                  network: wallet.network,
                  usdAmount,
                  tokenAddress,
                  tokenSymbol,
                  actionText,
                  explorerUrl: tokenTx.explorerUrl,
                  whaleStatsBlock,
                  metricsBlock: "",
                  liquidityWarning: "",
                });
              }
            }
          }
        }

        // ------------------------------------------
        // 3. WHALE ALERT SALDO UMUM (NATIVE)
        // ------------------------------------------
        let currentBalance = 0;
        if (wallet.network === "SOLANA")
          currentBalance = await getSolanaBalance(wallet.address);
        else if (wallet.network === "ETHEREUM" || wallet.network === "BASE")
          currentBalance = await getEVMBalance(
            wallet.address,
            wallet.network as any,
          );
        else if (wallet.network === "BITCOIN")
          currentBalance = await getBTCBalance(wallet.address);

        const oldBalance = Number(wallet.lastBalance || 0);
        const diff = currentBalance - oldBalance;

        let nativePriceEstimasi = 0;
        if (wallet.network === "SOLANA") nativePriceEstimasi = 145;
        else if (wallet.network === "ETHEREUM" || wallet.network === "BASE")
          nativePriceEstimasi = 3000;
        else if (wallet.network === "BITCOIN") nativePriceEstimasi = 60000;

        const diffUsdValue = Math.abs(diff) * nativePriceEstimasi;

        if (Math.abs(diff) > 0.00000001) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { lastBalance: currentBalance },
          });

          await prisma.transaction.create({
            data: {
              walletId: wallet.id,
              dedupeKey: `NATIVE-${wallet.id}-${Date.now()}`,
              signature: "NATIVE_TRANSFER",
              type: diff > 0 ? "RECEIVE_NATIVE" : "SEND_NATIVE",
              amount: Math.abs(diff),
              tokenSymbol:
                wallet.network === "BITCOIN"
                  ? "BTC"
                  : wallet.network === "SOLANA"
                    ? "SOL"
                    : "ETH",
              usdValue: diffUsdValue,
              explorerUrl: "#",
            },
          });

          if (
            !isSwapOrTokenAlertSent &&
            targetChatId &&
            process.env.TELEGRAM_BOT_TOKEN &&
            diffUsdValue >= threshold
          ) {
            const sym =
              wallet.network === "BITCOIN"
                ? "₿"
                : wallet.network === "SOLANA"
                  ? "◎"
                  : "Ξ";
            const message =
              `🚨 *WHALE BALANCE UPDATE*\n\n` +
              `👤 *Whale:* ${wallet.name}\n` +
              `🌐 *Network:* ${wallet.network}\n` +
              `💼 *Old Balance:* ${sym} ${oldBalance.toFixed(8)}\n` +
              `💰 *New Balance:* ${sym} ${currentBalance.toFixed(8)}\n` +
              `📊 *Change:* ${sym} ${Math.abs(diff).toFixed(8)} (≈ $${diffUsdValue.toFixed(2)})\n` +
              `📍 *Address:* \`${wallet.address}\``;

            await fetch(
              `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: targetChatId,
                  text: message,
                  parse_mode: "Markdown",
                }),
              },
            );
          }
        }
      } catch (innerError) {
        console.error(`Gagal ngecek wallet ${wallet.name}:`, innerError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Radar Selesai Menyapu",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menyapu" },
      { status: 500 },
    );
  }
}
