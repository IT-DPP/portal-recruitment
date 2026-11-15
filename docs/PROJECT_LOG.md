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
Fase 1 (Security & Dependency Hardening) selesai, diverifikasi, dan disetujui IT Leader.

---

## 2026-11-13 — Revamp Opsi B: Fase 2 (Database Normalization & Kepatuhan UU PDP)

### Aktivitas
1. **Implementasi Utilitas Enkripsi Field-Level AES-256-GCM (`lib/crypto.ts`):**
   - Menghadirkan perlindungan data sesuai UU No. 27 Tahun 2022 (UU PDP) Pasal 4 Ayat 2a (Data Medis Spesifik) dan Pasal 35 (Kewajiban Pengamanan Teknis).
   - Menggunakan authenticated cipher **AES-256-GCM** dengan format `enc:v1:<iv>:<tag>:<ciphertext>`.
   - Mengimplementasikan **HMAC-SHA256 Blind Indexing** (`hashField`) untuk pencarian NIK unik dan pengecekan duplikasi `O(1)` tanpa mendekripsi ciphertext di layer basis data.
   - Menyertakan fallback transparan (*backward compatibility*) untuk membaca data historis tanpa error.
2. **Normalisasi Relasional Skema Prisma (`prisma/schema.prisma`):**
   - Membongkar kolom JSON `Application.stageData` menjadi 4 model relasional dengan integritas kunci asing (*foreign key*):
     - `ApplicationAssessment`: Penilaian terstruktur untuk CV Screening, Interview HR, Psikotes, Test Skill, Interview User, dan Validasi BNSP.
     - `MedicalCheckUp`: Pelacakan klinik, jadwal, status kebugaran (*FIT*, *FIT_WITH_RESTRICTION*, *TEMPORARY_UNFIT*, *UNFIT*), berkas bukti, dan kolom `doctorNotesEncrypted` yang terenkripsi AES-256-GCM.
     - `OfferingLetterRecord`: Siklus penawaran kerja (*DRAFT*, *SENT*, *ACCEPTED*, *DECLINED*, *REJECTED_FINAL*), dokumen bertandatangan, serta enkripsi kompensasi (*baseSalaryEncrypted*).
     - `ContractMobilization`: Manajemen penempatan *Labor Supply* mencakup nomor kontrak PKWT, NRP site, nomor Mine Permit/SIMPER, induksi, status BAST, dan mobilisasi fisik hingga tiba di *site* tambang.
   - Menambahkan pelacakan kuota pada `JobOpening`: `headcountTarget`, `headcountFulfilled`, dan `headcountOnSite`.
   - Menambahkan mekanisme penghapusan aman (*Soft Delete*) via `deletedAt DateTime?` pada tabel `CandidateProfile`, `JobOpening`, dan `Application`.
   - Menambahkan indeks komposit performa tinggi untuk mencegah *full table scan*.
3. **Penyusunan Berkas Migrasi SQL & Script Backfill Idempoten:**
   - Membuat migrasi SQL formal [`prisma/migrations/20261113140000_fase2_normalization_and_pdp/migration.sql`](../prisma/migrations/20261113140000_fase2_normalization_and_pdp/migration.sql) untuk dieksekusi via `prisma migrate deploy` saat deployment.
   - Membuat script migrasi dan transformasi data non-destruktif [`scripts/migrate-stagedata-to-relational.ts`](../scripts/migrate-stagedata-to-relational.ts) (`npm run db:migrate:fase2`).
4. **Pembaruan Server Actions & Query Helpers:**
   - Memperbarui `app/actions/candidate-profile.ts` untuk mengenkripsi NIK & KK secara transparan saat disimpan dan mendekripsi saat disajikan ke kandidat.
   - Memperbarui `app/actions/job.ts`:
     - Fungsi `syncStageDataToRelational` untuk sinkronisasi dua arah otomatis antara JSON `stageData` dan tabel relasional baru.
     - Otomatisasi pembaruan kuota `headcountFulfilled` dan `headcountOnSite` saat status kandidat bergerak di pipeline.
     - Validasi aturan 1 lamaran aktif per NIK menggunakan `nikHash` blind index.
     - Dekripsi NIK pada daftar kandidat dan antarmuka verifikasi recruiter.
   - Memperbarui `app/actions/candidate-application.ts` untuk menyinkronkan respon Offering Letter dan unggah bukti MCU ke tabel relasional formal.
