# Project Log — DPP Recruitment Portal Dashboard

Dokumen ini mencatat riwayat kronologis pengerjaan proyek, keputusan penting, temuan teknis, masalah, dan solusinya sebagai jejak audit serta dokumentasi portfolio IT Leader.

---

## 2026-11-03 — Fase 0: Discovery & Audit Awal Codebase

### Apa yang dikerjakan
1. **Audit inventaris workspace (read-only):**
   - Menemukan prototipe aplikasi rekrutmen berbasis **Next.js 16.2.12 + React 19 + Prisma 5.15 + PostgreSQL + NextAuth v4 + AWS SDK S3/MinIO** (~25.700+ baris kode awal, bertambah setelah pull).
   - Mengidentifikasi bahwa folder lokal belum terinisialisasi Git namun identik 100% dengan commit `7995845` pada repository remote `https://github.com/fahruulc/recruitment-portal-dashboard.git`.
2. **Sinkronisasi Git secara aman:**
   - Menginisialisasi Git lokal pada branch `main`, menghubungkan `origin` ke repo developer, memverifikasi kesamaan tree, dan menjalankan `git pull --ff-only origin main` hingga commit terbaru `2d95345` (2 Nov 2026).
   - Menemukan tambahan fitur di commit terbaru: migrasi Prisma awal (`20261023065130_init`, `20261023071104_add_master_clinic`), fitur chat kandidat (`ApplicationMessageFeed`), kartu aksi MCU & Offering, dan generator dokumen BAST/Offering/MCU.
3. **Security & Architecture Spot-Check:**
   - Mengidentifikasi 13 risiko awal (4 Kritis, 4 Tinggi, 5 Sedang), terutama endpoint manajemen user tanpa autentikasi (`R1`), server actions tanpa pemeriksaan session/role (`R2`), duplikasi mekanisme upload antara S3/R2 dan `public/uploads` (`R3`), serta IDOR pada `/api/file` (`R4`).

### Keputusan yang diambil (oleh IT Leader)
1. **Strategi Eksekusi:** Brownfield — melanjutkan dan memperkuat (*hardening*) prototipe yang ada, bukan membangun ulang dari nol (lihat [ADR-001](adr/ADR-001-brownfield-hardening-strategy.md)).
2. **Freeze Struktur Sebelum Knowledge Transfer:** Tidak merombak struktur kode/schema yang sedang berjalan sebelum sesi *knowledge transfer* (KT) dengan developer pembuat prototipe minggu ini selesai.
3. **Feature Flagging:** Menyembunyikan Portal Kandidat (`/candidate/*`) dan halaman lowongan publik (`/jobs/*`) pada environment Staging/Production menggunakan feature flag sampai keamanannya siap, tetapi tetap membukanya di environment development lokal.
4. **Autentikasi & User Management:** Menggunakan login Email + Password (tanpa MFA untuk saat ini) dengan manajemen user oleh Super Admin (ubah data & reset password).
5. **Data Awal:** Dimulai dari kosong (*clean slate*) saat go-live. Tidak diperlukan migrasi data kandidat historis dari spreadsheet lama.
6. **Kapasitas & Target Pengguna:** $\le 30$ pengguna internal, $\le 20$ pengguna bersamaan (*concurrent*).
7. **Deployment & Repo:**
   - Sementara tetap di repo developer (`fahruulc/recruitment-portal-dashboard`) dan menggunakan `docker compose up -d --build` langsung di VM non-Odoo sampai aplikasi stabil 100%.
   - Setelah pengembangan selesai 100% dan berjalan stabil, repo akan ditransfer ke GitHub Organization resmi DPP (`https://github.com/IT-DPP`) dan build image dipindahkan ke GitHub Actions + GHCR.
   - Subdomain menggunakan `portal.dpp.co.id` (Production) dan `portal-staging.dpp.co.id` (Staging) melalui DNS cPanel.
   - Object storage di environment cloud diarahkan ke Cloudflare R2 (kompatibel S3 lewat `lib/s3.ts`).

### Masalah & Solusi
- **Masalah:** Direktori kerja lokal belum memiliki folder `.git`, sehingga `git pull` biasa berisiko menimpa file.
- **Solusi:** Melakukan `git init`, `git fetch`, dan membandingkan *hash tree* lokal terhadap seluruh riwayat commit remote. Ditemukan kecocokan 100% pada commit `7995845`, sehingga `git update-ref` + `git pull --ff-only` dapat dijalankan tanpa kehilangan satu byte pun.

