# ADR-001: Strategi Brownfield Hardening vs Greenfield Rewrite & Penggunaan Feature Flag

- **Status:** Accepted
- **Tanggal:** 2026-11-03
- **Pengambil Keputusan:** IT Leader, Solution Architect

## 1. Konteks
Saat Fase 0 (Discovery) dilakukan, ditemukan bahwa workspace dan repository GitHub (`fahruulc/recruitment-portal-dashboard`) sudah berisi prototipe aplikasi rekrutmen dengan ~35.000 baris kode (Next.js 16.2, Prisma, PostgreSQL, Tailwind v4) yang dibuat oleh seorang developer.

Prototipe tersebut telah memiliki:
- Skema domain spesifik PT Dian Pandu Pratama (DPP): `JobOpening` (`noRegistrasi`, `noFormB1`, `requiresBnsp`), `MasterSite` dengan `SiteSla`, `MasterInstitute` (BLK), `MasterClinic` (MCU), dan 10 tahap pipeline (`CV Screening` hingga `PKWT`).
- Generator dokumen otomatis (Offering Letter, Pengantar MCU, BAST).
- Dashboard analitik, GeoMap kandidat, kalender interview, blacklist, dan talent pool.
- Portal Kandidat dan halaman lowongan publik.

Namun, prototipe memiliki celah keamanan kritis (API `/api/users` tanpa autentikasi, Server Actions tanpa pemeriksaan role, IDOR pada `/api/file`, dan penyimpanan ganda S3 + `public/uploads`) serta belum memiliki sesi *knowledge transfer* (KT) resmi kepada IT Leader.

## 2. Opsi yang Dipertimbangkan

### Opsi A: Greenfield Rewrite (Bangun Ulang dari Nol)
- **Kelebihan:** Struktur kode, skema UUID, dan lapisan domain bersih sejak hari pertama.
- **Kekurangan:** Membuang ~2–3 bulan kerja yang sudah sangat spesifik terhadap proses bisnis DPP (terutama generator dokumen BAST/Offering/MCU dan logika 10 tahap pipeline).

### Opsi B: Brownfield Hardening tanpa Feature Flag (Rilis Semua Fitur Sekaligus)
- **Kelebihan:** Tidak ada fitur yang disembunyikan.
- **Kekurangan:** Membuka registrasi publik (`/candidate/register`, `/api/auth/register`) dan upload dokumen oleh pihak eksternal di saat lapisan keamanan dan rate-limiting belum teruji penuh.

### Opsi C: Brownfield Hardening + Freeze Struktur Pra-KT + Feature Flag Portal Publik (Rekomendasi)
- **Kelebihan:**
  - Menyelamatkan seluruh aset bisnis dan UI yang sudah dibangun developer.
  - Tidak mengubah struktur file/skema secara drastis sebelum KT selesai, sehingga tidak menimbulkan *merge conflict* dengan pekerjaan developer yang masih berjalan.
  - Menyembunyikan Portal Kandidat (`/candidate/*`) dan halaman lowongan publik (`/jobs/*`) di Staging/Production melalui *feature flag*, namun tetap membukanya di environment lokal untuk kebutuhan development.

## 3. Keputusan
Memilih **Opsi C**:
1. Melanjutkan codebase yang ada (*Brownfield Hardening*).
2. Mempertahankan struktur proyek dan skema database saat ini hingga sesi KT selesai.
3. Menambahkan pengamanan wajib (*security wrapper* pada API & Server Actions) dan *feature flag* berbasis environment variable:
   - `FEATURE_CANDIDATE_PORTAL` (`true` di lokal, `false` di staging/prod tahap awal)
   - `FEATURE_PUBLIC_JOBS` (`true` di lokal, `false` di staging/prod tahap awal)

## 4. Konsekuensi
- **Positif:** Waktu menuju go-live internal jauh lebih cepat; risiko keamanan dari akses publik tertutup; proses transisi dari developer ke IT Leader berjalan mulus tanpa gesekan kode.
- **Negatif / Trade-off:** ID tabel masih menggunakan `cuid()` bawaan skema awal (bukan UUID murni), tetapi `cuid()` sudah bersifat unik secara global, aman dari enumerasi, dan memenuhi kebutuhan ID internal stabil untuk ekspor masa depan.

