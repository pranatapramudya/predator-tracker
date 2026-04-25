// lib/crypto.ts

export async function getSolanaBalance(address: string) {
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
    // Saldo Solana itu satuannya Lamport, harus dibagi 1 milyar biar jadi SOL
    const solAmount = data.result?.value / 1_000_000_000 || 0;
    return solAmount.toFixed(2); // Kita ambil 2 angka di belakang koma aja biar rapi
  } catch (error) {
    console.error("Gagal narik saldo Helius:", error);
    return "0.00";
  }
}
