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

### 3. Detektif Anti-Mafia & Security Check (Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif kelas _enterprise_ yang menyelamatkan _user_ dari koin _scam_:

- **RugCheck API Integration:** Pemindai otomatis status kontrak pintar (Mint, Freeze, LP Burn). Bot akan memberikan bendera merah 🚫 **Honeypot: High Risk Detected** jika token terindikasi penipuan.
- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC. Memberikan peringatan dari 🟢 _Safe_ hingga 🔴 _EXTREME DANGER!_.
- **Isolated Error Handling:** Jika DexScreener atau RugCheck gagal mengindeks koin yang baru lahir sedetik lalu, sistem tetap berjalan aman berkat arsitektur _Try-Catch_ terisolasi.

### 4. Atomic PnL Engine & Live Whale Rapor 🏆

Dashboard dan Notifikasi tidak hanya menampilkan angka mentah, tapi performa akurat.

- **Prisma Interactive Transaction:** Kalkulasi _Average Buy Price_, _Realized PnL_, dan _Winrate_ diproses secara _Atomic_. Mencegah _Race Condition_ saat paus melakukan banyak transaksi bersamaan.
- **Live Telegram Report:** Setiap _alert_ otomatis menampilkan akumulasi performa paus detik itu juga. Penghilang FOMO Buta agar _user_ tahu paus mana yang benar-benar _Smart Money_.

### 5. Smart Noise Reduction & Alpha Tagging 🛡️

Algoritma filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal.

- **Silent Database Recording:** Transaksi receh sekecil apapun (di atas $0.1) tetap dicatat di database Prisma secara _background_. Menjamin akurasi kalkulasi PnL, Win Rate, dan Total Trades di Dashboard tetap 100% presisi.
- **Anti-Spam Telegram:** Telegram hanya akan berbunyi untuk aksi _BUY_, atau aksi _SELL_ yang nilainya di atas **$50**. Mengabaikan _dusting_ atau buang koin receh.
- **Dynamic Alpha Status:** Otomatis mengubah _header_ notifikasi menjadi `👑 ALPHA PREDATOR ALERT!` untuk transaksi bernilai masif di atas **$1000**.

### 6. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot.
- **EVM:** Integrasi Explorer & DexScreener Chart.

### 7. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar. Berapapun usernya, data paus mereka dijamin tidak bocor ke tetangga.

### 8. Fully Automated Crypto Monetization & Enterprise Security 💳

Sistem monetisasi mandiri dengan arsitektur _Tiering_ dinamis (Scout, Predator, Apex Whale) dan keamanan tingkat tinggi:

- **Decentralized Checkout:** Pembayaran langganan bulanan langsung via MoonPay menggunakan kripto (USDC, SOL, dll) atau Kartu Kredit.
- **Anti-DDoS & Spam Protection:** Menggunakan _Rate Limiting_ berbasis **Upstash Redis** untuk melindungi sistem dari serangan _botnet_ yang melakukan _spam_ formulir pencarian target paus.
- **Enterprise-Grade Webhook Security:** Perlindungan "Anti-Fake Payment" menggunakan verifikasi kriptografi `HMAC-SHA256`. Webhook otomatis menolak _request_ palsu sebelum menyentuh _database_.
- **Telegram Gatekeeper & Secret Token:** Mengunci interaksi bot Telegram hanya untuk pengguna eksklusif yang telah mendaftar di web. Melindungi _endpoint_ webhook dari _request_ palsu menggunakan otentikasi header `x-telegram-bot-api-secret-token`.
- **Freemium Vendor Lock-in:** Akun tier `FREE` dikunci secara permanen pada 1 target pertama (Hard Lock). Mencegah eksploitasi hapus-tambah dompet dan memicu efek psikologis pengguna untuk melakukan _upgrade_.
- **Auto-Provisioning Webhook:** Pemrosesan otomatis status pembayaran dari MoonPay untuk _upgrade tier_ dan penambahan kuota _maxWallets_ secara instan.
- **Auto-Downgrade Lifecycle:** Menurunkan tier otomatis kembali ke _Free_ dan memotong limit jika _user_ berhenti berlangganan atau gagal bayar.
- **Hard Limit Enforcer:** Akses kontrol ketat di sisi _Server Actions_ yang memblokir penambahan dompet target jika _user_ sudah mencapai batas kuota dari _tier_ langganannya.
- **Owner God Mode:** Bypass akses khusus di level server yang memberikan kebebasan _unlimited_ penambahan target dompet bagi admin/owner tanpa terpengaruh sistem tiering.

### 9. Futures Sentiment & Market Direction (Coinglass) 📈

Validasi aksi Spot paus dengan data pasar derivatif secara _real-time_ untuk mengukur kekuatan momentum.

- **Open Interest (OI) Tracker:** Mengambil agregat dana yang berputar di pasar Futures untuk koin spesifik di seluruh _Centralized Exchange_ global.
- **Ultra-Fast In-Memory Cache:** Request API dilindungi oleh struktur data `Map` selama 5 menit untuk mencegah _rate-limit_ API habis dan menjaga kecepatan respon _webhook_ tetap di bawah 1 detik.
- **Graceful Degradation:** Jika paus membeli koin _micin_ baru yang belum terdaftar di pasar Futures, sistem akan mengabaikan _error_ secara senyap dan tetap memproses notifikasi keamanan _on-chain_ tanpa kendala.

