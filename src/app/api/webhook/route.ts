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
      };
    }
    return null;
  } catch (error) {
    console.error(`[DEXSCREENER] Error token ${tokenAddress}`);
    return null;
  }
}

function formatCurrency(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

// ==========================================
// AUTO WIN-RATE & PnL ENGINE
// ==========================================
async function processAutoWinRate(
  walletId: string,
  isBuy: boolean,
  amountToken: number,
  usdValue: number,
  tokenAddress: string,
  tokenSymbol: string,
) {
  if (!tokenAddress || tokenAddress === "solana" || usdValue <= 0) return;

  try {
    const position = await prisma.tokenPosition.findUnique({
      where: { walletId_tokenAddress: { walletId, tokenAddress } },
    });

    if (isBuy) {
      if (position) {
        await prisma.tokenPosition.update({
          where: { id: position.id },
          data: {
            tokenAmount: Number(position.tokenAmount) + amountToken,
            totalInvestedUsd: Number(position.totalInvestedUsd) + usdValue,
          },
        });
      } else {
        await prisma.tokenPosition.create({
          data: {
            walletId,
            tokenAddress,
            tokenSymbol,
            tokenAmount: amountToken,
            totalInvestedUsd: usdValue,
          },
        });
      }
    } else {
      if (position && Number(position.tokenAmount) > 0) {
        const avgBuyPrice =
          Number(position.totalInvestedUsd) / Number(position.tokenAmount);
        const costOfSoldTokens = avgBuyPrice * amountToken;
        const pnl = usdValue - costOfSoldTokens;
        const isWin = pnl > 0;

        const walletStats = await prisma.wallet.findUnique({
          where: { id: walletId },
        });
        if (walletStats) {
          const newTotalTrades = walletStats.totalTrades + 1;
          const newSuccessTrades = walletStats.successTrades + (isWin ? 1 : 0);
          const newWinRate =
            newTotalTrades === 0
              ? 0
              : (newSuccessTrades / newTotalTrades) * 100;

          await prisma.wallet.update({
            where: { id: walletId },
            data: {
              totalTrades: newTotalTrades,
              successTrades: newSuccessTrades,
              winRate: newWinRate,
            },
          });

          const remainingAmount = Math.max(
            0,
            Number(position.tokenAmount) - amountToken,
          );
          await prisma.tokenPosition.update({
            where: { id: position.id },
            data: {
              tokenAmount: remainingAmount,
              realizedPnlUsd: Number(position.realizedPnlUsd) + pnl,
            },
          });
        }
      }
    }
  } catch (e) {
    console.error("Auto WR Error:", e);
  }
}

// ==========================================
// FUNGSI KIRIM TELEGRAM
// ==========================================
async function sendTelegramAlert({
  wallet,
  targetChatId,
  alphaChatId,
  label,
  winRate,
  network,
  usdAmount,
  tokenAddress,
  tokenSymbol,
  marketInfo,
  actionText,
  explorerUrl,
}: any) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const isAlphaWorthy = usdAmount >= 1000;
  const notificationTargets: { id: string; customLabel: string }[] = [];
  const userAlphaChatId = wallet.alphaChannelId;

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
      notificationTargets.push({ id: targetChatId, customLabel: label });
    }
  }

  const mktCapText =
    marketInfo && marketInfo.marketCap > 0
      ? `\n📊 *Market Cap:* ${formatCurrency(marketInfo.marketCap)}`
      : "";

  const titleText =
    network === "SOLANA"
      ? "🚨 *SMART MONEY SWAP (SOLANA)*"
      : `🚨 *SMART MONEY TOKEN (${network})*`;

  for (const target of notificationTargets) {
    const message =
      `${target.customLabel} ALERT!\n${titleText}\n\n` +
      `👤 *Target:* ${wallet.name}\n` +
      `🔄 *Aksi:* ${actionText}\n` +
      `💵 *Estimasi USD:* $${usdAmount.toFixed(2)}${mktCapText}\n` +
      `📈 *Current Win Rate:* ${winRate.toFixed(1)}%\n` +
      `📍 *Address:* \`${wallet.address}\``;

    let inline_keyboard = [];
    if (network === "SOLANA") {
      inline_keyboard = [
        [
          {
            text: "📈 DexScreener",
            url: `https://dexscreener.com/solana/${tokenAddress}`,
          },
          { text: "🔍 Cek TX", url: explorerUrl },
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
      inline_keyboard = [[{ text: "🔍 Cek TX di Explorer", url: explorerUrl }]];
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
    } catch (err) {
      console.error(`Gagal kirim notif ke ${target.id}`, err);
    }
  }
}

export async function GET(request: Request) {
  try {
    const wallets = await prisma.wallet.findMany({ where: { isActive: true } });
    const alphaChatId = process.env.TELEGRAM_CHAT_ID;

    for (const wallet of wallets) {
      try {
        const winRate = (wallet as any).winRate || 0;

        // 🔥 UPDATE S.KOM 1: BATAS MINIMUM DINAIKAN JADI $500 SECARA DEFAULT
        const threshold = (wallet as any).minAlertUsd || 500;

        const targetChatId = wallet.chatId;

        let label = "🐋 THE WHALE";
        if (winRate > 70) label = "🥇 THE ORACLE";
        else if (winRate >= 40) label = "🥈 THE GRINDER";
        else if (winRate > 0 && winRate < 30) label = "💀 EXIT LIQUIDITY";

        let isSwapOrTokenAlertSent = false;

        // ==========================================
        // 1. SMART MONEY SWAP (SOLANA)
        // ==========================================
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

              const marketInfo = await getTokenMarketInfo(tokenAddress);
              if (usdAmount === 0 && tokenAddress !== "solana" && marketInfo) {
                usdAmount = amountToken * marketInfo.priceUsd;
              }

              const isBuy =
                !swapData.description.toUpperCase().includes("FOR SOL") &&
                !swapData.description.toUpperCase().includes("FOR USDC");

              await processAutoWinRate(
                wallet.id,
                isBuy,
                amountToken,
                usdAmount,
                tokenAddress,
                tokenSymbol,
              );

              // SATPAM $500: Cuma jalan kalau nominal >= threshold
              if (usdAmount > 0 && usdAmount >= threshold) {
                await prisma.transaction.create({
                  data: {
                    walletId: wallet.id,
                    dedupeKey: `${wallet.id}-${swapData.signature}`,
                    signature: swapData.signature,
                    type: "SWAP",
                    amount: amountToken,
                    tokenSymbol: tokenSymbol,
                    tokenAddress: tokenAddress,
                    usdValue: usdAmount,
                    explorerUrl: `https://solscan.io/tx/${swapData.signature}`,
                  },
                });

                const actionText = isBuy
                  ? "🟢 *BUY (AKUMULASI)*"
                  : "🔴 *SELL (TAKE PROFIT/CUT LOSS)*";

                await sendTelegramAlert({
                  wallet,
                  targetChatId,
                  alphaChatId,
                  label,
                  winRate,
                  network: "SOLANA",
                  usdAmount,
                  tokenAddress,
                  tokenSymbol,
                  marketInfo,
                  actionText,
                  explorerUrl: `https://solscan.io/tx/${swapData.signature}`,
                });
              } else if (usdAmount > 0) {
                console.log(
                  `[SKIP SWAP] ${wallet.name} transaksi cuma $${usdAmount.toFixed(2)} (di bawah $500)`,
                );
              }
            }
          }
        }

        // ==========================================
        // 2. SMART MONEY TOKEN (ETH & BASE)
        // ==========================================
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

              const marketInfo = await getTokenMarketInfo(tokenAddress);
              if (usdAmount === 0 && tokenAddress && marketInfo) {
                usdAmount = amountToken * marketInfo.priceUsd;
              }

              const isBuy = tokenTx.description.includes("🟢");

              await processAutoWinRate(
                wallet.id,
                isBuy,
                amountToken,
                usdAmount,
                tokenAddress,
                tokenSymbol,
              );

              // SATPAM $500: Cuma jalan kalau nominal >= threshold
              if (usdAmount > 0 && usdAmount >= threshold) {
                await prisma.transaction.create({
                  data: {
                    walletId: wallet.id,
                    dedupeKey: `${wallet.id}-${tokenTx.signature}`,
                    signature: tokenTx.signature,
                    type: "ERC20_TRANSFER",
                    amount: amountToken,
                    tokenSymbol: tokenSymbol,
                    tokenAddress: tokenAddress,
                    usdValue: usdAmount,
                    explorerUrl: tokenTx.explorerUrl,
                  },
                });

                await sendTelegramAlert({
                  wallet,
                  targetChatId,
                  alphaChatId,
                  label,
                  winRate,
                  network: wallet.network,
                  usdAmount,
                  tokenAddress,
                  tokenSymbol,
                  marketInfo,
                  actionText: tokenTx.description,
                  explorerUrl: tokenTx.explorerUrl,
                });
              } else if (usdAmount > 0) {
                console.log(
                  `[SKIP EVM] ${wallet.name} transaksi cuma $${usdAmount.toFixed(2)} (di bawah $500)`,
                );
              }
            }
          }
        }

        // ==========================================
        // 3. WHALE ALERT SALDO UMUM (Penyebab Utama Spam!)
        // ==========================================
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

        // 🔥 UPDATE S.KOM 2: Estimasi Harga Koin Utama untuk Filter $500
        let nativePriceEstimasi = 0;
        if (wallet.network === "SOLANA") nativePriceEstimasi = 145;
        else if (wallet.network === "ETHEREUM" || wallet.network === "BASE")
          nativePriceEstimasi = 3000;
        else if (wallet.network === "BITCOIN") nativePriceEstimasi = 60000;

        const diffUsdValue = Math.abs(diff) * nativePriceEstimasi;

        // Cek kalau ada perubahan saldo (sekecil apapun) buat di-update di DB
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

          // 🔥 SATPAM $500 BERAKSI: Jangan kirim notif Telegram kalau perubahan saldonya < $500
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
              `${label} ALERT!\n🚨 *WHALE BALANCE UPDATE*\n\n` +
              `👤 *Target:* ${wallet.name}\n` +
              `🌐 *Network:* ${wallet.network}\n` +
              `💼 *Saldo Lama:* ${sym} ${oldBalance.toFixed(8)}\n` +
              `💰 *Saldo Baru:* ${sym} ${currentBalance.toFixed(8)}\n` +
              `📊 *Perubahan:* ${sym} ${Math.abs(diff).toFixed(8)} (≈ $${diffUsdValue.toFixed(2)})\n` +
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
          } else if (diffUsdValue > 0) {
            console.log(
              `[SKIP NATIVE ALERT] ${wallet.name} bayar gas/transfer receh, pergerakan cuma $${diffUsdValue.toFixed(2)}.`,
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
