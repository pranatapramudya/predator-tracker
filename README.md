# 🎯 Predator Tracker (Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE). Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih dan akurat langsung ke Telegram Anda.

## 🚀 Fitur Unggulan (Final Version)

### 1. Jalur Notifikasi Ganda (Dual-Channel Isolation)

Sistem memisahkan informasi menjadi dua jalur agar Anda tetap fokus:

- **Predator Alpha Feed (Channel):** Jalur eksklusif untuk sinyal beli/jual koin baru (Swap/Token) di atas batas minimal USD. Dilengkapi tombol _View on DexScreener_.
- **Asisten Crypto Prana (Personal Bot):** Jalur laporan harian untuk perubahan saldo utama (Transfer) agar Anda tetap bisa memantau aktivitas paus tanpa mengganggu Feed Alpha.

### 2. Filter Anti-Berisik Dinamis (`minAlertUsd`)

Setiap paus memiliki karakter berbeda. Kini Anda bisa mengatur batas minimal notifikasi per dompet di database:

- **Paus A (Batas $1,000):** Hanya bunyi jika dia transaksi besar.
- **Paus B (Batas $100):** Cocok untuk memantau paus yang suka mencicil (DCA).
- **Silent Update:** Transaksi di bawah batas tetap dicatat di database secara diam-diam tanpa mengirim notif yang mengganggu.

### 3. Real-Time Pricing via DexScreener

Bot tidak lagi "buta" harga. Setiap ada transaksi token/micin di Solana, ETH, atau Base, bot otomatis menembak API DexScreener untuk mendapatkan:

- Estimasi nilai transaksi dalam USD.
- Simbol koin terbaru secara akurat.
- Link langsung ke grafik koin tersebut.

### 4. Smart Tagging & Reputation System

Pelabelan otomatis berdasarkan performa paus di masa lalu:

- 🥇 **THE ORACLE (Win Rate > 70%)** - Sinyal prioritas tinggi.
- 🥈 **THE GRINDER (Win Rate 40% - 60%)** - Sinyal untuk dipantau.
- 💀 **EXIT LIQUIDITY (Win Rate < 30%)** - Sinyal peringatan.

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma ORM & PostgreSQL (Neon DB)
- **Engine:** Helius Enriched API (Solana), Etherscan/Basescan (EVM), DexScreener (Pricing)
- **Bot:** Telegram Bot API (Inline Keyboards & Markdown)

## 🛠️ Alur Kerja Sistem (The Predator Logic)

1. **Sweeping:** UptimeRobot memicu `/api/webhook` setiap 5 menit.
2. **Analysis:** Sistem mengecek aktivitas terbaru via RPC.
3. **Valuation:** Jika ditemukan Swap, bot mencari harga real-time di DexScreener.
4. **Bouncer:** Jika nilai < `minAlertUsd`, notif Alpha dibatalkan (Silent).
5. **Execution:** Jika lolos filter, sinyal dikirim ke Channel Alpha dengan tombol interaktif, dan notif saldo di DM personal otomatis dibungkam (Anti-Double Notif).

## 🗺️ Roadmap (Completed)

- [x] Filter Anti-Berisik Dinamis per dompet.
- [x] Integrasi DexScreener untuk kalkulasi USD otomatis.
- [x] Inline Keyboard (Tombol DexScreener & Solscan).
- [x] Dual-Channel Alert (Pemisahan Sinyal vs Log Saldo).
