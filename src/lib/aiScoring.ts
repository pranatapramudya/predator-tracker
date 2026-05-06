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

    // 🔥 FIX UTAMA: Ganti URL endpoint ke model gemini-2.5-flash-lite
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // Suhu dikecilin biar respon JSON makin stabil
            responseMimeType: "application/json",
          },
          // 🛡️ SUPER SHIELD: Matikan filter moral Google biar gak nge-blokir analisis koin micin
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE",
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error(
        `[GEMINI ERROR API] Status: ${response.status}, Detail:`,
        errorDetail,
      );
      return { score: 0, reason: "API Connection Error" };
    }

    const data = await response.json();

    // 🛡️ CEK KOSONG: Tangkap kalau Google tetep ngeyel nge-blokir respon
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error(
        "⚠️ Gemini tidak memberikan jawaban (Mungkin terfilter):",
        JSON.stringify(data),
      );
      return { score: 10, reason: "Safety filter blocked" };
    }

    let aiText = data.candidates[0].content.parts[0].text;

    // 🧹 PEMBERSIH JSON
    aiText = aiText
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    // 🛡️ SAFE PARSE: Biar kalau JSON pecah, sistem gak langsung mati
    try {
      const aiResult = JSON.parse(aiText);
      return {
        score: aiResult.score || 0,
        reason: aiResult.reason || "Analysis completed",
      };
    } catch (parseError) {
      console.error("❌ Gagal Parse JSON Gemini:", aiText);
      return { score: 5, reason: "Format error from AI" };
    }
  } catch (error) {
    console.error("🤖 Error Fatal AI Scoring:", error);
    return {
      score: 0,
      reason: "AI System error",
    };
  }
}
