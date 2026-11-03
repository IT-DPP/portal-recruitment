# Strategi Testing, Rencana Deployment, Rollback, & Knowledge Transfer

Dokumen ini memuat panduan pengujian kualitas (QA), arsitektur deployment ke VM Azure Non-Odoo, prosedur backup/restore, rencana rollback, serta daftar pertanyaan *Knowledge Transfer* (KT) dengan developer.

---

## 1. Strategi Testing & Quality Gate

Sesuai Definition of Done (§10 Brief), setiap perubahan wajib melewati berlapis pengujian berikut:

### 1.1 Static Analysis (Setiap Commit)
- **Type Check:** `npx tsc --noEmit` (memastikan tidak ada ketidakcocokan tipe pada skema Prisma dan komponen).
- **Linter:** `npm run lint` (ESLint 9 + `eslint-config-next` 16.2.12).

### 1.2 Unit & Integration Testing (Vitest)
Fokus pengujian unit pada fungsi berisiko tinggi:
1. **Auth & RBAC Guards (`lib/auth-guard.test.ts`):** Memastikan akses tanpa session atau dengan role yang salah (`CANDIDATE` mengakses action `ADMIN`/`RECRUITER`) selalu ditolak.
2. **Feature Flag Gate (`lib/feature-flags.test.ts`):** Memastikan rute `/candidate/*` dan `/jobs/*` terblokir saat flag `false` dan terbuka saat `true`.
3. **File Access & Upload Validation (`lib/storage-guard.test.ts`):** Memastikan IDOR pada `/api/file` tertolak, tipe file selain PDF/JPG/PNG ditolak, dan ukuran $>5\text{ MB}$ ditolak.
4. **Excel Validator & Deduplication:** Memastikan duplikasi NIK/Email dan format tidak valid tertangkap sebelum masuk database.

### 1.3 End-to-End (E2E) Testing (Playwright)
Skenario alur kritis untuk UAT otomatis:
1. **Skenario Keamanan Negatif:** Akses anonim ke `/dashboard`, `POST /api/users`, dan `/api/file?key=test` harus gagal (`401/403` atau redirect `/login`).
2. **Skenario User Management:** Super Admin login $\rightarrow$ buat akun Recruiter baru $\rightarrow$ reset password Recruiter $\rightarrow$ login menggunakan akun Recruiter tersebut.
3. **Skenario Operasional Rekrutmen:** Buat Master Customer & Site $\rightarrow$ Buat Job Opening baru $\rightarrow$ Tambah Kandidat $\rightarrow$ Pindahkan kandidat melewati tahapan pipeline $\rightarrow$ Generate dokumen.

---

## 2. Rencana Deployment ke VM Azure Non-Odoo

### 2.1 Prasyarat Inspeksi VM (Read-Only Check)
Sebelum melakukan konfigurasi di VM Non-Odoo, jalankan perintah *read-only* berikut melalui SSH untuk memetakan kapasitas dan menghindari konflik dengan proyek web/mobile lain:

```bash
# 1. Cek OS, CPU, RAM, Swap, dan Disk
cat /etc/os-release | head -4; uname -r; nproc; free -h; swapon --show
df -hT -x tmpfs -x devtmpfs; uptime

# 2. Cek Container yang sedang berjalan & pemakaian resource-nya
docker version --format 'Server: {{.Server.Version}}'; docker compose version
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'

# 3. Cek Port yang sedang dipakai & Reverse Proxy (Nginx/Caddy/Apache)
sudo ss -tlnp
which nginx caddy apache2 2>/dev/null
ls /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null
```

### 2.2 Arsitektur Container di VM Non-Odoo (Staging & Production)
Sesuai arahan IT Leader, selama tahap awal masih menggunakan `docker compose up -d --build` di VM, konfigurasi Compose produksi akan dirancang dengan pengaman berikut:
1. **Bind Port Lokal Saja:**
   - App Production: `127.0.0.1:3010:3000` (diteruskan oleh Nginx/Caddy dari `https://portal.dpp.co.id`).
   - App Staging: `127.0.0.1:3011:3000` (diteruskan oleh Nginx/Caddy dari `https://portal-staging.dpp.co.id`).
   - Database PostgreSQL Prod & Staging: berada di jaringan internal Docker (`127.0.0.1` saja bila perlu akses lokal), **tidak** diekspos ke `0.0.0.0`.
2. **Tanpa Container MinIO di VM:** Karena staging dan production menggunakan Cloudflare R2, container MinIO hanya diaktifkan pada mode development lokal (menggunakan Docker Compose profile `local` atau file override), sehingga menghemat RAM dan disk di VM.
3. **Health Check Endpoint:** Menyediakan `GET /api/health` yang memeriksa konektivitas database (`SELECT 1`) dan mengembalikan HTTP `200 OK` untuk dipantau oleh Docker `healthcheck` serta uptime monitor.

