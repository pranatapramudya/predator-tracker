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

export async function GET(request: Request) {
  try {
    const wallets = await prisma.wallet.findMany({ where: { isActive: true } });

    const ALPHA_CHANNEL_ID = "-1003737826938";

    for (const wallet of wallets) {
      try {
        const winRate = (wallet as any).winRate || 0;
        // 🔴 TARIK FILTER DINAMIS DARI DATABASE:
        const threshold = (wallet as any).minAlertUsd || 100;

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
              const usdAmount = (swapData as any).usdValue || 0;

              // 🔴 PAKAI VARIABEL THRESHOLD
              if (usdAmount > 0 && usdAmount < threshold) {
                console.log(
                  `[SILENT SKIP] Transaksi Swap receh $${usdAmount} dari ${wallet.name} (Batas: $${threshold}). Saldo diupdate tanpa notif.`,
                );
              } else {
                await prisma.transaction.create({
                  data: {
                    walletId: wallet.id,
                    dedupeKey: `${wallet.id}-${swapData.signature}`,
                    signature: swapData.signature,
                    type: "SWAP",
                    amount: (swapData as any).amount || 0,
                    tokenSymbol: (swapData as any).tokenSymbol || "MEME_COIN",
                    usdValue: usdAmount,
                    explorerUrl: `https://solscan.io/tx/${swapData.signature}`,
                  },
                });

                if (process.env.TELEGRAM_BOT_TOKEN) {
                  const tokenAddressForDex =
                    (swapData as any).tokenAddress || "solana";
                  const swapMessage =
                    `${label} ALERT!\n🚨 *SMART MONEY SWAP (SOLANA)*\n\n` +
                    `👤 *Target:* ${wallet.name}\n` +
                    `🔄 *Aksi:* ${swapData.description}\n` +
                    `💵 *Estimasi USD:* $${usdAmount}\n` +
                    `📍 *Address:* \`${wallet.address}\``;

                  await fetch(
                    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        chat_id: ALPHA_CHANNEL_ID,
                        text: swapMessage,
                        parse_mode: "Markdown",
                        disable_web_page_preview: true,
                        reply_markup: {
                          inline_keyboard: [
                            [
                              {
                                text: "📈 View on DexScreener",
                                url: `https://dexscreener.com/solana/${tokenAddressForDex}`,
                              },
                            ],
                            [
                              {
                                text: "🔍 Cek TX di Solscan",
                                url: `https://solscan.io/tx/${swapData.signature}`,
                              },
                            ],
                          ],
                        },
                      }),
                    },
                  );
                }
              }
            }
          }
        }

        // ==========================================
        // 2. SMART MONEY TOKEN (ETH & BASE)
        // ==========================================
        if (wallet.network === "ETHEREUM" || wallet.network === "BASE") {
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
              const usdAmount = (tokenTx as any).usdValue || 0;

              // 🔴 PAKAI VARIABEL THRESHOLD
              if (usdAmount > 0 && usdAmount < threshold) {
                console.log(
                  `[SILENT SKIP] Transaksi Token receh EVM $${usdAmount} dari ${wallet.name} (Batas: $${threshold}).`,
                );
              } else {
                await prisma.transaction.create({
                  data: {
                    walletId: wallet.id,
                    dedupeKey: `${wallet.id}-${tokenTx.signature}`,
                    signature: tokenTx.signature,
                    type: "ERC20_TRANSFER",
                    amount: (tokenTx as any).amount || 0,
                    tokenSymbol: (tokenTx as any).tokenSymbol || "TOKEN",
                    usdValue: usdAmount,
                    explorerUrl: tokenTx.explorerUrl,
                  },
                });

                if (process.env.TELEGRAM_BOT_TOKEN) {
                  const tokenMessage =
                    `${label} ALERT!\n🚨 *SMART MONEY TOKEN (${wallet.network})*\n\n` +
                    `👤 *Target:* ${wallet.name}\n` +
                    `🔄 *Aksi:* ${tokenTx.description}\n` +
                    `💵 *Estimasi USD:* $${usdAmount}\n` +
                    `📍 *Address:* \`${wallet.address}\``;

                  await fetch(
                    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        chat_id: ALPHA_CHANNEL_ID,
                        text: tokenMessage,
                        parse_mode: "Markdown",
                        disable_web_page_preview: true,
                        reply_markup: {
                          inline_keyboard: [
                            [
                              {
                                text: "🔍 Cek TX di Explorer",
                                url: tokenTx.explorerUrl,
                              },
                            ],
                          ],
                        },
                      }),
                    },
                  );
                }
              }
            }
          }
        }

        // ==========================================
        // 3. WHALE ALERT SALDO UMUM (DIAM-DIAM)
        // ==========================================
        let currentBalance = 0;
        if (wallet.network === "SOLANA") {
          currentBalance = await getSolanaBalance(wallet.address);
        } else if (wallet.network === "ETHEREUM" || wallet.network === "BASE") {
          currentBalance = await getEVMBalance(
            wallet.address,
            wallet.network as any,
          );
        } else if (wallet.network === "BITCOIN") {
          currentBalance = await getBTCBalance(wallet.address);
        }

        const oldBalance = Number(wallet.lastBalance || 0);
        const diff = currentBalance - oldBalance;

        if (Math.abs(diff) > 0.00000001) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { lastBalance: currentBalance },
          });

          if (
            !isSwapOrTokenAlertSent &&
            wallet.chatId &&
            process.env.TELEGRAM_BOT_TOKEN
          ) {
            const action =
              diff > 0 ? "🟢 BUY/RECEIVE (MASUK)" : "🔴 SELL/SEND (KELUAR)";
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
              `📊 *Perubahan:* ${sym} ${Math.abs(diff).toFixed(8)}\n` +
              `📍 *Address:* \`${wallet.address}\``;

            await fetch(
              `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: wallet.chatId,
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
      message: "Radar Predator Selesai Menyapu Semua Jaringan",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menyapu radar" },
      { status: 500 },
    );
  }
}
