# 🎯 Predator Tracker (SaaS Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE). Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih, akurat, dan dapat dieksekusi dalam 1 klik, langsung dari Telegram pengguna.

---

## 🚀 Fitur Unggulan (Final Version)

### 1. Multi-Tenant Data Isolation (SaaS Ready) 🔐

Sistem dirancang untuk melayani banyak pengguna sekaligus dengan tingkat privasi maksimal.

- **Isolated chatId Mapping:** Setiap dompet yang didaftarkan akan mengikat notifikasi ke ID Telegram masing-masing pengguna.
- **100% Private:** Pengguna A tidak akan pernah melihat sinyal paus milik Pengguna B. Sangat aman untuk model bisnis langganan (_subscription-based_).

### 2. 1-Click Execution Terminal (Sniper Bot Integration) ⚡

Tidak perlu lagi berpindah aplikasi atau _copy-paste contract address_. Setiap notifikasi dilengkapi dengan Deep Link eksekusi instan:

- **Solana Ecosystem:** Eksekusi via Web3 (Jupiter DEX) atau Telegram Bot (BonkBot).
- **EVM Ecosystem (ETH & Base):** Eksekusi via Web3 (Uniswap) atau Telegram Bot (Maestro Sniper).

### 3. Filter Anti-Berisik Dinamis (`minAlertUsd`) 🎚️

Setiap paus memiliki karakter berbeda. Pengguna bisa mengatur batas minimal notifikasi per dompet di database:

- **Paus A (Batas $1,000):** Hanya bunyi jika ada transaksi besar.
- **Paus B (Batas $100):** Cocok untuk memantau paus yang suka mencicil (DCA).
- **Silent Update:** Transaksi di bawah batas tetap dicatat di database secara diam-diam tanpa mengirim notif yang mengganggu.

### 4. Real-Time Pricing via DexScreener 📈

Bot tidak lagi "buta" harga. Setiap ada transaksi token/micin di Solana, ETH, atau Base, bot otomatis menembak API DexScreener untuk mendapatkan:

- Estimasi nilai transaksi dalam USD secara presisi.
- Market Cap _real-time_ saat paus melakukan akumulasi/distribusi.

### 5. Smart Tagging & Reputation System 🏆

Pelabelan otomatis berdasarkan _Win Rate_ (PnL) paus di masa lalu:

- 🥇 **THE ORACLE** (Win Rate > 70%) - Sinyal prioritas tinggi (Wajib di-snipe).
- 🥈 **THE GRINDER** (Win Rate 40% - 60%) - Sinyal untuk dipantau.
- 💀 **EXIT LIQUIDITY** (Win Rate < 30%) - Sinyal peringatan.

### 6. Auto-Heal & Auto-Wipe Database (Clerk Webhooks) 🧹

- **Self-Cleaning Database:** Terintegrasi penuh dengan `svix` webhooks dari Clerk. Jika ada pengguna yang menghapus akun atau berhenti berlangganan, Prisma akan melakukan _Cascade Delete_ secara otomatis untuk melenyapkan semua data dompet dan riwayat transaksi mereka tanpa sisa.

### 7. Smart Onboarding & Auto-Sync Telegram 🤖

- **Frictionless Setup:** Sistem memiliki fitur _Auto-ID Finder_ terintegrasi. Pengguna baru cukup mengklik satu tombol untuk menyinkronkan ID Telegram mereka secara otomatis.
- **Instant Feedback:** Bot akan memberikan notifikasi selamat datang _real-time_ tepat saat pengguna berhasil menambahkan target dompet ke dalam radar.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Clerk Auth (dengan Svix Webhooks)
- **Database:** Prisma ORM & PostgreSQL (Neon DB)
- **Engine:** Helius Enriched API (Solana), Etherscan/Basescan (EVM), DexScreener API (Pricing)
- **Bot:** Telegram Bot API (Inline Keyboards, Markdown, & Deep Linking)
- **Architecture:** Isolated Multi-Tenant Webhook

---

## 🛠️ Alur Kerja Sistem (The SaaS Logic)

1. **Sweeping:** UptimeRobot memicu `/api/webhook` setiap interval yang ditentukan.
2. **Analysis & Enrichment:** Sistem mengecek aktivitas terbaru via RPC dan menghitung kalkulasi USD via DexScreener.
3. **Bouncer:** Jika nilai < `minAlertUsd`, notifikasi dibatalkan (Silent Update).
4. **Routing:** Sistem memetakan `targetChatId` berdasarkan kepemilikan dompet di database.
5. **Execution:** Sinyal dikirim secara _private_ ke pengguna lengkap dengan tombol Sniper Bot/DEX.

---

## 🗺️ Roadmap (Completed)

- [x] Filter Anti-Berisik Dinamis per dompet.
- [x] Integrasi DexScreener untuk kalkulasi USD & Market Cap otomatis.
- [x] Multi-Tenant Telegram Isolation (SaaS Ready).
- [x] 1-Click Execution Buttons (Jupiter, Uniswap, BonkBot, Maestro).
- [x] Smart Tracking Buttons untuk pengejaran dompet (Explorer).
- [x] Sistem Pembersih Database Otomatis via Clerk Webhooks.
- [x] Integrasi Pintasan Onboarding ID Telegram Otomatis.
