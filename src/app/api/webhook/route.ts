// src/app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const wallets = await prisma.wallet.findMany({ where: { isActive: true } });

    for (const wallet of wallets) {
      // BUNGKUS TRY-CATCH DI SINI BIAR KALO 1 API ERROR, YANG LAIN TETEP JALAN
      try {
        let currentBalance = 0;

        // Cek Saldo Terbaru
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

        // Kalau ada perubahan saldo (kita set threshold kecil biar ga spam)
        if (Math.abs(diff) > 0.00000001) {
          // Update DB
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { lastBalance: currentBalance },
          });

          // Kirim Notif Telegram
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
      } catch (innerError) {
        console.error(`Gagal ngecek wallet ${wallet.name}:`, innerError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Radar Predator Selesai Menyapu",
    });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyapu radar" },
      { status: 500 },
    );
  }
}
