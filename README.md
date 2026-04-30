# 🎯 Predator Tracker (SaaS Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE)[cite: 9]. Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih, akurat, dan dapat dieksekusi dalam 1 klik, langsung dari Telegram pengguna[cite: 9].

---

## 🚀 Fitur Unggulan (Latest Update)

### 1. Hybrid Dual-Engine Architecture (Webhook & Sweeper) ⚙️

Sistem pelacakan tanpa titik buta (_blind spot_) dengan arsitektur dua mesin sinkron[cite: 9]:

- **Webhook Engine (POST):** Menangkap transaksi _real-time_ dengan kecepatan milidetik menggunakan infrastruktur Helius dan Alchemy[cite: 9].
- **Sweeper Engine (GET):** Radar patroli aktif yang berjalan via _Cron Job_ untuk menyapu transaksi yang terlewat dan melacak pergerakan saldo utama (Native Balance)[cite: 9].

### 2. Universal Native Balance Tracker 🏦

Tidak hanya melacak _swap_ token micin, radar ini mengawasi pergerakan saldo absolut paus[cite: 9].

- Melacak injeksi atau penarikan dana besar dalam bentuk murni **SOL, ETH, dan BTC**[cite: 9].
- Menghitung kalkulasi perubahan nilai (USD) secara instan dan mengirim peringatan `🚨 WHALE BALANCE UPDATE` jika melewati batas toleransi (_threshold_)[cite: 9].

### 3. Detektif Anti-Mafia & Security Check (Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif kelas _enterprise_ yang menyelamatkan _user_ dari koin _scam_[cite: 9]:

- **RugCheck API Integration:** Pemindai otomatis status kontrak pintar (Mint, Freeze, LP Burn)[cite: 9]. Bot akan memberikan bendera merah 🚫 **Honeypot: High Risk Detected** jika token terindikasi penipuan[cite: 9].
- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC[cite: 9]. Memberikan peringatan dari 🟢 _Safe_ hingga 🔴 _EXTREME DANGER!_[cite: 9].
- **Isolated Error Handling:** Jika DexScreener atau RugCheck gagal mengindeks koin yang baru lahir sedetik lalu, sistem tetap berjalan aman berkat arsitektur _Try-Catch_ terisolasi[cite: 9].

### 4. Atomic PnL Engine & Live Whale Rapor 🏆

Dashboard dan Notifikasi tidak hanya menampilkan angka mentah, tapi performa akurat[cite: 9].

- **Prisma Interactive Transaction:** Kalkulasi _Average Buy Price_, _Realized PnL_, dan _Winrate_ diproses secara _Atomic_[cite: 9]. Mencegah _Race Condition_ saat paus melakukan banyak transaksi bersamaan[cite: 9].
- **Live Telegram Report:** Setiap _alert_ otomatis menampilkan akumulasi performa paus detik itu juga[cite: 9]. Penghilang FOMO Buta agar _user_ tahu paus mana yang benar-benar _Smart Money_[cite: 9].

### 5. Smart Noise Reduction & Alpha Tagging 🛡️

Algoritma filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal[cite: 9].

- **Silent Database Recording:** Transaksi receh sekecil apapun (di atas $0.1) tetap dicatat di database Prisma secara _background_[cite: 9]. Menjamin akurasi kalkulasi PnL, Win Rate, dan Total Trades di Dashboard tetap 100% presisi[cite: 9].
- **Anti-Spam Telegram:** Telegram hanya akan berbunyi untuk aksi _BUY_, atau aksi _SELL_ yang nilainya di atas **$50**[cite: 9]. Mengabaikan _dusting_ atau buang koin receh[cite: 9].
- **Dynamic Alpha Status:** Otomatis mengubah _header_ notifikasi menjadi `👑 ALPHA PREDATOR ALERT!` untuk transaksi bernilai masif di atas **$1000**[cite: 9].

### 6. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot[cite: 9].
- **EVM:** Integrasi Explorer & DexScreener Chart[cite: 9].

### 7. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar[cite: 9]. Berapapun usernya, data paus mereka dijamin tidak bocor ke tetangga[cite: 9].

