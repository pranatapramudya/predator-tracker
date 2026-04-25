// lib/crypto.ts

/**
 * MENGAMBIL SALDO SOLANA (HELIUS)
 */
export async function getSolanaBalance(address: string): Promise<number> {
  const apiKey = process.env.HELIUS_API_KEY;
  try {
    const res = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address],
        }),
        cache: "no-store",
      },
    );
    const data = await res.json();
    return Number(data.result?.value || 0) / 1_000_000_000;
  } catch (e) {
    return 0;
  }
}

/**
 * MENGAMBIL SALDO EVM (ETH & BASE VIA LLAMARPC/PUBLIC)
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
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.result) {
      return Number(BigInt(data.result)) / 1e18;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

/**
 * MENGAMBIL SALDO BITCOIN (TRIPLE ENGINE FALLBACK)
 */
export async function getBTCBalance(address: string): Promise<number> {
  const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };

  // ENGINE 1: Mempool.space
  try {
    const res = await fetch(`https://mempool.space/api/address/${address}`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const bal =
        (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) /
        100_000_000;
      if (!isNaN(bal)) return bal;
    }
  } catch (e) {}

  // ENGINE 2: Blockstream.info
  try {
    const res = await fetch(`https://blockstream.info/api/address/${address}`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const bal =
        (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) /
        100_000_000;
      if (!isNaN(bal)) return bal;
    }
  } catch (e) {}

  // ENGINE 3: Blockchain.info
  try {
    const res = await fetch(
      `https://blockchain.info/q/addressbalance/${address}`,
      { headers, cache: "no-store" },
    );
    if (res.ok) {
      const text = await res.text();
      const bal = Number(text) / 100_000_000;
      if (!isNaN(bal)) return bal;
    }
  } catch (e) {}

  return 0;
}
