import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fungsi POST untuk nerima data dari MoonPay
export async function POST(req: Request) {
  try {
    // 1. Ambil data mentah (body) yang dikirim MoonPay
    const body = await req.json();

    // 2. Kita cuma peduli sama event "transaction_created" atau "transaction_updated" yang statusnya "completed"
    if (
      body.type === "transaction_updated" &&
      body.data.status === "completed"
    ) {
      // 3. Ambil User ID (Clerk ID) yang tadi kita titipin di URL
      const userId =
        body.data.externalCustomerId || body.data.clientReferenceId;

      // Ambil BaseCurrencyAmount (Harga yang dibayar) untuk nentuin Tier
      const amountPaid = body.data.baseCurrencyAmount;

      if (!userId) {
        return NextResponse.json(
          { error: "No User ID attached" },
          { status: 400 },
        );
      }

      // 4. Logika Penentuan Tier Berdasarkan Harga
      let newTier: "FREE" | "SCOUT" | "PREDATOR" | "APEX" = "FREE";
      let newMaxWallets = 1;

      // Harga di-hardcode sesuai setup MoonPay lu
      if (amountPaid === 29) {
        newTier = "SCOUT";
        newMaxWallets = 3;
      } else if (amountPaid === 99) {
        newTier = "PREDATOR";
        newMaxWallets = 15;
      } else if (amountPaid === 499) {
        newTier = "APEX";
        newMaxWallets = 100;
      }

      // 5. UPDATE DATABASE PRISMA! 🔥
      if (newTier !== "FREE") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: newTier,
            maxWallets: newMaxWallets,
          },
        });
        console.log(
          `[MOONPAY WEBHOOK] Sukses upgrade user ${userId} ke tier ${newTier}`,
        );
      }
    }

    // Wajib kasih respon 200 OK biar MoonPay tau sinyalnya udah kita terima
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[MOONPAY WEBHOOK ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
