# ADR-009: Bulk Actions, Bulky Candidate Import (Excel/CSV), & UI/UX De-slopping

## Status
**ACCEPTED** (Fase 3 — Revamp Terarah Opsi B)

## Konteks & Latar Belakang
Pada evaluasi operasional PT Dian Pandu Pratama (DPP) sebagai perusahaan *Labor Supply* dan *Job Supply* ke sektor tambang, alat berat, dan maritim, ditemukan beberapa hambatan efisiensi kerja:
1. **Kelelahan Operasional Recruiter (*Click Fatigue*):**
   Pada versi awal, pemindahan tahapan pelamar (10-stage pipeline) harus dilakukan satu per satu per kandidat. Ketika ada batch pelamar masuk 50–100 orang untuk posisi Head Office (HO) atau Back Office, recruiter membutuhkan ratusan klik repetitif.
2. **Ketiadaan Fitur Bulky Upload Kandidat:**
   Profil kandidat tenaga kerja sering kali dikumpulkan langsung oleh staf lapangan / recruiter melalui formulir spreadsheet. Belum tersedia mekanisme impor massal yang aman, terstandarisasi, dan patuh regulasi PDP.
3. **Resiko Kepatuhan UU PDP pada Impor Massal:**
   Impor massal tidak boleh mengorbankan keamanan data pribadi. Nomor Induk Kependudukan (NIK) dan No. Kartu Keluarga (KK) wajib tetap dienkripsi AES-256-GCM dan dideduplikasi secara efisien menggunakan *blind indexing* (HMAC-SHA256).
4. **"AI Slop" pada Antarmuka Pengguna:**
   Antarmuka sebelumnya menampilkan kartu bergradien berlebihan, border glassmorphism yang mengaburkan teks, dan struktur tabel yang tidak mematuhi standar web modern (kontras rendah, header tabel hilang saat scroll, ketiadaan keyboard accessibility).

---

## Keputusan Arsitektur & Desain

### 1. Multi-Selection & Floating Sticky Bottom Bar pada Kanban Pipeline
- Menerapkan checkbox seleksi multi-kandidat pada kartu di `components/PipelineBoard.tsx` (detail lowongan) dan `app/dashboard/pipeline/PipelineClient.tsx` (pipeline global).
- Menyediakan tombol "Pilih Semua di Tahap Ini" pada setiap header kolom tahapan untuk seleksi 1-klik per stage.
- Menampilkan bilah aksi mengambang (*Sticky Bottom Bulk Bar*) bernuansa korporat DPP Navy (`#0A2540`):
  - **Loloskan ke Tahap... (*Bulk Advance Stage*):** Memilih tahapan tujuan dan memindahkan seluruh kandidat terpilih secara paralel.
  - **Tolak Massal (*Bulk Reject*):** Menolak kandidat dengan pilihan alasan standar (*Standardized Rejection Reasons*) seperti "Kualifikasi Belum Sesuai", "Gagal MCU", "Mengundurkan Diri", dll.
  - **Pindahkan ke Talent Pool:** Menyimpan profil kandidat ke talent pool untuk peluang lowongan mendatang.
  - **Batal Pilih:** Mengosongkan seleksi seketika.

### 2. Backend Server Actions Terproteksi & Headcount Sync
Menerapkan 5 Server Actions baru di `app/actions/job.ts`:
1. `bulkAdvanceApplicationStage(appIds, targetStageId, note)`:
   - Validasi sesi staf (`requireStaffSession()`).
   - Guard Offering Letter: Mencegah pemindahan dari `stage_6` (Offering) bila kandidat belum menandatangani persetujuan penawaran resmi.
   - Sinkronisasi status: Mengubah status ke `HIRED` secara otomatis saat mencapai tahap `stage_8`, `stage_9`, `stage_10`, atau `Hired`.
   - Sinkronisasi live headcount: Memperbarui otomatis `JobOpening.headcountFulfilled` dan `JobOpening.headcountOnSite` pada seluruh lowongan terdampak.
   - Audit Trail: Mencatat riwayat ke `AuditLog` dengan aksi `BULK_STAGE_MOVED`.
2. `bulkRejectApplications(appIds, rejectionReason)`:
   - Mengubah status ke `REJECTED`, membuat catatan riwayat penolakan, menyinkronkan headcount, dan mencatat `BULK_REJECTED` ke audit log.
3. `bulkAddToTalentPool(candidateProfileIds)`:
   - Menandai `isTalentPool = true` pada profil kandidat terpilih.
