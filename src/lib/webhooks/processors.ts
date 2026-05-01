// src/app/api/webhook/processors.ts
import { processWhaleTrade } from "@/app/api/webhook/pnl";
import { Network, Prisma } from "@prisma/client";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { prisma } from "../prisma";
import { resolveAsset } from "./pricing";
import type {
  AlchemyAddressActivityPayload,
  HeliusEnhancedTransaction,
  TransferCandidate,
  WebhookSource,
  WhaleAction,
} from "./types";

const MIN_ALERT_USD = 0.1;

// 🧠 BUKU CATATAN CACHE (BIAR SUPER KILAT!)
const insiderRiskCache = new Map<string, { data: string; timestamp: number }>();
const securityRiskCache = new Map<
  string,
  { data: string; timestamp: number }
>();
const dexscreenerCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache bertahan 5 menit

type AlchemyActivity = NonNullable<
  NonNullable<AlchemyAddressActivityPayload["event"]>["activity"]
>[number];

function normalizeAddress(address: string, network: Network): string {
  return network === Network.SOLANA ? address : address.toLowerCase();
}

function explorerUrlFor(network: Network, signature: string): string {
  if (network === Network.SOLANA) return `https://solscan.io/tx/${signature}`;
  if (network === Network.BASE) return `https://basescan.org/tx/${signature}`;
  return `https://etherscan.io/tx/${signature}`;
}

