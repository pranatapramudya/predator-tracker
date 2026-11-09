// src/lib/auth.ts
/**
 * 🔒 PREDATOR TRACKER - SIMPLE MASTER PIN AUTH
 * Replaces heavy Clerk authentication with a lightweight, secure PIN gate.
 */
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "predator_session";
export const DEFAULT_ADMIN_PIN = "2026";

export function getAdminPin(): string {
  return (process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN).trim();
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
  return clean === getAdminPin();
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
  return session === expected;
}