5. **Penyusunan Dokumentasi ADR-008 & Portfolio:**
   - Menerbitkan [`docs/adr/ADR-008-database-normalization-and-pdp-compliance.md`](adr/ADR-008-database-normalization-and-pdp-compliance.md).
   - Memperbarui [`CHANGELOG.md`](../CHANGELOG.md).
6. **Verifikasi & Pengujian Mutu:**
   - Menjalankan unit test kriptografi [`lib/__tests__/crypto.test.ts`](../lib/__tests__/crypto.test.ts) (**7/7 PASS**).
   - Menjalankan seluruh test suite otomatis via `npm test` (**13/13 PASS**).
   - Menjalankan static type checking `npx tsc --noEmit` (**0 ERROR**).
   - Menjalankan full production build `npm run build` (**54 routes compiled cleanly via Turbopack**).

### Status
Fase 2 (Database Normalization & Kepatuhan UU PDP) selesai dengan sempurna dan terverifikasi secara menyeluruh. Menunggu instruksi dan persetujuan IT Leader sebelum melanjutkan ke Fase 3 (UI Redesign & Bulk Actions).

---

## 2026-11-13 — Fase 3: UI/UX De-slopping, Bulk Actions & Recruiter Efficiency

### Apa yang dikerjakan
1. **Multi-Selection & Floating Sticky Bottom Bulk Action Bar:**
   - Menambahkan mekanisme multi-seleksi berbasis checkbox di setiap kartu kandidat pada Kanban Board:
     - Cross-job Pipeline: `app/dashboard/pipeline/PipelineClient.tsx`
     - Per-job Pipeline: `components/PipelineBoard.tsx`
   - Menambahkan toggle "Pilih Semua di Kolom Ini" pada header tiap kolom tahapan untuk seleksi cepat kandidat per tahap seleksi.
   - Mengimplementasikan bilah aksi mengambang (*Sticky Bottom Bulk Bar*) berdesain korporat DPP Navy (`#0A2540`):
     - Menampilkan indikator jumlah kandidat terpilih.
     - **Loloskan ke Tahap... (*Bulk Advance*):** Memilih tahapan tujuan dan memindahkan seluruh kandidat terpilih secara paralel.
     - **Tolak Massal (*Bulk Reject*):** Menolak kandidat dengan alasan penolakan standar terstruktur (*Standardized Rejection Reasons*).
     - **Pindahkan ke Talent Pool:** Memindahkan profil kandidat ke Talent Pool.
     - **Batal Pilih:** Mengosongkan seleksi seketika.
2. **Server Actions Terproteksi untuk Aksi Massal (`app/actions/job.ts`):**
   - `bulkAdvanceApplicationStage(appIds, targetStageId, note)`: Memindahkan banyak kandidat sekaligus dengan guard Offering Letter lock (mencegah pemindahan kandidat dari stage 6 sebelum persetujuan resmi), sinkronisasi otomatis status `HIRED` untuk tahapan pasca-MCU, pembaruan headcount target job (`headcountFulfilled` & `headcountOnSite`), dan audit log `BULK_STAGE_MOVED`.
   - `bulkRejectApplications(appIds, rejectionReason)`: Menolak kandidat massal, menyinkronkan status `REJECTED`, dan mencatat riwayat audit log `BULK_REJECTED`.
   - `bulkAddToTalentPool(candidateProfileIds)`: Menandai `isTalentPool = true` pada profil kandidat terpilih secara massal.
   - `bulkAssignCandidatesToJob(candidateProfileIds, targetJobId)`: Menugaskan kandidat langsung dari Talent Pool ke lowongan kerja aktif pada Stage 1 (CV Screening).
   - `bulkImportCandidates(jobId, candidates)`: Memproses impor massal kandidat via spreadsheet hingga 500 baris per batch.