function hexToNumber(value?: string, decimals = 18): number | null {
  if (!value) return null;
  try {
    const raw = BigInt(value);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = raw / base;
    const fraction = raw % base;
    const fractionString = fraction
      .toString()
      .padStart(decimals, "0")
      .slice(0, 8);
    return Number(`${whole.toString()}.${fractionString || "0"}`);
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getAlchemySigningKeys(): string[] {
  return (process.env.ALCHEMY_SIGNING_KEYS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function verifyHeliusAuth(headers: Headers): boolean {
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET?.trim();
  if (!sharedSecret) return true;
  const authorization = headers.get("authorization")?.trim();
  if (!authorization) return false;
  return (
    safeEqual(authorization, sharedSecret) ||
    safeEqual(authorization, `Bearer ${sharedSecret}`)
  );
}

function verifyAlchemySignature(headers: Headers, rawBody: string): boolean {
  const signingKeys = getAlchemySigningKeys();
  if (signingKeys.length === 0) return true;
  const signature = headers.get("x-alchemy-signature")?.trim();
  if (!signature) return false;
  return signingKeys.some((signingKey) => {
    const digest = createHmac("sha256", signingKey)
      .update(rawBody)
      .digest("hex");
    return safeEqual(digest, signature);
  });
}

export function detectWebhookSource(payload: unknown): WebhookSource | null {
  if (Array.isArray(payload)) return "HELIUS";
  if (
    payload &&
    typeof payload === "object" &&
    "type" in payload &&
    "event" in payload
  )
    return "ALCHEMY";
  return null;
}

export function verifyWebhookRequest(params: {
  source: WebhookSource;
  headers: Headers;
  rawBody: string;
}): boolean {
  if (params.source === "HELIUS") return verifyHeliusAuth(params.headers);
  return verifyAlchemySignature(params.headers, params.rawBody);
}

function parseHeliusTransfers(
  payload: HeliusEnhancedTransaction[],
): TransferCandidate[] {
  const candidates: TransferCandidate[] = [];
  payload.forEach((transaction, txIndex) => {
    const signature = transaction.signature;
    if (!signature) return;

    transaction.nativeTransfers?.forEach((transfer, transferIndex) => {
      if (
        !transfer.amount ||
        !transfer.fromUserAccount ||
        !transfer.toUserAccount
      )
        return;
      candidates.push({
        source: "HELIUS",
        network: Network.SOLANA,
        signature,
        amount: transfer.amount / 1_000_000_000,
        symbol: "SOL",
        tokenIdentifier: "SOL",
        fromAddress: transfer.fromUserAccount,
        toAddress: transfer.toUserAccount,
        explorerUrl: explorerUrlFor(Network.SOLANA, signature),
        dedupeBase: `helius:${signature}:native:${txIndex}:${transferIndex}`,
      });
    });

    transaction.tokenTransfers?.forEach((transfer, transferIndex) => {
      if (
        !transfer.tokenAmount ||
        !transfer.fromUserAccount ||
        !transfer.toUserAccount
      )
        return;
      candidates.push({
        source: "HELIUS",
        network: Network.SOLANA,
        signature,
        amount: transfer.tokenAmount,
        symbol: transfer.symbol,
        tokenIdentifier: transfer.mint,
        fromAddress: transfer.fromUserAccount,
        toAddress: transfer.toUserAccount,
        explorerUrl: explorerUrlFor(Network.SOLANA, signature),
        dedupeBase: `helius:${signature}:token:${txIndex}:${transferIndex}`,
      });
    });
  });
  return candidates;
}

function mapAlchemyNetwork(network?: string): Network | null {
  if (!network) return null;
  if (network.startsWith("BASE")) return Network.BASE;
  if (network.startsWith("ETH")) return Network.ETHEREUM;
  return null;
}

function parseAlchemyAmount(activity: AlchemyActivity): number | null {
  if (
    typeof activity.value === "number" &&
    Number.isFinite(activity.value) &&
    activity.value > 0
  )
    return activity.value;
  const rawValue = hexToNumber(
    activity.rawContract?.rawValue,
    activity.rawContract?.decimals ?? 18,
  );
  return rawValue && rawValue > 0 ? rawValue : null;
}

function parseAlchemyTransfers(
  payload: AlchemyAddressActivityPayload,
): TransferCandidate[] {
  const network = mapAlchemyNetwork(payload.event?.network);
  if (!network) return [];
  const eventId = payload.id ?? randomUUID();

  return (
    payload.event?.activity?.flatMap((activity, index) => {
      const signature = activity.hash;
      const amount = parseAlchemyAmount(activity);
      if (!signature || !amount || !activity.fromAddress || !activity.toAddress)
        return [];

      return [
        {
          source: "ALCHEMY" as const,
          network,
          signature,
          amount,
          symbol: activity.asset,
          tokenIdentifier: activity.rawContract?.address,
          fromAddress: activity.fromAddress,
          toAddress: activity.toAddress,
          explorerUrl: explorerUrlFor(network, signature),
          dedupeBase: `alchemy:${eventId}:${index}`,
        },
      ];
    }) ?? []
  );
}

function extractCandidates(
  source: WebhookSource,
  payload: unknown,
): TransferCandidate[] {
  if (source === "HELIUS")
    return parseHeliusTransfers(payload as HeliusEnhancedTransaction[]);
  return parseAlchemyTransfers(payload as AlchemyAddressActivityPayload);
}

async function loadTrackedWallets(candidates: TransferCandidate[]) {
  const addressesByNetwork = new Map<Network, Set<string>>();

  for (const candidate of candidates) {
    const addresses =
      addressesByNetwork.get(candidate.network) ?? new Set<string>();
    if (candidate.fromAddress)
      addresses.add(normalizeAddress(candidate.fromAddress, candidate.network));
    if (candidate.toAddress)
      addresses.add(normalizeAddress(candidate.toAddress, candidate.network));
    addressesByNetwork.set(candidate.network, addresses);
  }

  const networkClauses = Array.from(addressesByNetwork.entries())
    .filter(([, addresses]) => addresses.size > 0)
    .map(([network, addresses]) => ({
      network,
      address: { in: Array.from(addresses) },
    }));

  if (networkClauses.length === 0) return new Map<string, any[]>();

  const wallets = await prisma.wallet.findMany({
    where: { isActive: true, OR: networkClauses },
    select: {
      id: true,
      address: true,
      name: true,
      network: true,
      chatId: true,
    },
  });

  const walletMap = new Map<string, typeof wallets>();
  for (const wallet of wallets) {
    const key = `${wallet.network}:${normalizeAddress(wallet.address, wallet.network)}`;
    if (!walletMap.has(key)) walletMap.set(key, []);
    walletMap.get(key)!.push(wallet);
  }
  return walletMap;
}

function isDuplicateError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function checkSolanaInsiderRisk(tokenAddress: string): Promise<string> {
  try {
    const now = Date.now();
    const cached = insiderRiskCache.get(tokenAddress);
    if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
      console.log(`[CACHE HIT] Helius Insider Risk: ${tokenAddress}`);
      return cached.data;
    }

    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return "";

    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

    const supplyRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenSupply",
        params: [tokenAddress],
      }),
    });
    const supplyData = await supplyRes.json();
    const totalSupply = supplyData?.result?.value?.uiAmount;

    if (!totalSupply) return "";

    const accountsRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [tokenAddress],
      }),
    });
    const accountsData = await accountsRes.json();
    const largestAccounts = accountsData?.result?.value;

    if (!largestAccounts || !Array.isArray(largestAccounts)) return "";

    let insiderAmount = 0;
    const top10 = largestAccounts.slice(1, 11);
    for (const acc of top10) {
      insiderAmount += acc.uiAmount || 0;
    }

    const insiderPercentage = (insiderAmount / totalSupply) * 100;
    let result = "";

    if (insiderPercentage > 30) {
      result = `\n☠️ *INSIDER RISK:* 🔴 EXTREME DANGER! (Top 10 holds ${insiderPercentage.toFixed(1)}%)`;
    } else if (insiderPercentage > 15) {
      result = `\n⚠️ *INSIDER RISK:* 🟡 Caution (Top 10 holds ${insiderPercentage.toFixed(1)}%)`;
    } else {
      result = `\n🛡️ *INSIDER RISK:* 🟢 Safe (Healthy Distribution)`;
    }

    insiderRiskCache.set(tokenAddress, { data: result, timestamp: now });
    return result;
  } catch (error) {
    console.error(`[Predator System] Gagal cek insider risk:`, error);
    return "";
  }
}

