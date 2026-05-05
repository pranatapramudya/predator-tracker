import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getOrFetchTokenIntel(
  tokenAddress: string,
  tokenSymbol: string,
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

    console.log(`[AI FETCH] Menganalisis narasi ${tokenSymbol}...`);

    // Panggil versi 2.5 Flash yang emang udah lu pakai kemarin!
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt yang dipaksa murni JSON
    const prompt = `
      Analyze the crypto token symbol: ${tokenSymbol} (Address: ${tokenAddress}).
      Return ONLY a valid JSON object. No markdown, no text.
      Format exact keys:
      {
        "narrative": "AI Memecoin",
        "aiScore": 85,
        "mindshare": "Trending"
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Pembersih teks ekstra aman (anti error VS Code)
    responseText = responseText
      .replace(/\`\`\`json/g, "")
      .replace(/\`\`\`/g, "")
      .trim();

    const aiData = JSON.parse(responseText);

    // 3. SIMPAN HASILNYA
    return await prisma.tokenIntel.create({
      data: {
        tokenAddress,
        tokenSymbol,
        narrative: aiData.narrative || "Unknown",
        aiScore: Number(aiData.aiScore) || 50,
        mindshare: aiData.mindshare || "Early Alpha",
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
      },
    });
  }
}
