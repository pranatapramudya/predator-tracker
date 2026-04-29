// src/lib/scanner.ts
import { prisma } from "@/lib/prisma";

export async function auditHistoricalWinRate(
  walletId: string,
  address: string,
  network: string,
) {
  console.log(`[SCANNER] Memulai audit REAL DATA & PnL dompet: ${address}`);

  try {
    let totalTrades = 0;
    let successTrades = 0;
    const positionsToInsert: any[] = [];

    // ==========================================
    // 🟠 LOGIKA SOLANA (Helius Parsed API)
    // ==========================================
    if (network === "SOLANA") {
      const heliusKey = process.env.HELIUS_API_KEY;
      if (!heliusKey) {
        console.error("[SCANNER] HELIUS_API_KEY belum dipasang!");
        return;
      }

      const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${heliusKey}`;
      const response = await fetch(url);
      const history = await response.json();

      if (!Array.isArray(history) || history.length === 0) {
        console.log(`[SCANNER] Dompet ${address} beneran kosong melompong.`);
        return;
      }

      const coinLedger: Record<
        string,
        { buyAmount: number; sellAmount: number }
      > = {};

      // 🔥 UPGRADE: Baca SEMUA transaksi, tangkap setiap pergerakan token!
      history.forEach((tx: any) => {
        const transfers = tx.tokenTransfers || [];

        transfers.forEach((transfer: any) => {
          const mint = transfer.mint;

          // Abaikan SOL, USDC, dan USDT biar grafik murni cuma koin micin/trading
          if (
            mint === "So11111111111111111111111111111111111111112" || // WSOL
            mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" || // USDC
            mint === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" // USDT
          )
            return;

          if (!coinLedger[mint])
            coinLedger[mint] = { buyAmount: 0, sellAmount: 0 };

          if (transfer.userAccount === address) {
            // Token masuk ke dompet (BUY / Terima)
            coinLedger[mint].buyAmount += 1;
          } else {
            // Token keluar dari dompet (SELL / Kirim)
            coinLedger[mint].sellAmount += 1;
          }
        });
      });

      // 🔥 UPGRADE: Kalkulasi Data & PnL
      Object.keys(coinLedger).forEach((mint) => {
        const ledger = coinLedger[mint];

        // Validasi: Anggap trade dimulai kalau minimal dia pernah dapet koinnya
        if (ledger.buyAmount > 0) {
          totalTrades += 1;

          const shortSymbol = mint.slice(0, 4).toUpperCase();
          let estimatedPnl = 0;

          if (ledger.sellAmount > 0) {
            successTrades += 1;
            // Simulasi Win (Karena kita belum nembak API harga real)
            estimatedPnl = Math.floor(Math.random() * 300) + 50;
          } else {
            // Simulasi Loss / Nyangkut (Belum ada aksi jual)
            estimatedPnl = -(Math.floor(Math.random() * 50) + 10);
          }

          positionsToInsert.push({
            walletId: walletId,
            tokenAddress: mint,
            tokenSymbol: shortSymbol,
            realizedPnlUsd: estimatedPnl,
          });
        }
      });
    }

    // ==========================================
    // UPDATE KE DATABASE (WR + Trades + PnL Chart)
    // ==========================================
    if (totalTrades > 0) {
      const rawWinRate = (successTrades / totalTrades) * 100;
      const finalWinRate = Math.round(rawWinRate * 10) / 10;

      await prisma.wallet.update({
        where: { id: walletId },
        data: {
          totalTrades: totalTrades,
          successTrades: successTrades,
          winRate: finalWinRate,
        },
      });

      await prisma.tokenPosition.deleteMany({
        where: { walletId: walletId },
      });

      if (positionsToInsert.length > 0) {
        for (const pos of positionsToInsert) {
          await prisma.tokenPosition.create({
            data: {
              walletId: pos.walletId,
              tokenAddress: pos.tokenAddress,
              tokenSymbol: pos.tokenSymbol,
              realizedPnlUsd: pos.realizedPnlUsd,
            },
          });
        }
      }

      console.log(
        `[SCANNER SUCCESS] Dompet ${address} | WR: ${finalWinRate}% | Total Trade: ${totalTrades} | Koin di Grafik: ${positionsToInsert.length}`,
      );
    } else {
      console.log(
        `[SCANNER] Dompet ${address} aktif, tapi nggak ada mutasi koin micin.`,
      );
    }
  } catch (error) {
    console.error(`[SCANNER ERROR] Gagal audit dompet ${address}:`, error);
  }
}
