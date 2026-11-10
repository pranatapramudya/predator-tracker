# predator-tracker — AI Agent Context

## Apa ini?
Whale Tracking Dashboard & Real-Time Alert System untuk Solana, Ethereum, dan Base blockchain. Memantau transaksi besar (smart money whale) secara 100% cloud-native 24/7.

## Stack
- Framework: Next.js 16 (App Router, Turbopack)
- Desain UI: FLOQ Fintech Aesthetic (Deep Pine Forest `#061a1d`, Mint `#a3f784`, White Card `#ffffff`)
- Blockchain data: Helius Enhanced Webhook (Solana 24/7 Cloud Push), DexScreener API, Basescan/Etherscan API
- Charting: Recharts (Sparkline PnL dengan zero-lag mobile optimization)
- Alerting: Telegram Bot Dual-Routing (Personal DM Asisten Crypto > $100 & VIP Predator Alpha Feed > $1000)
- Deploy: Vercel (Production Live)

## Arsitektur 24/7 Cloud (Zero Daemon)
1. **Primary Push:** Helius Enhanced Webhook (`https://predator-tracker.vercel.app/api/webhook/helius`) memantau target di `config/watchlist.json`. Tidak butuh daemon lokal.
2. **Secondary Backup:** GitHub Actions workflow (`.github/workflows/tracker.yml`) berjalan setiap 5 menit.
3. **Local Daemon (Opsional):** `scripts/daemon.ts` hanya digunakan untuk debugging/pengujian manual di terminal.

## Rules untuk Agent
1. Repo ini **standalone** — tidak terintegrasi dengan ekosistem pjtech-autonomous
2. Pertahankan performa mobile (WhaleCard terisolasi, `touch-manipulation`, dan non-intrusive background polling)
3. Cek `src/` untuk komponen utama dan `config/watchlist.json` untuk daftar target aktif