### 2.3 Alur Eksekusi Deploy di VM (Tahap Awal)
```bash
# 1. Masuk ke direktori environment (mis. staging atau production)
cd /opt/dpp/recruitment-portal-prod

# 2. Backup database otomatis sebelum update
./scripts/backup-db.sh

# 3. Tarik kode terbaru (fast-forward only)
git pull --ff-only origin main

# 4. Build & jalankan container
docker compose -p dpp-portal-prod -f docker-compose.prod.yml up -d --build

# 5. Jalankan migrasi skema Prisma secara aman (tanpa reset!)
docker compose -p dpp-portal-prod -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 6. Verifikasi status & health check
docker compose -p dpp-portal-prod -f docker-compose.prod.yml ps
curl -fsS http://127.0.0.1:3010/api/health
```

---

## 3. Strategi Backup, Restore Drill, dan Rollback Plan

### 3.1 Strategi Backup Database (Wajib Diuji)
- **Jadwal:** Cron harian setiap pukul `01:00 WIB` + eksekusi otomatis setiap kali sebelum deployment.
- **Metode:** `docker exec <db_container> pg_dump -U $POSTGRES_USER -Fc $POSTGRES_DB | gzip > backup_YYYYMMDD_HHMM.dump.gz`.
- **Retensi:** 7 backup harian + 4 backup mingguan + 3 backup bulanan; salinan terenkripsi diunggah ke folder/bucket backup terpisah di Cloudflare R2.
- **Restore Drill (Wajib di Fase 6 sebelum Go-Live):** Mengembalikan file `.dump` hasil backup ke database Staging dan memverifikasi integritas data melalui UI.

### 3.2 Prosedur Rollback (Jika Terjadi Kegagalan Saat Deploy)
1. **Rollback Aplikasi (< 2 Menit):**
   - Catat commit SHA stabil sebelum pull (`PREV_SHA=$(git rev-parse HEAD)`).
   - Jika rilis baru bermasalah:
     ```bash
     git checkout $PREV_SHA
     docker compose -p dpp-portal-prod -f docker-compose.prod.yml up -d --build
     ```
   - *(Catatan: Setelah transisi ke GHCR di Tahap 2 nanti, rollback menjadi `< 15 detik` hanya dengan mengganti `IMAGE_TAG` ke SHA sebelumnya lalu `docker compose up -d`).*
2. **Rollback Database (Jika Migrasi Bermasalah):**
   - Semua migrasi di Fase 2–6 dirancang **backward-compatible** (penambahan tabel/kolom opsional, bukan penghapusan kolom).
   - Jika diperlukan pemulihan penuh, jalankan `pg_restore --clean` dari file dump pra-deploy yang dibuat pada Langkah 2.

---

## 4. Checklist Knowledge Transfer (KT) dengan Developer Minggu Ini

Daftar pertanyaan terstruktur ini disiapkan untuk membantu Anda sebagai IT Leader saat sesi *sharing knowledge* dengan developer pembuat prototipe minggu ini:

### A. Alur Bisnis & Fitur yang Sedang Dikerjakan
1. Fitur apa yang saat ini **masih setengah jalan (WIP)** atau belum di-push ke branch `main` setelah commit `2d95345` (`improving chat on candidate dashboard`)?
2. Pada **10 tahapan pipeline** (`stage_1` CV Screening s/d `stage_10` PKWT), apakah seluruh data spesifik per tahap disimpan di kolom JSON `Application.stageData`, dan bagaimana struktur JSON di masing-masing tahap tersebut?
3. Bagaimana alur kerja fitur **Generate Documents** (`GenerateDocumentsClient.tsx` & `lib/document-generator.ts`) untuk Offering Letter, Surat Pengantar MCU, dan BAST? Apakah ada template dari HR/Klien yang masih belum final?
4. Mengapa di beberapa tempat foto/dokumen disimpan sebagai `base64` (`filePhoto.base64` / `public/uploads`) sementara di profil kandidat menggunakan S3/R2 (`lib/s3.ts`)? Apakah ada kendala saat mengintegrasikan S3/R2 di halaman tersebut?

### B. Environment, Storage (R2), & Kredensial
5. Di akun Cloudflare siapa bucket **R2** saat ini dibuat? Apa konfigurasi CORS yang dipasang pada bucket R2 agar browser bisa melakukan `PUT` langsung ke *presigned URL*?
6. Apakah ada variabel di file `.env` lokal developer yang **belum tertulis** di `.env.example` (misalnya `NEXT_PUBLIC_S3_ENDPOINT` yang terlihat dipanggil di `verify/[candidateId]/page.tsx`)?
7. Apakah Google OAuth (`GOOGLE_CLIENT_ID`) memang direncanakan untuk dipakai kandidat/staf, atau hanya sisa eksperimen awal?

### C. Database & Seeding
8. Untuk go-live dari kondisi database kosong, apakah cukup menjalankan `npx prisma migrate deploy` diikuti `npm run db:seed:essential`? Apakah data di `seed-essential.ts` (seperti daftar Customer Astra/Telkom/Mandiri/UT dan daftar posisi) adalah contoh dummy atau data master asli DPP?

