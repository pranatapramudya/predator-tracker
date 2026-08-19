# Product Requirements Document: PREDATOR TRACKER
**Versi:** 0.0.1
**Fokus:** Vercel CPU Leak Audit & Massive Query Refactoring

## 1. Analisis Masalah (Kedaruratan Server)
Berdasarkan data Vercel Observability, proyek `predator-tracker` saat ini mengonsumsi nyaris 1 jam dari total *Fluid Active CPU* (38.7% dari total limit). Mengingat sifat aplikasi ini adalah *tracker* (pelacakan), terindikasi kuat adanya kebocoran performa pada proses pengambilan data massal atau frekuensi pemanggilan API yang tidak teroptimasi.

## 2. Instruksi Eksekusi (Blind Audit & Optimization)
**Tugas Anda (KERJAKAN TANPA MENAMPILKAN CONTOH KODE, LANGSUNG LAKUKAN AUDIT DAN BERIKAN LAPORANNYA):**

**A. Audit Route API Polling & Realtime:**
1. Lakukan pencarian global (*global search*) pada direktori `app/api/` untuk *route* yang sering di- *hit* oleh klien (misalnya API untuk update lokasi, get koordinat terbaru, atau sinkronisasi data).
2. Jika ada *route* yang menarik data koordinat/histori tanpa limitasi, Anda **WAJIB** menambahkan *pagination* (`take` / `skip` / `cursor`) atau membatasi *query* hanya untuk 24 jam terakhir.

**B. Eliminasi In-Memory Computation & N+1 Problem:**
1. Cari semua penggunaan fungsi `.findMany()` dari ORM (Prisma/Drizzle) yang hasilnya dimanipulasi menggunakan `.map()`, `.filter()`, atau `.reduce()` di dalam *Javascript/Typescript*.
2. Jika Anda menemukan logika perhitungan jarak, agregasi status, atau *grouping* data di sisi Vercel (Node.js), segera ubah logika tersebut menjadi *Database-level Query* (gunakan `aggregate`, `groupBy`, atau *raw SQL* untuk *PostGIS/Geospatial query* jika menggunakan koordinat).
3. Pastikan tidak ada *query database* di dalam *looping* (N+1 Problem).

**C. Caching Strategy:**
1. Untuk *endpoint* publik atau *dashboard* yang menampilkan data statis (yang tidak berubah setiap detik), implementasikan standard Next.js *Route Segment Config* (seperti `export const revalidate = 60;`) agar Vercel melakukan *caching* dan tidak menghajar *database* pada setiap *request*.

Silakan bongkar seluruh *codebase* API *route* aplikasi ini! Laporkan kepada saya rute mana saja yang menjadi tersangka utama (tersedot CPU tertinggi) beserta strategi *refactor* yang akan Anda terapkan ke *database engine*!