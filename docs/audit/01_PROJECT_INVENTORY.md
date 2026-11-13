# 01. INVENTARISASI PROYEK & PEMETAAN FUNGSIONAL
**DPP Recruitment Portal Dashboard**  
*Auditor: Joint Audit Team (Principal Engineer, UX Auditor, Security Reviewer, Business Analyst)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Ringkasan Repositori & Stack Teknologi

| Parameter | Spesifikasi / Temuan | Lokasi Bukti |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 16.2.12 (App Router, Turbopack support) | `package.json:42` |
| **Core UI Library** | React 19.2.4 & React-DOM 19.2.4 | `package.json:44,47` |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`) | `package.json:48,58` |
| **Database ORM** | Prisma Client & CLI v5.15.0 (PostgreSQL engine) | `package.json:19,57`, `prisma/schema.prisma:6` |
| **Autentikasi** | NextAuth.js v4.24.15 (JWT session strategy, bcryptjs v3.0.3) | `package.json:25,36,43`, `lib/auth.ts:57` |
| **Penyimpanan Objek** | Cloudflare R2 / AWS S3 SDK v3.1143.0 | `package.json:21-22`, `lib/s3.ts:1-25` |
| **Dokumen & Ekspor** | docx v9.7.1, exceljs v4.4.0, jspdf v4.2.1, html2canvas v1.4.1, jszip v3.10.2 | `package.json:33-39` |
| **Pemetaan & Kalender** | Leaflet v1.9.4, React-Leaflet v5.0.0, React-Big-Calendar v1.20.0 | `package.json:33,38,41` |
| **Bahasa & Typing** | TypeScript 5, Node.js 20 LTS | `package.json:51,60` |
| **Infrastruktur Target** | Azure VM Non-Odoo (Docker Compose, Ubuntu 22.04 LTS, Nginx Reverse Proxy) | `docker-compose.yml:1-46`, `Dockerfile:1-79` |

### Volume Baris Kode (LOC Aktual per Bahasa)
*Dihitung melalui inspeksi PowerShell lokal non-destruktif terhadap seluruh file kode sumber (mengecualikan `node_modules`, `.next`, `.git`, dan `dist`):*

| Ekstensi | Jumlah File | Total Baris (LOC) | Catatan |
| :--- | :---: | :---: | :--- |
| `.tsx` | 101 | 26.688 | Komponen UI dan Halaman App Router |
| `.ts` | 42 | 14.157 | Server Actions, API Routes, Helper Libs, Seed Scripts |
| **Total TypeScript** | **143** | **40.845** | **Total Basis Kode Aplikasi Utama** |
| `.prisma` | 1 | 327 | Skema Database Prisma (23 Model Relasional) |
| `.sql` | 3 | 404 | Script migrasi & dump awal |
| `.css` | 1 | 103 | Styling global Tailwind CSS |
| `.yml` / `.dockerfile` | 3 | 146 | Konfigurasi kontainerisasi deployment |

---

## 2. Pemetaan Lengkap Rute Halaman (App Router Pages)

Tabel berikut memetakan seluruh rute tampilan (UI Pages) pada sistem, target peran akses (*RBAC*), entitas data terkait, dan status kelengkapan fungsionalnya:

| Rute Halaman (`app/`) | Target Role | Entitas Data Prisma Terkait | Status Kelengkapan | Ada Test? | Keterangan Fungsional & Catatan Bukti |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `/` | Publik / Guest | `JobOpening`, `MasterSite` | Parsial | Tidak | Landing page publik. Memiliki toggle feature flag (`lib/feature-flags.ts:1-25`). |
| `/login` | Publik / Guest | `User`, `Account` | Nyata | Tidak | Login email/password & Google SSO (`app/login/page.tsx:1-223`). |
| `/candidate/login` | Kandidat | `User` | Nyata | Tidak | Rute redirect login khusus kandidat (`app/candidate/login/page.tsx`). |
| `/candidate/register` | Publik / Kandidat | `User`, `CandidateProfile` | Nyata | Tidak | Registrasi akun pelamar baru (`app/candidate/register/page.tsx:1-199`). |
| `/jobs` | Publik / Guest | `JobOpening`, `MasterCity` | Nyata | Tidak | Katalog lowongan publik dengan filter provinsi/kota (`app/jobs/page.tsx`). |
| `/jobs/[id]` | Publik / Guest | `JobOpening`, `Application` | Nyata | Tidak | Detail lowongan & tombol apply (`app/jobs/[id]/page.tsx:1-95`). |
| `/candidate/(dashboard)/profile` | CANDIDATE | `CandidateProfile`, `CandidateDocument` | Nyata | Tidak | Form pengisian data diri, NIK, KK, pendidikan, dan upload berkas (`app/candidate/(dashboard)/profile/page.tsx:1-635`). |
| `/candidate/(dashboard)/jobs` | CANDIDATE | `JobOpening`, `Application` | Nyata | Tidak | Portal pencarian lowongan untuk pelamar login (`app/candidate/(dashboard)/jobs/page.tsx`). |
| `/candidate/(dashboard)/history` | CANDIDATE | `Application`, `ApplicationHistory` | Nyata | Tidak | Riwayat lamaran aktif & tahapan terkini (`app/candidate/(dashboard)/history/page.tsx`). |
| `/candidate/(dashboard)/past-applications` | CANDIDATE | `Application` | Nyata | Tidak | Riwayat lamaran lampau/arsip (`app/candidate/(dashboard)/past-applications/page.tsx`). |
| `/dashboard` | ADMIN, RECRUITER | - | **Placeholder / Redirect** | Tidak | Halaman dummy yang langsung me-redirect ke `/dashboard/executive` (`app/dashboard/page.tsx:1-14`). |
| `/dashboard/executive` | ADMIN, RECRUITER | `JobOpening`, `Application`, `MasterSite` | Parsial (Heavy Client) | Tidak | Executive dashboard analitik. Menarik *seluruh* row DB ke browser (`app/dashboard/executive/page.tsx:1-467`). |
| `/dashboard/geosource` | ADMIN, RECRUITER | `MasterSite`, `CandidateProfile` | Parsial | Tidak | Peta sebaran kandidat via Leaflet (`app/dashboard/geosource/page.tsx:1-506`). Icon Leaflet ditarik dari CDN unpkg. |
| `/dashboard/calendar` | ADMIN, RECRUITER | `Interview`, `Application` | Nyata (Monolitik) | Tidak | Jadwal wawancara tim recruiter (`app/dashboard/calendar/page.tsx:1-1031`). |
| `/dashboard/job-openings` | ADMIN, RECRUITER | `JobOpening`, `MasterCustomer` | Nyata | Tidak | Manajemen daftar permintaan pekerjaan (`app/dashboard/job-openings/JobClient.tsx`). |
| `/dashboard/job-openings/create` | ADMIN, RECRUITER | `JobOpening`, `JobTimeline` | Nyata (Monolitik) | Tidak | Pembuatan job order baru (`app/dashboard/job-openings/create/JobCreateClient.tsx:1-562`). |
| `/dashboard/job-openings/[id]` | ADMIN, RECRUITER | `JobOpening`, `Application` | Nyata | Tidak | Detail lowongan, metrik pemenuhan, dan list pelamar (`app/dashboard/job-openings/[id]/JobDetailClient.tsx`). |
| `/dashboard/job-openings/[id]/edit` | ADMIN, RECRUITER | `JobOpening` | Nyata | Tidak | Edit form lowongan (`app/dashboard/job-openings/[id]/edit/JobEditClient.tsx`). |
| `/dashboard/job-openings/[id]/verify/[candidateId]` | ADMIN, RECRUITER | `Application`, `CandidateProfile` | **Nyata (Mega Monolit)** | Tidak | Halaman verifikasi 10 tahapan seleksi (`page.tsx:1-2893` baris). Menggabungkan puluhan state ke satu komponen. |
| `/dashboard/pipeline` | ADMIN, RECRUITER | `Application`, `MasterPipelineStage` | Nyata | Tidak | Kanban board pipeline rekrutmen (`components/PipelineBoard.tsx:1-496`). |
| `/dashboard/talent-pool` | ADMIN, RECRUITER | `CandidateProfile` | Nyata | Tidak | Database kandidat cadangan (`app/dashboard/talent-pool/TalentPoolClient.tsx`). |
| `/dashboard/talent-pool/add` | ADMIN, RECRUITER | `CandidateProfile`, `User` | Nyata | Tidak | Input data kandidat manual oleh staf (`app/dashboard/talent-pool/add/page.tsx:1-524`). |
| `/dashboard/blacklist` | ADMIN, RECRUITER | `CandidateProfile` | Nyata | Tidak | Daftar pelamar bermasalah (`app/dashboard/blacklist/page.tsx:1-172`). |
| `/dashboard/archived-candidates` | ADMIN, RECRUITER | `Application`, `CandidateProfile` | Nyata | Tidak | Daftar kandidat yang ditolak/gagal (`app/dashboard/archived-candidates/ArchivedCandidatesClient.tsx`). |
| `/dashboard/interviews` | ADMIN, RECRUITER | `Interview`, `Application` | Nyata | Tidak | Jadwal & log interview terpusat (`app/dashboard/interviews/page.tsx:1-315`). |
| `/dashboard/generate-documents` | ADMIN, RECRUITER | `Application`, `JobOpening` | **Tercemar Mock Data** | Tidak | Generator Offering, MCU, & BAST (`GenerateDocumentsClient.tsx:1-3332`). Menyisipkan kandidat tiruan otomatis. |
| `/dashboard/settings/master-data/*` | ADMIN, RECRUITER | 13 Tabel `Master*` | Nyata | Tidak | CRUD 13 master data (Provinsi, Kota, Customer, Site, Posisi, Sertifikasi, dll.). |
| `/dashboard/settings/sla` | ADMIN | `SiteSla`, `MasterPipelineStage` | Nyata | Tidak | Pengaturan SLA tahapan global dan site (`app/dashboard/settings/sla/page.tsx`). |
| `/dashboard/settings/users` | ADMIN | `User` | Nyata | Tidak | Manajemen akun internal staf (`app/dashboard/settings/users/page.tsx:1-338`). |
| `/dashboard/settings/audit-logs` | ADMIN | `AuditLog` | Nyata | Tidak | Log audit aktivitas sistem (`app/dashboard/settings/audit-logs/page.tsx:1-231`). |

---

## 3. Pemetaan Lengkap API Routes (`app/api/`)

| Rute Endpoint API | Metode HTTP | Hak Akses (Auth Guard) | Entitas / Operasi | Bukti Lokasi Kode | Catatan Keamanan & Kualitas |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/api/auth/[...nextauth]` | ALL | Publik | NextAuth Core Engine | `app/api/auth/[...nextauth]/route.ts` | Mengelola login Credentials & Google OAuth. |
| `/api/auth/register` | POST | Publik | Registrasi Kandidat | `app/api/auth/register/route.ts:1-66` | Hashing bcrypt password min 6 char. Role default: CANDIDATE. |
| `/api/health` | GET | Publik | Monitoring Kontainer | `app/api/health/route.ts:1-25` | Healthcheck Docker: memeriksa status uptime dan memori. |
| `/api/file` | GET | ADMIN, RECRUITER, CANDIDATE | Streaming File R2/Lokal | `app/api/file/route.ts:1-150` | Memiliki proteksi IDOR kepemilikan file, tetapi memiliki fallback menghasilkan fake PDF/SVG jika file hilang. |
| `/api/file/upload` | POST | ADMIN, RECRUITER, CANDIDATE | Upload File Dokumen | `app/api/file/upload/route.ts:1-82` | Validasi ukuran 5MB dan MIME. Simpan ke R2 / disk lokal. |
| `/api/candidates/[candidateId]/documents-zip` | GET | ADMIN, RECRUITER | Export ZIP Berkas | `app/api/candidates/[candidateId]/documents-zip/route.ts:1-203` | Mengunduh seluruh berkas kandidat dalam 1 arsip ZIP (JSZip). |
| `/api/documents/bast-file-proxy` | GET | ADMIN, RECRUITER | Proxy Download BAST | `app/api/documents/bast-file-proxy/route.ts:1-176` | Streaming berkas lampiran BAST dari Cloudflare R2. |
| `/api/users` | GET, POST | ADMIN | List & Tambah User | `app/api/users/route.ts:1-124` | Terproteksi `requireAdminSession()`. Mengisi audit log. |
| `/api/users/[id]` | GET, PUT, DELETE | ADMIN | Modifikasi Akun | `app/api/users/[id]/route.ts:1-144` | Terproteksi `requireAdminSession()`. |
| `/api/audit-logs` | GET | ADMIN | Ekstraksi Log Audit | `app/api/audit-logs/route.ts:1-38` | Terproteksi `requireAdminSession()`. Paginasi log audit. |

> [!WARNING]
> **Temuan Kritis Gerbang API (`middleware.ts:68-74`):**  
> Konfigurasi matcher pada `middleware.ts` hanya mendefinisikan rute `["/", "/jobs/:path*", "/dashboard/:path*", "/candidate/:path*"]`. Seluruh endpoint `/api/*` **tidak terdaftar dalam matcher middleware**, sehingga tidak terlindungi oleh filter otentikasi global dan sepenuhnya bergantung pada proteksi internal di masing-masing file `route.ts`.

---

## 4. Pemetaan Lengkap Server Actions (`app/actions/`)

Sistem sangat bergantung pada Server Actions Next.js (`"use server"`). Berikut adalah hasil audit otorisasi pada setiap file action:

### 4.1 `app/actions/job.ts` (1.717 Baris)
File ini merupakan modul terpadat dalam sistem. Ditemukan **6 Server Actions tanpa proteksi autentikasi sama sekali**:

| Nama Server Action | Baris | Status Auth Guard | Potensi Risiko & Dampak |
| :--- | :---: | :---: | :--- |
| `getJobOpenings` | 11 | `requireStaffSession()` | Terproteksi (Aman). |
| `getCalendarData` | 32 | `requireStaffSession()` | Terproteksi (Aman). |
| `createJobOpening` | 268 | `requireStaffSession()` | Terproteksi (Aman). |
| `updateJobOpening` | 348 | `requireStaffSession()` | Terproteksi (Aman). |
| `publishJobOpening` | 421 | `requireStaffSession()` | Terproteksi (Aman). |
| `updateApplicationStage` | 626 | `requireStaffSession()` | Terproteksi (Aman). |
| `updateApplicationStageData` | 736 | `requireStaffSession()` | Terproteksi (Aman). |
| `getApplicationForVerify` | 760 | `requireStaffSession()` | Terproteksi (Aman). |
| `applyToJob` | 799 | `getServerSession()` | Terproteksi (Hanya kandidat login). |
| `blacklistCandidate` | 926 | `requireStaffSession()` | Terproteksi (Aman). |
| **`getPaginatedTalentPool`** | **1160** | **TIDAK ADA (Bypass)** | **KRITIS: Unauthenticated caller dapat mengekstrak seluruh NIK, No WA, nama pelamar.** |
| **`getPaginatedArchivedCandidates`** | **1304** | **TIDAK ADA (Bypass)** | **KRITIS: Unauthenticated caller dapat melihat seluruh daftar pelamar ditolak.** |
| **`getPaginatedBlacklistedCandidates`** | **1420** | **TIDAK ADA (Bypass)** | **KRITIS: Siapa pun dapat mengakses daftar hitam dan alasan penolakan kandidat.** |
| **`getPaginatedInterviewsDashboardData`**| **1518** | **TIDAK ADA (Bypass)** | **KRITIS: Jadwal interview dan link pertemuan dapat diakses tanpa login.** |
| **`getPaginatedJobOpenings`** | **1697** | **TIDAK ADA (Bypass)** | **TINGGI: Membocorkan status internal permintaan klien dan form B1.** |
| **`getFilteredPipelineData`** | **1786** | **TIDAK ADA (Bypass)** | **KRITIS: Data kandidat pada setiap stage pipeline dapat ditarik publik.** |

### 4.2 `app/actions/master-data.ts` (714 Baris)
Mengelola 13 entitas master data. Mayoritas telah terproteksi `requireStaffSession()`, namun modul skema sertifikasi terlewat:
- `getCertificationSchemas` (Baris 564): **Tidak ada auth guard** (Publik).
- `createCertificationSchema` (Baris 573): **Tidak ada auth guard** (Siapa pun dapat membuat skema sertifikasi).
- `updateCertificationSchema` (Baris 586): **Tidak ada auth guard** (Siapa pun dapat mengubah skema).
- `deleteCertificationSchema` (Baris 599): **Tidak ada auth guard** (Siapa pun dapat menghapus skema).
- `ensureExtendedPipelineStages` (Baris 667): **Tidak ada auth guard**.

### 4.3 `app/actions/document.ts` (258 Baris)
- `getDocumentGenerationData` (Baris 48): Terproteksi `requireStaffSession()`.
- `saveCandidateDocumentData` (Baris 146): Terproteksi `requireStaffSession()`.
- `batchSaveBastData` (Baris 223): Terproteksi `requireStaffSession()`.

### 4.4 `app/actions/dashboard.ts` (381 Baris)
- `getExecutiveDashboardData` (Baris 79): Terproteksi `requireStaffSession()`. Melakukan penarikan paralel data `JobOpening`, `Application`, `CandidateProfile`, dan `MasterSite` tanpa limitasi paginasi.

### 4.5 `app/actions/candidate-application.ts` (748 Baris) & `candidate-profile.ts` (299 Baris)
- Terproteksi dengan verifikasi kepemilikan profil (`getAuthenticatedCandidate` & `requireRole`).

---

## 5. Fitur Semu, Data Tiruan (Mock), & Hardcode yang Ditemukan di Kode

1. **Injeksi Kandidat Tiruan Otomatis pada Modul Dokumen Nyata:**  
   - *Lokasi:* `app/dashboard/generate-documents/GenerateDocumentsClient.tsx:970-977` dan `lib/mcu-clinics.ts:142-209`.
   - *Fakta:* Modul penyerahan dokumen MCU menggabungkan data database asli dengan 6 kandidat dummy (`MOCK_MCU_CANDIDATES`) yang memiliki NIK rekaan 16-digit. Komentar kode secara eksplisit menyatakan: *"Merge with prototype mock candidates so it is immediately interactive out of the box"*.
2. **Fallback Dokumen Palsu Saat Berkas Fisik Tidak Ditemukan:**  
   - *Lokasi:* `app/api/file/route.ts:116-146` dan `lib/dummy-file-generator.ts:1-140`.
   - *Fakta:* Jika berkas pelamar (KTP/KK/MCU/CV) tidak ditemukan di Cloudflare R2 maupun penyimpanan disk lokal, server tidak me-return 404, melainkan men-generate berkas PDF dan avatar SVG rekaan secara dinamis dan menampilkannya seolah-olah dokumen asli kandidat ada.
3. **Hardcoded Data Pribadi (PII) Staf Rekruter di Repositori:**  
   - *Lokasi:* `lib/mcu-clinics.ts:115-140`.
   - *Fakta:* Nama lengkap staf (*Annisa Nur Cahya Rahmadani*, *Mursidi*, *M Irfan Dzul Izzudin*), nomor HP operasional/pribadi (`0895-2305-7314`), dan 6 alamat email korporat `@dpp.co.id` tertulis secara permanen (*hardcoded*) di dalam source code, alih-alih ditarik dari database relasional atau environment variable.
4. **Halaman Dashboard Induk Tanpa Konten:**  
   - *Lokasi:* `app/dashboard/page.tsx:1-14`.
   - *Fakta:* Rute `/dashboard` hanya berupa komponen kosong yang mengeksekusi `router.replace("/dashboard/executive")`.
5. **Dualitas Master Data Sertifikasi:**  
   - *Lokasi:* `prisma/schema.prisma:173,185` (`MasterCertificationSchema` vs `MasterCertification`).
   - *Fakta:* Terdapat dua tabel relasional terpisah untuk konsep yang identik, mengindikasikan duplikasi pembuatan skema oleh AI.

---

## 6. Status Pengujian Perangkat Lunak (Test Suite Coverage)

- **Total File Pengujian di Seluruh Repositori:** 1 file (`lib/__tests__/security-foundation.test.ts` — 95 baris).
- **Unit Test Domain / Alur Bisnis Rekrutmen:** 0% (Tidak ada pengujian unit untuk perhitungan SLA, transisi 10 tahap pipeline, pembuatan berkas BAST/Offering/MCU, maupun kalkulasi dashboard).
- **Integration Test & E2E Test:** 0% (Tidak ada framework Playwright, Cypress, atau Jest yang dikonfigurasi).
- **Linting Health:** Menghasilkan **644 masalah** (482 error kritis, 162 warning) yang didominasi oleh penggunaan tipe `any`, variabel tak terpakai, dan ketiadaan validasi tipe data.
- **npm audit Status:** Terdeteksi **12 kerentanan** (2 Kritis: `dompurify` DOM XSS dan `next` RCE/SSRF/Cache Poisoning; 7 High; 3 Moderate).

