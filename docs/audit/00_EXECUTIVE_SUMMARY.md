# 00. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)
**AUDIT KOMPREHENSIF PORTAL REKRUTMEN PT DIAN PANDU PRATAMA (DPP)**  
*Disusun oleh: Tim Gabungan Principal Engineer, UX Auditor, Security Reviewer, & Business Analyst*  
*Ditujukan kepada: IT Leader PT Dian Pandu Pratama*  
*Tanggal: 13 November 2026*  
*Status: FINAL (Read-Only Audit — 9 Dokumen Selesai)*

---

## 1. Kondisi Nyata Proyek Saat Ini (Current State & Health)

Aplikasi **DPP Recruitment Portal Dashboard** dibangun di atas stack modern: **Next.js 16.2.12 (App Router), React 19, Tailwind CSS v4, Prisma 5.15, PostgreSQL 15, dan Cloudflare R2**. Proyek ini mencakup **143 file TypeScript dengan total 40.845 baris kode**.

**Penilaian Kesehatan Proyek:**  
Proyek ini berhasil dibangun dengan kecepatan tinggi berkat bantuan kecerdasan buatan (AI) dan tampak berfungsi baik pada skenario pengujian demo (*happy path*). Namun, di balik antarmuka visualnya, sistem ini menyimpan **kerapuhan arsitektural ekstrem (*AI slop*), 6 celah keamanan kritis yang membocorkan database pelamar, potensi sanksi hukum berat di bawah UU PDP No. 27/2022 atas data rekam medis MCU, serta ketidaksesuaian fundamental dengan model bisnis penyedia tenaga kerja (*labor supply*) ke sektor tambang dan maritim**.

```
Indikator Metrik Kunci Kesehatan Sistem:
• Skor Slop Keseluruhan  : 3.4 / 5.0 (Tinggi / Kategori Rapuh)
• File Komponen Raksasa  : 25 File > 400 Baris (Terbesar: 3.332 Baris)
• Masalah Kode (ESLint)  : 644 Masalah (482 Error, 162 Warning)
• Kerentanan Dependensi  : 12 Kerentanan (2 Kritis: RCE Next.js & XSS DOMPurify)
• Cakupan Pengujian Bisnis: 0% (Hanya 1 file test helper 95 baris)
• Kepatuhan UU PDP       : GAGAL (Data MCU disimpan dalam Plaintext JSON Blob)
```

---

## 2. Lima (5) Temuan Terpenting

### 1. [KRITIS] Enam (6) Server Actions Baru Membocorkan Seluruh Database Pelamar Tanpa Autentikasi
*Lokasi Bukti: `app/actions/job.ts:1160, 1304, 1420, 1518, 1697, 1786`*  
Pada komit penggabungan fitur paginasi dan filter tabel terkini, enam fungsi Server Action (`getPaginatedTalentPool`, `getPaginatedArchivedCandidates`, `getPaginatedBlacklistedCandidates`, `getPaginatedInterviewsDashboardData`, `getPaginatedJobOpenings`, `getFilteredPipelineData`) **tidak dibungkus oleh session guard atau RBAC sama sekali**. Siapa pun dari internet tanpa perlu login dapat mengeksekusi fungsi ini untuk menarik seluruh NIK KTP, nama lengkap, nomor WhatsApp, alamat, dan catatan riwayat pelamar DPP.

### 2. [KRITIS] Pelanggaran UU PDP No. 27/2022 atas Data Medis Sensitif (Hasil MCU Tambang)
*Lokasi Bukti: `prisma/schema.prisma:283`, `app/actions/candidate-application.ts:278`*  
Data hasil uji laboratorium kesehatan dan status kelayakan fisik (*Fit to Work*) pelamar disimpan dalam teks mentah (*plaintext*) di dalam satu kolom JSON `stageData` tanpa enkripsi *at-rest* dan tanpa pemisahan hak akses medis. Sesuai Pasal 4 Ayat 2a UU PDP, data kesehatan adalah **Data Pribadi Bersifat Spesifik** yang mewajibkan proteksi enkripsi ketat. Kegagalan menjaga kerahasiaan ini mengancam korporasi dengan sanksi denda administratif hingga Rp 60 Miliar dan tuntutan pidana.

### 3. [TINGGI] Arsitektur Monolitik Ekstrem & Pola "AI Slop" Menyeluruh
*Lokasi Bukti: `verify/[candidateId]/page.tsx:1-2893`, `GenerateDocumentsClient.tsx:1-3332`*  
Terdapat 25 file dengan ukuran di atas 400 baris. Halaman verifikasi kandidat dibangun sebagai satu komponen raksasa 2.893 baris dengan lebih dari 50 hook `useState`. Selain itu, ditemukan praktik penyembunyian bug melalui **penelanan error diam-diam (`catch (e) {}` di 5 file)** serta **injeksi kandidat rekaan otomatis (`MOCK_MCU_CANDIDATES:142`)** yang menyusup ke modul cetak dokumen operasional nyata.

