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
    });

    const data = await response.json();

    // Pastiin kita balikin angka (number), bukan string
    const solAmount = data.result?.value / 1_000_000_000 || 0;
    return solAmount;
  } catch (error) {
    console.error("Gagal narik saldo Helius:", error);
    return 0;
  }
}
