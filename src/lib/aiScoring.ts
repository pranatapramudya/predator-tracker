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
    // Pastikan lu udah masukin API Key di file .env
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("Kunci API DeepSeek belum dipasang!");
    }

    // Ngerakit Prompt yang udah lu buat tadi
    const prompt = `Kamu adalah sistem analis on-chain ahli. Analisis data token berikut:
- Likuiditas: ${payload.liquidity}
- Umur Koin: ${payload.age}
- Keamanan Mint: ${payload.mintStatus}
- Keamanan Freeze: ${payload.freezeStatus}
- Status LP: ${payload.lpStatus}
- Deteksi Honeypot: ${payload.honeypotStatus}

Berikan skor probabilitas potensi profit dari 0-100 dan berikan alasan maksimal 6 kata. Kembalikan HANYA dalam format JSON seperti ini: {"score": 85, "reason": "Aman dari rugpull, liquiditas memadai"}`;

    // Nembak API DeepSeek
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Pake model chat bawaan mereka
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah asisten AI yang hanya menjawab dengan format JSON murni tanpa markdown tambahan.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2, // Suhu rendah biar jawabannya logis & konsisten, nggak halu
      }),
    });

    if (!response.ok) throw new Error("Gagal nembak API DeepSeek");

    const data = await response.json();

    // Parsing hasil jawaban AI dari string ke Object JSON
    const aiResult = JSON.parse(data.choices[0].message.content);

    return {
      score: aiResult.score,
      reason: aiResult.reason,
    };
  } catch (error) {
    console.error("🤖 Error AI Scoring:", error);
    // FALLBACK: Kalau API down/error, jangan kasih nilai palsu
    return {
      score: 0,
      reason: "Sistem AI sedang offline",
    };
  }
}
