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
  // BYPASS ALCHEMY: Kita pake Public RPC gratisan yang ngebut
  const url =
    network === "ETHEREUM"
      ? `https://cloudflare-eth.com`
      : `https://mainnet.base.org`;

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
