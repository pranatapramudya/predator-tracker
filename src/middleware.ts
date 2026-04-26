// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    // 🔥 GANTI USERNAME & PASSWORD ADMIN LU DI SINI
    if (user === "admin" && pwd === "bosbesar") {
      return NextResponse.next();
    }
  }

  // Kalau password salah atau belum diisi, blokir aksesnya!
  return new NextResponse("Akses Ditolak. Area Khusus Admin.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Admin Area"',
    },
  });
}

// 🔥 Konfigurasi ini memastikan HANYA halaman "/" yang dikunci.
// Halaman "/invite" dan "/api/webhook" akan tetap terbuka untuk publik dan sistem.
export const config = {
  matcher: "/",
};
