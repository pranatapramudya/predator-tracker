# 🎯 Predator Tracker (Smart Money & Whale Radar)

Sistem intelijen pelacakan dompet paus (*Whale*) dan *Smart Money* secara *real-time* lintas jaringan (**Solana**, **Base**, **Ethereum**, dan **Bitcoin**), dilengkapi **4-Layer Anti-Rugpull Guard**, **Multi-Wallet Confluence Engine**, **Paper Trading Simulator**, **Dual-Channel Telegram Alert Dispatcher**, dan **Cyberpunk Terminal UI** berstandar arsitektur industri (**Next.js Fundamental SOP & Pabrik Robot Modul 11**).

---

## ⚡ Arsitektur Utama (Dual-Engine System)

Predator Tracker dirancang dengan pemisahan tegas antara **UI Visualizer** dan **Tracking Daemon Engine**:

```
 ┌────────────────────────────────────────────────────────┐
 │                    TRACKING ENGINES                    │
 │                                                        │
 │  [Engine A: Local Standalone Daemon]                   │
 │   npm run daemon  (Polling 15-25 detik di PC/VPS)      │
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
 │             DUAL-CHANNEL ALERT DISPATCHER              │
 │  • Personal Bot DM (@skom_tracker_bot)  : > $100 USD   │
 │  • Predator Alpha Channel (VIP Signal)  : > $1,000 USD │
 │  • Confluence Badge (🔥 2+ Paus Masuk Bersamaan)       │
 │  • Quick Execution (DexScreener, Jupiter, Solscan)     │
 └────────────────────────────────────────────────────────┘
```

---

## 🏛️ Standar Arsitektur (SOP Compliance)

### 1. Next.js Fundamental SOP (Clean Server-Client Separation)
- **`page.tsx` Sebagai Koki (Server Component)**: Seluruh pemrosesan data, pembacaan konfigurasi `watchlist.json`, audit saldo RPC on-chain, dan kueri Prisma berjalan di sisi server secara aman.
- **Client Component Sebagai Pelayan**: Direktif `'use client'` didorong khusus ke komponen interaktif kecil (`DashboardShell.tsx`, `LiveRadarPoller.tsx`, `PnLChart.tsx`, `UpgradeModal.tsx`).
- **Resilient Route Handlers**: Dilengkapi rute penting bawaan App Router:
  - `src/app/loading.tsx`: Skeleton radar glowing dengan animasi cyber pulse.
  - `src/app/error.tsx`: Client error boundary dengan tombol diagnostik instan `reset()`.
  - `src/app/not-found.tsx`: Halaman koordinat hilang 404 terenkripsi.
- **Persistent Tab Routing**: Pemilihan menu (`Watchlist`, `Alpha Feed`, `Acquisition`, `Command Menu`) disinkronkan ke `localStorage` (`predator_active_tab`) dan URL query `router.replace('/?tab=' + tab)`, sehingga perpindahan tab tidak pernah reset saat auto-refresh.

### 2. Pabrik Robot SOP (Modul 11 - Standar Otomasi Industri)
- **Sentralisasi `process.env` (`src/config/env.ts`)**: Dilengkapi **Booting Crash Guard** yang memvalidasi seluruh kredensial lingkungan saat runtime booting awal.
- **Try-Catch Isolation di Dalam Loop**: Iterasi pemindaian wallet Solana dan Base diproteksi secara independen di dalam `scripts/daemon.ts`. Jika 1 RPC atau wallet timeout, pemindaian dompet lain **tetap berjalan 100% tanpa henti**.
- **Struktur 3 Pilar**:
  - `src/config/`: Konfigurasi terpusat & env guard (`env.ts`).
  - `src/services/`: Logika konektivitas RPC on-chain & blockchain scanner (`crypto.ts`, `scanner.ts`, `gemini.ts`).
  - `src/handlers/`: Pengendali perutean pesan & eksekusi bisnis (`alertDispatcher.ts`).
- **Watchdog & Anti-Freeze Delay**: Proteksi rate-limit dengan backoff eksponensial otomatis untuk mencegah pemblokiran API provider.

---

## 🛡️ Fitur Unggulan

