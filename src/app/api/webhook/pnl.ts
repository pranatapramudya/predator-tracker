import { prisma } from "@/lib/prisma"; // Sesuaikan path ini kalau file prisma.ts lo ada di tempat lain (misal "@/lib/prisma")

export async function processWhaleTrade(
  walletId: string,
  tokenAddress: string,
  tokenSymbol: string,
  type: "BUY" | "SELL",
  amountTokens: number,
  usdValue: number,
) {
  // 1. Cari posisi koin ini di database
  let position = await prisma.tokenPosition.findUnique({
    where: {
      walletId_tokenAddress: { walletId, tokenAddress },
    },
  });

  // 2. Kalau belum ada, bikin entri baru
  if (!position) {
    position = await prisma.tokenPosition.create({
      data: {
        walletId,
        tokenAddress,
        tokenSymbol,
        tokenAmount: 0,
        totalInvestedUsd: 0,
        avgBuyPriceUsd: 0,
        realizedPnlUsd: 0,
      },
    });
  }

  // 3. Konversi Decimal dari database ke tipe Number biasa untuk dikalkulasi
  const currentAmount = Number(position.tokenAmount);
  const currentInvested = Number(position.totalInvestedUsd);
  const currentRealized = Number(position.realizedPnlUsd);

  if (type === "BUY") {
    // 🟢 LOGIKA BUY: Hitung Average Buy Price (DCA)
    const newTotalInvested = currentInvested + usdValue;
    const newTokenAmount = currentAmount + amountTokens;
    // Cegah pembagian dengan nol
    const newAvgBuyPrice =
      newTokenAmount > 0 ? newTotalInvested / newTokenAmount : 0;

    await prisma.tokenPosition.update({
      where: { id: position.id },
      data: {
        tokenAmount: newTokenAmount,
        totalInvestedUsd: newTotalInvested,
        avgBuyPriceUsd: newAvgBuyPrice,
      },
    });
  } else if (type === "SELL") {
    // 🔴 LOGIKA SELL: Hitung Realized PnL dan Win Rate
    const sellPrice = amountTokens > 0 ? usdValue / amountTokens : 0;
    const tradePnl =
      (sellPrice - Number(position.avgBuyPriceUsd)) * amountTokens;

    const remainingTokens = Math.max(0, currentAmount - amountTokens);
    const proportionSold = currentAmount > 0 ? amountTokens / currentAmount : 0;
    const remainingInvested = Math.max(
      0,
      currentInvested - currentInvested * proportionSold,
    );

    // Update tas koin si paus
    await prisma.tokenPosition.update({
      where: { id: position.id },
      data: {
        tokenAmount: remainingTokens,
        totalInvestedUsd: remainingInvested,
        realizedPnlUsd: currentRealized + tradePnl,
      },
    });

    // Update Win Rate si paus di tabel Wallet
    if (tradePnl > 0) {
      // Trade untung (Cuan)
      await prisma.wallet.update({
        where: { id: walletId },
        data: {
          successTrades: { increment: 1 },
          totalTrades: { increment: 1 },
        },
      });
    } else {
      // Trade rugi (Boncos)
      await prisma.wallet.update({
        where: { id: walletId },
        data: {
          totalTrades: { increment: 1 },
        },
      });
    }

    // Kalkulasi ulang presentase Win Rate (%)
    const updatedWallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (updatedWallet && updatedWallet.totalTrades > 0) {
      const newWinRate =
        (updatedWallet.successTrades / updatedWallet.totalTrades) * 100;
      await prisma.wallet.update({
        where: { id: walletId },
        data: { winRate: newWinRate },
      });
    }
  }
}

// Fitur untuk ngecek floating profit/loss real-time ke DexScreener
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
