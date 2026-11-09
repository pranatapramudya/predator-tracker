// scripts/daemon.ts
/**
 * 👑 PREDATOR TRACKER - STANDALONE WORKER DAEMON
 * Memantau aktivitas Smart Money Whale secara real-time di Solana & Base.
 * Dilengkapi Anti-Rugpull Guard & Multi-Wallet Confluence Engine.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import {
  buildPredatorAlertMessage,
  buildInlineKeyboard,
  sendTelegramNotification,
} from "../src/lib/telegram";
import { auditTokenSecurity, RugAuditResult } from "../src/lib/rugcheck";

interface WatchlistWallet {
  name: string;
  address: string;
  network: "SOLANA" | "BASE" | "ETHEREUM";
  isActive: boolean;
  minAlertUsd?: number;
  userId?: string;
  chatId?: string;
  alphaChannelId?: string;
}

interface ProcessedState {
  seenSignatures: string[];
  lastRun: string;
}

interface ConfluenceEntry {
  tokenAddress: string;
  tokenSymbol: string;
  wallets: string[];
  firstSeen: number;
  lastSeen: number;
}

interface SignalLog {
  timestamp: string;
  network: string;
  whaleName: string;
  walletAddress: string;
  action: string;
  tokenSymbol: string;
  tokenAddress: string;
  usdValue: number;
  priceUsd: number;
  txUrl: string;
  rugVerdict: string;
  confluenceCount: number;
}

const CONFIG_PATH = path.resolve(process.cwd(), "config/watchlist.json");
const PROCESSED_PATH = path.resolve(process.cwd(), "data/processed_txs.json");
const CONFLUENCE_PATH = path.resolve(process.cwd(), "data/confluence.json");
const SIGNALS_PATH = path.resolve(process.cwd(), "data/signals.json");

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 25000); // 25 detik
const CONFLUENCE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 jam window

// Helper sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function loadWatchlist(): WatchlistWallet[] {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn("[DAEMON] Watchlist config not found. Creating default...");
      const initial: WatchlistWallet[] = [];
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    const wallets = JSON.parse(data) as WatchlistWallet[];
    return wallets.filter((w) => w.isActive && w.address);
  } catch (err: any) {
    console.error("[DAEMON ERROR] Failed loading watchlist:", err.message);
    return [];
  }
}

function loadProcessed(): ProcessedState {
  try {
    if (fs.existsSync(PROCESSED_PATH)) {
      const data = fs.readFileSync(PROCESSED_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch {}
  return { seenSignatures: [], lastRun: new Date().toISOString() };
}

function saveProcessed(state: ProcessedState) {
  try {
    // Keep max 5000 signatures to prevent file bloat
    if (state.seenSignatures.length > 5000) {
      state.seenSignatures = state.seenSignatures.slice(-5000);
    }
    fs.writeFileSync(PROCESSED_PATH, JSON.stringify(state, null, 2));
  } catch (err: any) {
    console.error("[DAEMON ERROR] Failed saving processed state:", err.message);
  }
}

function loadConfluence(): Record<string, ConfluenceEntry> {
  try {
    if (fs.existsSync(CONFLUENCE_PATH)) {
      const data = fs.readFileSync(CONFLUENCE_PATH, "utf-8");
      const records = JSON.parse(data) as Record<string, ConfluenceEntry>;
      const now = Date.now();
      // Clean expired entries
      const valid: Record<string, ConfluenceEntry> = {};
      for (const [key, val] of Object.entries(records)) {
        if (now - val.lastSeen < CONFLUENCE_WINDOW_MS) {
          valid[key] = val;
        }
      }
      return valid;
    }
  } catch {}
  return {};
}

function saveConfluence(records: Record<string, ConfluenceEntry>) {
  try {
    fs.writeFileSync(CONFLUENCE_PATH, JSON.stringify(records, null, 2));
  } catch (err: any) {
    console.error("[DAEMON ERROR] Failed saving confluence:", err.message);
  }
}

function logSignal(entry: SignalLog) {
  try {
    let logs: SignalLog[] = [];
    if (fs.existsSync(SIGNALS_PATH)) {
      logs = JSON.parse(fs.readFileSync(SIGNALS_PATH, "utf-8"));
    }
    logs.unshift(entry);
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    fs.writeFileSync(SIGNALS_PATH, JSON.stringify(logs, null, 2));
  } catch (err: any) {
    console.error("[DAEMON ERROR] Failed logging signal:", err.message);
  }
}

async function getTokenMarketInfo(tokenAddress: string) {
  if (!tokenAddress || tokenAddress === "solana") return null;
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      return {
        priceUsd: parseFloat(pair.priceUsd || "0"),
        tokenSymbol: pair.baseToken?.symbol || "MEME",
        fdv: pair.fdv || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
      };
    }
  } catch {}
  return null;
}

// ==========================================================
// 1. SOLANA PROCESSOR (Helius Parsed Transactions)
// ==========================================================
async function checkSolanaWallet(
  wallet: WatchlistWallet,
  processed: ProcessedState,
  confluenceMap: Record<string, ConfluenceEntry>,
  isInitialRun: boolean,
) {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    console.error("[SOLANA ERROR] HELIUS_API_KEY is not defined in .env!");
    return;
  }

  try {
    const url = `https://api.helius.xyz/v0/addresses/${wallet.address}/transactions?api-key=${apiKey}&type=SWAP`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(
          `[SOLANA] Helius Rate-Limit (429) on ${wallet.name}. Pausing briefly.`,
        );
        await sleep(3000);
      }
      return;
    }

    const txs = await res.json();
    if (!Array.isArray(txs) || txs.length === 0) return;

    // Filter txs
    for (const tx of txs.slice(0, 5)) {
      const signature = tx.signature;
      if (!signature) continue;

      if (processed.seenSignatures.includes(signature)) {
        continue;
      }

      // If initial startup run, mark existing tx as seen without spamming alerts
      if (isInitialRun) {
        processed.seenSignatures.push(signature);
        continue;
      }

      // Parse Swap
      const tokenTransfers = tx.tokenTransfers || [];
      let isBuy = false;
      let isSell = false;
      let targetToken = "";
      let tokenAmount = 0;

      for (const transfer of tokenTransfers) {
        if (
          transfer.mint === "So11111111111111111111111111111111111111112" || // WSOL
          transfer.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" || // USDC
          transfer.mint === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" // USDT
        ) {
          continue;
        }

        if (transfer.toUserAccount === wallet.address) {
          isBuy = true;
          targetToken = transfer.mint;
          tokenAmount = Number(transfer.tokenAmount || 0);
        } else if (transfer.fromUserAccount === wallet.address) {
          isSell = true;
          targetToken = transfer.mint;
          tokenAmount = Number(transfer.tokenAmount || 0);
        }
      }

      if (!targetToken) {
        processed.seenSignatures.push(signature);
        continue;
      }

      // Market Info & Valuation
      const marketInfo = await getTokenMarketInfo(targetToken);
      const tokenSymbol = marketInfo?.tokenSymbol || "MEME";
      const currentPrice = marketInfo?.priceUsd || 0;
      const usdValue = tokenAmount * currentPrice;

      // Filter dust transactions (default min $15)
      const minAlert = wallet.minAlertUsd ?? 15;
      if (usdValue < minAlert) {
        console.log(
          `[SKIP DUST] ${wallet.name} ${isBuy ? "BUY" : "SELL"} $${tokenSymbol} valued at $${usdValue.toFixed(2)} (< $${minAlert})`,
        );
        processed.seenSignatures.push(signature);
        continue;
      }

      console.log(
        `\n🚨 [TRANSACTION DETECTED] ${wallet.name} -> ${isBuy ? "BUY" : "SELL"} $${tokenSymbol} ($${usdValue.toFixed(2)})`,
      );

      // 🛡️ ANTI-RUGPULL SECURITY AUDIT
      let rugAudit: RugAuditResult | null = null;
      if (isBuy) {
        console.log(
          `🛡️ Auditing Anti-Rugpull Guard for $${tokenSymbol} (${targetToken})...`,
        );
        rugAudit = await auditTokenSecurity(targetToken);
        console.log(
          `🛡️ Verdict: ${rugAudit.verdict} | LP: ${rugAudit.lpStatus} | Mint: ${rugAudit.mintStatus} | Freeze: ${rugAudit.freezeStatus} | Top 10: ${rugAudit.top10Status}`,
        );
      }

      // 🔥 MULTI-WALLET CONFLUENCE TRACKER
      let confluenceCount = 1;
      if (isBuy) {
        const now = Date.now();
        if (!confluenceMap[targetToken]) {
          confluenceMap[targetToken] = {
            tokenAddress: targetToken,
            tokenSymbol,
            wallets: [wallet.address],
            firstSeen: now,
            lastSeen: now,
          };
        } else {
          if (!confluenceMap[targetToken].wallets.includes(wallet.address)) {
            confluenceMap[targetToken].wallets.push(wallet.address);
          }
          confluenceMap[targetToken].lastSeen = now;
        }
        confluenceCount = confluenceMap[targetToken].wallets.length;
      }

      const txUrl = `https://solscan.io/tx/${signature}`;

      // Build & Send Telegram Alert
      const alertText = buildPredatorAlertMessage({
        network: "SOLANA",
        whaleName: wallet.name,
        walletAddress: wallet.address,
        action: isBuy ? "BUY" : "SELL",
        tokenSymbol,
        tokenAddress: targetToken,
        amount: tokenAmount,
        usdValue,
        txUrl,
        rugAudit,
        confluenceCount,
      });

      const keyboard = buildInlineKeyboard("SOLANA", targetToken, txUrl);

      // Multi-tenant alert routing: send to tenant's chatId, or fallback to global chatId
      const targetChatId = wallet.chatId || process.env.TELEGRAM_CHAT_ID;
      await sendTelegramNotification({
        chatId: targetChatId,
        text: alertText,
        replyMarkup: { inline_keyboard: keyboard },
      });

      // Also forward to private Alpha Channel if tenant configured it
      if (wallet.alphaChannelId && wallet.alphaChannelId !== targetChatId) {
        await sendTelegramNotification({
          chatId: wallet.alphaChannelId,
          text: alertText,
          replyMarkup: { inline_keyboard: keyboard },
        }).catch(() => {});
      }

      console.log(`✅ [TELEGRAM ALERT SENT] ${wallet.name} $${tokenSymbol}`);

      // Paper Trading log
      logSignal({
        timestamp: new Date().toISOString(),
        network: "SOLANA",
        whaleName: wallet.name,
        walletAddress: wallet.address,
        action: isBuy ? "BUY" : "SELL",
        tokenSymbol,
        tokenAddress: targetToken,
        usdValue,
        priceUsd: currentPrice,
        txUrl,
        rugVerdict: rugAudit?.verdict || "N/A",
        confluenceCount,
      });

      processed.seenSignatures.push(signature);
      saveProcessed(processed);
      saveConfluence(confluenceMap);

      // Brief delay between alerts to avoid rate limit
      await sleep(1500);
    }
  } catch (err: any) {
    console.error(`[SOLANA ERROR] Scan failed on ${wallet.name}:`, err.message);
  }
}

// ==========================================================
// 2. BASE / EVM PROCESSOR (Alchemy / Basescan API)
// ==========================================================
async function checkBaseWallet(
  wallet: WatchlistWallet,
  processed: ProcessedState,
  confluenceMap: Record<string, ConfluenceEntry>,
  isInitialRun: boolean,
) {
  const apiKey = process.env.BASESCAN_API_KEY;
  const baseUrl = "https://api.basescan.org/api";

  try {
    const url = `${baseUrl}?module=account&action=tokentx&address=${wallet.address}&page=1&offset=5&sort=desc${apiKey ? `&apikey=${apiKey}` : ""}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;

    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.result)) return;

    for (const tx of data.result) {
      const hash = tx.hash;
      if (!hash) continue;

      if (processed.seenSignatures.includes(hash)) continue;

      if (isInitialRun) {
        processed.seenSignatures.push(hash);
        continue;
      }

      const isReceive = tx.to?.toLowerCase() === wallet.address.toLowerCase();
      const action = isReceive ? "BUY" : "SELL";
      const tokenAddress = tx.contractAddress;
      const decimals = Number(tx.tokenDecimal || 18);
      const amount = Number(tx.value) / Math.pow(10, decimals);
      const tokenSymbol = tx.tokenSymbol || "TOKEN";

      const marketInfo = await getTokenMarketInfo(tokenAddress);
      const currentPrice = marketInfo?.priceUsd || 0;
      const usdValue = currentPrice * amount;

      const minAlert = wallet.minAlertUsd ?? 15;
      if (usdValue < minAlert) {
        processed.seenSignatures.push(hash);
        continue;
      }

      console.log(
        `\n🚨 [BASE TRANSACTION] ${wallet.name} -> ${action} $${tokenSymbol} ($${usdValue.toFixed(2)})`,
      );

      const txUrl = `https://basescan.org/tx/${hash}`;

      const alertText = buildPredatorAlertMessage({
        network: "BASE",
        whaleName: wallet.name,
        walletAddress: wallet.address,
        action: isReceive ? "BUY" : "SELL",
        tokenSymbol,
        tokenAddress,
        amount,
        usdValue,
        txUrl,
        rugAudit: null,
        confluenceCount: 1,
      });

      const keyboard = buildInlineKeyboard("BASE", tokenAddress, txUrl);

      // Multi-tenant alert routing: send to tenant's chatId, or fallback to global chatId
      const targetChatId = wallet.chatId || process.env.TELEGRAM_CHAT_ID;
      await sendTelegramNotification({
        chatId: targetChatId,
        text: alertText,
        replyMarkup: { inline_keyboard: keyboard },
      });

      if (wallet.alphaChannelId && wallet.alphaChannelId !== targetChatId) {
        await sendTelegramNotification({
          chatId: wallet.alphaChannelId,
          text: alertText,
          replyMarkup: { inline_keyboard: keyboard },
        }).catch(() => {});
      }

      console.log(`✅ [TELEGRAM ALERT SENT] ${wallet.name} $${tokenSymbol}`);

      logSignal({
        timestamp: new Date().toISOString(),
        network: "BASE",
        whaleName: wallet.name,
        walletAddress: wallet.address,
        action,
        tokenSymbol,
        tokenAddress,
        usdValue,
        priceUsd: currentPrice,
        txUrl,
        rugVerdict: "EVM_TOKEN",
        confluenceCount: 1,
      });

      processed.seenSignatures.push(hash);
      saveProcessed(processed);
      saveConfluence(confluenceMap);

      await sleep(1500);
    }
  } catch (err: any) {
    console.error(`[BASE ERROR] Scan failed on ${wallet.name}:`, err.message);
  }
}

// ==========================================================
// 🔁 MAIN DAEMON LOOP
// ==========================================================
async function main() {
  console.log("==================================================");
  console.log("👑 PREDATOR TRACKER - STANDALONE WORKER DAEMON 👑");
  console.log("==================================================");
  console.log(`[DAEMON] Poll Interval: ${POLL_INTERVAL_MS / 1000}s`);
  console.log(`[DAEMON] Telegram Bot Token: Configured`);
  console.log(`[DAEMON] Telegram Chat ID: ${process.env.TELEGRAM_CHAT_ID}`);
  console.log(
    `[DAEMON] Helius RPC: ${process.env.HELIUS_API_KEY ? "Configured" : "MISSING"}`,
  );
  console.log(`[DAEMON] Watchlist File: ${CONFIG_PATH}`);
  console.log("==================================================\n");

  const runOnce = process.argv.includes("--once");
  let isInitialRun = true;

  const processed = loadProcessed();
  const confluenceMap = loadConfluence();

  while (true) {
    try {
      const watchlist = loadWatchlist();

      if (watchlist.length === 0) {
        console.log(
          `[DAEMON ${new Date().toLocaleTimeString()}] Watchlist kosong. Tambahkan wallet ke config/watchlist.json.`,
        );
      } else {
        const solanaWallets = watchlist.filter((w) => w.network === "SOLANA");
        const baseWallets = watchlist.filter((w) => w.network === "BASE");

        if (isInitialRun) {
          console.log(
            `[DAEMON] Initializing seen transactions for ${watchlist.length} wallets...`,
          );
        } else {
          console.log(
            `[DAEMON ${new Date().toLocaleTimeString()}] Scanning ${solanaWallets.length} Solana, ${baseWallets.length} Base wallets...`,
          );
        }

        for (const w of solanaWallets) {
          await checkSolanaWallet(w, processed, confluenceMap, isInitialRun);
          await sleep(1000);
        }

        for (const w of baseWallets) {
          await checkBaseWallet(w, processed, confluenceMap, isInitialRun);
          await sleep(1000);
        }

        if (isInitialRun) {
          console.log(
            "✅ Initial scan completed. Radar is now ACTIVE & LISTENING for live smart money moves!\n",
          );
          isInitialRun = false;
        }

        processed.lastRun = new Date().toISOString();
        saveProcessed(processed);
        saveConfluence(confluenceMap);
      }
    } catch (loopErr: any) {
      console.error("[DAEMON LOOP ERROR]", loopErr.message);
    }

    if (runOnce) {
      console.log("[DAEMON] Single run mode complete. Exiting.");
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((fatal) => {
  console.error("FATAL DAEMON CRASH:", fatal);
  process.exit(1);
});
