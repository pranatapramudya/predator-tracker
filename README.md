# 🎯 Predator Tracker (Smart Money & Whale Radar)

Sistem intelijen pelacakan dompet paus (*Whale*) dan *Smart Money* secara *real-time* lintas jaringan (**Solana** dan **Base/EVM**), dilengkapi **4-Layer Anti-Rugpull Guard**, **Multi-Wallet Confluence Engine**, **Paper Trading Simulator**, dan **Simple Master PIN Gate** untuk operasional pribadi yang hemat sumber daya (0 Vercel CPU).

---

## ⚡ Arsitektur Utama (Dual-Engine System)

Predator Tracker dirancang dengan pemisahan tegas antara **UI Visualizer** dan **Tracking Daemon Engine**:

```
 ┌────────────────────────────────────────────────────────┐
 │                    TRACKING ENGINES                    │
 │                                                        │
 │  [Engine A: Local Standalone Daemon]                   │
 │   npm run daemon  (Polling 15-30 detik di PC/VPS)      │
 │                                                        │
 │  [Engine B: GitHub Actions 24/7 Cloud Tracker]         │
 │   .github/workflows/tracker.yml (Cron tiap 10 menit)   │
 │   100% Gratis - 0 Vercel CPU / Function Usage          │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │             4-LAYER ANTI-RUGPULL FILTER                │
 │  1. LP Burnt / Locked >= 95% (RugCheck API)            │
 │  2. Mint Authority Revoked (null)                      │
 │  3. Freeze Authority Disabled (null)                   │
 │  4. Top 10 Holders Concentration < 20%                 │
 └───────────────────────────┬────────────────────────────┘
                             │
            Lolos Semua Filter (SAFE / CONDITIONAL)
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                   TELEGRAM BOT DISPATCH                │
 │  • Chat ID & Bot Token Terverifikasi                   │
 │  • Confluence Badge (🔥 2+ Paus Masuk Bersamaan)       │
 │  • Tactical SOP ($2-$3 micro-entry, ladder TP)         │
 │  • Quick Execution (DexScreener, Jupiter, BonkBot)     │
 └────────────────────────────────────────────────────────┘
```

---

## 🛡️ Fitur Unggulan

### 1. 4-Layer Anti-Rugpull Guard (`src/lib/rugcheck.ts`)
Setiap kali target paus membeli token baru di Solana, transaksi otomatis diaudit sebelum notifikasi Telegram dikirim:
- **Layer 1 (LP Locked/Burnt):** Minimal 95% likuiditas harus terkunci permanen atau dibakar.
- **Layer 2 (Mint Revoked):** Developer tidak bisa mencetak token baru seenaknya untuk *dump*.
- **Layer 3 (Freeze Disabled):** Developer tidak bisa membekukan dompet pembeli (*honeypot*).
- **Layer 4 (Top 10 Holders):** Akumulasi total kepemilikan 10 *holder* terbesar wajib di bawah 20% dari total suplai.
> Token berstatus **CRITICAL RUG** (LP belum burn / mint aktif) langsung dibuang secara senyap demi melindungi modal operator.

### 2. Multi-Wallet Confluence Engine (`data/confluence.json`)
- Mendeteksi ketika 2 atau lebih dompet *Smart Money* membeli token yang sama dalam jendela waktu 30 menit.
- Notifikasi Telegram akan diberi stempel khusus: `🔥 SUPER ALPHA CONFLUENCE: 2 SMART MONEY WALLETS BUYING!`.

### 3. Simple Master PIN Authentication (No Clerk Complexity)
- Menggantikan Clerk dengan sistem otentikasi **Master PIN** mandiri (`src/lib/auth.ts`, `src/app/login/page.tsx`).
- Sesi disimpan aman di *HTTP-Only Cookie* (`predator_session`) terenkripsi SHA-256.
- PIN dikonfigurasi via `ADMIN_PIN` di `.env` (Default: `2026`).
- Menghemat ukuran *bundle*, menghilangkan *redirect pop-up* pihak ketiga, dan bebas masalah sinkronisasi akun.

### 4. Zero Dummy Data Policy
- 100% data transaksi diambil langsung secara *real-time* dari RPC Helius (Solana) dan Basescan/Alchemy (Base).
- Tidak ada data acak/simulasi `Math.random()` di dalam sistem.

