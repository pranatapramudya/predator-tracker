// lib/crypto.ts

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

export async function getEVMBalance(
  address: string,
  network: "ETHEREUM" | "BASE",
): Promise<number> {
  // BYPASS ALCHEMY: Pake LlamaRPC (ETH) & Public Base (BASE)
  const url =
    network === "ETHEREUM"
      ? `https://eth.llamarpc.com`
      : `https://mainnet.base.org`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Topeng Ninja biar Vercel gak dikira bot
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
 * MENGAMBIL SALDO BITCOIN (Public API, Gak butuh API Key!)
 */
export async function getBTCBalance(address: string): Promise<number> {
  try {
    // API publik dari blockchain.info (sangat stabil)
    const response = await fetch(
      `https://blockchain.info/q/addressbalance/${address}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) return 0;

    const satoshis = await response.text();
    // 1 BTC = 100.000.000 Satoshis
    const btcAmount = Number(satoshis) / 100_000_000;
    return btcAmount;
  } catch (error) {
    console.error("Gagal narik saldo BTC:", error);
    return 0;
  }
}
