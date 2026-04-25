# 🎯 Predator Tracker (Smart Money & Whale Watcher)

Aplikasi SaaS untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas _Smart Money_ secara _real-time_ lintas jaringan (BTC, ETH, SOL, BASE).

## 🚀 Fitur Saat Ini (Status Terkini)

Sistem ini memiliki kapabilitas analitik otomatis yang berjalan 24/7 dengan arsitektur yang tahan banting:

### 1. Multi-Network Balance Tracker

Memantau perubahan saldo utama (Native Coin) dengan tingkat akurasi tinggi:

- **Bitcoin (BTC):** Menggunakan mesin Blockchain.info & Mempool.space.
- **Solana (SOL):** Menggunakan Helius RPC.
- **Ethereum (ETH) & Base:** Menggunakan sistem **Round-Robin RPC Fallback** (Llamarpc, Ankr, PublicNode, 1rpc) untuk menjamin stabilitas data dan menghindari _rate-limit_ dari penyedia RPC tunggal.

### 2. Smart Money Tracker (Swap & Token)

Melacak aktivitas transaksi spesifik untuk melihat strategi akumulasi paus:

- **Solana Swaps:** Deteksi Jual/Beli koin micin via _Helius Enriched API_. Notifikasi otomatis diterjemahkan (Contoh: "Swapped 10 SOL for 5000 WIF").
- **EVM ERC-20 Transfers:** Memantau pergerakan token di jaringan Ethereum dan Base menggunakan Etherscan/Basescan API.

### 3. Autopilot Webhook & Telegram Alerts

- **Bypass Cron Limit:** Menggunakan UptimeRobot untuk memicu `/api/webhook` setiap 5 menit, melampaui batasan Cron Job pada Vercel Hobby Plan.
- **Anti-False Alarm:** Sistem dilengkapi _fail-safe_ yang otomatis men-_skip_ pengecekan jika API sedang limit, mencegah notifikasi palsu "Saldo 0".

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma ORM dengan PostgreSQL (Neon DB)
- **Deployment:** Vercel
- **Integrasi:** Telegram Bot API & UptimeRobot
- **External APIs:** Helius (Solana), Etherscan (ETH), Basescan (Base)

---

## 🛠️ Cara Kerja Sistem

1. **Acquisition:** User memasukkan alamat via Web UI. Sistem melakukan validasi alamat berdasarkan network yang dipilih.
2. **Radar Sweeping:** UptimeRobot memanggil webhook secara berkala.
3. **Analisis Data:** Sistem membandingkan saldo lama vs baru, serta mengecek _signature_ transaksi terbaru di database menggunakan kunci unik (`dedupeKey`) untuk menghindari notifikasi duplikat.

---

## 🗺️ Roadmap Selanjutnya

- [ ] **PNL Tracker:** Fitur untuk menghitung estimasi keuntungan/kerugian (Profit & Loss) dari transaksi paus.
- [ ] **Multi-user Authentication:** Watchlist pribadi menggunakan Clerk atau NextAuth.
- [ ] **Custom Threshold:** Pengaturan batas minimum notifikasi transaksi (Contoh: Notifikasi hanya dikirim jika transaksi > $10,000).
