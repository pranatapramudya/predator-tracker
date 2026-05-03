// src/lib/aiScoring.ts

// Definisikan struktur data yang bakal dikirim ke AI
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
    // 🔥 UBAH NAMA VARIABEL JADI GEMINI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Kunci API Gemini belum dipasang!");
    }

    // Ngerakit Prompt
    const prompt = `Kamu adalah sistem analis on-chain ahli. Analisis data token berikut:
- Likuiditas: ${payload.liquidity}
- Umur Koin: ${payload.age}
- Keamanan Mint: ${payload.mintStatus}
- Keamanan Freeze: ${payload.freezeStatus}
- Status LP: ${payload.lpStatus}
- Deteksi Honeypot: ${payload.honeypotStatus}

Berikan skor probabilitas potensi profit dari 0-100 dan berikan alasan maksimal 6 kata. Kembalikan HANYA dalam format JSON dengan key "score" (number) dan "reason" (string).`;

    // Nembak API Gemini 1.5 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2, // Biar tetep logis dan dingin
            responseMimeType: "application/json", // 🔥 Fitur sakti Gemini biar outputnya murni JSON tanpa Markdown
          },
        }),
      },
    );

    // Error handling kalau Gemini nolak
    if (!response.ok) {
      const errorDetail = await response.text();
      console.error(
        `[GEMINI ERROR API] Status: ${response.status}, Detail:`,
        errorDetail,
      );
      throw new Error("Gagal nembak API Gemini");
    }

    const data = await response.json();

    // Parsing hasil jawaban Gemini ke Object JSON
    const aiText = data.candidates[0].content.parts[0].text;
    const aiResult = JSON.parse(aiText);

    return {
      score: aiResult.score || 0,
      reason: aiResult.reason || "Alasan tidak terdeteksi",
    };
  } catch (error) {
    console.error("🤖 Error AI Scoring:", error);
    // FALLBACK: Kalau API down/error, jangan kasih nilai palsu
    return {
      score: 0,
      reason: "System AI offline",
    };
  }
}
