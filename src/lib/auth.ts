// src/lib/auth.ts
/**
 * 🔒 PREDATOR TRACKER - SIMPLE MASTER PIN AUTH
 * Replaces heavy Clerk authentication with a lightweight, secure PIN gate.
 */
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export const SESSION_COOKIE_NAME = "predator_session";
export const DEFAULT_ADMIN_PIN = "2026";

const PIN_FILE_PATH = path.resolve(process.cwd(), "config/pin.txt");

export function getAdminPin(): string {
  try {
    if (fs.existsSync(PIN_FILE_PATH)) {
      const saved = fs.readFileSync(PIN_FILE_PATH, "utf-8").trim();
      if (saved) return saved;
    }
  } catch {}
  return (process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN).trim();
}

export function setCustomPin(newPin: string): boolean {
  try {
    const configDir = path.resolve(process.cwd(), "config");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(PIN_FILE_PATH, newPin.trim(), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write custom pin:", err);
    return false;
  }
}

export function getSecretSalt(): string {
  return (
    process.env.WEBHOOK_SHARED_SECRET || "predator_tracker_salt_2026"
  ).trim();
}

/**
 * Creates a deterministic SHA-256 hash token for the session cookie
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pin}:${getSecretSalt()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin: string): Promise<boolean> {
  const clean = String(pin || "").trim();
  const expected = getAdminPin();
  // Allow either current configured PIN or the default 2026 as master emergency backup
  return clean === expected || clean === DEFAULT_ADMIN_PIN;
}

export async function createSession() {
  const token = await hashPin(getAdminPin());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return false;
  const expected = await hashPin(getAdminPin());
  const defaultExpected = await hashPin(DEFAULT_ADMIN_PIN);
  return session === expected || session === defaultExpected;
}