### 10. AI-Powered Predictive Scoring (DeepSeek Integration) 🤖

Mengubah Tracker menjadi _Predictive Tool_ menggunakan analisis data on-chain berbasis kecerdasan buatan.

- **Real-Time AI Analyst:** Mengirimkan parameter kritis token (Likuiditas, Umur, dan Metrik Keamanan) ke model AI DeepSeek untuk mendapatkan _Confidence Score_ (0-100) dan wawasan (insight) instan.
- **Strict Format Prompting:** Algoritma sistem menggunakan _temperature_ rendah untuk memaksa output AI berformat JSON murni, mencegah halusinasi, dan memastikan konsistensi logika analisis.
- **Fail-Safe Mechanism:** Memiliki _fallback logic_ terisolasi yang memastikan notifikasi Telegram tetap berhasil terkirim tanpa mengganggu _runtime_ meskipun API penyedia AI sedang mengalami gangguan atau limitasi.

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

### 14. Global Smart Trends & AI Mindshare (Nansen + Kaito Engine) 🧠🔥

Mengkombinasikan agregasi data _on-chain_ dengan analisis sentimen AI lintas target paus untuk menemukan token yang sedang _hype_.

- **Global Whale Aggregator:** Melacak secara makro dan merangkum _Top 3_ token yang paling banyak diborong oleh _seluruh_ daftar target paus secara global dalam 24 jam terakhir (menggunakan fungsi _group-by_ pada tingkat _database_).
- **AI Narrative & Mindshare:** Ditenagai oleh Google Gemini 2.5 Flash API untuk menganalisis dan melabeli narasi sektor token (misal: RWA, AI Memecoin) sekaligus mengukur tingkat _hype_ di pasar (_Early Alpha_, _Hype Train_).
- **Smart Data Deduplication:** Sistem Caching khusus (`TokenIntel`) tertanam di PostgreSQL menggunakan Prisma untuk menyimpan ingatan AI. Melindungi sistem dari batas kuota (Rate Limit) API dengan memastikan AI hanya memproses _scanning_ satu kali per koin.

### 15. Technical Confluency AI Engine (Trend & Momentum) 📊

Menggabungkan data _On-Chain_ dengan Indikator Teknikal klasik untuk validasi sinyal (Confluency 2 dari 3).

- **Dynamic Indicator Calculation:** Menghitung pergerakan harga melalui Indikator EMA-50 dan RSI-14 secara _server-side_ menggunakan _library_ NodeJS tanpa bergantung pada API teknikal berbayar.
- **AI Logic Validation:** Model AI memvalidasi posisi harga terhadap EMA (Tren) dan nilai RSI (Momentum) berbarengan dengan transaksi _Whale_ untuk mencari probabilitas menang tertinggi.
- **Clean UI Badges & Alerts:** Mengonversi data teknikal rumit menjadi visual elegan (⚡ _Super Alpha_, ⚠️ _High Risk_, ⚖️ _Neutral_) di UI Dashboard Next.js dan pesan Telegram.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router / Serverless)
- **Authentication:** Clerk
- **Database:** Prisma ORM & PostgreSQL (Neon DB)
- **Rate Limiting/Cache:** Upstash Redis & In-Memory Map
- **Scanner Engine:** Helius RPC, Alchemy, DexScreener API, RugCheck API, Coinglass API, DeepSeek API, **Gemini 2.5 Flash API**
- **Payment Gateway:** MoonPay (Pay Links & Webhooks)
- **State Management:** Prisma `$transaction` (Atomic DB Locks)
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis).
- [x] Multi-Tenant Telegram Isolation (SaaS Ready).
- [x] Integrasi Detektif Anti-Mafia (Wallet Clustering Alert).
- [x] Telegram Injection: Live Whale PnL & Winrate Report.
- [x] Hybrid Architecture: Active Sweeper (GET) & Passive Webhook (POST).
- [x] Universal Native Balance (BTC/ETH/SOL) Tracker.
- [x] SaaS Monetization (MoonPay Checkout & Webhook Auto-Upgrade).
- [x] Tiering System & Wallet Limit Enforcer.
- [x] Auto-Downgrade Lifecycle & God Mode Privilege.
- [x] RugCheck Security API & Live Honeypot Detection.
- [x] Silent Data Recording (>$0.1) & Smart Telegram Filter (>$50).
- [x] Dynamic Alpha Alert Tagging (>$1000).
- [x] Freemium Vendor Lock-in & UI Smart Lock (Gembok Target).
- [x] MoonPay Webhook Security (HMAC-SHA256 Anti-Fake Payment).
- [x] Upstash Redis Rate Limiting (Anti-DDoS & Spam Protection).
- [x] Telegram Gatekeeper & Webhook Secret Token (Anti-Fake Request).
- [x] Coinglass Futures Sentiment (Open Interest) & Ultra-Fast In-Memory Caching.
- [x] AI-Powered Predictive Scoring & Real-time Insight (DeepSeek API).
- [x] Massive Exit Warning Alert & Database Schema Setup.
- [x] User Dashboard Tagging: Scalper vs Diamond Hands Status.
- [x] Shadowing Mode Database Setup.
- [x] Global Smart Trends Leaderboard & AI Mindshare Cache (Gemini API).
- [x] **Technical Confluency AI Engine (Trend & Momentum) & UI Badges.**
