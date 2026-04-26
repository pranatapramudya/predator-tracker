import { processWhaleTrade } from "@/app/api/webhook/pnl";
import { Network, Prisma } from "@prisma/client";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { prisma } from "../prisma";
import { buildWhaleAlertMessage, sendTelegramMessage } from "../telegram";
import { resolveAsset } from "./pricing";
import type {
  AlchemyAddressActivityPayload,
  HeliusEnhancedTransaction,
  TransferCandidate,
  WebhookSource,
  WhaleAction,
} from "./types";

const MIN_ALERT_USD = 500;

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
        // Pastikan tokenAddress ikut disave sesuai schema baru
        tokenAddress: params.candidate.tokenIdentifier || null,
      },
    });

    // 🔥 2. INJEKSI MESIN PNL (PROFIT & LOSS) 🔥
    // Kita cuma proses kalau ada tokenIdentifier (bukan transfer native SOL/ETH biasa)
    if (params.candidate.tokenIdentifier) {
      try {
        await processWhaleTrade(
          params.wallet.id,
          params.candidate.tokenIdentifier,
          params.symbol,
          params.action as "BUY" | "SELL",
          params.candidate.amount,
          params.usdValue,
        );
        console.log(
          `[Predator System] PnL & tas koin ${params.symbol} berhasil di-update untuk ${params.wallet.id}!`,
        );
      } catch (pnlError) {
        console.error(`[Predator System] Gagal proses PnL:`, pnlError);
      }
    }
  } catch (error) {
    if (isDuplicateError(error)) {
      return; // Kalau transaksi duplikat, stop di sini
    }
    throw error;
  }

  // 3. Kirim Notif ke Telegram HP Lo
  await sendTelegramMessage(
    buildWhaleAlertMessage({
      network: params.wallet.network,
      walletLabel: params.wallet.name ?? params.wallet.address,
      action: params.action,
      amount: params.candidate.amount,
      tokenSymbol: params.symbol,
      txUrl: params.candidate.explorerUrl,
    }),
  );
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
