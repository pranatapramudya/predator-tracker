// lib/crypto.ts

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
 * MENGAMBIL SALDO BITCOIN (THE CACHE BUSTER)
 */
export async function getBTCBalance(address: string): Promise<number> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    Accept: "text/plain, application/json, */*",
  };

  // JURUS PENGHANCUR CACHE VERCEL
  const cb = Date.now();

  // ENGINE 1: Blockchain.info (Raw Text) - Paling kebal dari blokiran Vercel
  try {
    const res = await fetch(
      `https://blockchain.info/q/addressbalance/${address}?t=${cb}`,
      { headers, cache: "no-store" },
    );
    if (res.ok) {
      const text = await res.text();
      const bal = Number(text) / 100_000_000;
      if (!isNaN(bal) && bal >= 0) return bal;
    }
  } catch (e) {
    console.error("BTC Engine 1 Failed");
  }

  // ENGINE 2: Mempool.space (JSON Backup)
  try {
    const res = await fetch(
      `https://mempool.space/api/address/${address}?t=${cb}`,
      { headers, cache: "no-store" },
    );
    if (res.ok) {
      const data = await res.json();
      const funded = Number(data.chain_stats?.funded_txo_sum || 0);
      const spent = Number(data.chain_stats?.spent_txo_sum || 0);
      const bal = (funded - spent) / 100_000_000;
      if (!isNaN(bal) && bal >= 0) return bal;
    }
  } catch (e) {
    console.error("BTC Engine 2 Failed");
  }

  return 0;
}
