import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Pastiin path-nya bener

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ====================================================================
    // 1. LOGIKA UPGRADE (Pas Bayar / Perpanjang Bulanan Sukses)
    // ====================================================================
    if (
      body.type === "transaction_updated" &&
      body.data.status === "completed"
    ) {
      const userId =
        body.data.externalCustomerId || body.data.clientReferenceId;
      const amountPaid = body.data.baseCurrencyAmount;

      if (!userId) {
        return NextResponse.json(
          { error: "No User ID attached" },
          { status: 400 },
        );
      }

      let newTier: "FREE" | "SCOUT" | "PREDATOR" | "APEX" = "FREE";
      let newMaxWallets = 1;

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

      if (newTier !== "FREE") {
        await prisma.user.update({
          where: { id: userId },
          data: { tier: newTier, maxWallets: newMaxWallets },
        });
        console.log(
          `[MOONPAY WEBHOOK] Sukses upgrade user ${userId} ke tier ${newTier}`,
        );
      }
    }

    // ====================================================================
    // 🔥 2. LOGIKA DOWNGRADE (Pas Batal Langganan / Kartu Kredit Gagal) 🔥
    // ====================================================================
    if (
      body.type === "subscription_canceled" ||
      body.type === "subscription_deleted"
    ) {
      const userId =
        body.data.externalCustomerId || body.data.clientReferenceId;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: "FREE",
            maxWallets: 1, // Balikin ke limit gembel
          },
        });
        console.log(
          `[MOONPAY WEBHOOK] Sadge, user ${userId} batal langganan. Turun kasta ke FREE.`,
        );
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[MOONPAY WEBHOOK ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
