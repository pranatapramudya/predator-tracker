# 🎯 Predator Tracker (Smart Money & Whale Radar)

Sistem intelijen pelacakan dompet paus (*Whale*) dan *Smart Money* secara **100% Cloud-Native 24/7 Real-Time** lintas jaringan (**Solana**, **Base**, **Ethereum**, dan **Bitcoin**), beroperasi mandiri tanpa perlu laptop menyala melalui **Helius Enhanced Webhook**, dilengkapi **4-Layer Anti-Rugpull Guard**, **Multi-Wallet Confluence Engine**, **Dual-Channel Telegram Alert Dispatcher**, dan antarmuka modern **FLOQ Dual-Tone (White & Pine Green)** berstandar industri (**Next.js Fundamental SOP & Pabrik Robot Modul 11**).

---

## ⚡ Arsitektur Cloud 24/7 (Zero-Daemon Required)

Predator Tracker dirancang agar operator **tidak perlu menyalakan laptop atau menjalankan daemon lokal**. Sistem berjalan sepenuhnya di cloud:

```
┌────────────────────────────────────────────────────────────────────────┐
│               SOLANA ON-CHAIN REAL-TIME DETECTION                      │
│                                                                        │
│   Paus Eksekusi Swap di Solana (Smart Money Alpha #1 & #2)             │
│                                │                                       │
│                                ▼                                       │
│   [Provider Cloud: Helius Enhanced Webhook] (Deteksi < 1 Detik)        │
│   Target: HjxaEDvd... & A3Ekubss...                                    │
│   URL   : https://predator-tracker.vercel.app/api/webhook/helius       │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ HTTP POST Webhook
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SERVERLESS CLOUD HANDLER (VERCEL)                    │
│                                                                        │
│   • Resilient Fallback Config (Tahan Banting jika DB Offline)          │
│   • DexScreener Live Pricing & Liquidity Verification                  │
│   • 4-Layer Anti-Rugpull Security Audit (RugCheck API)                 │
│   • Confluence Detector (Paus Beli Bersamaan dalam 30 Menit)           │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                 Lolos Ambang Batas Nilai Transaksi
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│               DUAL-CHANNEL TELEGRAM ALERT DISPATCHER                   │
│                                                                        │
│   1. Personal DM Asisten Crypto (@skom_tracker_bot) : > $100 USD       │
│   2. Predator Alpha Feed VIP Channel                : > $1,000 USD     │
│   3. Tombol Interaktif 1-Klik:                                         │
│      [Solscan Tx] [DexScreener] [Jupiter] [BonkBot] [Search X]         │
└────────────────────────────────────────────────────────────────────────┘

 [Secondary Backup Layer]: GitHub Actions Cloud Workflow (.github/workflows/tracker.yml)
                           Memindai terjadwal setiap 5 menit sebagai jaring cadangan.
 [Tertiary Layer - Opsional]: Local Standalone Daemon (npm run daemon) untuk debugging lokal.
```

---

## 🎨 Tampilan Modern FLOQ Dual-Tone

Antarmuka web mengadopsi standar visual **FLOQ Fintech**:
* **Header & Top Bar:** Deep Pine Forest (`#061a1d`) dipadu aksen Soft Mint (`#a3f784`).
* **Content Container:** Sheet putih melengkung elegan (`rounded-t-[36px] bg-[#f8fafc] sm:bg-white`) dengan tipografi hitam pekat kontras tinggi (`text-slate-900`) yang sangat ramah di mata.
* **Halaman Login & PIN (`/login`):** Kartu putih bersih (`bg-white rounded-3xl`) dengan keypad angka modern, tanpa efek kedip hitam suram.
* **Performa Mobile Ringan (Zero-Lag 60-120 FPS):**
  * `WhaleCard.tsx` terisolasi dengan `React.memo` dan state lokal per kartu. Mengganti pilihan koin (*portfolio breakdown*) merespon **0ms** tanpa me-render ulang kartu lain.
  * Dilengkapi `touch-action: manipulation` (menghilangkan delay 300ms bawaan browser mobile) dan `touch-pan-y` pada grafik sparkline agar jempol meluncur bebas saat scrolling.

---

## 🛡️ Fitur Unggulan

### 1. Dual-Channel Alert Routing (`src/app/api/webhook/helius/route.ts`)
* **Personal DM Asisten Crypto:** Menerima notifikasi untuk seluruh transaksi bernilai **> $100 USD** agar operator bisa segera melakukan copy-trade terukur.
* **Predator Alpha Feed (Channel VIP):** Mengisolasi transaksi mega-whale di atas **$1,000 USD** untuk memantau pergerakan modal institusional/smart money terbesar.