### 8. Fully Automated Crypto Monetization & Enterprise Security 💳

Sistem monetisasi mandiri dengan arsitektur _Tiering_ dinamis (Scout, Predator, Apex Whale) dan keamanan tingkat tinggi[cite: 9]:

- **Decentralized Checkout:** Pembayaran langganan bulanan langsung via MoonPay menggunakan kripto (USDC, SOL, dll) atau Kartu Kredit[cite: 9].
- **Anti-DDoS & Spam Protection:** Menggunakan _Rate Limiting_ berbasis **Upstash Redis** untuk melindungi sistem dari serangan _botnet_ yang melakukan _spam_ formulir pencarian target paus.
- **Enterprise-Grade Webhook Security:** Perlindungan "Anti-Fake Payment" menggunakan verifikasi kriptografi `HMAC-SHA256`[cite: 9]. Webhook otomatis menolak _request_ palsu sebelum menyentuh _database_[cite: 9].
- **Freemium Vendor Lock-in:** Akun tier `FREE` dikunci secara permanen pada 1 target pertama (Hard Lock)[cite: 9]. Mencegah eksploitasi hapus-tambah dompet dan memicu efek psikologis pengguna untuk melakukan _upgrade_[cite: 9].
- **Auto-Provisioning Webhook:** Pemrosesan otomatis status pembayaran dari MoonPay untuk _upgrade tier_ dan penambahan kuota _maxWallets_ secara instan[cite: 9].
- **Auto-Downgrade Lifecycle:** Menurunkan tier otomatis kembali ke _Free_ dan memotong limit jika _user_ berhenti berlangganan atau gagal bayar[cite: 9].
- **Hard Limit Enforcer:** Akses kontrol ketat di sisi _Server Actions_ yang memblokir penambahan dompet target jika _user_ sudah mencapai batas kuota dari _tier_ langganannya[cite: 9].
- **Owner God Mode:** Bypass akses khusus di level server yang memberikan kebebasan _unlimited_ penambahan target dompet bagi admin/owner tanpa terpengaruh sistem tiering[cite: 9].

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router / Serverless)[cite: 9]
- **Authentication:** Clerk[cite: 9]
- **Database:** Prisma ORM & PostgreSQL (Neon DB)[cite: 9]
- **Rate Limiting/Cache:** Upstash Redis
- **Scanner Engine:** Helius RPC, Alchemy, DexScreener API, RugCheck API[cite: 9]
- **Payment Gateway:** MoonPay (Pay Links & Webhooks)[cite: 9]
- **State Management:** Prisma `$transaction` (Atomic DB Locks)[cite: 9]
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)[cite: 9]

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis)[cite: 9].
- [x] Multi-Tenant Telegram Isolation (SaaS Ready)[cite: 9].
- [x] Integrasi Detektif Anti-Mafia (Wallet Clustering Alert)[cite: 9].
- [x] Telegram Injection: Live Whale PnL & Winrate Report[cite: 9].
- [x] Hybrid Architecture: Active Sweeper (GET) & Passive Webhook (POST)[cite: 9].
- [x] Universal Native Balance (BTC/ETH/SOL) Tracker[cite: 9].
- [x] SaaS Monetization (MoonPay Checkout & Webhook Auto-Upgrade)[cite: 9].
- [x] Tiering System & Wallet Limit Enforcer[cite: 9].
- [x] Auto-Downgrade Lifecycle & God Mode Privilege[cite: 9].
- [x] RugCheck Security API & Live Honeypot Detection[cite: 9].
- [x] Silent Data Recording (>$0.1) & Smart Telegram Filter (>$50)[cite: 9].
- [x] Dynamic Alpha Alert Tagging (>$1000)[cite: 9].
- [x] Freemium Vendor Lock-in & UI Smart Lock (Gembok Target)[cite: 9].
- [x] MoonPay Webhook Security (HMAC-SHA256 Anti-Fake Payment)[cite: 9].
- [x] **Upstash Redis Rate Limiting (Anti-DDoS & Spam Protection).**
