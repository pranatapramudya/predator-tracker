import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfluenceSignal } from "@prisma/client"; // IMPORT ENUM DARI PRISMA

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getOrFetchTokenIntel(
  tokenAddress: string,
  tokenSymbol: string,
  currentPrice?: number,
  ema50?: number,
  rsi14?: number,
) {
  try {
    // 1. CEK CACHE DATABASE
    const cachedIntel = await prisma.tokenIntel.findUnique({
      where: { tokenAddress },
    });

    if (cachedIntel) {
      console.log(`[AI CACHE HIT] Ingatan lama untuk ${tokenSymbol}`);
      return cachedIntel;
    }

    console.log(
      `[AI FETCH] Menganalisis narasi dan confluency ${tokenSymbol}...`,
    );

    // Panggil versi 2.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. BUILD PROMPT DENGAN CONFLUENCY LOGIC (ENGLISH)
    let prompt = `
      You are an expert Crypto Analyst. Analyze the token symbol: ${tokenSymbol} (Address: ${tokenAddress}).
    `;

    // Inject data teknikal jika tersedia (saat paus beli)
    if (currentPrice && ema50 && rsi14) {
      prompt += `
      Current Market Data:
      - Current Price: ${currentPrice}
      - EMA-50: ${ema50}
      - RSI-14: ${rsi14}

      CONFLUENCY RULES FOR EVALUATION:
      1. TREND: If Current Price is greater than EMA-50, the trend is Bullish.
      2. MOMENTUM: If RSI-14 is between 40 and 70, momentum is healthy (not overbought).
      3. VOLUME: A recent massive whale purchase indicates strong volume (this is implied).

      TASK:
      - If Current Price > EMA-50 AND RSI-14 is between 40 and 70, classify confluence as "SUPER_ALPHA".
      - If Current Price < EMA-50 (trading against the trend), classify confluence as "HIGH_RISK".
      - If data is mixed or unclear, classify as "NEUTRAL".
      `;
    } else {
      prompt += `
      No technical data provided. Set confluence strictly as "PENDING".
      `;
    }

    // Paksa output murni JSON
    prompt += `
      Return ONLY a valid JSON object. No markdown, no text, no explanations.
      Format exact keys and types:
      {
        "narrative": "string (e.g., AI Memecoin, RWA, DeFi)",
        "aiScore": "number (0-100)",
        "mindshare": "string (Early Alpha / Trending / Hype Train)",
        "confluence": "string (SUPER_ALPHA / HIGH_RISK / NEUTRAL / PENDING)"
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // FIX 1: Regex dirapihin jadi satu baris biar nggak syntax error
    responseText = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const aiData = JSON.parse(responseText);

    // FIX 2: Validasi Enum dan Casting Tipe Data agar TypeScript nggak ngomel
    const validConfluence = (
      ["SUPER_ALPHA", "HIGH_RISK", "NEUTRAL", "PENDING"].includes(
        aiData.confluence,
      )
        ? aiData.confluence
        : "PENDING"
    ) as ConfluenceSignal;

    // 3. SIMPAN HASILNYA
    return await prisma.tokenIntel.create({
      data: {
        tokenAddress,
        tokenSymbol,
        narrative: aiData.narrative || "Unknown",
        aiScore: Number(aiData.aiScore) || 50,
        mindshare: aiData.mindshare || "Early Alpha",
        confluence: validConfluence,
      },
    });
  } catch (error) {
    console.error(`[AI ERROR] Gagal scan ${tokenSymbol}:`, error);

    // 4. FALLBACK AMAN MENGGUNAKAN UPSERT
    return await prisma.tokenIntel.upsert({
      where: { tokenAddress },
      update: {},
      create: {
        tokenAddress,
        tokenSymbol,
        narrative: "Unknown",
        aiScore: 50,
        mindshare: "Low",
        confluence: ConfluenceSignal.PENDING, // Pakai Enum dari Prisma langsung
      },
    });
  }
}