### 1. Smart Non-Intrusive Live Radar Poller (`src/components/LiveRadarPoller.tsx`)
- **Singleton Countdown Architecture**: Timer 15 detik dikoordinasikan secara global sehingga tampilan desktop dan mobile selalu serempak detik demi detik.
- **User Activity Guard**: Poller otomatis mendeteksi jika operator sedang aktif mengetik di input form (`address`, `name`, `search`) atau membuka dialog modal. Refresh server otomatis ditunda 5 detik agar form atau keyboard HP tidak tertutup/terganggu.

### 2. Dual-Channel Alert Routing (`src/handlers/alertDispatcher.ts`)
- **Personal DM (@skom_tracker_bot)**: Menerima seluruh transaksi paus di atas **$100 USD** untuk keperluan copy-trade taktis.
- **Predator Alpha Channel**: Mengisolasi transaksi paus bernominal besar di atas **$1,000 USD** untuk memfilter pergerakan mega-whale.

### 3. Real-Time Sparkline PnL dengan Rentang Hari & Jam (`src/components/PnLChart.tsx`)
- Grafik sparkline mikro kini dilengkapi rentang tanggal dan jam real-time transaksi (`📅 09 Nov 18:14 — 09 Nov 21:02`).
- Tooltip interaktif menampilkan waktu eksekusi tepat dan nilai PnL per titik trade.

### 4. 4-Layer Anti-Rugpull Guard (`src/lib/rugcheck.ts`)
Setiap kali target paus membeli token baru di Solana, transaksi otomatis diaudit sebelum notifikasi Telegram dikirim:
- **Layer 1 (LP Locked/Burnt):** Minimal 95% likuiditas harus terkunci permanen atau dibakar.
- **Layer 2 (Mint Revoked):** Developer tidak bisa mencetak token baru seenaknya untuk *dump*.
- **Layer 3 (Freeze Disabled):** Developer tidak bisa membekukan dompet pembeli (*honeypot*).
- **Layer 4 (Top 10 Holders):** Akumulasi total kepemilikan 10 *holder* terbesar wajib di bawah 20% dari total suplai.

### 5. Multi-Wallet Confluence Engine (`data/confluence.json`)
- Mendeteksi ketika 2 atau lebih dompet *Smart Money* membeli token yang sama dalam jendela waktu 30 menit.
- Notifikasi Telegram akan diberi stempel khusus: `🔥 SUPER ALPHA CONFLUENCE: 2 SMART MONEY WALLETS BUYING!`.

### 6. High-Contrast Typography & Ergonomic Cyber UI
- Seluruh teks antarmuka dioptimasi dengan kontras maksimal (`text-white font-black` / `text-white font-bold`).
- Tombol navigasi keluar kini jelas berlabel **KELUAR / Sign Out** dengan ikon `LogOut`.

---

## 💻 Panduan Perintah CLI (Command Reference)

Semua perintah dijalankan langsung dari terminal:

### 1. Menjalankan Tracker Daemon
```bash
# Mode Continuously Running (Patroli otomatis setiap 25 detik)
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
npm run wallet:add -- HjxaEDvdje644vhUmE3VpjpteWLBmWgSsgvYhf6LVw2L "Smart Money Alpha #1" SOLANA 100

# Menghapus dompet dari radar
npm run wallet:remove -- "Smart Money Alpha #1"

# Menjeda / Mengaktifkan sementara
npm run wallet:toggle -- "Smart Money Alpha #1"
```

### 3. Memeriksa Status Paper Trading (Live ROI)
```bash
npm run paper:status
```

### 4. Tes Sinyal Notifikasi Telegram
```bash
npm run test:alert
```

---

## 🌐 Menjalankan Dashboard UI

```bash
# Menjalankan development server
npm run dev

# Membuka di browser:
http://localhost:3000
```
- Masukkan Master PIN (Default: `2026`) untuk membuka kontrol radar.
- Setiap penambahan atau penghapusan dompet di dashboard UI otomatis tersinkronisasi dengan `config/watchlist.json` dan database SQLite/Prisma.

---

## ⚙️ Variabel Lingkungan Terpusat (`.env`)

```env
# Master PIN Gate
ADMIN_PIN="2026"

# Telegram Bot Alerts
TELEGRAM_BOT_TOKEN="8483467657:AAHCKiyxTov-tazbxagkqfcNl62ZqUCkYSQ"
TELEGRAM_CHAT_ID="2079693450"
TELEGRAM_ALPHA_CHANNEL_ID="-1003737826938"

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
