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
    });

    const data = await response.json();
    const solAmount = data.result?.value / 1_000_000_000 || 0;
    return solAmount;
  } catch (error) {
    console.error("Gagal narik saldo Helius:", error);
    return 0;
  }
}

/**
 * MENGAMBIL SALDO EVM (ETH & BASE VIA ALCHEMY)
 */
export async function getEVMBalance(
  address: string,
  network: "ETHEREUM" | "BASE",
): Promise<number> {
  const apiKey = process.env.ALCHEMY_API_KEY;

  // Tentukan RPC URL berdasarkan network
  const url =
    network === "ETHEREUM"
      ? `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
      : `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });

    const data = await response.json();

    // Alchemy mengembalikan data dalam format Hexadecimal (Wei)
    // 1 ETH = 10^18 Wei
    if (data.result) {
      const balanceInWei = BigInt(data.result);
      const ethAmount = Number(balanceInWei) / 1_000_000_000_000_000_000;
      return ethAmount;
    }
    return 0;
  } catch (error) {
    console.error(`Gagal narik saldo ${network}:`, error);
    return 0;
  }
}
