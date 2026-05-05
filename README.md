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

### 3. Detektif Anti-Mafia & Security Check (Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif kelas _enterprise_ yang menyelamatkan _user_ dari koin _scam_[cite: 6]:

- **RugCheck API Integration:** Pemindai otomatis status kontrak pintar (Mint, Freeze, LP Burn)[cite: 6]. Bot akan memberikan bendera merah 🚫 **Honeypot: High Risk Detected** jika token terindikasi penipuan[cite: 6].
- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC[cite: 6]. Memberikan peringatan dari 🟢 _Safe_ hingga 🔴 _EXTREME DANGER!_[cite: 6].
- **Isolated Error Handling:** Jika DexScreener atau RugCheck gagal mengindeks koin yang baru lahir sedetik lalu, sistem tetap berjalan aman berkat arsitektur _Try-Catch_ terisolasi[cite: 6].

### 4. Atomic PnL Engine & Live Whale Rapor 🏆

Dashboard dan Notifikasi tidak hanya menampilkan angka mentah, tapi performa akurat[cite: 6].

- **Prisma Interactive Transaction:** Kalkulasi _Average Buy Price_, _Realized PnL_, dan _Winrate_ diproses secara _Atomic_[cite: 6]. Mencegah _Race Condition_ saat paus melakukan banyak transaksi bersamaan[cite: 6].
- **Live Telegram Report:** Setiap _alert_ otomatis menampilkan akumulasi performa paus detik itu juga[cite: 6]. Penghilang FOMO Buta agar _user_ tahu paus mana yang benar-benar _Smart Money_[cite: 6].

### 5. Smart Noise Reduction & Alpha Tagging 🛡️

Algoritma filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal[cite: 6].

- **Silent Database Recording:** Transaksi receh sekecil apapun (di atas $0.1) tetap dicatat di database Prisma secara _background_[cite: 6]. Menjamin akurasi kalkulasi PnL, Win Rate, dan Total Trades di Dashboard tetap 100% presisi[cite: 6].
- **Anti-Spam Telegram:** Telegram hanya akan berbunyi untuk aksi _BUY_, atau aksi _SELL_ yang nilainya di atas **$50**[cite: 6]. Mengabaikan _dusting_ atau buang koin receh[cite: 6].
- **Dynamic Alpha Status:** Otomatis mengubah _header_ notifikasi menjadi `👑 ALPHA PREDATOR ALERT!` untuk transaksi bernilai masif di atas **$1000**[cite: 6].

### 6. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot[cite: 6].
- **EVM:** Integrasi Explorer & DexScreener Chart[cite: 6].

### 7. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar[cite: 6]. Berapapun usernya, data paus mereka dijamin tidak bocor ke tetangga[cite: 6].

### 8. Fully Automated Crypto Monetization & Enterprise Security 💳

Sistem monetisasi mandiri dengan arsitektur _Tiering_ dinamis (Scout, Predator, Apex Whale) dan keamanan tingkat tinggi[cite: 6]:

- **Decentralized Checkout:** Pembayaran langganan bulanan langsung via MoonPay menggunakan kripto (USDC, SOL, dll) atau Kartu Kredit[cite: 6].
- **Anti-DDoS & Spam Protection:** Menggunakan _Rate Limiting_ berbasis **Upstash Redis** untuk melindungi sistem dari serangan _botnet_ yang melakukan _spam_ formulir pencarian target paus[cite: 6].
- **Enterprise-Grade Webhook Security:** Perlindungan "Anti-Fake Payment" menggunakan verifikasi kriptografi `HMAC-SHA256`[cite: 6]. Webhook otomatis menolak _request_ palsu sebelum menyentuh _database_[cite: 6].
- **Telegram Gatekeeper & Secret Token:** Mengunci interaksi bot Telegram hanya untuk pengguna eksklusif yang telah mendaftar di web[cite: 6]. Melindungi _endpoint_ webhook dari _request_ palsu menggunakan otentikasi header `x-telegram-bot-api-secret-token`[cite: 6].
- **Freemium Vendor Lock-in:** Akun tier `FREE` dikunci secara permanen pada 1 target pertama (Hard Lock)[cite: 6]. Mencegah eksploitasi hapus-tambah dompet dan memicu efek psikologis pengguna untuk melakukan _upgrade_[cite: 6].
- **Auto-Provisioning Webhook:** Pemrosesan otomatis status pembayaran dari MoonPay untuk _upgrade tier_ dan penambahan kuota _maxWallets_ secara instan[cite: 6].
- **Auto-Downgrade Lifecycle:** Menurunkan tier otomatis kembali ke _Free_ dan memotong limit jika _user_ berhenti berlangganan atau gagal bayar[cite: 6].
- **Hard Limit Enforcer:** Akses kontrol ketat di sisi _Server Actions_ yang memblokir penambahan dompet target jika _user_ sudah mencapai batas kuota dari _tier_ langganannya[cite: 6].
- **Owner God Mode:** Bypass akses khusus di level server yang memberikan kebebasan _unlimited_ penambahan target dompet bagi admin/owner tanpa terpengaruh sistem tiering[cite: 6].

### 9. Futures Sentiment & Market Direction (Coinglass) 📈

Validasi aksi Spot paus dengan data pasar derivatif secara _real-time_ untuk mengukur kekuatan momentum[cite: 6].