### 2. 4-Layer Anti-Rugpull Guard (`src/lib/rugcheck.ts`)
Setiap kali target paus membeli token baru di Solana, transaksi otomatis diaudit sebelum alert dikirim:
* **Layer 1 (LP Locked/Burnt):** Minimal 95% likuiditas harus terkunci permanen atau dibakar.
* **Layer 2 (Mint Revoked):** Developer tidak bisa mencetak token baru seenaknya untuk *dump*.
* **Layer 3 (Freeze Disabled):** Developer tidak bisa membekukan dompet pembeli (*honeypot*).
* **Layer 4 (Top 10 Holders):** Akumulasi total kepemilikan 10 *holder* terbesar wajib di bawah 20% dari total suplai.

### 3. Multi-Wallet Confluence Engine (`data/confluence.json`)
* Mendeteksi jika 2 atau lebih dompet *Smart Money* mengakumulasi token yang sama dalam jendela waktu 30 menit.
* Notifikasi Telegram diberi stempel khusus: `🔥 SUPER ALPHA CONFLUENCE: 2 SMART MONEY WALLETS BUYING!`.

### 4. Interactive Per-Coin PnL Breakdown
* Setiap kartu paus memecah performa per-koin secara mandiri (`$ORBIT`, `$BORLY`, `$ELYSION`).
* Mengklik koin kustom langsung mengubah grafik sparkline, modal masuk, dan persentase ROI secara instan.

---

## 📋 Daftar Target Dompet Aktif (`config/watchlist.json`)

| Alias Target | Jaringan | Alamat Dompet | Filter Alert |
| :--- | :---: | :--- | :---: |
| **Smart Money Alpha #1** | Solana | `HjxaEDvdje644vhUmE3VpjpteWLBmWgSsgvYhf6LVw2L` | > $100 USD |
| **Smart Money Alpha #2** | Solana | `A3EkubssaFS1UP1DfYCEVsjndSZ7SYWbWTqDDUER73mv` | > $100 USD |

---

## 💻 Panduan Perintah CLI (Opsional / Debugging)

Jika ingin menjalankan pengujian manual di laptop:

### 1. Menjalankan Tracker Lokal (Opsional)
```bash
# Menjalankan pemindaian lokal satu kali
npm run daemon:once

# Menjalankan loop lokal 25 detik (hanya untuk testing lokal)
npm run daemon
```

### 2. Mengelola Watchlist Dompet (`config/watchlist.json`)
```bash
# Melihat daftar dompet yang sedang dipantau
npm run wallet:list

# Menambah dompet target baru
npm run wallet:add -- <address> "<alias>" [network] [minAlertUsd]

# Menghapus dompet dari radar
npm run wallet:remove -- "<alias>"
```

### 3. Menjalankan Dashboard UI Lokal
```bash
npm run dev
# Buka di browser: http://localhost:3000
```

---

## ⚙️ Variabel Lingkungan Terpusat (`.env`)

```env
# Master PIN Gate
ADMIN_PIN="2026"

# Telegram Bot Alerts
TELEGRAM_BOT_TOKEN="8483467657:AAHCKiyxTov-tazbxagkqfcNl62ZqUCkYSQ"
TELEGRAM_CHAT_ID="2079693450"
TELEGRAM_ALPHA_CHANNEL_ID="-1003737826938"

# Filter Ambang Batas Notifikasi
ASISTEN_MIN_USD="100"
ALPHA_FEED_MIN_USD="1000"

# Blockchain RPC Providers
HELIUS_API_KEY="987f85c1-4b31-430a-bbb0-b8ef435b557f"
ALCHEMY_API_KEY="fGEpLjFJqd8KgM8T2Wbk7"

# Webhook Endpoint Cloud
WEBHOOK_URL="https://predator-tracker.vercel.app/api/webhook"
WEBHOOK_SHARED_SECRET="predator_rahasia_2026"
```

---

## 🎯 Tactical SOP Eksekusi Sinyal

Ketika sinyal masuk ke Telegram Asisten Crypto / Alpha Feed:
1. **Periksa Confluence:** Sinyal dengan badge `🔥 Multi-Wallet Confluence` memiliki probabilitas keberhasilan tertinggi.
2. **Micro-Sizing Entry:** Gunakan ukuran posisi taktis kecil ($2–$3 / Rp 30.000–Rp 50.000) per koin micin.
3. **Eksekusi 1-Klik:** Klik tombol Jupiter / BonkBot / DexScreener yang disertakan langsung di bawah pesan Telegram.
4. **Ladder Take Profit:** Pasang TP bertahap (+20%, +50%, +100%) dan segera amankan modal awal saat posisi telah 2x lipat.
