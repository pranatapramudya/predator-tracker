// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "predator_session";
const SECRET = (
  process.env.WEBHOOK_SHARED_SECRET || "predator_tracker_salt_2026"
).trim();

async function hashValue(val: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${val}:${SECRET}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, webhooks, and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhook") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthed = false;

  if (session && session.includes(":")) {
    const [userId, sig] = session.split(":");
    const expectedSig = await hashValue(userId);
    if (sig === expectedSig) {
      isAuthed = true;
    }
  }

  // 2. Allow /login
  if (pathname === "/login") {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 3. Redirect unauthenticated visitors to /login
  if (!isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
