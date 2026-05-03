// src/lib/aiScoring.ts

export interface TokenPayload {
  liquidity: string;
  age: string;
  mintStatus: string;
  freezeStatus: string;
  lpStatus: string;
  honeypotStatus: string;
}

export async function getAIScore(payload: TokenPayload) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Kunci API Gemini belum dipasang!");
    }

    const prompt = `Kamu adalah sistem analis on-chain ahli. Analisis data token berikut:
- Likuiditas: ${payload.liquidity}
- Umur Koin: ${payload.age}
- Keamanan Mint: ${payload.mintStatus}
- Keamanan Freeze: ${payload.freezeStatus}
- Status LP: ${payload.lpStatus}
- Deteksi Honeypot: ${payload.honeypotStatus}

Berikan skor probabilitas potensi profit dari 0-100 dan berikan alasan maksimal 6 kata. Kembalikan HANYA format JSON murni tanpa markdown, tanpa penjelasan tambahan. Contoh: {"score": 85, "reason": "Aman dari rugpull, liquiditas memadai"}`;

    // 🔥 Pindah ke jalur 'gemini-pro' yang paling stabil dan anti-404
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Tetap dingin dan logis
          },
        }),
      },
    );

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error(
        `[GEMINI ERROR API] Status: ${response.status}, Detail:`,
        errorDetail,
      );
      throw new Error("Gagal nembak API Gemini");
    }

    const data = await response.json();

    let aiText = data.candidates[0].content.parts[0].text;

    // 🧹 PEMBERSIH JSON: Jaga-jaga kalau Gemini ngebandel nambahin ```json ... ```
    aiText = aiText
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const aiResult = JSON.parse(aiText);

    return {
      score: aiResult.score || 0,
      reason: aiResult.reason || "Alasan tidak terdeteksi",
    };
  } catch (error) {
    console.error("🤖 Error AI Scoring:", error);
    return {
      score: 0,
      reason: "Sistem AI sedang offline",
    };
  }
}
