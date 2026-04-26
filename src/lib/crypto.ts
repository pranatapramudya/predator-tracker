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
  // ROUND ROBIN ANTI-LIMIT VERCEL
  const ethRPCs = [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://ethereum.publicnode.com",
    "https://1rpc.io/eth",
  ];
  const rpcList =
    network === "ETHEREUM" ? ethRPCs : ["https://mainnet.base.org"];

  for (const url of rpcList) {
    try {
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

      if (!res.ok) continue;
      const data = await res.json();

      if (!data.error && data.result !== undefined) {
        return Number(BigInt(data.result)) / 1e18;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error("EVM All RPCs Timeout/Limit");
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

      let tokenAddress = "solana";
      let tokenAmount = 0;
      let tokenSymbol = "MEME_COIN";
      let usdValue = 0;

      // 1. Ekstraksi Token Address & Amount
      if (latestTx.tokenTransfers && latestTx.tokenTransfers.length > 0) {
        const transfer =
          latestTx.tokenTransfers.find(
            (t: any) =>
              t.mint !== "So11111111111111111111111111111111111111112",
          ) || latestTx.tokenTransfers[0];
        tokenAddress = transfer.mint;
        tokenAmount = transfer.tokenAmount;
      }

      // 2. Integrasi DexScreener untuk Harga Real-time
      if (tokenAddress && tokenAddress !== "solana") {
        try {
          const dexRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
            { cache: "no-store" },
          );
          if (dexRes.ok) {
            const dexData = await dexRes.json();
            if (dexData.pairs && dexData.pairs.length > 0) {
              const pair = dexData.pairs[0];
              const priceUsd = parseFloat(pair.priceUsd || "0");

              usdValue = priceUsd * tokenAmount;
              tokenSymbol = pair.baseToken.symbol || "TOKEN";
            }
          }
        } catch (dexError) {
          console.error("DexScreener Fetch Error:", dexError);
        }
      }

      return {
        signature: latestTx.signature,
        description: latestTx.description || "Melakukan aktivitas Swap Token",
        amount: tokenAmount,
        tokenSymbol: tokenSymbol,
        tokenAddress: tokenAddress,
        usdValue: usdValue > 0 ? Number(usdValue.toFixed(2)) : 0,
      };
    }
  } catch (e) {
    console.error("Helius Swap Fetch Error:", e);
  }
  return null;
}

export async function getEVMLatestTokenTx(
  address: string,
  network: "ETHEREUM" | "BASE",
) {
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
      const isReceive = tx.to.toLowerCase() === address.toLowerCase();
      const action = isReceive ? "🟢 TERIMA/BELI" : "🔴 KIRIM/JUAL";

      const amount = Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal));
      const tokenAddress = tx.contractAddress;

      let usdValue = 0;
      let finalTokenSymbol = tx.tokenSymbol || "TOKEN";

      // Integrasi DexScreener untuk EVM
      if (tokenAddress) {
        try {
          const dexRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
            { cache: "no-store" },
          );
          if (dexRes.ok) {
            const dexData = await dexRes.json();
            if (dexData.pairs && dexData.pairs.length > 0) {
              const pair = dexData.pairs[0];
              const priceUsd = parseFloat(pair.priceUsd || "0");

              usdValue = priceUsd * amount;
              finalTokenSymbol = pair.baseToken.symbol || finalTokenSymbol;
            }
          }
        } catch (dexError) {
          console.error(`DexScreener EVM Fetch Error (${network}):`, dexError);
        }
      }

      return {
        signature: tx.hash,
        tokenSymbol: finalTokenSymbol,
        description: `${action} ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${finalTokenSymbol}`,
        explorerUrl: `${explorer}/${tx.hash}`,
        amount: amount,
        tokenAddress: tokenAddress,
        usdValue: usdValue > 0 ? Number(usdValue.toFixed(2)) : 0,
      };
    }
  } catch (e) {
    console.error(`EVM Token Tx Error (${network}):`, e);
  }
  return null;
}
