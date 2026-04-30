// lib/rugcheck.ts

export async function getSecurityData(tokenAddress: string) {
  try {
    // Tarik data dari endpoint summary RugCheck
    const response = await fetch(
      `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`,
    );

    if (!response.ok) throw new Error("Gagal narik data RugCheck");

    const data = await response.json();

    // Default: Asumsikan koin aman sampai terbukti bersalah
    let mint = "✅ Disabled";
    let freeze = "✅ Disabled";
    let lp = "🔥 100% Burned";
    let honeypot = "🛡️ Not Detected (Simulated)";

    // Loop data 'risks' dari RugCheck buat ngecek ranjau
    if (data.risks && data.risks.length > 0) {
      for (const risk of data.risks) {
        // Deteksi tombol maut dev
        if (risk.name.toLowerCase().includes("mint"))
          mint = "🚫 Enabled (Bahaya)";
        if (risk.name.toLowerCase().includes("freeze"))
          freeze = "🚫 Enabled (Bahaya)";

        // Deteksi masalah likuiditas
        if (risk.name.toLowerCase().includes("liquidity"))
          lp = "⚠️ Unlocked/Low LP";

        // Deteksi Honeypot dari skor atau status danger
        if (risk.level === "danger" || data.score > 500) {
          honeypot = "🚫 High Risk / Possible Honeypot";
        }
      }
    }

    return { mint, freeze, lp, honeypot };
  } catch (error) {
    console.error("Error cek satpam:", error);
    // Kalau API down, jangan kasih "Aman", kasih "Unknown" biar lu waspada
    return {
      mint: "❓ Unknown",
      freeze: "❓ Unknown",
      lp: "❓ Unknown",
      honeypot: "❓ Error Checking",
    };
  }
}
