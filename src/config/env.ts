// src/config/env.ts
/**
 * 👑 PREDATOR TRACKER - STANDAR ARSITEKTUR PABRIK ROBOT (MODUL 11)
 * PILAR 1: Sentralisasi semua process.env dengan Booting Crash Guard.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  TELEGRAM_ALPHA_CHANNEL_ID: string;
  HELIUS_API_KEY: string;
  ADMIN_PIN: string;
  WEBHOOK_SHARED_SECRET: string;
  BASESCAN_API_KEY?: string;
  ETHERSCAN_API_KEY?: string;
  GEMINI_API_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  POLL_INTERVAL_MS: number;
  ASISTEN_MIN_USD: number;
  ALPHA_FEED_MIN_USD: number;
}

function validateAndLoadEnv(): EnvConfig {
  const missingVars: string[] = [];

  const getEnv = (key: string, required = false, fallback = ""): string => {
    const val = process.env[key]?.trim();
    if (!val && required) {
      missingVars.push(key);
      return fallback;
    }
    return val || fallback;
  };

  const config: EnvConfig = {
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    DATABASE_URL: getEnv("DATABASE_URL", false, "file:./dev.db"),
    TELEGRAM_BOT_TOKEN: getEnv("TELEGRAM_BOT_TOKEN", false, ""),
    TELEGRAM_CHAT_ID: getEnv("TELEGRAM_CHAT_ID", false, "2079693450"),
    TELEGRAM_ALPHA_CHANNEL_ID: getEnv(
      "TELEGRAM_ALPHA_CHANNEL_ID",
      false,
      "-1003737826938",
    ),
    HELIUS_API_KEY: getEnv("HELIUS_API_KEY", false, ""),
    ADMIN_PIN: getEnv("ADMIN_PIN", false, "2026"),
    WEBHOOK_SHARED_SECRET: getEnv(
      "WEBHOOK_SHARED_SECRET",
      false,
      "predator_tracker_salt_2026",
    ),
    BASESCAN_API_KEY: process.env.BASESCAN_API_KEY?.trim(),
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY?.trim(),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL?.trim(),
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || 25000),
    ASISTEN_MIN_USD: Number(process.env.ASISTEN_MIN_USD || 100),
    ALPHA_FEED_MIN_USD: Number(process.env.ALPHA_FEED_MIN_USD || 1000),
  };

  // 🛡️ BOOTING CRASH GUARD: Verifikasi integritas konfigurasi bot
  if (missingVars.length > 0) {
    const errBanner = [
      "╔══════════════════════════════════════════════════════════════════════╗",
      "║ 🚨 [CRASH GUARD] BOOTING DIHENTIKAN: ENVIRONMENT VARIABLE TIDAK LENGKAP ║",
      "╠══════════════════════════════════════════════════════════════════════╣",
      `║ Variabel yang wajib diisi tapi belum tersedia:                     ║`,
      ...missingVars.map((v) => `║  - ${v.padEnd(66)} ║`),
      "║ Silakan lengkapi file .env atau .env.local sebelum menjalankan bot.  ║",
      "╚══════════════════════════════════════════════════════════════════════╝",
    ].join("\n");

    console.error(errBanner);
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[CRASH GUARD] Booting failed. Missing env: ${missingVars.join(", ")}`,
      );
    }
  }

  return config;
}

export const ENV = validateAndLoadEnv();