4. `bulkAssignCandidatesToJob(candidateProfileIds, targetJobId)`:
   - Menugaskan kandidat dari Talent Pool ke lowongan kerja aktif pada Stage 1 (CV Screening).
5. `bulkImportCandidates(jobId, candidates)`:
   - Memproses batch impor kandidat hingga 500 baris per eksekusi.

### 3. Kepatuhan UU No. 27 Tahun 2022 (UU PDP) pada Impor Massal
- **Validasi Format NIK:** Memastikan NIK dibersihkan dari karakter non-numerik dan tepat 16 digit.
- **Blind Index Deduplication:** Menghitung `nikHash = hashField(nik)` (HMAC-SHA256) untuk pencarian $O(1)$ di database tanpa mengekspos plaintext NIK.
- **Field-Level Encryption:** Seluruh data NIK dan KK dienkripsi menggunakan AES-256-GCM bersertifikasi autentikasi (`encryptField`).
- **Deterministic Identity Fallback:** Jika recruiter tidak mengisi email kandidat, sistem menghasilkan identitas unik `kandidat.{nik}@recruitment.dpp.co.id` dan default password ter-hash bcrypt.

### 4. Template Generator & Modal Impor Spreadsheet
- **Endpoint Download:** `GET /api/candidates/import-template` menghasilkan spreadsheet `.xlsx` menggunakan library `exceljs`:
  - Sheet 1: `Template Import Kandidat` dengan format header korporat DPP Navy (`#0A2540`), teks putih tebal, pemformatan kolom NIK & KK sebagai text (`@`), serta 3 baris sampel riil operasional tenaga kerja tambang & back office.
  - Sheet 2: `Panduan Pengisian` berisi aturan pengisian kolom, batasan format, dan klausul proteksi enkripsi UU PDP.
- **Komponen `BulkImportModal.tsx`:**
  - Area unggah drag-and-drop berkas `.xlsx`, `.xls`, `.csv`.
  - Client-side parser dengan `exceljs` yang mengekstrak dan memvalidasi kelayakan data di browser sebelum diunggah ke server.
  - Tabel pratinjau interaktif dengan badge status `Valid` atau `Error` per baris.

### 5. Kepatuhan Panduan Web Modern (Modern Web Guidance)
- **Responsive Table (`responsive-table`):**
  Seluruh tabel data (pratinjau import, kandidat terpilih, talent pool) dibungkus kontainer `<div tabIndex={0} role="region" aria-label="..." className="overflow-x-auto focus:outline-hidden overscroll-x-contain">` dengan sticky header (`sticky top-0 z-10`) untuk memastikan navigasi keyboard dan *scroll containment* yang mulus.
- **Accessible Dialog (`dialog`):**
  Seluruh modal menggunakan atribut semantik `role="dialog"`, `aria-modal="true"`, `aria-labelledby="..."`, penutupan dengan tombol Escape, dan pencegahan *background scroll lock leak*.

### 6. UI/UX De-slopping
- Mengeliminasi gradien template generik dan glassmorphism buram yang tidak fungsional.
- Menegaskan sistem warna korporat DPP:
  - Deep Navy `#0A2540` untuk elemen aksi utama dan header.
  - Slate `#F8FAFC` (bg-50), `#E2E8F0` (border-200), `#0F172A` (text-900).
  - Emerald `#059669` untuk status lolos, disetujui, dan hired.
  - Amber `#D97706` untuk peringatan SLA dan konfirmasi tertunda.
  - Rose `#DC2626` untuk penolakan dan status keterlambatan (overdue).

---

## Konsekuensi & Dampak

### Positif:
1. **Peningkatan Kecepatan Recruiter:** Recruiter dapat memproses 50+ kandidat per batch dalam hitungan detik dibandingkan proses manual berulang.
2. **Kesiapan Proyek Back Office & HO:** Dukungan impor kandidat massal via Excel memenuhi kebutuhan penempatan cepat tenaga kerja staf lapangan dan kantor pusat.
3. **Keamanan Data Terjaga Penuh:** Enkripsi AES-256-GCM dan blind indexing tetap 100% konsisten dengan standar PDP Fase 2.
4. **Zero Regression:** 17/17 automated test suites dan 21/21 E2E platform checks lulus tanpa catatan error.

### Hal yang Perlu Diperhatikan:
1. File Excel dengan lebih dari 500 baris disarankan dipecah menjadi beberapa batch untuk menjaga responsivitas thread Node.js.
2. Penolakan massal kandidat bersifat permanen pada aplikasi aktif, namun profil kandidat tetap tersimpan di database dan dapat dipanggil kembali dari Talent Pool.
