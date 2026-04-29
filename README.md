# 🎯 Predator Tracker (SaaS Smart Money & Whale Watcher)

Sebuah arsitektur SaaS premium untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas Smart Money secara real-time lintas jaringan (BTC, ETH, SOL, BASE). Sistem ini dirancang untuk memberikan sinyal "Alpha" yang bersih, akurat, dan dapat dieksekusi dalam 1 klik, langsung dari Telegram pengguna.

---

## 🚀 Fitur Unggulan (Latest Update)

### 1. Historical Audit & "Machine Time" Scanner 🕰️

Fitur intelijen yang memungkinkan sistem mengetahui kualitas paus **sebelum** mulai memantaunya.

- **Auto-Audit on Registration:** Begitu dompet ditambahkan, sistem otomatis melakukan _sweeping_ 50-100 transaksi terakhir via Helius/RPC.
- **Instant Reputation:** Menghitung _Win Rate_ masa lalu secara instan sehingga tidak ada lagi dompet "Zonk" di radar.
- **Background Async Processing:** Proses audit berjalan di _background layer_ untuk memastikan pengalaman UI tetap cepat tanpa _loading_ lama.

### 2. "Satpam $500" - Enterprise Noise Reduction 🛡️

Filter cerdas untuk menjaga ketenangan pikiran dan kualitas sinyal Alpha.

- **Threshold-Based Alerts:** Telegram hanya akan berbunyi jika nilai transaksi berada di atas **$500** (default) atau sesuai pengaturan user.
- **Anti-Spam Logic:** Mengabaikan transaksi debu, _airdrop_ sampah, atau sekadar pembayaran _gas fee_ yang biasanya mengganggu bot pelacak biasa.
- **Native & Token Filter:** Berlaku untuk pergerakan saldo koin utama (SOL/ETH/BTC) maupun koin micin di ekosistem DEX.

### 3. Smart Heuristic PnL Engine V2 📊

Dashboard tidak hanya menampilkan angka, tapi visualisasi performa yang hidup.

- **Token Movement Tracking:** Mendeteksi setiap mutasi koin micin (In/Out) menggunakan logika _Smart Heuristic_.
- **Visual PnL Chart:** Mengonversi data mentah transaksi menjadi grafik performa yang intuitif.
- **Dynamic Labeling:** Gelar paus (Oracle, Grinder, Exit Liquidity) otomatis diperbarui berdasarkan performa _real-time_.

### 4. Multi-Tenant Data Isolation (SaaS Ready) 🔐

- **Isolated Mapping:** Notifikasi dikirimkan tepat sasaran ke `chatId` masing-masing pemilik radar.
- **Database Unique Constraint:** Keamanan data tingkat tinggi pada kombinasi `[address, network, userId]`.

### 5. 1-Click Execution Terminal ⚡

- **Solana:** Integrasi Jupiter DEX & BonkBot.
- **EVM:** Integrasi Uniswap & Maestro Sniper.
- **Social Intel:** Tombol khusus untuk cek tren komunitas koin di X (Twitter) secara langsung.

### 6. Detektif Anti-Mafia (Wallet Clustering & Rugpull Scanner) 🕵️‍♂️

Sistem keamanan preventif untuk melindungi _user_ dari jebakan _developer_ nakal.

- **Deteksi "Raja Boneka" (Solana Native):** Memeriksa persentase kepemilikan _Top 10 Holders_ secara _real-time_ via Helius RPC untuk mendeteksi _Insider Trading_ atau potensi _Dev Dump_.
- **Cek Kunci Brankas (LP Check):** Peringatan otomatis di Telegram jika _Liquidity Pool_ koin incaran berada di zona bahaya (_High Risk_ < $10k).

### 7. Live Whale Rapor (Real-Time PnL & Winrate) 🏆

- **Integrasi Langsung ke Telegram:** Setiap _alert_ transaksi jual/beli akan langsung menampilkan akumulasi performa paus detik itu juga (_Winrate %_ dan _Total Realized PnL_).
- **Penghilang FOMO Buta:** _User_ tahu pasti dan memiliki bukti data apakah paus yang mereka ikuti adalah pemenang sejati (_Smart Money_) atau sekadar penjudi yang membuang uang.

---

## 🏗️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router)
- **Database:** Prisma ORM & PostgreSQL (Neon DB)
- **Scanner Engine:** Helius Enriched API, DexScreener API (Pricing)
- **Bot Infrastructure:** Telegram Bot API (Inline Keyboards & Markdown)

---

## 🗺️ Roadmap (Completed)

- [x] Historical Scanner (Audit Masa Lalu Otomatis).
- [x] Satpam Filter $500 (Noise Reduction).
- [x] Smart Heuristic V2 (Detect Unknown Token Transfers).
- [x] PnL Chart & Dynamic Whale Reputation.
- [x] Multi-Tenant Telegram Isolation (SaaS Ready).
- [x] **Integrasi Detektif Anti-Mafia (Wallet Clustering Alert).**
- [x] **Telegram Injection: Live Whale PnL & Winrate Report.**
