// lib/crypto.ts

/**
 * MENGAMBIL SALDO SOLANA (HELIUS)
 */
export async function getSolanaBalance(address: string): Promise<number> {
  const apiKey = process.env.HELIUS_API_KEY;
  const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-test",
        method: "getBalance",
        params: [address],
      }),
      cache: "no-store",
    });

    const data = await response.json();
    const solAmount = Number(data.result?.value || 0) / 1_000_000_000;
    return solAmount;
  } catch (error) {
    console.error("Gagal narik saldo Solana:", error);
    return 0;
  }
}

/**
 * MENGAMBIL SALDO EVM (ETH & BASE VIA LLAMARPC)
 */
export async function getEVMBalance(
  address: string,
  network: "ETHEREUM" | "BASE",
): Promise<number> {
  const url =
    network === "ETHEREUM"
      ? `https://eth.llamarpc.com`
      : `https://mainnet.base.org`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (data.result) {
      const balanceInWei = BigInt(data.result);
      return Number(balanceInWei) / 1_000_000_000_000_000_000;
    }
    return 0;
  } catch (error) {
    console.error(`Fetch Error ${network}:`, error);
    return 0;
  }
}

/**
 * MENGAMBIL SALDO BITCOIN (DUAL ENGINE FALLBACK)
 */
export async function getBTCBalance(address: string): Promise<number> {
  // MESIN 1: API Blockchain.info (Sangat cepat, balikin angka murni)
  try {
    const res1 = await fetch(
      `https://blockchain.info/q/addressbalance/${address}`,
      {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        cache: "no-store",
      },
    );

    if (res1.ok) {
      const text = await res1.text();
      const satoshis = Number(text);
      if (!isNaN(satoshis)) return satoshis / 100_000_000;
    }
  } catch (err1) {
    console.error("Mesin BTC 1 (Blockchain.info) gagal, pindah ke Mesin 2...");
  }

  // MESIN 2: Backup pakai Mempool.space kalau Mesin 1 diblokir Vercel
  try {
    const res2 = await fetch(`https://mempool.space/api/address/${address}`, {
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      cache: "no-store",
    });

    if (res2.ok) {
      const data = await res2.json();
      const funded = data.chain_stats?.funded_txo_sum || 0;
      const spent = data.chain_stats?.spent_txo_sum || 0;
      const satoshis = funded - spent;
      return satoshis / 100_000_000;
    }
    return 0;
  } catch (err2) {
    console.error("Mesin BTC 2 (Mempool) juga gagal:", err2);
    return 0;
  }
}
