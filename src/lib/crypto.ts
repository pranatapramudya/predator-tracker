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
    if (data.result) {
      return Number(BigInt(data.result)) / 1e18;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

/**
 * MENGAMBIL SALDO BITCOIN (THE FINAL BOSS ENGINE)
 * Menggunakan Case-Insensitive Parsing untuk Blockchair
 */
export async function getBTCBalance(address: string): Promise<number> {
  const cb = Date.now();

  // ENGINE 1: Blockchair (Paling Stabil)
  try {
    const res = await fetch(
      `https://api.blockchair.com/bitcoin/dashboards/address/${address}?_=${cb}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      // Mengambil data pertama tanpa peduli key address (case-insensitive)
      const addressData =
        data.data && Object.values(data.data)[0]
          ? (Object.values(data.data)[0] as any)
          : null;

      if (addressData && addressData.address) {
        const bal = Number(addressData.address.balance) / 100_000_000;
        if (!isNaN(bal) && bal >= 0) return bal;
      }
    }
  } catch (e) {}

  // ENGINE 2: BlockCypher (Fallback 1)
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?t=${cb}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      const bal = Number(data.final_balance || 0) / 100_000_000;
      if (!isNaN(bal) && bal >= 0) return bal;
    }
  } catch (e) {}

  // ENGINE 3: Blockchain.info (Fallback 2)
  try {
    const res = await fetch(
      `https://blockchain.info/q/addressbalance/${address}?t=${cb}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const text = await res.text();
      const bal = Number(text) / 100_000_000;
      if (!isNaN(bal) && bal >= 0) return bal;
    }
  } catch (e) {}

  return 0;
}