### 5. Paper Trading Simulator (`scripts/paper-status.ts`)
- Setiap sinyal beli yang valid otomatis dicatat ke dalam log simulasi `data/signals.json`.
- Menghitung modal hipotetis ($2–$3), harga beli saat sinyal masuk, harga pasar *live* via DexScreener API, dan kalkulasi PnL / ROI saat ini.

---

## 💻 Panduan Perintah CLI (Command Reference)

Semua perintah dijalankan langsung dari terminal:

### 1. Menjalankan Tracker Daemon
```bash
# Mode Continuously Running (Patroli otomatis setiap 30 detik)
npm run daemon

# Mode Single Sweep (Satu kali jalan - dipakai oleh GitHub Actions Cron)
npm run daemon:once
```

### 2. Mengelola Watchlist Dompet (`config/watchlist.json`)
```bash
# Melihat daftar dompet yang sedang dipantau
npm run wallet:list

# Menambah dompet target baru
# Format: npm run wallet:add -- <address> "<alias>" [network] [minAlertUsd]
npm run wallet:add -- HjxaEDvdje644vhUmE3VpjpteWLBmWgSsgvYhf6LVw2L "Smart Money Alpha #1" SOLANA 15

# Menghapus dompet dari radar
npm run wallet:remove -- "Smart Money Alpha #1"

# Menjeda / Mengaktifkan sementara
npm run wallet:toggle -- "Smart Money Alpha #1"
```

### 3. Memeriksa Status Paper Trading (Live ROI)
```bash
npm run paper:status
```
*Output menampilkan tabel rapi: Token, Waktu Beli, Harga Entry, Harga Sekarang, ROI %, dan Estimasi PnL.*

### 4. Tes Sinyal Notifikasi Telegram
```bash
npm run test:alert
```

---

## 🌐 Menjalankan Dashboard UI

Dashboard Next.js dapat dibuka secara lokal maupun di Vercel:

```bash
# Menjalankan development server
npm run dev

# Membuka di browser:
http://localhost:3000
```
- Masukkan Master PIN (Default: `2026`) untuk membuka kontrol radar.
- Setiap penambahan atau penghapusan dompet di dashboard UI otomatis tersinkronisasi dengan `config/watchlist.json`.

---

## ☁️ 24/7 Cloud Tracker via GitHub Actions (Bebas Biaya Vercel)

Untuk menjaga pelacakan tetap berjalan 24 jam nonstop tanpa menghabiskan kuota Vercel CPU (yang sebelumnya menyebabkan *deployment paused*):

1. File alur kerja terletak di [.github/workflows/tracker.yml](file:///.github/workflows/tracker.yml).
2. Berjalan otomatis setiap **10 menit** (`cron: '*/10 * * * *'`) dan setiap kali ada *commit push*.
3. Menggunakan GitHub Secrets berikut pada repositori GitHub Anda:
   - `HELIUS_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `ADMIN_PIN`

---

## ⚙️ Variabel Lingkungan (`.env`)

```env
# Master PIN Gate
ADMIN_PIN="2026"

# Telegram Bot Alerts
TELEGRAM_BOT_TOKEN="8483467657:AAHCKiyxTov-tazbxagkqfcNl62ZqUCkYSQ"
TELEGRAM_CHAT_ID="2079693450"

# Blockchain RPC Providers
HELIUS_API_KEY="987f85c1-4b31-430a-bbb0-b8ef435b557f"
ALCHEMY_API_KEY="fGEpLjFJqd8KgM8T2Wbk7"

# Webhook Shared Secret
WEBHOOK_SHARED_SECRET="predator_rahasia_2026"
```

---

## 🎯 Tactical SOP Eksekusi Sinyal

Ketika sinyal masuk ke Telegram:
1. **Periksa Confluence:** Sinyal dengan badge `🔥 Multi-Wallet Confluence` memiliki probabilitas keberhasilan tertinggi.
2. **Micro-Sizing Entry:** Gunakan ukuran posisi taktis kecil ($2–$3 / Rp 30.000–Rp 50.000) per koin micin.
3. **Eksekusi 1-Klik:** Klik tombol Jupiter / BonkBot / DexScreener yang disertakan langsung di bawah pesan Telegram.
4. **Ladder Take Profit:** Pasang TP bertahap (+50%, +100%, +200%) dan segera amankan modal awal saat posisi telah 2x lipat.