3. **Bulky Upload Kandidat (Excel / CSV Mass Import):**
   - Membangun endpoint unduh template resmi [`app/api/candidates/import-template/route.ts`](../app/api/candidates/import-template/route.ts) menggunakan `exceljs`:
     - Sheet 1: Template data kandidat dengan format header DPP Navy (`#0A2540`), formatting text cell `@` pada NIK & KK agar tidak terpotong menjadi notasi ilmiah, dan 3 baris data sampel riil profil staf lapangan & back office.
     - Sheet 2: Panduan aturan pengisian kolom, validasi format, dan klausul UU PDP.
   - Membangun komponen modal impor interaktif [`components/dashboard/BulkImportModal.tsx`](../components/dashboard/BulkImportModal.tsx):
     - Area drag-and-drop berkas `.xlsx`, `.xls`, `.csv`.
     - Client-side parser menggunakan `exceljs` yang mengekstrak dan memvalidasi data langsung di browser.
     - Tabel pratinjau data (status `Valid` / `Error`, NIK 16 digit, Nama Lengkap, WA, Pendidikan) sebelum dieksekusi ke database.
   - Menghubungkan tombol "+ Import Massal Excel" pada:
     - Header halaman detail lowongan: `app/dashboard/job-openings/[id]/JobDetailClient.tsx`
     - Header halaman Talent Pool: `app/dashboard/talent-pool/TalentPoolClient.tsx`
4. **Kepatuhan UU No. 27 Tahun 2022 (UU PDP) pada Impor Massal:**
   - Validasi ketat NIK 16 digit numerik.
   - Deduplikasi cepat $O(1)$ menggunakan blind index HMAC-SHA256 (`hashField`).
   - Proteksi field-level encryption AES-256-GCM (`encryptField`) pada kolom NIK dan KK.
   - Pembuatan akun `User` otomatis dengan role `CANDIDATE` dan kata sandi ter-hash `bcrypt`.
5. **Kepatuhan Modern Web Guidance:**
   - **Accessible Dialogs (`dialog`):** Seluruh modal menggunakan `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, dan listener tombol `Escape`.
   - **Responsive Table (`responsive-table`):** Tabel pratinjau impor, tabel kandidat terpilih, dan tabel Talent Pool dibungkus kontainer `<div tabIndex={0} role="region" aria-label="..." className="overflow-x-auto focus:outline-hidden overscroll-x-contain">` dengan sticky header (`sticky top-0 z-10`).
6. **UI/UX De-slopping:**
   - Mengeliminasi gradien template AI berlebihan dan glassmorphism buram.
   - Menegaskan palet warna korporat DPP: Deep Navy `#0A2540`, Slate `#F8FAFC` & `#E2E8F0`, Emerald `#059669`, Amber `#D97706`, dan Rose `#DC2626`.
7. **Penyusunan Dokumentasi ADR-009 & Pengujian Mutu:**
   - Menerbitkan [`docs/adr/ADR-009-bulk-actions-and-recruiter-efficiency.md`](adr/ADR-009-bulk-actions-and-recruiter-efficiency.md).
   - Menambahkan unit test baru di `lib/__tests__/bulk-actions.test.ts`.
   - Menjalankan `npm test` (**17/17 PASS**).
   - Menjalankan `npm run check:e2e` (**21/21 PASS**).
   - Menjalankan `npx tsc --noEmit` (**0 ERROR**).
   - Menjalankan `npm run build` (**54 routes compiled cleanly via Turbopack**).

### Status
Fase 3 (UI/UX De-slopping, Bulk Actions & Recruiter Efficiency) selesai 100% dengan standar keandalan tinggi dan verifikasi end-to-end tanpa error.

---

## 2026-11-13 — Fase 4: Corporate Branding Overhaul & Industrial Identity (dpp.co.id)

### Konteks & Arahan IT Leader
IT Leader DPP menginstruksikan penyelarasan tema dan branding platform e-recruitment dengan referensi website korporat utama (`dpp.co.id`), menyematkan ornamen visual khas bisnis inti *Labor Supply & Job Supply* (manpower support alat berat & fabrikasi), serta menampilkan relasi ekosistem klien/konsumen strategis (AHEMCE Group / United Tractors ecosystem).

