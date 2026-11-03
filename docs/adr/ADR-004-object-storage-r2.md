# ADR-004: Arsitektur Penyimpanan Dokumen (Cloudflare R2 & Penghapusan Upload Lokal)

- **Status:** Accepted
- **Tanggal:** 2026-11-03
- **Pengambil Keputusan:** IT Leader, Solution Architect

## 1. Konteks
Hasil audit Fase 0 terhadap kode prototipe menunjukkan adanya **dua mekanisme penyimpanan file yang berjalan bersamaan**:
1. **S3-Compatible Object Storage (`lib/s3.ts`):** Menggunakan `@aws-sdk/client-s3` dan `@aws-sdk/s3-request-presigner` untuk membuat *presigned upload/download URL*. Proyek telah diarahkan untuk menggunakan **Cloudflare R2** pada environment server, dan **MinIO** pada `docker-compose.yml` lokal.
2. **Local Filesystem Upload (`app/actions/upload.ts`) & Base64 di DB:** Menulis file langsung ke `public/uploads/` di dalam web root dan menyimpan sebagian foto sebagai string base64 di kolom JSON database.

Menulis file ke `public/uploads/` di dalam Docker container menimbulkan dua masalah besar:
- **Keamanan (R3):** File berada di web root publik tanpa pemeriksaan autentikasi dan tanpa validasi *magic bytes*.
- **Kehilangan Data Operasional:** Setiap kali `docker compose up -d --build` dijalankan untuk pembaruan aplikasi, container aplikasi dibuat ulang sehingga file di dalam filesystem container yang tidak di-mount akan hilang.

## 2. Opsi yang Dipertimbangkan

### Opsi A: Menyimpan Semua File di Disk Lokal VM (Bind Mount)
- **Kekurangan:** Membebani disk VM yang dipakai bersama proyek lain dan menyulitkan backup/migrasi server.

### Opsi B: Menyatukan Seluruh Penyimpanan Dokumen ke S3-Compatible Storage (Cloudflare R2 untuk Staging/Prod, MinIO Opsional untuk Dev Lokal)
- **Kelebihan:**
  - Kode `lib/s3.ts` sudah mendukung R2 sepenuhnya hanya melalui konfigurasi `.env` (`S3_ENDPOINT`, `S3_REGION=auto`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`).
  - Tidak membebani disk maupun bandwidth VM Azure karena upload/download file menggunakan *presigned URL* langsung ke R2.
  - Biaya sangat rendah (Cloudflare R2 memiliki *free tier* 10 GB/bulan dan US\$0,015/GB setelahnya, tanpa biaya egress).

## 3. Keputusan
Memilih **Opsi B** dengan langkah pengamanan (dieksekusi di Fase 2/3 pasca-KT):
1. Menggunakan **Cloudflare R2** dengan bucket terpisah antara Staging (`dpp-recruitment-staging`) dan Production (`dpp-recruitment-prod`).
2. Bucket wajib diset **Private** (tidak boleh *public anonymous access*).
3. Menghapus fungsi `ensureBucketExists()` otomatis di runtime agar kredensial aplikasi cukup menggunakan token dengan izin **Object Read & Write** pada bucket terkait saja (*least privilege*).
4. Menutup celah **IDOR pada `/api/file`**: sebelum membuat *presigned download URL*, server wajib memverifikasi bahwa pemanggil adalah staf internal yang berwenang (`ADMIN`/`RECRUITER`/dsb.) atau kandidat pemilik sah dokumen tersebut.
5. Membatasi tipe file (`application/pdf`, `image/jpeg`, `image/png`) dan ukuran maksimal (mis. 5 MB), serta menghentikan penggunaan `public/uploads/` untuk dokumen kandidat.

## 4. Konsekuensi
- **Positif:** Container Next.js menjadi sepenuhnya *stateless*; proses `docker compose up -d --build` aman dilakukan kapan saja tanpa risiko kehilangan dokumen kandidat.
- **Catatan Kepatuhan (UU PDP):** Saat transfer aset ke organisasi DPP, akun Cloudflare R2 harus berada di bawah kendali resmi PT Dian Pandu Pratama dengan *location hint* Asia-Pacific (APAC).