---

## 2026-11-03 — Fase 1: Planning & Dokumentasi Arsitektur

### Apa yang dikerjakan
1. Membuat branch lokal `docs/phase-1` (tanpa push ke remote sesuai instruksi).
2. Menyusun paket dokumen perencanaan Fase 1 dan dokumentasi portfolio (§9 & §11):
   - [`docs/PRD.md`](PRD.md): Product Requirements Document, definisi KPI, matriks RBAC, user stories & acceptance criteria, serta gap analysis prototipe vs target MVP.
   - [`docs/ARCHITECTURE.md`](ARCHITECTURE.md): Arsitektur sistem, topologi deployment, alur autentikasi & storage, ERD saat ini vs target, dan desain feature flag.
   - [`docs/RISK_REGISTER.md`](RISK_REGISTER.md): Daftar risiko keamanan, kepatuhan UU PDP, operasional VM bersama, dan rencana mitigasinya.
   - [`docs/ESTIMATION_AND_COST.md`](ESTIMATION_AND_COST.md): Estimasi effort, perbandingan OPEX/CAPEX (VM existing vs Azure Managed Services), dan backlog per sprint.
   - [`docs/TESTING_AND_DEPLOYMENT.md`](TESTING_AND_DEPLOYMENT.md): Strategi testing (Vitest + Playwright), rencana deployment bertahap, backup/restore drill, rollback plan, dan checklist KT developer + inspeksi VM.
   - [`docs/PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md) & [`CHANGELOG.md`](../CHANGELOG.md).
   - 6 dokumen ADR di [`docs/adr/`](adr/).

### Status
Disetujui oleh IT Leader untuk lanjut ke Fase 2 dengan informasi tambahan inventaris container yang berjalan di VM Non-Odoo.

---

## 2026-11-03 — Fase 2: Foundation, Security Stop-the-Bleed & Docker Readiness

### Konteks Tambahan dari VM Non-Odoo
Dari hasil inventaris container aktif di VM yang dibagikan IT Leader:
- Port yang **sudah terpakai** oleh proyek lain: `3000` (`crm-frontend-1`), `3001` (`be_dashboard_app`), `4000` (`be_ehs_app`), `5000` (`crm-backend-1`), `5005` (`be_dashboard_face_verification`), `5432` (`be_ehs_db`), `5433` (`be_dashboard_db`), `6379` (`be_dashboard_redis`), `3306` (`db` MySQL), `8010` (`dashboard_app`), `8060` (`fe_ehs`).
- Artinya port default `3000` dan `5433` pada prototipe awal **pasti bentrok** jika dijalankan di VM.

### Apa yang dikerjakan
1. **Kepatuhan Next.js 16 (`AGENTS.md`):**
   - Menginstal dependency lokal dan memeriksa dokumentasi resmi di `node_modules/next/dist/docs/` (`version-16.md`, `proxy.md`, `output.md`, `15-route-handlers.md`).
2. **Security Stop-the-Bleed (Menutup R-01, R-02, R-03, R-04, R-07 tanpa merombak struktur developer):**
   - Membuat [`lib/feature-flags.ts`](../lib/feature-flags.ts) (`isCandidatePortalEnabled`, `isPublicJobsEnabled`) — default `true` di lokal, `false` di Docker/Staging/Prod.
   - Membuat [`lib/auth-guard.ts`](../lib/auth-guard.ts) (`requireRole`, `requireStaffSession`, `requireAdminSession`, `isObjectKeyOwnedByUser`, `validateUploadMetadata`).
   - Mengamankan [`app/api/users/route.ts`](../app/api/users/route.ts) dan [`app/api/users/[id]/route.ts`](../app/api/users/%5Bid%5D/route.ts) dengan `requireAdminSession()`, validasi password $\ge 8$ karakter (`bcrypt` cost 12), dan proteksi anti-self-delete/demote (**R-01 Resolved**).
   - Mengamankan seluruh Server Actions internal di `dashboard.ts`, `document.ts`, `master-data.ts`, `job.ts`, `upload.ts`, dan `candidate-profile.ts` (**R-02 & R-03 Mitigated**).
   - Menutup celah IDOR pada [`app/api/file/route.ts`](../app/api/file/route.ts) dengan pemeriksaan kepemilikan dokumen kandidat (**R-04 Resolved**).
   - Memperbarui [`middleware.ts`](../middleware.ts) dan [`app/api/auth/register/route.ts`](../app/api/auth/register/route.ts) untuk menghormati *feature flag* (**R-07 Resolved**).
3. **Docker, Port Non-Konflik (`3020` / `5435`), & Healthcheck:**
   - Menambahkan `output: "standalone"` di [`next.config.ts`](../next.config.ts) (**R-11 Resolved**).
   - Menyelaraskan [`Dockerfile`](../Dockerfile) dengan standar proyek DPP lainnya di VM (`node:20-slim`, `openssl libssl3 ca-certificates curl`, `PORT=3020`, `EXPOSE 3020`, `HEALTHCHECK` ke `/api/health`, serta menyertakan Prisma schema & client).
   - Menambahkan endpoint [`app/api/health/route.ts`](../app/api/health/route.ts) (`SELECT 1` ke PostgreSQL).
   - Memperbarui [`docker-compose.yml`](../docker-compose.yml) agar memakai port `3020:3020` untuk `app` dan `127.0.0.1:5435:5432` untuk `db` (**R-13 Resolved**), menghapus `mc anonymous set public`, dan memindahkan MinIO ke profile opsional `local-minio`.
4. **Testing & CI Pipeline Dasar:**
   - Menulis unit test keamanan di [`lib/__tests__/security-foundation.test.ts`](../lib/__tests__/security-foundation.test.ts) (4/4 test PASS) dan workflow CI [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
   - Verifikasi `npx tsc --noEmit` lulus dengan **0 error**.

### Status
Disetujui oleh IT Leader, dipisahkan ke branch lokal `docs/phase-1` dan `feat/phase-2-foundation`, serta dilanjutkan ke Fase 3 di branch baru `feat/phase-3-mvp`.

---

## 2026-11-03 — Fase 3: MVP Polish, Audit Log (UU PDP), Rate Limiting & Konsolidasi Storage R2

### Apa yang dikerjakan
1. **Sistem Audit Log & Kepatuhan UU PDP (`R-09` Resolved):**
   - Menambahkan model `AuditLog` secara *non-breaking* di [`prisma/schema.prisma`](../prisma/schema.prisma) beserta migrasi SQL [`prisma/migrations/20261103043000_add_audit_log/migration.sql`](../prisma/migrations/20261103043000_add_audit_log/migration.sql).
   - Membuat service [`lib/audit-log.ts`](../lib/audit-log.ts) dengan sanitasi otomatis field rahasia (`password`, `token`, `secret` $\rightarrow$ `[REDACTED]`).
   - Mencatat jejak audit otomatis untuk login sukses/gagal/rate-limited, pembuatan/update/reset password/penghapusan user, pembuatan Job Order, perpindahan tahap pipeline, blacklist kandidat, serta upload/akses dokumen.
   - Membuat endpoint [`app/api/audit-logs/route.ts`](../app/api/audit-logs/route.ts) dan halaman UI [`app/dashboard/settings/audit-logs/page.tsx`](../app/dashboard/settings/audit-logs/page.tsx) lengkap dengan filter & **Export CSV**, serta menambahkannya ke menu Settings di [`components/layout/Sidebar.tsx`](../components/layout/Sidebar.tsx).
2. **Penyatuan Storage ke Cloudflare R2 (`ADR-004` & `R-03`/`S-04` Resolved):**
   - Memperbarui [`lib/s3.ts`](../lib/s3.ts) agar mendukung token R2 *least-privilege* (tidak memanggil `CreateBucketCommand` di endpoint Cloudflare R2) dan menambahkan `uploadBufferToS3` serta `isS3Configured`.
   - Memperbarui [`app/actions/upload.ts`](../app/actions/upload.ts) agar setiap pemanggilan `uploadBase64File` otomatis menyimpan objek ke Cloudflare R2/S3 dan mengembalikan URL terproteksi `/api/file?key=...` saat S3/R2 terkonfigurasi.
3. **Penyempurnaan User Management & Proteksi Brute-Force (`ADR-003` & `R-06` Mitigated):**
   - Membuat rate limiter [`lib/rate-limit.ts`](../lib/rate-limit.ts) dan memasangnya di [`lib/auth.ts`](../lib/auth.ts) (maksimal 5 percobaan login gagal per 15 menit per email).
   - Menyempurnakan [`app/dashboard/settings/users/page.tsx`](../app/dashboard/settings/users/page.tsx) dan [`app/api/users/[id]/route.ts`](../app/api/users/%5Bid%5D/route.ts) agar Super Admin dapat mengubah nama, email, departemen, role, serta me-reset password user dengan validasi minimal 8 karakter.
4. **Verifikasi & Unit Testing:**
   - Menambahkan unit test rate limiter dan sanitizer audit log di [`lib/__tests__/security-foundation.test.ts`](../lib/__tests__/security-foundation.test.ts) (**6/6 PASS**) dan verifikasi `npx tsc --noEmit` (**0 error**).

### Status
Disetujui oleh IT Leader. Aplikasi telah berhasil diverifikasi di lokal (PostgreSQL lokal + Google OAuth + Cloudflare R2 `portal-recruitment`) dan berhasil di-deploy secara live di VM Azure Non-Odoo pada domain **`https://recruitment.dpp.co.id`** (dilengkapi DNS A Record cPanel, Nginx Reverse Proxy, dan sertifikat SSL Let's Encrypt/Certbot).

---

## 2026-11-13 — Revamp Opsi B: Fase 1 (Security & Dependency Hardening)

### Aktivitas
1. **Penyusunan Audit Komprehensif (9 Dokumen di `docs/audit/`):**
   - Menganalisis seluruh 40.845 baris kode dari perspektif Principal Engineer, UX Auditor, Security Reviewer, dan Business Analyst.
   - Mengidentifikasi celah keamanan kritis pada 6 Server Action dan pelanggaran data medis spesifik MCU di bawah UU PDP No. 27/2022.
   - IT Leader secara formal memilih dan menginstruksikan pelaksanaan **Opsi B (Revamp Terarah)**.
2. **Pengamanan 6 Server Action Terbuka (`ADR-007` & Temuan `SEC-01`):**
   - Menambahkan guard `requireStaffSession()` pada `getPaginatedTalentPool`, `getPaginatedArchivedCandidates`, `getPaginatedBlacklistedCandidates`, `getPaginatedInterviewsDashboardData`, `getPaginatedJobOpenings`, dan `getFilteredPipelineData` di [`app/actions/job.ts`](../app/actions/job.ts).
   - Menutup celah eksfiltrasi data pribadi kandidat (NIK, KK, kontak WhatsApp) oleh pihak luar tanpa login.
3. **Pengamanan Mutasi Master Data Sertifikasi (`SEC-04`):**
   - Menambahkan guard `requireStaffSession()` pada `createCertificationSchema`, `updateCertificationSchema`, `deleteCertificationSchema`, dan `ensureExtendedPipelineStages` di [`app/actions/master-data.ts`](../app/actions/master-data.ts).
4. **Perluasan Proteksi Middleware ke Endpoint API (`SEC-03`):**
   - Menambahkan matcher `/api/:path*` di [`middleware.ts`](../middleware.ts) dengan verifikasi sesi dan otorisasi RBAC global, serta pengecualian rute publik (`/api/auth/*` dan `/api/health`).
5. **Sanitasi PII Karyawan & Penghapusan Mock Data (`SEC-02` & `AI-Slop`):**
   - Menghapus nama, nomor handphone, dan email staf DPP yang sebelumnya hardcoded di [`lib/mcu-clinics.ts`](../lib/mcu-clinics.ts), digantikan dengan fallback environment variable aman.
   - Menghapus logika penggabungan `MOCK_MCU_CANDIDATES` di [`app/dashboard/generate-documents/GenerateDocumentsClient.tsx`](../app/dashboard/generate-documents/GenerateDocumentsClient.tsx) agar dokumen cetak hanya memproses kandidat asli dari database.
6. **Eliminasi Paket Dependensi Rentan & Terlantar:**
   - Menghapus 104 paket dependensi melalui `npm uninstall xlsx @tiptap/pm @tiptap/react @tiptap/starter-kit html-to-docx`.
   - Menghilangkan celah keamanan Prototype Pollution dan ReDoS dari library `xlsx`.
   - Menghapus impor `xlsx` yang tidak terpakai di [`lib/document-generator.ts`](../lib/document-generator.ts).

### Status
Fase 1 (Security & Dependency Hardening) selesai dan terverifikasi. Siap untuk peninjauan dan persetujuan IT Leader sebelum melangkah ke Fase 2 (Database Normalization & Kepatuhan UU PDP).


