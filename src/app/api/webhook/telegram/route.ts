// src/app/api/webhook/telegram/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 🛡️ BENTENG PERTAMA: Cek Token Rahasia dari Telegram
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");

    // Pastikan lu bikin variabel TELEGRAM_WEBHOOK_SECRET di .env nanti
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn(
        "[SECURITY] Ada request palsu nyoba nembus Webhook Telegram!",
      );
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Pastikan ini adalah pesan teks dari Telegram
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ok" });
    }

    const chatId = body.message.chat.id.toString();
    const userText = body.message.text;

    // Filter hanya untuk perintah /start
    if (userText === "/start") {
      // 🔍 CEK APAKAH USER SUDAH PUNYA WALLET TERDAFTAR DENGAN CHAT ID INI
      const walletExists = await prisma.wallet.findFirst({
        where: { chatId: chatId },
      });

      let responseText = "";

      if (walletExists) {
        // ✅ JALUR USER RESMI (English Version)
        responseText = `⚡ *RADAR ACTIVE, PREDATOR!*\n\nYour radar is now online. I'll notify you right here whenever a tracked whale makes a move.\n\nMonitor your dashboard at: https://predator-tracker.vercel.app`;
      } else {
        // 🚫 JALUR ORANG RANDOM (English Version)
        responseText = `🚫 *ACCESS DENIED!*\n\nSorry mate, this radar is private. You need to register on the website first to verify your Telegram ID and receive Alpha signals.\n\n🔗 *Register Now:* https://predator-tracker.vercel.app`;
      }

      // Kirim balik pesan balasan via Telegram Bot API
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: "Markdown",
          }),
        },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[TELEGRAM WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