- **Open Interest (OI) Tracker:** Mengambil agregat dana yang berputar di pasar Futures untuk koin spesifik di seluruh _Centralized Exchange_ global[cite: 6].
- **Ultra-Fast In-Memory Cache:** Request API dilindungi oleh struktur data `Map` selama 5 menit untuk mencegah _rate-limit_ API habis dan menjaga kecepatan respon _webhook_ tetap di bawah 1 detik[cite: 6].
- **Graceful Degradation:** Jika paus membeli koin _micin_ baru yang belum terdaftar di pasar Futures, sistem akan mengabaikan _error_ secara senyap dan tetap memproses notifikasi keamanan _on-chain_ tanpa kendala[cite: 6].

### 10. AI-Powered Predictive Scoring (DeepSeek Integration) 🤖

Mengubah Tracker menjadi _Predictive Tool_ menggunakan analisis data on-chain berbasis kecerdasan buatan[cite: 6].

- **Real-Time AI Analyst:** Mengirimkan parameter kritis token (Likuiditas, Umur, dan Metrik Keamanan) ke model AI DeepSeek untuk mendapatkan _Confidence Score_ (0-100) dan wawasan (insight) instan[cite: 6].
- **Strict Format Prompting:** Algoritma sistem menggunakan _temperature_ rendah untuk memaksa output AI berformat JSON murni, mencegah halusinasi, dan memastikan konsistensi logika analisis[cite: 6].
- **Fail-Safe Mechanism:** Memiliki _fallback logic_ terisolasi yang memastikan notifikasi Telegram tetap berhasil terkirim tanpa mengganggu _runtime_ meskipun API penyedia AI sedang mengalami gangguan atau limitasi[cite: 6].

### 11. Whale Panic / Massive Exit Alert 🚨

Mendeteksi dan mengirim peringatan dini ketika beberapa target paus melakukan aksi jual bersamaan.

- **Sale Log Event:** Sistem mencatat setiap transaksi _Sell_ di atas $1000 ke dalam _database_ khusus.
- **Multi-Whale Threshold:** Jika terdeteksi 3 target paus atau lebih menjual aset yang sama dalam waktu singkat, bot Telegram akan membunyikan alarm "Massive Exit Detected".

### 12. Smart Money "Hold Duration" Tagging ⏱️

Menganalisis gaya _trading_ setiap paus secara otomatis.

- **Trade Style Profiling:** Mengategorikan target dompet menjadi _Scalper_, _Swing Trader_, atau _Diamond Hands_ berdasarkan rata-rata waktu transaksi beli dan jual.

### 13. Portfolio "Shadowing" Mode 👥

Fitur eksklusif yang dirancang untuk membangkitkan FOMO pada pengguna dengan memperlihatkan potensi keuntungan.

- **Simulated PnL Calculation:** Pengguna menetapkan "modal kertas" atau saldo simulasi. Sistem akan mengalkulasi berapa banyak potensi profit atau _loss_ yang bisa didapat seandainya pengguna mengikuti langkah _trading_ target paus tersebut.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router / Serverless)[cite: 6]
- **Authentication:** Clerk[cite: 6]
- **Database:** Prisma ORM & PostgreSQL (Neon DB)[cite: 6]
- **Rate Limiting/Cache:** Upstash Redis & In-Memory Map[cite: 6]
- **Scanner Engine:** Helius RPC, Alchemy, DexScreener API, RugCheck API, Coinglass API, **Gemini API**[cite: 6]
- **Payment Gateway:** MoonPay (Pay Links & Webhooks)[cite: 6]
- **State Management:** Prisma `$transaction` (Atomic DB Locks)[cite: 6]
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)[cite: 6]

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis)[cite: 6].
- [x] Multi-Tenant Telegram Isolation (SaaS Ready)[cite: 6].
- [x] Integrasi Detektif Anti-Mafia (Wallet Clustering Alert)[cite: 6].
- [x] Telegram Injection: Live Whale PnL & Winrate Report[cite: 6].
- [x] Hybrid Architecture: Active Sweeper (GET) & Passive Webhook (POST)[cite: 6].
- [x] Universal Native Balance (BTC/ETH/SOL) Tracker[cite: 6].
- [x] SaaS Monetization (MoonPay Checkout & Webhook Auto-Upgrade)[cite: 6].
- [x] Tiering System & Wallet Limit Enforcer[cite: 6].
- [x] Auto-Downgrade Lifecycle & God Mode Privilege[cite: 6].
- [x] RugCheck Security API & Live Honeypot Detection[cite: 6].
- [x] Silent Data Recording (>$0.1) & Smart Telegram Filter (>$50)[cite: 6].
- [x] Dynamic Alpha Alert Tagging (>$1000)[cite: 6].
- [x] Freemium Vendor Lock-in & UI Smart Lock (Gembok Target)[cite: 6].
- [x] MoonPay Webhook Security (HMAC-SHA256 Anti-Fake Payment)[cite: 6].
- [x] Upstash Redis Rate Limiting (Anti-DDoS & Spam Protection)[cite: 6].
- [x] Telegram Gatekeeper & Webhook Secret Token (Anti-Fake Request)[cite: 6].
- [x] Coinglass Futures Sentiment (Open Interest) & Ultra-Fast In-Memory Caching[cite: 6].
- [x] AI-Powered Predictive Scoring & Real-time Insight (DeepSeek API)[cite: 6].
- [x] Massive Exit Warning Alert & Database Schema Setup.
- [x] User Dashboard Tagging: Scalper vs Diamond Hands Status.
- [x] Shadowing Mode Database Setup.