// FUNGSI SATPAM RUGCHECK (VERSI KEBAL BLOKIR & CACHE CEPAT)
async function checkSecurityRisk(tokenAddress: string): Promise<string> {
  try {
    const now = Date.now();
    const cached = securityRiskCache.get(tokenAddress);
    if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
      console.log(`[CACHE HIT] Rugcheck Security: ${tokenAddress}`);
      return cached.data;
    }

    const response = await fetch(
      `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PredatorTracker/1.0",
        },
      },
    );

    if (!response.ok) {
      return `\n\n🔍 *SECURITY CHECK:*\n⚠️ API Error atau Token belum di-scan (${response.status})`;
    }

    const data = await response.json();

    let mint = "✅ Mint: Disabled";
    let freeze = "✅ Freeze: Disabled";
    let lp = "🔥 LP: 100% Burned";
    let honeypot = "🛡️ Honeypot: Not Detected";

    if (data.risks && data.risks.length > 0) {
      for (const risk of data.risks) {
        const name = risk.name.toLowerCase();
        if (name.includes("mint")) mint = "🚫 Mint: Enabled (Bahaya)";
        if (name.includes("freeze")) freeze = "🚫 Freeze: Enabled (Bahaya)";
        if (name.includes("liquidity")) lp = "⚠️ LP: Unlocked/Low";
        if (risk.level === "danger" || data.score > 500) {
          honeypot = "🚫 Honeypot: High Risk Detected";
        }
      }
    }
    const finalResult = `\n\n🔍 *SECURITY CHECK:*\n${mint}\n${freeze}\n${lp}\n${honeypot}`;

    securityRiskCache.set(tokenAddress, { data: finalResult, timestamp: now });
    return finalResult;
  } catch (error) {
    console.error(`[Security Check] Gagal periksa keamanan:`, error);
    return `\n\n🔍 *SECURITY CHECK:*\n⚠️ Server Timeout/Error.`;
  }
}

async function saveTransactionAndNotify(params: {
  candidate: TransferCandidate;
  wallet: {
    id: string;
    address: string;
    name: string | null;
    network: Network;
    chatId: string | null;
  };
  action: WhaleAction;
  symbol: string;
  usdValue: number;
}): Promise<void> {
  const dedupeKey = `${params.candidate.dedupeBase}:${params.wallet.id}:${params.action}`;

  try {
    await prisma.transaction.create({
      data: {
        walletId: params.wallet.id,
        dedupeKey,
        signature: params.candidate.signature,
        type: params.action,
        amount: new Prisma.Decimal(params.candidate.amount.toString()),
        tokenSymbol: params.symbol,
        usdValue: new Prisma.Decimal(params.usdValue.toFixed(2)),
        explorerUrl: params.candidate.explorerUrl,
        tokenAddress: params.candidate.tokenIdentifier || null,
      },
    });

    let isFirstTimeBuy = false;
    let liquidityUsd = 0;
    let multibaggerScore = 0;
    let volumeMcapRatio = 0;
    let tokenAgeHours = 0;
    let smartMoneyCount = 0;
    let insiderWarning = "";
    let metricsBlock = "";
    let securityBlock = "";

    // 1. PROSES TOKEN JIKA ADA TOKEN IDENTIFIER
    if (params.candidate.tokenIdentifier) {
      try {
        const existingPosition = await prisma.tokenPosition.findUnique({
          where: {
            walletId_tokenAddress: {
              walletId: params.wallet.id,
              tokenAddress: params.candidate.tokenIdentifier,
            },
          },
        });

        if (!existingPosition && params.action === "BUY") isFirstTimeBuy = true;

        await processWhaleTrade(
          params.wallet.id,
          params.candidate.tokenIdentifier,
          params.symbol,
          params.action as "BUY" | "SELL",
          params.candidate.amount,
          params.usdValue,
        );

        if (params.action === "BUY") {
          smartMoneyCount = await prisma.tokenPosition.count({
            where: {
              tokenAddress: params.candidate.tokenIdentifier,
              tokenAmount: { gt: 0 },
            },
          });
          if (smartMoneyCount >= 2) multibaggerScore += 2;

          // DEXSCREENER DENGAN CACHE
          try {
            const now = Date.now();
            const cachedDex = dexscreenerCache.get(
              params.candidate.tokenIdentifier,
            );
            let dexData;

            if (cachedDex && now - cachedDex.timestamp < CACHE_DURATION_MS) {
              console.log(
                `[CACHE HIT] DexScreener: ${params.candidate.tokenIdentifier}`,
              );
              dexData = cachedDex.data;
            } else {
              const dexRes = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${params.candidate.tokenIdentifier}`,
              );
              dexData = await dexRes.json();
              dexscreenerCache.set(params.candidate.tokenIdentifier, {
                data: dexData,
                timestamp: now,
              });
            }

            if (dexData.pairs && dexData.pairs.length > 0) {
              const pair = dexData.pairs[0];
              liquidityUsd = pair.liquidity?.usd || 0;
              const mcapUsd = pair.fdv || pair.marketCap || 0;
              const volume24h = pair.volume?.h24 || 0;

              if (pair.pairCreatedAt) {
                tokenAgeHours =
                  (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60);
                if (tokenAgeHours < 24) multibaggerScore += 1;
              }
              if (mcapUsd > 0) volumeMcapRatio = (volume24h / mcapUsd) * 100;
            }
          } catch (dexError) {
            console.error(`[DexScreener] Error:`, dexError);
          }

          // HELIUS INSIDER RISK
          try {
            if (params.wallet.network === Network.SOLANA) {
              insiderWarning = await checkSolanaInsiderRisk(
                params.candidate.tokenIdentifier,
              );
            }
          } catch (heliusError) {
            console.error(`[Helius] Error:`, heliusError);
          }

          // RUGCHECK SECURITY
          try {
            if (params.wallet.network === Network.SOLANA) {
              securityBlock = await checkSecurityRisk(
                params.candidate.tokenIdentifier,
              );
            }
          } catch (secError) {
            console.error(`[Security] Error:`, secError);
          }
        }
      } catch (error) {
        console.error(`[Predator System] Gagal proses Metrik utama:`, error);
      }
    }

    // 2. TARIK DATA RAPOR WHALE
    const whaleData = await prisma.wallet.findUnique({
      where: { id: params.wallet.id },
      select: { winRate: true, totalTrades: true },
    });

    const allPositions = await prisma.tokenPosition.findMany({
      where: { walletId: params.wallet.id },
      select: { realizedPnlUsd: true },
    });

    const totalRealizedPnl = allPositions.reduce(
      (sum, pos) => sum + Number(pos.realizedPnlUsd),
      0,
    );

    const winRateText =
      whaleData && whaleData.totalTrades > 0
        ? `${Number(whaleData.winRate).toFixed(1)}%`
        : "N/A (No Sells Yet)";

    const pnlText =
      totalRealizedPnl >= 0
        ? `+$${totalRealizedPnl.toFixed(2)} 🤑`
        : `-$${Math.abs(totalRealizedPnl).toFixed(2)} 🩸`;

    const whaleStatsBlock =
      `\n\n🏆 *WHALE STATS*` +
      `\n🎯 *Winrate:* ${winRateText} (${whaleData?.totalTrades || 0} Trades)` +
      `\n💰 *Total PnL:* ${pnlText}`;

    // 3. FORMATTING TELEGRAM
    let actionLabel = params.action === "BUY" ? "🟢 BUY" : "🔴 SELL";
    if (isFirstTimeBuy) actionLabel = "🔥 FIRST TIME BUY 🔥";

    let liquidityWarning = "";
    if (params.action === "BUY" && params.candidate.tokenIdentifier) {
      if (liquidityUsd < 10000 && liquidityUsd > 0)
        liquidityWarning = `\n⚠️ *LIQUIDITY:* [HIGH RISK] < $10k`;
      else if (liquidityUsd >= 10000)
        liquidityWarning = `\n💧 *Liquidity:* $${(liquidityUsd / 1000).toFixed(1)}k`;
    }

    if (params.action === "BUY" && params.candidate.tokenIdentifier) {
      metricsBlock =
        `\n\n📊 *ON-CHAIN METRICS*` +
        `\n💎 *Score:* ${multibaggerScore}/3 Points` +
        `\n🐳 *Smart Money:* ${smartMoneyCount} Wallets` +
        `\n⏳ *Age:* ${tokenAgeHours > 0 ? tokenAgeHours.toFixed(1) + "h" : "N/A"}` +
        `\n📈 *Vol/MCap:* ${volumeMcapRatio > 0 ? volumeMcapRatio.toFixed(1) + "%" : "N/A"} ` +
        (volumeMcapRatio > 50 ? `(🔥 Hot)` : `(🧊 Normal)`) +
        insiderWarning;
    }

    const isAlpha = params.usdValue >= 1000;
    const title = isAlpha
      ? "👑 *ALPHA PREDATOR ALERT!*"
      : "🚨 *WHALE ALERT* 🚨";

    const dyorFooter = `\n\n⚠️ *DISCLAIMER:*\n_Auto-generated from blockchain data. Not financial advice (NFA). Do your own research (DYOR)!_`;

    // 2. FILTER NOMINAL: BUY min $50, SELL min $100 🛡️
    if (params.action === "SELL" && params.usdValue < 100) {
      console.log(
        `[Silent Mode] ${params.wallet.name} SELL receh $${params.usdValue.toFixed(2)}. Skip notif.`,
      );
      return;
    }

    if (params.action === "BUY" && params.usdValue < 50) {
      console.log(
        `[Silent Mode] ${params.wallet.name} BUY receh $${params.usdValue.toFixed(2)}. Skip notif.`,
      );
      return;
    }

    // 3. RAKIT PESAN
    const message =
      `${title}\n\n` +
      `👤 *Whale:* ${params.wallet.name ?? "Unknown Target"}\n` +
      `📍 *Address:* \`${params.wallet.address}\`\n` +
      `📈 *Action:* ${actionLabel}\n` +
      `🪙 *Token:* ${params.symbol}\n` +
      `💰 *Value:* $${params.usdValue.toFixed(2)}${liquidityWarning}` +
      whaleStatsBlock +
      metricsBlock +
      securityBlock +
      dyorFooter;

    const inlineKeyboard = [];
    inlineKeyboard.push([
      { text: "🔍 View Transaction", url: params.candidate.explorerUrl },
    ]);

    if (params.candidate.tokenIdentifier) {
      const token = params.candidate.tokenIdentifier;
      inlineKeyboard.push([
        {
          text: "📊 Chart on DexScreener",
          url: `https://dexscreener.com/solana/${token}`,
        },
      ]);
      inlineKeyboard.push([
        { text: "⚡ Web3: Jupiter", url: `https://jup.ag/swap/SOL-${token}` },
        {
          text: "🤖 TG Bot: BonkBot",
          url: `https://t.me/bonkbot_bot?start=ref_${token}`,
        },
      ]);
      inlineKeyboard.push([
        { text: "🐦 Cek X", url: `https://twitter.com/search?q=${token}` },
        {
          text: "🫧 Bubblemaps",
          url: `https://app.bubblemaps.io/sol/token/${token}`,
        },
      ]);
    }

    // 4. ROUTING LOGIC: PISAHKAN KOLAM ALPHA DAN REGULER
    let targetChatId = params.wallet.chatId || process.env.TELEGRAM_CHAT_ID;

    if (params.usdValue >= 1000) {
      targetChatId = process.env.TELEGRAM_ALPHA_CHAT_ID;
    }

    if (targetChatId && process.env.TELEGRAM_BOT_TOKEN) {
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: message,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            reply_markup: { inline_keyboard: inlineKeyboard },
          }),
        },
      );
    }
  } catch (error) {
    if (isDuplicateError(error)) return;
    throw error;
  }
}

