# 🎯 Predator Tracker (SaaS Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE)[cite: 2]. Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih, akurat, dan dapat dieksekusi dalam 1 klik, langsung dari Telegram pengguna[cite: 2].

---

## 🚀 Fitur Unggulan (Latest Update)

### 1. Hybrid Dual-Engine Architecture (Webhook & Sweeper) ⚙️

Sistem pelacakan tanpa titik buta (_blind spot_) dengan arsitektur dua mesin sinkron[cite: 2]:

- **Webhook Engine (POST):** Menangkap transaksi _real-time_ dengan kecepatan milidetik menggunakan infrastruktur Helius dan Alchemy[cite: 2].
- **Sweeper Engine (GET):** Radar patroli aktif yang berjalan via _Cron Job_ untuk menyapu transaksi yang terlewat dan melacak pergerakan saldo utama (Native Balance)[cite: 2].

### 2. Universal Native Balance Tracker 🏦

Tidak hanya melacak _swap_ token micin, radar ini mengawasi pergerakan saldo absolut paus[cite: 2].

- Melacak injeksi atau penarikan dana besar dalam bentuk murni **SOL, ETH, dan BTC**[cite: 2].
- Menghitung kalkulasi perubahan nilai (USD) secara instan dan mengirim peringatan `🚨 WHALE BALANCE UPDATE` jika melewati batas toleransi (_threshold_)[cite: 2].

### 3. Detektif Anti-Mafia & Security Check (Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif kelas _enterprise_ yang menyelamatkan _user_ dari koin _scam_[cite: 2]:

- **RugCheck API Integration:** Pemindai otomatis status kontrak pintar (Mint, Freeze, LP Burn)[cite: 2]. Bot akan memberikan bendera merah 🚫 **Honeypot: High Risk Detected** jika token terindikasi penipuan[cite: 2].
- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC[cite: 2]. Memberikan peringatan dari 🟢 _Safe_ hingga 🔴 _EXTREME DANGER!_[cite: 2].
- **Isolated Error Handling:** Jika DexScreener atau RugCheck gagal mengindeks koin yang baru lahir sedetik lalu, sistem tetap berjalan aman berkat arsitektur _Try-Catch_ terisolasi[cite: 2].

### 4. Atomic PnL Engine & Live Whale Rapor 🏆

Dashboard dan Notifikasi tidak hanya menampilkan angka mentah, tapi performa akurat[cite: 2].

- **Prisma Interactive Transaction:** Kalkulasi _Average Buy Price_, _Realized PnL_, dan _Winrate_ diproses secara _Atomic_[cite: 2]. Mencegah _Race Condition_ saat paus melakukan banyak transaksi bersamaan[cite: 2].
- **Live Telegram Report:** Setiap _alert_ otomatis menampilkan akumulasi performa paus detik itu juga[cite: 2]. Penghilang FOMO Buta agar _user_ tahu paus mana yang benar-benar _Smart Money_[cite: 2].

### 5. Smart Noise Reduction & Alpha Tagging 🛡️

Algoritma filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal[cite: 2].

- **Silent Database Recording:** Transaksi receh sekecil apapun (di atas $0.1) tetap dicatat di database Prisma secara _background_[cite: 2]. Menjamin akurasi kalkulasi PnL, Win Rate, dan Total Trades di Dashboard tetap 100% presisi[cite: 2].
- **Anti-Spam Telegram:** Telegram hanya akan berbunyi untuk aksi _BUY_, atau aksi _SELL_ yang nilainya di atas **$50**[cite: 2]. Mengabaikan _dusting_ atau buang koin receh[cite: 2].
- **Dynamic Alpha Status:** Otomatis mengubah _header_ notifikasi menjadi `👑 ALPHA PREDATOR ALERT!` untuk transaksi bernilai masif di atas **$1000**[cite: 2].

### 6. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot[cite: 2].
- **EVM:** Integrasi Explorer & DexScreener Chart[cite: 2].

### 7. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar[cite: 2]. Berapapun usernya, data paus mereka dijamin tidak bocor ke tetangga[cite: 2].

### 8. Fully Automated Crypto Monetization & Enterprise Security 💳

Sistem monetisasi mandiri dengan arsitektur _Tiering_ dinamis (Scout, Predator, Apex Whale) dan keamanan tingkat tinggi[cite: 2]:

