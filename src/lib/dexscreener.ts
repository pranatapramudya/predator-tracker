// src/lib/dexscreener.ts

/**
 * Fungsi buat nyari harga token micin apapun dalam hitungan detik.
 * Gratis dan tanpa API Key!
 */
export async function getTokenPriceUsd(tokenAddress: string): Promise<number> {
  try {
    // Hindari ngecek native token (SOL/ETH) ke DexScreener langsung kalau lu udah punya API lain,
    // tapi buat koin micin (SPL/ERC20), ini akurat banget.
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
    );
    const data = await res.json();

    if (data.pairs && data.pairs.length > 0) {
      // Ambil pair dengan likuiditas paling gede (biasanya index 0)
      return parseFloat(data.pairs[0].priceUsd || "0");
    }
    return 0;
  } catch (error) {
    console.error(`🚨 Gagal narik harga buat token ${tokenAddress}:`, error);
    return 0;
  }
}