### Apa yang dikerjakan
1. **Integrasi Aset Riil Korporat PT DPP:**
   - Menyimpan dan mengoptimasi foto autentik kiriman IT Leader ke dalam `public/images/branding/`:
     - `dpp-plant.jpg`: Fasilitas industri Eco-Greenplant PT DPP di Cikarang (Kawasan Industri Jababeka XII) dengan kendaraan operasional PATRIA 02.
     - `welder-specialist.jpg`: Juru las bersertifikasi dengan APD lengkap fabrikasi alat berat dan percikan api las, merepresentasikan kompetensi inti penyediaan tenaga kerja teknis.
     - `dpp-operational-map.png`: Peta Sebaran Operasional PT DPP di seluruh Indonesia (Head Office Cikarang, Sangatta KPC, Melak TRUST/PATRIA, Tabang IPR, Balikpapan Manggar, Batu Kajang, Tanjung Redep Berau, Tanjung Tabalong, Muara Teweh, Banjarmasin, Sungai Danau).
2. **Standardisasi Design System Token DPP (`app/globals.css`):**
   - Menambahkan warna resmi korporat DPP: Deep Navy `#0A2540`, DPP Accent Red `#D9232A` (warna standar Astra / UT), Slate `#1E293B`, dan Industrial Amber `#D97706`.
3. **Penyusunan Ulang Halaman Utama Publik (`app/page.tsx`):**
   - Mengganti total halaman beranda generik menjadi portal rekrutmen korporat bereputasi tinggi:
     - Header korporat dengan logo resmi DPP, afiliasi YKBUT (Yayasan Karya Bakti United Tractors), dan tombol aksi.
     - Hero section industri menggabungkan fotografi juru las dan greenplant, statistik kunci (10+ Site Operasi, 50+ Titik Penempatan, 100% Kepatuhan K3 & PDP), serta CTA pelamar dan recruiter.
     - 3 Pilar Bisnis DPP: *Job & Labour Supply*, *Product Support & Fabrication*, dan *YKBUT & BNSP Competency Development*.
     - Nilai Budaya Korporat S.M.A.R.T (Satisfaction, Morale, Adaptability, Responsibility, Team Work).
     - Showcase Ekosistem Klien & Mitra Strategis: PATRIA, United Tractors, PAMA, Triatra, PMP, KPC (Sangatta), Berau Coal, TRUST (Melak), IPR (Tabang), Astra International.
     - Peta Sebaran Operasional Nasional menampilkan representatif site di Sumatera, Jawa, dan Kalimantan.
     - Tabel lowongan aktif terkini (`PublicJobsClient`) dan footer korporat lengkap (alamat Jababeka XII Cikarang, email, telepon, dan klausul privasi UU PDP No. 27/2022).
4. **Pembaruan Portal Lowongan Publik (`app/jobs/page.tsx` & `app/jobs/[id]/page.tsx`):**
   - Header bertema DPP Deep Navy dengan ornamen badge keahlian teknis (Welder 6G/4G, Heavy Equipment Mechanic, Assembler, Surveyor).
   - Penegasan kualifikasi K3 (Kesehatan & Keselamatan Kerja), sertifikasi BNSP, serta data klien/site penempatan.
5. **Pembaruan Halaman Autentikasi (`app/login/page.tsx` & `app/candidate/register/page.tsx`):**
   - Halaman Login dirombak menjadi tata letak *responsive split-screen*: panel kiri menampilkan visual industrial juru las, badge budaya S.M.A.R.T, daftar klien strategis, dan komitmen UU PDP; panel kanan menyediakan formulir login akun dan Google SSO.
   - Halaman Registrasi Kandidat diperkuat dengan logo DPP, afiliasi YKBUT, dan persetujuan privasi data pribadi.
6. **Harmonisasi Navigasi Internal (Recruiter & Kandidat):**
   - `components/layout/Sidebar.tsx`: Menampilkan identitas resmi PT DPP, "E-Recruitment • YKBUT", dan badge "Labor & Job Supply".
   - `components/layout/CandidateSidebar.tsx`: Menyelaraskan logo dan header dengan portal kandidat resmi DPP.
   - `components/layout/Header.tsx`: Menampilkan identitas "PT Dian Pandu Pratama • E-Recruitment Portal (YKBUT) • Labor & Job Supply".
   - `app/dashboard/geosource/page.tsx`: Disesuaikan dengan konteks pemetaan talenta site operasional tambang/manufaktur dan jejaring vokasi (BLK/LPK/SMK).
