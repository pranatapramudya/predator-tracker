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

    for (const wallet of wallets) {
      try {
        let currentBalance = 0;

        // 1. CEK SALDO UTAMA
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

        if (Math.abs(diff) > 0.00000001) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { lastBalance: currentBalance },
          });

          if (wallet.chatId && process.env.TELEGRAM_BOT_TOKEN) {
            const action =
              diff > 0 ? "🟢 BUY/RECEIVE (MASUK)" : "🔴 SELL/SEND (KELUAR)";
            const sym =
              wallet.network === "BITCOIN"
                ? "₿"
                : wallet.network === "SOLANA"
                  ? "◎"
                  : "Ξ";

            const message =
              `🚨 *WHALE ALERT: ${action}!*\n\n` +
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

        // 2. CEK SMART MONEY SWAP (SOLANA)
        if (wallet.network === "SOLANA") {
          const swapData = await getSolanaLatestSwap(wallet.address);
          if (swapData) {
            const isExists = await prisma.transaction.findFirst({
              where: { signature: swapData.signature },
            });
            if (!isExists) {
              await prisma.transaction.create({
                data: {
                  walletId: wallet.id,
                  dedupeKey: `${wallet.id}-${swapData.signature}`,
                  signature: swapData.signature,
                  type: "SWAP",
                  amount: 0,
                  tokenSymbol: "MEME_COIN",
                  usdValue: 0,
                  explorerUrl: `https://solscan.io/tx/${swapData.signature}`,
                },
              });

              if (wallet.chatId && process.env.TELEGRAM_BOT_TOKEN) {
                const swapMessage = `🚨 *SMART MONEY SWAP (SOLANA)* 🚨\n\n🐳 *Whale:* ${wallet.name}\n🔄 *Aksi:* ${swapData.description}\n\n🔍 *Cek TX:* [Solscan](https://solscan.io/tx/${swapData.signature})\n📍 *Address:* \`${wallet.address}\``;
                await fetch(
                  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chat_id: wallet.chatId,
                      text: swapMessage,
                      parse_mode: "Markdown",
                      disable_web_page_preview: true,
                    }),
                  },
                );
              }
            }
          }
        }

        // 3. CEK SMART MONEY TOKEN (ETH & BASE)
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
              await prisma.transaction.create({
                data: {
                  walletId: wallet.id,
                  dedupeKey: `${wallet.id}-${tokenTx.signature}`,
                  signature: tokenTx.signature,
                  type: "ERC20_TRANSFER",
                  amount: 0,
                  tokenSymbol: tokenTx.tokenSymbol,
                  usdValue: 0,
                  explorerUrl: tokenTx.explorerUrl,
                },
              });

              if (wallet.chatId && process.env.TELEGRAM_BOT_TOKEN) {
                const tokenMessage = `🚨 *SMART MONEY TOKEN (${wallet.network})* 🚨\n\n🐳 *Whale:* ${wallet.name}\n🔄 *Aksi:* ${tokenTx.description}\n\n🔍 *Cek TX:* [Explorer](${tokenTx.explorerUrl})\n📍 *Address:* \`${wallet.address}\``;
                await fetch(
                  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chat_id: wallet.chatId,
                      text: tokenMessage,
                      parse_mode: "Markdown",
                      disable_web_page_preview: true,
                    }),
                  },
                );
              }
            }
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
