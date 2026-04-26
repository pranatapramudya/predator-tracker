import { processWhaleTrade } from "@/app/api/webhook/pnl";
import { Network, Prisma } from "@prisma/client";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { prisma } from "../prisma";
import { sendTelegramMessage } from "../telegram";
import { resolveAsset } from "./pricing";
import type {
  AlchemyAddressActivityPayload,
  HeliusEnhancedTransaction,
  TransferCandidate,
  WebhookSource,
  WhaleAction,
} from "./types";

// ✅ 1. FILTER TRANSAKSI RECEH (Abaikan di bawah $100)
const MIN_ALERT_USD = 100;

type AlchemyActivity = NonNullable<
  NonNullable<AlchemyAddressActivityPayload["event"]>["activity"]
>[number];

function normalizeAddress(address: string, network: Network): string {
  return network === Network.SOLANA ? address : address.toLowerCase();
}

function explorerUrlFor(network: Network, signature: string): string {
  if (network === Network.SOLANA) {
    return `https://solscan.io/tx/${signature}`;
  }

  if (network === Network.BASE) {
    return `https://basescan.org/tx/${signature}`;
  }

  return `https://etherscan.io/tx/${signature}`;
}

function hexToNumber(value?: string, decimals = 18): number | null {
  if (!value) {
    return null;
  }

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

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

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

  if (!sharedSecret) {
    return true;
  }

  const authorization = headers.get("authorization")?.trim();

  if (!authorization) {
    return false;
  }

  return (
    safeEqual(authorization, sharedSecret) ||
    safeEqual(authorization, `Bearer ${sharedSecret}`)
  );
}

function verifyAlchemySignature(headers: Headers, rawBody: string): boolean {
  const signingKeys = getAlchemySigningKeys();

  if (signingKeys.length === 0) {
    return true;
  }

  const signature = headers.get("x-alchemy-signature")?.trim();

  if (!signature) {
    return false;
  }

  return signingKeys.some((signingKey) => {
    const digest = createHmac("sha256", signingKey)
      .update(rawBody)
      .digest("hex");
    return safeEqual(digest, signature);
  });
}

export function detectWebhookSource(payload: unknown): WebhookSource | null {
  if (Array.isArray(payload)) {
    return "HELIUS";
  }

  if (
    payload &&
    typeof payload === "object" &&
    "type" in payload &&
    "event" in payload
  ) {
    return "ALCHEMY";
  }

  return null;
}

export function verifyWebhookRequest(params: {
  source: WebhookSource;
  headers: Headers;
  rawBody: string;
}): boolean {
  if (params.source === "HELIUS") {
    return verifyHeliusAuth(params.headers);
  }

  return verifyAlchemySignature(params.headers, params.rawBody);
}

