import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // [FIX] Turbopack panic "Next.js package not found":
  // Memberikan resolveAlias minimal agar Turbopack tidak gagal
  // saat membangun internal server import map untuk route /page.
  turbopack: {
    resolveAlias: {},
  },
  // Sertakan file JSON data dan config ke dalam serverless bundle Vercel
  outputFileTracingIncludes: {
    '/**': [
      './data/signals.json',
      './data/confluence.json',
      './config/watchlist.json',
    ],
  },
  // Optimasi ukuran Serverless Functions di Vercel: buang folder non-kritis
  outputFileTracingExcludes: {
    '*': [
      './docs/**',
      './scripts/**',
      '**/*.md',
    ],
  },
};

// [FIX] Hanya wrap dengan PWA di production.
// next-pwa tidak kompatibel penuh dengan Turbopack di Next.js 16
// dan bisa menyebabkan module resolution failure saat dev.
export default process.env.NODE_ENV === "development"
  ? nextConfig
  : withPWA(nextConfig);