export async function processWebhookPayload(
  source: WebhookSource,
  payload: unknown,
): Promise<void> {
  const candidates = extractCandidates(source, payload);
  if (candidates.length === 0) return;

  const walletMap = await loadTrackedWallets(candidates);

  for (const candidate of candidates) {
    const fromWallets = candidate.fromAddress
      ? walletMap.get(
          `${candidate.network}:${normalizeAddress(candidate.fromAddress, candidate.network)}`,
        ) || []
      : [];

    const toWallets = candidate.toAddress
      ? walletMap.get(
          `${candidate.network}:${normalizeAddress(candidate.toAddress, candidate.network)}`,
        ) || []
      : [];

    if (fromWallets.length === 0 && toWallets.length === 0) continue;

    const asset = await resolveAsset({
      symbol: candidate.symbol,
      identifier: candidate.tokenIdentifier,
    });
    if (asset.usdPrice === null) continue;

    const usdValue = candidate.amount * asset.usdPrice;
    if (usdValue < MIN_ALERT_USD) continue;

    for (const fromWallet of fromWallets) {
      await saveTransactionAndNotify({
        candidate,
        wallet: fromWallet,
        action: "SELL",
        symbol: asset.symbol,
        usdValue,
      });
    }

    for (const toWallet of toWallets) {
      await saveTransactionAndNotify({
        candidate,
        wallet: toWallet,
        action: "BUY",
        symbol: asset.symbol,
        usdValue,
      });
    }
  }
}