- **Decentralized Checkout:** Pembayaran langganan bulanan langsung via MoonPay menggunakan kripto (USDC, SOL, dll) atau Kartu Kredit[cite: 2].
- **Anti-DDoS & Spam Protection:** Menggunakan _Rate Limiting_ berbasis **Upstash Redis** untuk melindungi sistem dari serangan _botnet_ yang melakukan _spam_ formulir pencarian target paus[cite: 2].
- **Enterprise-Grade Webhook Security:** Perlindungan "Anti-Fake Payment" menggunakan verifikasi kriptografi `HMAC-SHA256`[cite: 2]. Webhook otomatis menolak _request_ palsu sebelum menyentuh _database_[cite: 2].
- **Telegram Gatekeeper & Secret Token:** Mengunci interaksi bot Telegram hanya untuk pengguna eksklusif yang telah mendaftar di web[cite: 2]. Melindungi _endpoint_ webhook dari _request_ palsu menggunakan otentikasi header `x-telegram-bot-api-secret-token`[cite: 2].
- **Freemium Vendor Lock-in:** Akun tier `FREE` dikunci secara permanen pada 1 target pertama (Hard Lock)[cite: 2]. Mencegah eksploitasi hapus-tambah dompet dan memicu efek psikologis pengguna untuk melakukan _upgrade_[cite: 2].
- **Auto-Provisioning Webhook:** Pemrosesan otomatis status pembayaran dari MoonPay untuk _upgrade tier_ dan penambahan kuota _maxWallets_ secara instan[cite: 2].
- **Auto-Downgrade Lifecycle:** Menurunkan tier otomatis kembali ke _Free_ dan memotong limit jika _user_ berhenti berlangganan atau gagal bayar[cite: 2].
- **Hard Limit Enforcer:** Akses kontrol ketat di sisi _Server Actions_ yang memblokir penambahan dompet target jika _user_ sudah mencapai batas kuota dari _tier_ langganannya[cite: 2].
- **Owner God Mode:** Bypass akses khusus di level server yang memberikan kebebasan _unlimited_ penambahan target dompet bagi admin/owner tanpa terpengaruh sistem tiering[cite: 2].

### 9. Futures Sentiment & Market Direction (Coinglass) 📈

Validasi aksi Spot paus dengan data pasar derivatif secara _real-time_ untuk mengukur kekuatan momentum[cite: 2].

- **Open Interest (OI) Tracker:** Mengambil agregat dana yang berputar di pasar Futures untuk koin spesifik di seluruh _Centralized Exchange_ global[cite: 2].
- **Ultra-Fast In-Memory Cache:** Request API dilindungi oleh struktur data `Map` selama 5 menit untuk mencegah _rate-limit_ API habis dan menjaga kecepatan respon _webhook_ tetap di bawah 1 detik[cite: 2].
- **Graceful Degradation:** Jika paus membeli koin _micin_ baru yang belum terdaftar di pasar Futures, sistem akan mengabaikan _error_ secara senyap dan tetap memproses notifikasi keamanan _on-chain_ tanpa kendala[cite: 2].

### 10. AI-Powered Predictive Scoring (DeepSeek Integration) 🤖

Mengubah Tracker menjadi _Predictive Tool_ menggunakan analisis data on-chain berbasis kecerdasan buatan.

- **Real-Time AI Analyst:** Mengirimkan parameter kritis token (Likuiditas, Umur, dan Metrik Keamanan) ke model AI DeepSeek untuk mendapatkan _Confidence Score_ (0-100) dan wawasan (insight) instan.
- **Strict Format Prompting:** Algoritma sistem menggunakan _temperature_ rendah untuk memaksa output AI berformat JSON murni, mencegah halusinasi, dan memastikan konsistensi logika analisis.
- **Fail-Safe Mechanism:** Memiliki _fallback logic_ terisolasi yang memastikan notifikasi Telegram tetap berhasil terkirim tanpa mengganggu _runtime_ meskipun API penyedia AI sedang mengalami gangguan atau limitasi.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router / Serverless)[cite: 2]
- **Authentication:** Clerk[cite: 2]
- **Database:** Prisma ORM & PostgreSQL (Neon DB)[cite: 2]
- **Rate Limiting/Cache:** Upstash Redis & In-Memory Map[cite: 2]
- **Scanner Engine:** Helius RPC, Alchemy, DexScreener API, RugCheck API, Coinglass API, **DeepSeek AI API**[cite: 2]
- **Payment Gateway:** MoonPay (Pay Links & Webhooks)[cite: 2]
- **State Management:** Prisma `$transaction` (Atomic DB Locks)[cite: 2]
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)[cite: 2]

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis)[cite: 2].
- [x] Multi-Tenant Telegram Isolation (SaaS Ready)[cite: 2].
- [x] Integrasi Detektif Anti-Mafia (Wallet Clustering Alert)[cite: 2].
- [x] Telegram Injection: Live Whale PnL & Winrate Report[cite: 2].
- [x] Hybrid Architecture: Active Sweeper (GET) & Passive Webhook (POST)[cite: 2].
- [x] Universal Native Balance (BTC/ETH/SOL) Tracker[cite: 2].
- [x] SaaS Monetization (MoonPay Checkout & Webhook Auto-Upgrade)[cite: 2].
- [x] Tiering System & Wallet Limit Enforcer[cite: 2].
- [x] Auto-Downgrade Lifecycle & God Mode Privilege[cite: 2].
- [x] RugCheck Security API & Live Honeypot Detection[cite: 2].
- [x] Silent Data Recording (>$0.1) & Smart Telegram Filter (>$50)[cite: 2].
- [x] Dynamic Alpha Alert Tagging (>$1000)[cite: 2].
- [x] Freemium Vendor Lock-in & UI Smart Lock (Gembok Target)[cite: 2].
- [x] MoonPay Webhook Security (HMAC-SHA256 Anti-Fake Payment)[cite: 2].
- [x] Upstash Redis Rate Limiting (Anti-DDoS & Spam Protection)[cite: 2].
- [x] Telegram Gatekeeper & Webhook Secret Token (Anti-Fake Request)[cite: 2].
- [x] Coinglass Futures Sentiment (Open Interest) & Ultra-Fast In-Memory Caching[cite: 2].
- [x] **AI-Powered Predictive Scoring & Real-time Insight (Gemini API).**