function parseHeliusTransfers(
  payload: HeliusEnhancedTransaction[],
): TransferCandidate[] {
  const candidates: TransferCandidate[] = [];

  payload.forEach((transaction, txIndex) => {
    const signature = transaction.signature;

    if (!signature) {
      return;
    }

    transaction.nativeTransfers?.forEach((transfer, transferIndex) => {
      if (
        !transfer.amount ||
        !transfer.fromUserAccount ||
        !transfer.toUserAccount
      ) {
        return;
      }

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
      ) {
        return;
      }

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
  if (!network) {
    return null;
  }

  if (network.startsWith("BASE")) {
    return Network.BASE;
  }

  if (network.startsWith("ETH")) {
    return Network.ETHEREUM;
  }

  return null;
}

function parseAlchemyAmount(activity: AlchemyActivity): number | null {
  if (
    typeof activity.value === "number" &&
    Number.isFinite(activity.value) &&
    activity.value > 0
  ) {
    return activity.value;
  }

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

  if (!network) {
    return [];
  }

  const eventId = payload.id ?? randomUUID();

  return (
    payload.event?.activity?.flatMap((activity, index) => {
      const signature = activity.hash;
      const amount = parseAlchemyAmount(activity);

      if (
        !signature ||
        !amount ||
        !activity.fromAddress ||
        !activity.toAddress
      ) {
        return [];
      }

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
  if (source === "HELIUS") {
    return parseHeliusTransfers(payload as HeliusEnhancedTransaction[]);
  }

  return parseAlchemyTransfers(payload as AlchemyAddressActivityPayload);
}

async function loadTrackedWallets(candidates: TransferCandidate[]) {
  const addressesByNetwork = new Map<Network, Set<string>>();

  for (const candidate of candidates) {
    const addresses =
      addressesByNetwork.get(candidate.network) ?? new Set<string>();

    if (candidate.fromAddress) {
      addresses.add(normalizeAddress(candidate.fromAddress, candidate.network));
    }

    if (candidate.toAddress) {
      addresses.add(normalizeAddress(candidate.toAddress, candidate.network));
    }

    addressesByNetwork.set(candidate.network, addresses);
  }

  const networkClauses = Array.from(addressesByNetwork.entries())
    .filter(([, addresses]) => addresses.size > 0)
    .map(([network, addresses]) => ({
      network,
      address: {
        in: Array.from(addresses),
      },
    }));

  if (networkClauses.length === 0) {
    return new Map<
      string,
      { id: string; address: string; name: string | null; network: Network }
    >();
  }

  const wallets = await prisma.wallet.findMany({
    where: {
      isActive: true,
      OR: networkClauses,
    },
    select: {
      id: true,
      address: true,
      name: true,
      network: true,
    },
  });

  return new Map(
    wallets.map((wallet) => [
      `${wallet.network}:${normalizeAddress(wallet.address, wallet.network)}`,
      wallet,
    ]),
  );
}

function isDuplicateError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function saveTransactionAndNotify(params: {
  candidate: TransferCandidate;
  wallet: {
    id: string;
    address: string;
    name: string | null;
    network: Network;
  };
  action: WhaleAction;
  symbol: string;
  usdValue: number;
}): Promise<void> {
  const dedupeKey = `${params.candidate.dedupeBase}:${params.wallet.address}:${params.action}`;

  try {
    // 1. Simpan Transaksi ke Database
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

    // VARIABEL METRIK ON-CHAIN (MODUL 4)
    let multibaggerScore = 0;
    let volumeMcapRatio = 0;
    let tokenAgeHours = 0;
    let smartMoneyCount = 0;
    let mcapUsd = 0;

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

        // ACTION FILTER: Deteksi First Time Buy
        if (!existingPosition && params.action === "BUY") {
          isFirstTimeBuy = true;
        }

        await processWhaleTrade(
          params.wallet.id,
          params.candidate.tokenIdentifier,
          params.symbol,
          params.action as "BUY" | "SELL",
          params.candidate.amount,
          params.usdValue,
        );

        // 🔥 ANALISA ON-CHAIN VIA DEXSCREENER & PRISMA (MODUL 4) 🔥
        if (params.action === "BUY") {
          // A. Cek Jumlah Paus (Smart Money Count)
          smartMoneyCount = await prisma.tokenPosition.count({
            where: {
              tokenAddress: params.candidate.tokenIdentifier,
              tokenAmount: { gt: 0 }, // Hitung yang saldo koinnya masih ada
            },
          });
          if (smartMoneyCount >= 2) multibaggerScore += 2; // Poin +2

          // B. Tarik Metrik DexScreener
          const dexRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${params.candidate.tokenIdentifier}`,
          );
          const dexData = await dexRes.json();

          if (dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs[0];
            liquidityUsd = pair.liquidity?.usd || 0;
            mcapUsd = pair.fdv || pair.marketCap || 0;
            const volume24h = pair.volume?.h24 || 0;

            // Hitung Umur Token
            if (pair.pairCreatedAt) {
              const ageMs = Date.now() - pair.pairCreatedAt;
              tokenAgeHours = ageMs / (1000 * 60 * 60);
              if (tokenAgeHours < 24) multibaggerScore += 1; // Poin +1
            }

            // Hitung Rasio Vol/MCap
            if (mcapUsd > 0) {
              volumeMcapRatio = (volume24h / mcapUsd) * 100;
            }
          }
        }
      } catch (error) {
        console.error(`[Predator System] Gagal proses Metrik On-Chain:`, error);
      }
    }

    // 3. RAKIT PESAN TELEGRAM
    let actionLabel = params.action === "BUY" ? "🟢 BUY" : "🔴 SELL";
    if (isFirstTimeBuy) actionLabel = "🔥 FIRST TIME BUY 🔥";

    let liquidityWarning = "";
    if (params.action === "BUY" && params.candidate.tokenIdentifier) {
      if (liquidityUsd < 10000 && liquidityUsd > 0) {
        liquidityWarning = `\n⚠️ *LIQUIDITY:* [HIGH RISK] < $10k`;
      } else if (liquidityUsd >= 10000) {
        liquidityWarning = `\n💧 *Liquidity:* $${(liquidityUsd / 1000).toFixed(1)}k`;
      }
    }

    // Blok Metrik Khusus (Cuma muncul pas BUY)
    let metricsBlock = "";
    if (params.action === "BUY" && params.candidate.tokenIdentifier) {
      metricsBlock =
        `\n\n📊 *ON-CHAIN METRICS*` +
        `\n💎 *Score:* ${multibaggerScore}/3 Poin` +
        `\n🐳 *Smart Money:* ${smartMoneyCount} Wallets` +
        `\n⏳ *Age:* ${tokenAgeHours > 0 ? tokenAgeHours.toFixed(1) + "h" : "N/A"}` +
        `\n📈 *Vol/MCap:* ${volumeMcapRatio > 0 ? volumeMcapRatio.toFixed(1) + "%" : "N/A"} ` +
        (volumeMcapRatio > 50 ? `(🔥 Panas)` : `(🧊 Normal)`);
    }

    const message =
      `🚨 *WHALE ALERT* 🚨\n\n` +
      `👤 *Whale:* ${params.wallet.name ?? params.wallet.address}\n` +
      `📈 *Action:* ${actionLabel}\n` +
      `🪙 *Token:* ${params.symbol}\n` +
      `💰 *Value:* $${params.usdValue.toFixed(2)}${liquidityWarning}` +
      metricsBlock +
      `\n\n🔗 [View TX](${params.candidate.explorerUrl})\n` +
      (params.candidate.tokenIdentifier
        ? `📊 [DexScreener](https://dexscreener.com/solana/${params.candidate.tokenIdentifier})`
        : "");

    await sendTelegramMessage(message);
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

  if (candidates.length === 0) {
    return;
  }

  const walletMap = await loadTrackedWallets(candidates);

  for (const candidate of candidates) {
    const fromWallet = candidate.fromAddress
      ? walletMap.get(
          `${candidate.network}:${normalizeAddress(candidate.fromAddress, candidate.network)}`,
        )
      : undefined;
    const toWallet = candidate.toAddress
      ? walletMap.get(
          `${candidate.network}:${normalizeAddress(candidate.toAddress, candidate.network)}`,
        )
      : undefined;

    if (!fromWallet && !toWallet) {
      continue;
    }

    const asset = await resolveAsset({
      symbol: candidate.symbol,
      identifier: candidate.tokenIdentifier,
    });

    if (asset.usdPrice === null) {
      continue;
    }

    const usdValue = candidate.amount * asset.usdPrice;

    // Filter transaksi berdasarkan MIN_ALERT_USD
    if (usdValue < MIN_ALERT_USD) {
      continue;
    }

    if (fromWallet && (!toWallet || fromWallet.id !== toWallet.id)) {
      await saveTransactionAndNotify({
        candidate,
        wallet: fromWallet,
        action: "SELL",
        symbol: asset.symbol,
        usdValue,
      });
    }

    if (toWallet && (!fromWallet || fromWallet.id !== toWallet.id)) {
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
