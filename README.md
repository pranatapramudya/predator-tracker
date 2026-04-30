# 🎯 Predator Tracker (SaaS Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE). Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih, akurat, dan dapat dieksekusi dalam 1 klik, langsung dari Telegram pengguna.

---

## 🚀 Fitur Unggulan (Latest Update)

### 1. Hybrid Dual-Engine Architecture (Webhook & Sweeper) ⚙️

Sistem pelacakan tanpa titik buta (_blind spot_) dengan arsitektur dua mesin sinkron:

- **Webhook Engine (POST):** Menangkap transaksi _real-time_ dengan kecepatan milidetik menggunakan infrastruktur Helius dan Alchemy.
- **Sweeper Engine (GET):** Radar patroli aktif yang berjalan via _Cron Job_ untuk menyapu transaksi yang terlewat dan melacak pergerakan saldo utama (Native Balance).

### 2. Universal Native Balance Tracker 🏦

Tidak hanya melacak _swap_ token micin, radar ini mengawasi pergerakan saldo absolut paus.

- Melacak injeksi atau penarikan dana besar dalam bentuk murni **SOL, ETH, dan BTC**.
- Menghitung kalkulasi perubahan nilai (USD) secara instan dan mengirim peringatan `🚨 WHALE BALANCE UPDATE` jika melewati batas toleransi (_threshold_).

### 3. Detektif Anti-Mafia & "Ruang Isolasi" (Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif yang kebal terhadap _error_ koin baru:

- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC. Memberikan peringatan dari 🟢 _Safe_ hingga 🔴 _EXTREME DANGER!_.
- **Isolated Error Handling:** Jika DexScreener gagal mengindeks koin yang baru lahir sedetik lalu, sistem _Insider Risk_ tetap berjalan berkat arsitektur _Try-Catch_ terisolasi.

### 4. Atomic PnL Engine & Live Whale Rapor 🏆

Dashboard dan Notifikasi tidak hanya menampilkan angka mentah, tapi performa akurat.

- **Prisma Interactive Transaction:** Kalkulasi _Average Buy Price_, _Realized PnL_, dan _Winrate_ diproses secara _Atomic_. Mencegah _Race Condition_ saat paus melakukan banyak transaksi bersamaan.
- **Live Telegram Report:** Setiap _alert_ otomatis menampilkan akumulasi performa paus detik itu juga. Penghilang FOMO Buta agar _user_ tahu paus mana yang benar-benar _Smart Money_.

### 5. "Satpam $500" - Enterprise Noise Reduction 🛡️

Filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal Alpha.

- **Threshold-Based Alerts:** Telegram hanya berbunyi jika nilai transaksi di atas batas USD yang ditentukan user. Mengabaikan transaksi debu atau _airdrop_ sampah.

### 6. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot.
- **EVM:** Integrasi Explorer & DexScreener Chart.

### 7. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar. Berapapun usernya, data paus mereka dijamin tidak bocor ke tetangga.

### 8. Fully Automated Crypto Monetization 💳 (NEW)

Sistem monetisasi mandiri dengan arsitektur _Tiering_ dinamis (Scout, Predator, Apex Whale).

- **Decentralized Checkout:** Pembayaran langganan bulanan langsung via MoonPay menggunakan kripto (USDC, SOL, dll) atau Kartu Kredit.
- **Auto-Provisioning Webhook:** Pemrosesan otomatis status pembayaran dari MoonPay untuk _upgrade tier_ dan penambahan kuota _maxWallets_ secara instan.
- **Auto-Downgrade Lifecycle:** Menurunkan tier otomatis kembali ke _Free_ dan memotong limit jika _user_ berhenti berlangganan atau gagal bayar.
- **Hard Limit Enforcer:** Akses kontrol ketat di sisi _Server Actions_ yang memblokir penambahan dompet target jika _user_ sudah mencapai batas kuota dari _tier_ langganannya.
- **Owner God Mode:** Bypass akses khusus di level server yang memberikan kebebasan _unlimited_ penambahan target dompet bagi admin/owner tanpa terpengaruh sistem tiering.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router / Serverless)
- **Authentication:** Clerk
- **Database:** Prisma ORM & PostgreSQL (Neon DB)
- **Scanner Engine:** Helius RPC, Alchemy, DexScreener API
- **Payment Gateway:** MoonPay (Pay Links & Webhooks)
- **State Management:** Prisma `$transaction` (Atomic DB Locks)
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis).
- [x] Satpam Filter $100-$500 (Noise Reduction).
- [x] Multi-Tenant Telegram Isolation (SaaS Ready).
- [x] Integrasi Detektif Anti-Mafia (Wallet Clustering Alert).
- [x] Telegram Injection: Live Whale PnL & Winrate Report.
- [x] Hybrid Architecture: Active Sweeper (GET) & Passive Webhook (POST).
- [x] Universal Native Balance (BTC/ETH/SOL) Tracker.
- [x] **SaaS Monetization (MoonPay Checkout & Webhook Auto-Upgrade).**
- [x] **Tiering System & Wallet Limit Enforcer.**
- [x] **Auto-Downgrade Lifecycle & God Mode Privilege.**
