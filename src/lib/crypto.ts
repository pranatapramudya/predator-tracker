// src/lib/crypto.ts

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export async function getSolanaBalance(address: string): Promise<number> {
  const apiKey = process.env.HELIUS_API_KEY;
  const res = await fetch(
    `https://mainnet.helius-rpc.com/?api-key=${apiKey}&t=${Date.now()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error("Solana Network Timeout");
  const data = await res.json();
  if (data.error) throw new Error("Solana API Limit Reached");

  return Number(data.result?.value || 0) / 1_000_000_000;
}

export async function getEVMBalance(
  address: string,
  network: "ETHEREUM" | "BASE",
): Promise<number> {
  // Ganti ke Cloudflare biar badak anti-limit buat ETH
  const url =
    network === "ETHEREUM"
      ? process.env.ETH_RPC_URL || `https://cloudflare-eth.com`
      : `https://mainnet.base.org`;

  const res = await fetch(`${url}?t=${Date.now()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...HEADERS },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("EVM Network Timeout");
  const data = await res.json();

  // CEGAH FALSE ALARM: Kalau API gagal balikin result, lempar error!
  if (data.error || data.result === undefined) {
    throw new Error("EVM API Limit Reached");
  }

  return Number(BigInt(data.result)) / 1e18;
}

export async function getBTCBalance(address: string): Promise<number> {
  const cb = Date.now();

  // ENGINE 1: Blockchain.info
  try {
    const res = await fetch(
      `https://blockchain.info/q/addressbalance/${address}?_=${cb}`,
      { cache: "no-store", headers: HEADERS },
    );
    if (res.ok) {
      const text = await res.text();
      const bal = Number(text) / 100_000_000;
      if (!isNaN(bal)) return bal;
    }
  } catch (e) {}

  // ENGINE 2: BlockCypher
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?_=${cb}`,
      { cache: "no-store", headers: HEADERS },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.final_balance !== undefined) {
        const bal = Number(data.final_balance) / 100_000_000;
        if (!isNaN(bal)) return bal;
      }
    }
  } catch (e) {}

  // ENGINE 3: Mempool.space
  try {
    const res = await fetch(
      `https://mempool.space/api/address/${address}?_=${cb}`,
      { cache: "no-store", headers: HEADERS },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.chain_stats) {
        const bal =
          ((data.chain_stats.funded_txo_sum || 0) -
            (data.chain_stats.spent_txo_sum || 0)) /
          100_000_000;
        if (!isNaN(bal)) return bal;
      }
    }
  } catch (e) {}

  // CEGAH FALSE ALARM: Kalau ke-3 API mati/limit, JANGAN balikin 0. Lempar error!
  throw new Error("BTC All Engines Timeout/Rate Limited");
}
