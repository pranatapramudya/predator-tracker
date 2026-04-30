# 🎯 Predator Tracker (SaaS Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE)[cite: 6]. Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih, akurat, dan dapat dieksekusi dalam 1 klik, langsung dari Telegram pengguna[cite: 6].

---

## 🚀 Fitur Unggulan (Latest Update)

### 1. Hybrid Dual-Engine Architecture (Webhook & Sweeper) ⚙️

Sistem pelacakan tanpa titik buta (_blind spot_) dengan arsitektur dua mesin sinkron[cite: 6]:

- **Webhook Engine (POST):** Menangkap transaksi _real-time_ dengan kecepatan milidetik menggunakan infrastruktur Helius dan Alchemy[cite: 6].
- **Sweeper Engine (GET):** Radar patroli aktif yang berjalan via _Cron Job_ untuk menyapu transaksi yang terlewat dan melacak pergerakan saldo utama (Native Balance)[cite: 6].

### 2. Universal Native Balance Tracker 🏦

Tidak hanya melacak _swap_ token micin, radar ini mengawasi pergerakan saldo absolut paus[cite: 6].

- Melacak injeksi atau penarikan dana besar dalam bentuk murni **SOL, ETH, dan BTC**[cite: 6].
- Menghitung kalkulasi perubahan nilai (USD) secara instan dan mengirim peringatan `🚨 WHALE BALANCE UPDATE` jika melewati batas toleransi (_threshold_)[cite: 6].

### 3. Detektif Anti-Mafia & "Ruang Isolasi" (Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif yang kebal terhadap _error_ koin baru[cite: 6]:

- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC[cite: 6]. Memberikan peringatan dari 🟢 _Safe_ hingga 🔴 _EXTREME DANGER!_[cite: 6].
- **Isolated Error Handling:** Jika DexScreener gagal mengindeks koin yang baru lahir sedetik lalu, sistem _Insider Risk_ tetap berjalan berkat arsitektur _Try-Catch_ terisolasi[cite: 6].

### 4. Atomic PnL Engine & Live Whale Rapor 🏆

Dashboard dan Notifikasi tidak hanya menampilkan angka mentah, tapi performa akurat[cite: 6].

- **Prisma Interactive Transaction:** Kalkulasi _Average Buy Price_, _Realized PnL_, dan _Winrate_ diproses secara _Atomic_[cite: 6]. Mencegah _Race Condition_ saat paus melakukan banyak transaksi bersamaan[cite: 6].
- **Live Telegram Report:** Setiap _alert_ otomatis menampilkan akumulasi performa paus detik itu juga[cite: 6]. Penghilang FOMO Buta agar _user_ tahu paus mana yang benar-benar _Smart Money_[cite: 6].

### 5. "Satpam $500" - Enterprise Noise Reduction 🛡️

Filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal Alpha[cite: 6].

- **Threshold-Based Alerts:** Telegram hanya berbunyi jika nilai transaksi di atas batas USD yang ditentukan user[cite: 6]. Mengabaikan transaksi debu atau _airdrop_ sampah[cite: 6].

### 6. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot[cite: 6].
- **EVM:** Integrasi Explorer & DexScreener Chart[cite: 6].

### 7. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar[cite: 6]. Berapapun usernya, data paus mereka dijamin tidak bocor ke tetangga[cite: 6].

### 8. Fully Automated Crypto Monetization 💳 (NEW)

Sistem monetisasi mandiri dengan arsitektur _Tiering_ dinamis (Scout, Predator, Apex Whale).

- **Decentralized Checkout:** Pembayaran langganan langsung via MoonPay menggunakan kripto (USDC, SOL, dll) atau Kartu Kredit.
- **Auto-Provisioning Webhook:** Pemrosesan otomatis status pembayaran dari MoonPay untuk _upgrade tier_ dan penambahan kuota _maxWallets_ secara instan tanpa campur tangan admin.
- **Hard Limit Enforcer:** Akses kontrol ketat di sisi _Server Actions_ yang memblokir penambahan dompet target jika _user_ sudah mencapai batas kuota dari _tier_ langganannya.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router / Serverless)[cite: 6]
- **Authentication:** Clerk
- **Database:** Prisma ORM & PostgreSQL (Neon DB)[cite: 6]
- **Scanner Engine:** Helius RPC, Alchemy, DexScreener API[cite: 6]
- **Payment Gateway:** MoonPay (Pay Links & Webhooks)
- **State Management:** Prisma `$transaction` (Atomic DB Locks)[cite: 6]
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)[cite: 6]

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis)[cite: 6].
- [x] Satpam Filter $100-$500 (Noise Reduction)[cite: 6].
- [x] Multi-Tenant Telegram Isolation (SaaS Ready)[cite: 6].
- [x] Integrasi Detektif Anti-Mafia (Wallet Clustering Alert)[cite: 6].
- [x] Telegram Injection: Live Whale PnL & Winrate Report[cite: 6].
- [x] Hybrid Architecture: Active Sweeper (GET) & Passive Webhook (POST)[cite: 6].
- [x] Universal Native Balance (BTC/ETH/SOL) Tracker[cite: 6].
- [x] **SaaS Monetization (MoonPay Checkout & Webhook Auto-Upgrade).**
- [x] **Tiering System & Wallet Limit Enforcer.**
