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
    const solAmount = data.result?.value / 1_000_000_000 || 0;
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
      const ethAmount = Number(balanceInWei) / 1_000_000_000_000_000_000;
      return ethAmount;
    }
    return 0;
  } catch (error) {
    console.error(`Fetch Error ${network}:`, error);
    return 0;
  }
}

/**
 * MENGAMBIL SALDO BITCOIN (Via Mempool.space - Paling Stabil)
 */
export async function getBTCBalance(address: string): Promise<number> {
  try {
    const response = await fetch(
      `https://mempool.space/api/address/${address}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return 0;

    const data = await response.json();

    // BTC Balance = (Total Satoshis Masuk) - (Total Satoshis Keluar)
    const funded = data.chain_stats?.funded_txo_sum || 0;
    const spent = data.chain_stats?.spent_txo_sum || 0;
    const satoshis = funded - spent;

    // 1 BTC = 100.000.000 Satoshis
    return satoshis / 100_000_000;
  } catch (error) {
    console.error("Gagal narik saldo BTC:", error);
    return 0;
  }
}
