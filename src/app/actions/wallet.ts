// src/app/actions/wallet.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSolanaBalance, getEVMBalance, getBTCBalance } from "@/lib/crypto";
import { auditHistoricalWinRate } from "@/lib/scanner";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ENV } from "@/config/env";
import fs from "fs";
import path from "path";

const CONFIG_WATCHLIST_PATH = path.resolve(
  process.cwd(),
  "config/watchlist.json",
);

function loadWatchlistFromFile(): any[] {
  try {
    if (fs.existsSync(CONFIG_WATCHLIST_PATH)) {
      const content = fs.readFileSync(CONFIG_WATCHLIST_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read config/watchlist.json:", err);
  }
  return [];
}

function syncWatchlistFile(
  action: "add" | "delete",
  wallet: {
    address: string;
    name?: string;
    network?: string;
    userId?: string;
    chatId?: string;
  },
) {
  try {
    const list = loadWatchlistFromFile();
    if (action === "add") {
      const idx = list.findIndex(
        (w: any) => w.address?.toLowerCase() === wallet.address?.toLowerCase(),
      );
      const item = {
        name: wallet.name || "Target Whale",
        address: wallet.address,
        network: wallet.network || "SOLANA",
        chain: (wallet.network || "SOLANA").toLowerCase(),
        userId: wallet.userId || "admin_owner",
        chatId: wallet.chatId || process.env.TELEGRAM_CHAT_ID || "",
        isActive: true,
        minAlertUsd: 100,
      };
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item };
      } else {
        list.push(item);
      }
    } else if (action === "delete") {
      const filtered = list.filter(
        (w: any) => w.address?.toLowerCase() !== wallet.address?.toLowerCase(),
      );
      fs.writeFileSync(
        CONFIG_WATCHLIST_PATH,
        JSON.stringify(filtered, null, 2),
        "utf-8",
      );
      return;
    }
    fs.writeFileSync(
      CONFIG_WATCHLIST_PATH,
      JSON.stringify(list, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.error("Failed to sync config/watchlist.json:", err);
  }
}

const redis = new Redis({
  url: ENV.UPSTASH_REDIS_REST_URL || "",
  token: ENV.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

function isValidAddress(address: string, network: string): boolean {
  if (network === "BITCOIN")
    return /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(address);
  if (network === "SOLANA")
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function createWalletAction(formData: FormData) {
  const sessionUser = await getCurrentUser();
  const userId = sessionUser?.id || "admin_owner";

  try {
    if (ENV.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(userId);
      if (!success) {
        redirect("/?feedback=too_fast&tab=add");
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT")
      throw error;
  }

  let feedback = "failed";
  const address = String(formData.get("address") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  let chatId = String(formData.get("chatId") ?? "").trim();
  let alphaChannelId = String(formData.get("alphaChannelId") ?? "").trim();
  const network = String(formData.get("network") ?? "").toUpperCase();

  if (!chatId || !alphaChannelId) {
    const existingUserWallets = await prisma.wallet
      .findMany({
        where: { userId: userId },
        select: { chatId: true, alphaChannelId: true },
      })
      .catch(() => []);

    if (!chatId) {
      chatId =
        existingUserWallets.find((w) => w.chatId)?.chatId ||
        ENV.TELEGRAM_CHAT_ID ||
        "";
    }
    if (!alphaChannelId) {
      alphaChannelId =
        existingUserWallets.find((w) => w.alphaChannelId)?.alphaChannelId ||
        ENV.TELEGRAM_ALPHA_CHANNEL_ID ||
        "-1003737826938";
    }
  }

  if (!address || !name || !network || !isValidAddress(address, network)) {
    redirect("/?feedback=invalid&tab=add");
  }

  try {
    const normalized =
      network === "SOLANA" || network === "BITCOIN"
        ? address
        : address.toLowerCase();

    // 1. Sync immediately to config/watchlist.json with multi-tenant tagging
    syncWatchlistFile("add", {
      address: normalized,
      name,
      network,
      userId,
      chatId,
    });

    let balance = 0;
    try {
      if (network === "BITCOIN") balance = await getBTCBalance(normalized);
      else if (network === "SOLANA")
        balance = await getSolanaBalance(normalized);
      else
        balance = await getEVMBalance(
          normalized,
          network as "BASE" | "ETHEREUM",
        );
    } catch {
      balance = 0;
    }

    try {
      const savedWallet = await prisma.wallet.upsert({
        where: {
          address_network_userId: {
            address: normalized,
            network: network as any,
            userId,
          },
        },
        update: {
          name,
          chatId,
          alphaChannelId,
          lastBalance: balance,
          isActive: true,
        },
        create: {
          address: normalized,
          name,
          network: network as any,
          chatId,
          alphaChannelId,
          lastBalance: balance,
          isActive: true,
          userId,
        },
      });

      auditHistoricalWinRate(
        savedWallet.id,
        savedWallet.address,
        savedWallet.network,
      );
    } catch (dbErr) {
      console.warn(
        "Prisma save skipped or failed, watchlist.json updated:",
        dbErr,
      );
    }

    if (chatId && ENV.TELEGRAM_BOT_TOKEN) {
      try {
        const welcomeMsg = `🎯 *NEW TARGET LOCKED!*\n\nYou've successfully added a new whale to the Predator Radar:\n\n👤 *Alias:* ${name}\n🌐 *Network:* ${network}\n📍 *Address:* \`${normalized}\`\n\nThe system is now monitoring this wallet 24/7. Standby for alpha signals! 🚀🐋`;

        await fetch(
          `https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: welcomeMsg,
              parse_mode: "Markdown",
            }),
          },
        );
      } catch (error) {
        console.error("Failed to send add wallet notification:", error);
      }
    }

    revalidatePath("/");
    feedback = "created";
  } catch (e) {
    console.error(e);
  }
  redirect(`/?feedback=${feedback}&tab=watchlist`);
}

export async function deleteWalletAction(formData: FormData) {
  const sessionUser = await getCurrentUser();
  const userId = sessionUser?.id || "admin_owner";
  const isOwner = sessionUser?.role === "OWNER" || userId === "admin_owner";

  let feedback = "failed";
  try {
    const id = String(formData.get("id"));

    // Sync deletion to config/watchlist.json
    try {
      const targetWallet = await prisma.wallet
        .findFirst({ where: { id } })
        .catch(() => null);
      if (targetWallet) {
        syncWatchlistFile("delete", { address: targetWallet.address });
      } else {
        syncWatchlistFile("delete", { address: id });
      }
      if (isOwner) {
        await prisma.wallet.deleteMany({ where: { id } }).catch(() => {});
      } else {
        await prisma.wallet
          .deleteMany({ where: { id, userId } })
          .catch(() => {});
      }
    } catch {
      syncWatchlistFile("delete", { address: id });
    }

    revalidatePath("/");
    feedback = "deleted";
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") {
      throw e;
    }
    console.error(e);
  }
  redirect(`/?feedback=${feedback}&tab=watchlist`);
}
