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
  const url =
    network === "ETHEREUM"
      ? `https://rpc.ankr.com/eth`
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

  if (data.error || data.result === undefined) {
    throw new Error("EVM API Limit Reached");
  }

  return Number(BigInt(data.result)) / 1e18;
}

export async function getBTCBalance(address: string): Promise<number> {
  const cb = Date.now();

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

  throw new Error("BTC All Engines Timeout");
}

export async function getSolanaLatestSwap(address: string) {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&type=SWAP`,
      { cache: "no-store" },
    );

    if (!res.ok) return null;
    const txs = await res.json();

    if (txs && txs.length > 0) {
      const latestTx = txs[0];
      return {
        signature: latestTx.signature,
        description: latestTx.description || "Melakukan aktivitas Swap Token",
      };
    }
  } catch (e) {
    console.error("Helius Swap Fetch Error:", e);
  }
  return null;
}

// ==========================================
// FITUR BARU: SMART MONEY EVM (ETH & BASE)
// ==========================================
export async function getEVMLatestTokenTx(
  address: string,
  network: "ETHEREUM" | "BASE",
) {
  // Boleh tanpa API Key buat testing, tapi dilimit 1 request/detik sama Etherscan
  const apiKey =
    network === "ETHEREUM"
      ? process.env.ETHERSCAN_API_KEY
      : process.env.BASESCAN_API_KEY;
  const baseUrl =
    network === "ETHEREUM"
      ? "https://api.etherscan.io/api"
      : "https://api.basescan.org/api";
  const explorer =
    network === "ETHEREUM"
      ? "https://etherscan.io/tx"
      : "https://basescan.org/tx";

  try {
    const url = `${baseUrl}?module=account&action=tokentx&address=${address}&page=1&offset=1&sort=desc${apiKey ? `&apikey=${apiKey}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();

    if (data.status === "1" && data.result && data.result.length > 0) {
      const tx = data.result[0];

      // Deteksi ini token masuk (beli) atau keluar (jual)
      const isReceive = tx.to.toLowerCase() === address.toLowerCase();
      const action = isReceive ? "🟢 TERIMA/BELI" : "🔴 KIRIM/JUAL";

      // Kalkulasi desimal token (biar PEPE yang jumlahnya miliaran kebaca bener)
      const amount = Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal));

      return {
        signature: tx.hash,
        tokenSymbol: tx.tokenSymbol || "TOKEN",
        description: `${action} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tx.tokenSymbol}`,
        explorerUrl: `${explorer}/${tx.hash}`,
      };
    }
  } catch (e) {
    console.error("EVM Token Tx Error:", e);
  }
  return null;
}
