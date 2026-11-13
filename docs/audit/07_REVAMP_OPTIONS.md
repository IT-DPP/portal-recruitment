# 07. MATRIKS KEPUTUSAN REVAMP & EVALUASI OPSI
**Keputusan Strategis: Pertahankan, Refaktor, Tulis Ulang, atau Buang**  
*Auditor: Joint Audit Team (Principal Engineer & Business Analyst)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Matriks Keputusan per Modul dan Lapisan Teknis

Tabel di bawah ini memetakan seluruh modul dan lapisan arsitektur ke dalam empat kategori keputusan:
- **PERTAHANKAN:** Fondasi sudah baik, lanjutkan dengan pemeliharaan rutin.
- **REFACTOR:** Struktur inti dapat dipakai, tetapi perlu pembersihan AI slop, modularisasi komponen, atau penambahan validasi tipe.
- **TULIS ULANG (*REWRITE*):** Implementasi saat ini terlalu rapuh/cacat, lebih cepat dan aman dibangun ulang dari nol.
- **BUANG (*DISCARD*):** Fitur tidak memiliki nilai bisnis bagi DPP atau dependensi berbahaya yang harus dieliminasi.

| Modul / Komponen | Lapisan Teknis | Rekomendasi | Alasan Teknis & Bisnis Berdasarkan Bukti Audit | Estimasi Effort (Hari Kerja / HK) | Risiko Teknis | Dependensi |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| **Pondasi Autentikasi & Sesi** | Auth / Middleware | **REFACTOR** | NextAuth JWT & bcrypt sudah berjalan baik, tetapi `middleware.ts` melewatkan `/api/*` dan in-memory rate limit hilang saat restart. | 2 – 4 HK | Risiko *session invalidation* sementara jika schema token diubah. | NextAuth, PostgreSQL |
| **Audit Logging System** | Database / Service | **PERTAHANKAN** | Model `AuditLog` di Prisma dan helper sanitasi password sudah terstruktur rapi. Hanya perlu diperluas ke semua server actions. | 1 – 2 HK | Sangat rendah. | Prisma Client |
| **Verifikasi 10 Tahapan Seleksi** (`verify/[candidateId]`) | Frontend / UI | **TULIS ULANG** | Komponen 2.893 baris dengan 50+ hook useState. Mustahil di-maintain tim kecil. Wajib dipecah menjadi modul tahapan independen. | 7 – 10 HK | Potensi regresi form input jika tidak dipetakan teliti. | Skema Database Baru |
| **Data Seleksi 10 Stage (`stageData`)** | Database / ORM | **TULIS ULANG** | Mengganti kolom "black-hole" untyped JSON `stageData` dengan tabel relasional formal (`InterviewAssessment`, `McuRecord`, `OfferingRecord`). | 5 – 8 HK | Perlu migrasi data lama yang sudah terlanjur ada di database staging/prod. | PostgreSQL, Prisma |
| **Document Generator & BAST** (`GenerateDocumentsClient`, `lib/document-generator.ts`) | Frontend & Service | **TULIS ULANG** | 5.814 baris kode monolit, injeksi mock kandidat, dan DOM rasterize screenshot `html2canvas` yang lambat. Wajib diganti server-side document rendering. | 6 – 9 HK | Perlu penyesuaian template tata letak dokumen cetak resmi DPP. | `docx`, `exceljs` |
| **Server Actions Rekrutmen** (`app/actions/job.ts`) | Domain Logic / Server | **REFACTOR** | Pecah file raksasa 1.717 baris menjadi modul terpisah (`job-orders.ts`, `pipeline.ts`, `interviews.ts`, `talent-pool.ts`). Tambal 6 bypass auth kritis. | 4 – 6 HK | Pemutusan referensi import pada komponen yang memanggil action ini. | Auth Guard |
| **Master Data & SLA** (`settings/master-data/*`) | UI & Server Action | **REFACTOR** | Struktur CRUD sudah berjalan, tetapi hapus duplikasi tabel sertifikasi (`schema.prisma:173,185`) dan tambahkan auth guard di skema sertifikasi. | 2 – 3 HK | Perubahan nama tabel master di database. | Prisma ORM |
| **GeoSource Map & Top BLK Chart** (`geosource/page.tsx`, `TopBlkChart.tsx`) | Frontend / UI | **BUANG** | Modul tidak memiliki nilai operasional bagi bisnis *Labor Supply* DPP. Membebani bundle dengan Leaflet dan dependensi unpkg eksternal. | 1 – 2 HK | Sangat rendah (cukup hapus rute dan menu navigasi). | Tidak ada |
| **Dependensi Rentan `xlsx` & Terbengkalai `@tiptap/*`** | Dependencies | **BUANG** | `xlsx` memiliki kerentanan kritis Prototype Pollution dan tidak dipakai. Tiga paket `@tiptap` terpasang tanpa pernah diimpor. | 0.5 – 1 HK | Sangat rendah (jalankan `npm uninstall xlsx @tiptap/* html-to-docx`). | `package.json` |
| **Candidate Portal Self-Service** (`app/candidate/*`) | Frontend / UI | **REFACTOR** | Pertahankan registrasi akun, tetapi sederhanakan form profil panjang dan sediakan fitur *Quick Apply* mobile. | 4 – 6 HK | Akses pelamar yang sedang aktif mengisi profil. | Candidate Auth |
| **Fitur Baru: Assisted Bulk Import (Excel)** | Core Business Feature | **BANGUN BARU** | Menambahkan fitur import data pelamar massal via file spreadsheet untuk kebutuhan recruiter mengunggah data pelamar lapangan. | 4 – 6 HK | Format spreadsheet dari staf lapangan sering tidak seragam. | `exceljs` |
| **Infrastruktur Kontainer & Docker** | DevOps / Infra | **PERTAHANKAN** | Docker multi-stage build dan compose isolasi staging/prod port sudah tepat. Hanya perlu perbaikan script entrypoint dan proteksi secret. | 1 – 2 HK | Sangat rendah. | Docker Engine |

