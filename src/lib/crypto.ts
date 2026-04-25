// src/lib/crypto.ts

export async function getSolanaBalance(address: string): Promise<number> {
  const apiKey = process.env.HELIUS_API_KEY;
  try {
    const res = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}&t=${Date.now()}`,
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

export async function getEVMBalance(
  address: string,
  network: "ETHEREUM" | "BASE",
): Promise<number> {
  const url =
    network === "ETHEREUM"
      ? `https://eth.llamarpc.com`
      : `https://mainnet.base.org`;
  try {
    const res = await fetch(`${url}?t=${Date.now()}`, {
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
    return data.result ? Number(BigInt(data.result)) / 1e18 : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * BTC BALANCE - VERSI ANTI-LIMIT & ANTI-CASE SENSITIVE
 */
export async function getBTCBalance(address: string): Promise<number> {
  const cb = Date.now();
  // Opsional: Tambahin &key=${process.env.BLOCKCHAIR_API_KEY} kalau lo punya key-nya
  const blockchairUrl = `https://api.blockchair.com/bitcoin/dashboards/address/${address}?_=${cb}`;

  try {
    const res = await fetch(blockchairUrl, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      // JURUS SAKTI: Ambil data pertama di dalam objek 'data' tanpa peduli nama key-nya
      const addressData =
        data.data && Object.values(data.data)[0]
          ? (Object.values(data.data)[0] as any)
          : null;
      if (addressData?.address?.balance !== undefined) {
        return Number(addressData.address.balance) / 100_000_000;
      }
    }
  } catch (e) {
    console.error("Blockchair failed");
  }

  // Fallback: Blockchain.info
  try {
    const res = await fetch(
      `https://blockchain.info/q/addressbalance/${address}?_=${cb}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const text = await res.text();
      return Number(text) / 100_000_000;
    }
  } catch (e) {
    console.error("Blockchain.info failed");
  }

  return 0;
}
