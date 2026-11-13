# ADR-007: Pengamanan Server Actions, Gerbang Middleware API, dan Eliminasi Ketergantungan Rentan

- **Status:** Accepted
- **Tanggal:** 2026-11-13
- **Pengambil Keputusan:** IT Leader PT Dian Pandu Pratama, Principal Engineer, Security Reviewer

---

## 1. Konteks
Berdasarkan hasil Audit Komprehensif (Fase Revamp Opsi B), ditemukan sejumlah kerentanan keamanan kritis dan kerapuhan teknis yang harus segera dituntaskan pada Fase 1:
1. **Server Actions Tanpa Otorisasi (`app/actions/job.ts`):** Enam fungsi Server Action baru hasil penggabungan fitur paginasi dan filter dari branch `main` (`getPaginatedTalentPool`, `getPaginatedArchivedCandidates`, `getPaginatedBlacklistedCandidates`, `getPaginatedInterviewsDashboardData`, `getPaginatedJobOpenings`, dan `getFilteredPipelineData`) tidak memiliki guard autentikasi/RBAC. Hal ini memungkinkan siapa saja tanpa login mengekstrak seluruh data pribadi kandidat (NIK, WhatsApp, nama, status penolakan, catatan blacklist).
2. **Bypass Otorisasi Master Data (`app/actions/master-data.ts`):** Fungsi pembuatan, pengubahan, dan penghapusan skema sertifikasi BNSP dapat dipanggil tanpa sesi staf.
3. **Gerbang Middleware Melewatkan API (`middleware.ts`):** Matcher middleware hanya mencakup rute tampilan (`/`, `/jobs`, `/dashboard`, `/candidate`), membiarkan seluruh rute `/api/*` tidak terlindungi pada lapis filter pertama.
4. **Hardcoded PII Karyawan (`lib/mcu-clinics.ts`):** Nama lengkap pejabat HR, nomor handphone pribadi/operasional, dan 6 alamat email `@dpp.co.id` tertulis permanen di kode sumber.
5. **Injeksi Mock Data Otomatis (`GenerateDocumentsClient.tsx`):** Data 6 kandidat tiruan dengan NIK palsu digabungkan secara otomatis ke antarmuka produksi pencetakan dokumen MCU.
6. **Dependensi Rentan dan Tak Terpakai:** Terpasang library `xlsx` (memiliki celah Prototype Pollution & ReDoS) yang sebenarnya tidak dipakai karena kode menggunakan `exceljs`, serta 3 paket `@tiptap/*` dan `html-to-docx` yang tidak pernah diimpor.

---

## 2. Opsi yang Dipertimbangkan

### Opsi A: Membiarkan Server Actions Terbuka dengan Asumsi Protected by Obscurity
- **Kekurangan:** Fatal. Sesuai arsitektur Next.js, Server Actions dapat dipanggil langsung melalui HTTP POST menggunakan endpoint action ID. Data pribadi pelamar (UU PDP No. 27/2022) bocor ke publik.

### Opsi B: Mengamankan Lapis Server Actions, API Middleware, dan Membersihkan Bloatware (Dipilih)
- **Kelebihan:**
  - Menutup 100% celah kebocoran database kandidat secara tuntas.
  - Menerapkan arsitektur keamanan berlapis (*Defense-in-Depth*): perlindungan di gerbang global `middleware.ts` DAN verifikasi di level Server Action / API Route.
  - Menghilangkan PII karyawan dari kode sumber publik repositori.
  - Menghilangkan bloatware dependensi dan kerentanan keamanan pihak ketiga.

---

## 3. Keputusan
Tim menyetujui implementasi **Opsi B** dengan langkah:
1. **Penerapan Guard Wajib pada 6 Server Actions:**  
   Menyematkan `const auth = await requireStaffSession(); if (!auth.authorized) return { success: false, error: auth.error };` di awal eksekusi seluruh fungsi paginasi pada `app/actions/job.ts`.
2. **Penerapan Guard pada Master Data Sertifikasi:**  
   Menyematkan `requireStaffSession()` pada `createCertificationSchema`, `updateCertificationSchema`, `deleteCertificationSchema`, dan `ensureExtendedPipelineStages` di `app/actions/master-data.ts`.
3. **Perluasan Matcher & Otorisasi Global API:**  
   Menambahkan `"/api/:path*"` pada `config.matcher` di `middleware.ts` dengan pengecualian whitelist untuk rute publik (`/api/auth/*` dan `/api/health`).
4. **Sanitasi PII Karyawan:**  
   Mengganti nilai hardcoded di `lib/mcu-clinics.ts` dengan fallback environment variable aman (`process.env.NEXT_PUBLIC_MCU_*`) dan placeholder generik.
5. **Pembersihan Mock Data di Antarmuka Produksi:**  
   Menghapus logika penggabungan `MOCK_MCU_CANDIDATES` pada `GenerateDocumentsClient.tsx` sehingga modul hanya memproses data kandidat riil dari database.
6. **Eliminasi Paket Rentan:**  
   Mencopot library `xlsx`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, dan `html-to-docx`.

---

## 4. Konsekuensi
- **Positif:**
  - Database pelamar (NIK, KK, kontak) terlindungi penuh dari akses tidak sah.
  - Kepatuhan awal terhadap prinsip perlindungan data UU No. 27/2022 terpenuhi.
  - Ukuran `node_modules` dan bundle aplikasi berkurang.
  - Menghilangkan temuan kritis pada laporan `npm audit`.
- **Negatif / Tindak Lanjut:**
  - Setiap endpoint API atau Server Action baru di masa depan wajib mengikuti standar otorisasi yang telah ditetapkan.

