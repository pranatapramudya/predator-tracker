# 🎯 Predator Tracker (Smart Money & Whale Watcher)

Aplikasi SaaS untuk melacak pergerakan dompet kripto raksasa (Whales) dan mendeteksi aktivitas _Smart Money_ secara _real-time_ lintas jaringan (BTC, ETH, SOL, BASE).

## 🚀 Fitur Saat Ini (Status Terkini)

Sistem ini sudah memiliki kapabilitas analitik otomatis yang berjalan 24/7:

### 1. Multi-Network Balance Tracker

Memantau perubahan saldo utama (Native Coin) secara akurat:

- **Bitcoin (BTC):** Menggunakan mesin Blockchain.info & Mempool.space.
- **Solana (SOL):** Menggunakan Helius RPC.
- **Ethereum (ETH) & Base:** Menggunakan RPC Ankr (Anti-Block Vercel).

### 2. Smart Money Tracker (Swap & Token)

Melacak aktivitas transaksi spesifik (bukan cuma saldo):

- **Solana Swaps:** Deteksi Jual/Beli koin micin via _Helius Enriched API_. Notifikasi otomatis diterjemahkan (Contoh: "Swapped 10 SOL for 5000 WIF").
- **EVM ERC-20 Transfers:** Memantau pergerakan token di jaringan Ethereum dan Base menggunakan Etherscan/Basescan API.

### 3. Autopilot Webhook & Telegram Alerts

- **Bypass Cron Limit:** Menggunakan UptimeRobot untuk mentrigger `/api/webhook` setiap 5 menit (Solusi Hobby Plan Vercel).
- **Anti-False Alarm:** Sistem dilengkapi _fail-safe_ yang otomatis men-skip pengecekan jika API sedang limit, mencegah notif palsu "Saldo 0".

---

## 🛠️ Cara Kerja Sistem

1. **Input:** User memasukkan alamat via Web UI.
2. **Radar:** UptimeRobot memanggil webhook setiap 5 menit.
3. **Analisis:** Sistem membandingkan saldo lama vs baru, dan mengecek signature transaksi terbaru di database agar tidak ada notifikasi ganda (Deduplication).

---

## 🗺️ Roadmap Selanjutnya

- [ ] PNL Tracker (Hitung Profit/Loss Paus).
- [ ] Multi-user Authentication (Watchlist per User).
- [ ] Custom Threshold (Notif hanya jika transaksi > $10,000).