---

## 2. Perbandingan Tiga Opsi Revamp Menyeluruh

Untuk memberi dasar keputusan yang kokoh bagi IT Leader DPP, tim audit menyusun tiga opsi komprehensif:

```
Perbandingan Ringkas Opsi Revamp:
┌─────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│ Parameter Evaluasi  │ OPSI A: Stabilkan    │ OPSI B: Revamp Arah  │ OPSI C: Total Rancang│
│                     │ & Tambal Minimal     │ (Rekomendasi Tim)    │ Ulang dari Nol       │
├─────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ Total Hari Kerja    │ 8 – 14 Hari Kerja    │ 25 – 35 Hari Kerja   │ 50 – 75 Hari Kerja   │
│ Biaya Tambahan OPEX │ Rp 0                 │ Rp 0 (Resource Exist)│ Tinggi (Opportunity) │
│ Kode Terselamatkan  │ ~90%                 │ ~65% - 70%           │ 0% - 15%             │
│ Eliminasi AI Slop   │ Rendah (~25%)        │ Tinggi (~85%)        │ 100%                 │
│ Kepatuhan UU PDP    │ Parsial (Tambal Celah) Penuh (Enkripsi DB)   │ Penuh                │
│ Kesesuaian Bisnis   │ Buruk (Tetap Lambat) │ Sangat Baik (Cepat)  │ Sangat Baik          │
│ Risiko Kegagalan    │ Rendah               │ Terukur & Terkelola  │ Tinggi (Molor Waktu) │
└─────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

---

### OPSI A: Stabilkan & Tambal Minimal (*Minimal Patch*)
Fokus eksklusif pada penutupan lubang keamanan (*blocker*) dan bug kritis tanpa mengubah arsitektur antarmuka atau alur bisnis.

- **Cakupan Pekerjaan:**
  1. Tambahkan `requireStaffSession()` pada 6 Server Action di `app/actions/job.ts` (menghentikan kebocoran database pelamar).
  2. Tambahkan matcher `/api/:path*` di `middleware.ts`.
  3. Pindahkan kredensial/kontak hardcoded di `lib/mcu-clinics.ts` ke database/environment variable.
  4. Hapus penggabungan `MOCK_MCU_CANDIDATES` di `GenerateDocumentsClient.tsx`.
  5. Hapus dependensi rentan `xlsx`, `html-to-docx`, dan `@tiptap/*`.
  6. Perbarui versi Next.js (`npm audit fix`) untuk menutup celah keamanan RCE.
- **Urutan Fase:** 1 Fase Tunggal (Patch & Security Fix).
- **Total Estimasi Waktu:** **8 – 14 Hari Kerja (HK)**.
- **Biaya Tambahan:** Rp 0.
- **Dampak ke Pengguna:** Pengguna tidak merasakan perubahan alur. Recruiter tetap bekerja lambat karena form monolitik 2.893 baris tidak diubah dan ketiadaan fitur *bulk action*.
- **Kelemahan Fatal:** Masalah mendasar (*AI slop*, performa lambat, `stageData` black-hole JSON, ketidakcocokan proses *labor supply*) **tetap ada dan menjadi beban teknis (*technical debt*) yang menumpuk di masa depan**.

---

### OPSI B: Revamp Terarah (*Targeted Revamp*) — **REKOMENDASI UTAMA**
Mempertahankan fondasi teknologi yang sudah baik (Next.js 16 App Router, Tailwind CSS, Prisma ORM, PostgreSQL, Docker Compose, Cloudflare R2), membuang modul AI slop yang rapuh, merombak modul verifikasi & generator dokumen menjadi komponen modular, serta menambahkan fitur kunci *Labor Supply* (Headcount tracking & Bulk Import).

- **Cakupan Pekerjaan:**
  1. **Fase 1: Security & Dependency Hardening (5 HK):**
     - Selesaikan seluruh tambalan keamanan pada Opsi A.
     - Terapkan enkripsi *Field-Level* (AES-256-GCM) untuk NIK, KK, dan data hasil MCU di database.
     - Ganti in-memory rate limiter dengan tabel database atau Redis.
  2. **Fase 2: Database Normalization & Schema Refactor (6 HK):**
     - Bongkar kolom `Application.stageData` JSON menjadi tabel relasional: `ApplicationAssessment`, `MedicalRecord`, dan `ContractRecord`.
     - Tambahkan kolom soft-delete (`deletedAt`) dan relasi tracking kuota headcount klien di `JobOpening`.
  3. **Fase 3: Pemecahan Mega-Monolit & Redesain UI Recruiter (12 HK):**
     - Bongkar `verify/[candidateId]/page.tsx` (2.893 baris) menjadi 10 komponen tahapan terpisah yang di-load secara dinamis (*lazy load/Suspense*).
     - Rombak `GenerateDocumentsClient.tsx` (3.332 baris): pisahkan antarmuka pemilihan kandidat dari mesin generator dokumen.
     - Ganti konversi PDF `html2canvas` DOM screenshot dengan generator PDF server-side berbasis vektor yang tajam dan teksnya dapat disalin.
     - Tambahkan **Fitur Tindakan Massal (*Bulk Actions*)** di tabel pipeline: loloskan massal kandidat ke tahapan berikutnya dalam satu klik.
     - Tambahkan **Fitur Import Massal Kandidat (Excel)** untuk kebutuhan operasional staf lapangan.
  4. **Fase 4: Pembersihan Kode & Testing (7 HK):**
     - Hapus modul tidak berguna (GeoSource Map & Top BLK Chart).
     - Pecah `app/actions/job.ts` (1.717 baris) menjadi modul-modul server action kecil.
     - Buat unit test komprehensif untuk alur bisnis seleksi dan generator berkas.
- **Total Estimasi Waktu:** **25 – 35 Hari Kerja (HK)** (Dapat diselesaikan dalam ~5–7 minggu oleh tim kecil 2 orang).
- **Biaya Tambahan:** Rp 0 (Memaksimalkan VM Azure dan akun Cloudflare R2 yang sudah aktif).
- **Kriteria Keberhasilan Terukur:**
  - Skor Slop sistem turun dari **3.4** menjadi **< 1.0**.
  - Waktu muat halaman verifikasi kandidat turun dari >3 detik menjadi **< 500 ms**.
  - Waktu recruiter memproses 20 kandidat ke tahap MCU berkurang dari 60 menit menjadi **< 3 menit**.
  - Tidak ada satupun Server Action yang terbuka tanpa auth guard.
  - Kepatuhan penuh terhadap UU PDP No. 27/2022 atas data kesehatan dan identitas.

---

### OPSI C: Total Rancang Ulang dari Nol (*Total Rewrite*)
Membuang seluruh repositori saat ini dan membangun aplikasi baru dari awal (*greenfield project*).

- **Cakupan Pekerjaan:** Memulai dari inisialisasi project baru, merancang ulang database, otentikasi, UI design system, integrasi R2, hingga pembuatan seluruh modul dari nol.
- **Total Estimasi Waktu:** **50 – 75 Hari Kerja (HK)** (Memerlukan waktu 3 – 4 bulan penuh).
- **Biaya Tambahan:** Tingkat kehilangan momentum bisnis (*opportunity loss*) sangat tinggi karena operasional DPP harus tertunda berbulan-bulan.
- **Evaluasi Teknis:** **TIDAK DIREKOMENDASIKAN**. Codebase saat ini memiliki fondasi yang cukup bernilai (integrasi Cloudflare R2 streaming, konfigurasi Docker Compose staging/production, skema NextAuth, generator DOCX/XLSX dasar, dan 13 Master Data). Membuang 100% kode adalah pemborosan waktu dan biaya yang tidak efisien bagi IT Leader yang baru menjabat.

---

## 3. Rekomendasi Tim Audit

> [!TIP]
> **Rekomendasi Utama Tim Gabungan: PILIH OPSI B (Revamp Terarah)**  
> 
> Opsi B memberikan rasio *Return on Investment (ROI)* terbaik: menyelamatkan sekitar **65%–70% kode yang baik**, mengeliminasi 100% *AI slop* yang berbahaya, menutup celah sanksi UU PDP, dan memberikan peningkatan produktivitas drastis kepada tim recruiter di lapangan dengan penambahan fitur *Bulk Actions* dan *Bulk Import Excel*.

---

## 4. Tindakan Wajib Diperbaiki Apa Pun Opsi yang Dipilih (*Mandatory Blockers*)

Sebelum keputusan Opsi A, B, atau C dijalankan secara penuh, **lima tindakan perbaikan darurat berikut wajib dieksekusi terlebih dahulu dalam 48 jam** guna mencegah kebocoran data di server staging/production:

1. **[BLOCKER 1] Kunci 6 Server Action Terbuka (`app/actions/job.ts`):**  
   Tambahkan `const auth = await requireStaffSession(); if (!auth.authorized) throw new Error(...)` pada fungsi `getPaginatedTalentPool`, `getPaginatedArchivedCandidates`, `getPaginatedBlacklistedCandidates`, `getPaginatedInterviewsDashboardData`, `getPaginatedJobOpenings`, dan `getFilteredPipelineData`.
2. **[BLOCKER 2] Hapus PII Karyawan Hardcoded (`lib/mcu-clinics.ts`):**  
   Hapus nama, nomor handphone, dan email staf DPP dari file source code repositori.
3. **[BLOCKER 3] Pasang Matcher `/api/*` di Middleware (`middleware.ts`):**  
   Ubah matcher agar mencakup seluruh rute API.
4. **[BLOCKER 4] Hapus Injeksi Mock Kandidat (`GenerateDocumentsClient.tsx:970-977`):**  
   Hentikan penggabungan data `MOCK_MCU_CANDIDATES` agar data tiruan tidak mencemari lingkungan operasional nyata.
5. **[BLOCKER 5] Update Pustaka Rentan Melalui npm audit:**  
   Hapus paket `xlsx` (`npm uninstall xlsx @tiptap/pm @tiptap/react @tiptap/starter-kit html-to-docx`) dan perbarui dependensi Next.js & Dompurify ke versi bebas kerentanan RCE.