7. **Verifikasi Mutu & Integritas:**
   - Static Type Checking `npx tsc --noEmit` (**0 ERROR**).
   - Automated Unit Tests `npm test` (**17/17 PASS**).
   - End-to-End Suite `npm run check:e2e` (**21/21 PASS**).
   - Next.js Turbopack Production Build `npm run build` (**54 routes compiled successfully**).

---

## 2026-11-15 — Fase 4.1: Penyempurnaan Hero 100vh, Formasi Barisan Manpower, Peta Latar Presisi & Tipografi Korporat

### Konteks & Arahan IT Leader
IT Leader DPP menginstruksikan penyempurnaan lanjutan pada landing page:
1. Menegaskan tombol "Daftar Karir" dan "Masuk Portal" di navbar tanpa ikon agar lebih dominan.
2. Mengintegrasikan Mitra & Klien Strategis ke dalam Hero section (dalam viewport 100vh desktop), menghapus Quick Metrics Ribbon dan overlay badge, serta mengganti foto manpower tunggal dengan komponen formasi barisan tenaga kerja (*line-up formation*).
3. Menggunakan peta operasional resolusi tinggi (`dpp-operational-map.png`) sebagai background section tanpa peregangan (rasio terjaga), merombak kartu rincian site menjadi direktori hub arsitektural/teknikal, dan menghapus tombol "Lihat Sebaran di Dashboard Geosource".
4. Menghapus warna teks merah cerah (`#D9232A`) yang terkesan "AI Slop", menggantinya dengan tipografi korporat gelap solid (`text-zinc-950`) dan aksen crimson `#C81E25` yang elegan dan profesional.

### Apa yang dikerjakan
1. **Penyempurnaan Tombol Navigasi (`components/landing/LandingNavbar.tsx`):**
   - Menghapus ikon `UserPlus` dan `LogIn`.
   - Mengubah tombol "Daftar Karir" menjadi border zinc-900 kontras tinggi dan "Masuk Portal" dengan latar merah korporat `#C81E25` tebal.
2. **Konsolidasi Hero 100vh & Komponen Formasi Manpower:**
   - Membangun `components/landing/ManpowerFormationShowcase.tsx`: komponen tab interaktif antara **Site Technical Crew** (`manpower-formation.jpg`) dan **Engineering & Back Office** (`manpower-backoffice.jpg`) lengkap dengan lencana kualifikasi K3 & fit-to-work.
   - Menggabungkan carousel logo klien (`ClientLogosCarousel compact={true}`) ke dalam bilah bawah container Hero sehingga masuk ke dalam viewport 100vh desktop tanpa perlu scroll tambahan.
   - Menghapus Quick Metrics Ribbon dan badge overlay floating dari Hero visual.
3. **Penyempurnaan Jaringan Operasi Nasional (`app/page.tsx`):**
   - Menggunakan aset `public/images/branding/dpp-operational-map.png` (4251 x 2391 px) sebagai watermark latar belakang dengan kelas `object-contain object-center` (bebas distorsi).
   - Mengganti kartu generik dengan direktori operasional arsitektural 3 hub: **HUB-01 (ID-JB Cikarang HQ & Plant)**, **HUB-02 (ID-KI Kalimantan Timur Mining Sites)**, dan **HUB-03 (ID-KS/KT Kalsel & Kalteng Hauling Corridor)**.
   - Menghapus tombol "Lihat Sebaran di Dashboard Geosource".
4. **Pembersihan Tipografi & Anti-Slop:**
   - Menghapus seluruh tag span berwarna merah cerah di tengah judul. Judul kini menggunakan font tebal hitam solid (`text-zinc-950`) standar Astra / United Tractors.
5. **Verifikasi Mutu & Integritas:**
   - Static Type Checking `npx tsc --noEmit` (**0 ERROR**).
   - Automated Unit Tests `npm test` (**17/17 PASS**).
   - End-to-End Suite `npm run check:e2e` (**21/21 PASS**).
   - Next.js Turbopack Production Build `npm run build` (**26/26 static/dynamic routes compiled successfully**).

### Status
Fase 4.1 Polish selesai 100%. Landing page memenuhi seluruh kriteria visual berstandar industri kelas enterprise.





