// pnl.ts
import { prisma } from "@/lib/prisma"; // Sesuaikan path

export async function processWhaleTrade(
  walletId: string, // ID Paus On-chain
  tokenAddress: string,
  tokenSymbol: string,
  type: "BUY" | "SELL",
  amountTokens: number,
  usdValue: number,
) {
  // ⚡ SOLUSI RACE CONDITION: Menggunakan Prisma Interactive Transaction
  // Semua proses di dalam blok ini bersifat Atomic. Kalau satu gagal, semua di-rollback.
  await prisma.$transaction(async (tx) => {
    // 1. Cari atau buat posisi (Upsert lebih efisien dari findUnique + create)
    const position = await tx.tokenPosition.upsert({
      where: {
        walletId_tokenAddress: { walletId, tokenAddress },
      },
      update: {}, // Jangan update apa-apa dulu, cuma ngambil lock/data
      create: {
        walletId,
        tokenAddress,
        tokenSymbol,
        tokenAmount: 0,
        totalInvestedUsd: 0,
        avgBuyPriceUsd: 0,
        realizedPnlUsd: 0,
      },
    });

    const currentAmount = Number(position.tokenAmount);
    const currentInvested = Number(position.totalInvestedUsd);
    const currentRealized = Number(position.realizedPnlUsd);

    if (type === "BUY") {
      const newTotalInvested = currentInvested + usdValue;
      const newTokenAmount = currentAmount + amountTokens;
      const newAvgBuyPrice =
        newTokenAmount > 0 ? newTotalInvested / newTokenAmount : 0;

      await tx.tokenPosition.update({
        where: { id: position.id },
        data: {
          tokenAmount: newTokenAmount,
          totalInvestedUsd: newTotalInvested,
          avgBuyPriceUsd: newAvgBuyPrice,
        },
      });
    } else if (type === "SELL") {
      const sellPrice = amountTokens > 0 ? usdValue / amountTokens : 0;
      const tradePnl =
        (sellPrice - Number(position.avgBuyPriceUsd)) * amountTokens;

      const remainingTokens = Math.max(0, currentAmount - amountTokens);
      const proportionSold =
        currentAmount > 0 ? amountTokens / currentAmount : 0;
      const remainingInvested = Math.max(
        0,
        currentInvested - currentInvested * proportionSold,
      );

      await tx.tokenPosition.update({
        where: { id: position.id },
        data: {
          tokenAmount: remainingTokens,
          totalInvestedUsd: remainingInvested,
          realizedPnlUsd: currentRealized + tradePnl,
        },
      });

      // Update Win Rate si paus di tabel Wallet
      if (tradePnl > 0) {
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            successTrades: { increment: 1 },
            totalTrades: { increment: 1 },
          },
        });
      } else {
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            totalTrades: { increment: 1 },
          },
        });
      }

      // Hitung ulang Win Rate
      const updatedWallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });
      if (updatedWallet && updatedWallet.totalTrades > 0) {
        const newWinRate =
          (updatedWallet.successTrades / updatedWallet.totalTrades) * 100;
        await tx.wallet.update({
          where: { id: walletId },
          data: { winRate: newWinRate },
        });
      }
    }
  });
}

export async function getUnrealizedPnL(
  tokenAddress: string,
  avgBuyPrice: number,
  tokenAmount: number,
) {
  if (tokenAmount <= 0) return 0;
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
    );
    const data = await res.json();
    if (data.pairs && data.pairs.length > 0) {
      const currentPrice = parseFloat(data.pairs[0].priceUsd);
      return (currentPrice - avgBuyPrice) * tokenAmount;
    }
  } catch (error) {
    console.error("Gagal menarik harga dari DexScreener", error);
  }
  return 0;
}