### 4. [TINGGI] Ketidaksesuaian Alur Sistem dengan Kebutuhan Nyata *Labor Supply* Tambang
*Lokasi Bukti: `schema.prisma:240-272`, `app/dashboard/talent-pool/add/page.tsx:1-524`*  
Sistem saat ini didesain menyerupai portal lowongan kerja publik (*job portal*) konvensional. Sistem **tidak memiliki pelacakan realisasi kuota headcount klien** (Target PO vs Shortlist vs MCU Fit vs On-Site vs Drop-out), **tidak memiliki fitur Import Massal Kandidat (Excel)** untuk staf lapangan, dan mengharuskan recruiter memproses pelamar satu per satu (14 klik per orang), yang membuat operasional jauh lebih lambat dibanding mengelola spreadsheet Excel.

### 5. [TINGGI] Kerapuhan Engine Dokumen (DOM Rasterize Screenshot) & Bloat Dependensi
*Lokasi Bukti: `lib/document-generator.ts:1575-1600`, `package.json:25-30`*  
Generator berkas PDF menggunakan teknik tangkapan layar bitmap DOM via iframe (`html2canvas + jspdf`) yang menghasilkan file buram, lambat, dan teksnya tidak dapat disalin. Di sisi lain, terpasang dependensi berbahaya yang tidak pernah diimpor (`xlsx` dengan celah Prototype Pollution, 3 paket `@tiptap/*`, dan `html-to-docx`).

---

## 3. Rekomendasi Strategis Tingkat Tinggi

Tim audit mengevaluasi tiga alternatif keputusan:
- **Opsi A (Stabilkan & Tambal Minimal):** Estimasi 8–14 Hari Kerja. Menambal celah keamanan, namun membiarkan arsitektur monolitik rapuh dan alur bisnis tetap lambat.
- **Opsi B (Revamp Terarah / Targeted Revamp) — [PILIHAN YANG DIREKOMENDASIKAN]:** Estimasi 25–35 Hari Kerja. Mempertahankan fondasi teknologi yang sudah baik (Next.js, Prisma, Docker, R2), membongkar 2 komponen mega-monolit, memisahkan data MCU ke tabel terenkripsi, membuang modul AI slop yang tidak berguna (GeoSource), serta menambahkan fitur penting *Labor Supply* (**Bulk Actions** dan **Import Excel**).
- **Opsi C (Total Rewrite dari Nol):** Estimasi 50–75 Hari Kerja. Membuang seluruh repositori dan membangun ulang. Tidak efisien dan menghilangkan momentum bisnis 3–4 bulan.

> [!TIP]
> **Arah Keputusan IT Leader:**  
> **Jalankan OPSI B (Revamp Terarah).** Opsi ini menyelamatkan **65%–70% aset kode yang ada**, menyelesaikan seluruh kepatuhan UU PDP dan celah otorisasi, menurunkan Skor Slop menjadi **< 1.0**, serta memangkas waktu kerja tim recruiter memproses kandidat hingga 80%.

### Tindakan Darurat (Wajib Dikerjakan dalam 48 Jam Pertama):
1. Tutup 6 Server Action yang tidak terproteksi di `app/actions/job.ts` dengan `requireStaffSession()`.
2. Hapus nomor HP dan email pribadi karyawan yang tertulis di `lib/mcu-clinics.ts`.
3. Pasang matcher rute `/api/:path*` pada `middleware.ts`.
4. Hentikan penggabungan mock data di `GenerateDocumentsClient.tsx:973`.
5. Hapus dependensi rentan `xlsx` dan update paket Next.js.

---

## 4. Tingkat Keyakinan Analisis (Confidence Level)

| Dimensi Audit | Tingkat Keyakinan | Dasar Pembuktian & Metodologi |
| :--- | :---: | :--- |
| **Kualitas Kode & AI Slop** | **98% (Sangat Tinggi)** | Diverifikasi lewat eksekusi compiler `tsc`, scan ESLint (644 masalah), pembacaan langsung baris kode, dan kalkulasi LOC. |
| **Keamanan Siber & RBAC** | **95% (Sangat Tinggi)** | Ditemukan bukti langsung pemanggilan query database tanpa guard pada 6 fungsi Server Action dan celah upload public. |
| **Kepatuhan UU PDP No. 27/2022**| **95% (Sangat Tinggi)** | Berdasarkan analisis langsung model Prisma `Application.stageData` dan ketiadaan enkripsi data medis spesifik. |
| **Kesesuaian Bisnis DPP** | **90% (Tinggi)** | Divalidasi silang terhadap alur kerja nyata industri *labor supply* tambang (PO klien, mobilisasi site, dan tes okupasi). |
| **Infrastruktur & Kontainer** | **92% (Tinggi)** | Menguji `docker-compose.yml`, multi-stage `Dockerfile`, dan konfigurasi port staging/production. |

**Rata-rata Tingkat Keyakinan Keseluruhan: 94% (High Evidentiary Confidence)**

---
*Seluruh laporan detail pendukung tersedia lengkap di folder `docs/audit/` (Dokumen 01 s/d 08).*

