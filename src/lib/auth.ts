// src/lib/auth.ts
/**
 * 🔒 PREDATOR TRACKER - ENTERPRISE MULTI-TENANT AUTH
 * Lightweight, self-contained multi-tenant authentication engine.
 * Eliminates external vendor dependencies while providing complete tenant data isolation.
 */
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { ENV } from "@/config/env";

export const SESSION_COOKIE_NAME = "predator_session";
const SECRET = (
  ENV.WEBHOOK_SHARED_SECRET || "predator_tracker_salt_2026"
).trim();
const USERS_FILE_PATH = path.resolve(process.cwd(), "data/users.json");

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "MEMBER";
  tier: "FREE" | "SCOUT" | "PREDATOR" | "APEX";
  passwordHash?: string;
  createdAt: string;
}

export function getSecretSalt(): string {
  return SECRET;
}

export async function hashValue(val: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${val}:${SECRET}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function loadUsers(): UserRecord[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const content = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read data/users.json:", err);
  }
  return [];
}

export function saveUsers(users: UserRecord[]) {
  try {
    const dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write data/users.json:", err);
  }
}

/**
 * Initializes or returns the master owner user
 */
export async function getOrCreateMasterUser(): Promise<UserRecord> {
  const users = loadUsers();
  let master = users.find((u) => u.role === "OWNER" || u.id === "admin_owner");

  if (!master) {
    const masterPin = (ENV.ADMIN_PIN || "2026").trim();
    const hash = await hashValue(masterPin);
    master = {
      id: "admin_owner",
      email: "owner@predator.tracker",
      name: "Master Operator",
      role: "OWNER",
      tier: "APEX",
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    users.unshift(master);
    saveUsers(users);
  }

  return master;
}

/**
 * Authenticates user credentials supporting multi-tenant accounts and master key
 */
export async function loginUser(
  identifier: string,
  keyOrPin: string,
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  const cleanId = String(identifier || "")
    .trim()
    .toLowerCase();
  const cleanKey = String(keyOrPin || "").trim();

  if (!cleanKey) {
    return { success: false, error: "Security access key is required." };
  }

  const masterPin = (ENV.ADMIN_PIN || "2026").trim();

  // 1. Direct master key authentication bypass
  if (cleanKey === masterPin) {
    const master = await getOrCreateMasterUser();
    return { success: true, user: master };
  }

  // If no identifier provided and key didn't match master PIN
  if (!cleanId) {
    return {
      success: false,
      error:
        "PIN Akses salah. Jika Anda member terdaftar, masukkan email Anda.",
    };
  }

  const users = loadUsers();
  const targetHash = await hashValue(cleanKey);

  // 2. Multi-tenant user lookup by email, id, or alias
  const foundUser = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.id.toLowerCase() === cleanId ||
      u.name.toLowerCase() === cleanId,
  );

  if (foundUser) {
    if (foundUser.passwordHash === targetHash) {
      return { success: true, user: foundUser };
    }
    return {
      success: false,
      error:
        "PIN Akses salah untuk akun ini. Silakan coba lagi atau gunakan menu 'Lupa PIN'.",
    };
  }

  // 3. Fallback check for single operator entering just the master key as identifier
  if (cleanId === masterPin) {
    const master = await getOrCreateMasterUser();
    return { success: true, user: master };
  }

  return {
    success: false,
    error:
      "Akun tidak terdaftar. Silakan pilih tab 'Daftar' untuk membuat akun workspace baru.",
  };
}

/**
 * Resets an operator's security PIN
 */
export async function resetUserPin(
  email: string,
  newPin: string,
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanPin = String(newPin || "").trim();

  if (!cleanEmail) {
    return { success: false, error: "Email akun wajib diisi." };
  }
  if (!cleanPin || cleanPin.length < 4) {
    return { success: false, error: "PIN Baru minimal 4 digit angka." };
  }

  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return {
      success: false,
      error: "Akun dengan email tersebut tidak ditemukan. Silakan daftar baru.",
    };
  }

  const newHash = await hashValue(cleanPin);
  user.passwordHash = newHash;
  saveUsers(users);

  return { success: true };
}

/**
 * Registers a new multi-tenant workspace operator
 */
export async function registerUser(
  name: string,
  email: string,
  keyOrPin: string,
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanKey = String(keyOrPin || "").trim();

  if (!cleanName || !cleanEmail || !cleanKey) {
    return { success: false, error: "All fields are required." };
  }

  const users = loadUsers();
  const exists = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return {
      success: false,
      error: "An operator with this email is already registered.",
    };
  }

  const isFirstUser = users.length === 0;
  const passwordHash = await hashValue(cleanKey);
  const newUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const newUser: UserRecord = {
    id: newUserId,
    email: cleanEmail,
    name: cleanName,
    role: isFirstUser ? "OWNER" : "MEMBER",
    tier: "APEX",
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, user: newUser };
}

/**
 * Creates an HTTP-Only signed session cookie
 */
export async function createSession(userId: string) {
  const sig = await hashValue(userId);
  const token = `${userId}:${sig}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clears the session cookie
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieves the currently authenticated user from session
 */
export async function getCurrentUser(): Promise<UserRecord | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token || !token.includes(":")) return null;

    const [userId, sig] = token.split(":");
    const expectedSig = await hashValue(userId);
    if (sig !== expectedSig) return null;

    const users = loadUsers();
    const found = users.find((u) => u.id === userId);
    if (found) return found;

    if (userId === "admin_owner") {
      return await getOrCreateMasterUser();
    }

    return {
      id: userId,
      email: `${userId}@predator.tracker`,
      name: "Operator",
      role: "MEMBER",
      tier: "APEX",
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
