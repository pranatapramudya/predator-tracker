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

    const prompt = `You are an expert on-chain crypto analyst. Analyze the following token data:
- Liquidity: ${payload.liquidity}
- Token Age: ${payload.age}
- Mint Security: ${payload.mintStatus}
- Freeze Security: ${payload.freezeStatus}
- LP Status: ${payload.lpStatus}
- Honeypot Status: ${payload.honeypotStatus}

Provide a profit probability score from 0 to 100. Also provide a very short reason (maximum 6 words). 
The reason MUST BE STRICTLY IN ENGLISH. 
Return ONLY in valid JSON format with keys "score" (number) and "reason" (string).`;

    // 🔥 Pindah ke model Gemini 2.5 Flash (Sesuai List API Lu)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json", // Aktifin lagi fitur sakti JSON murni
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
