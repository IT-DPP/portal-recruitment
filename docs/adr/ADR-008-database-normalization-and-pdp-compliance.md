# ADR-008: Normalisasi Database (Decoupling stageData) & Kepatuhan UU PDP No. 27/2022

## Status
**Diterima & Diimplementasikan (Fase 2 Revamp Terarah - Opsi B)**

## Konteks & Masalah
Berdasarkan hasil audit komprehensif pada dokumen `docs/audit/05_SECURITY_PDP_REVIEW.md` dan `docs/audit/04_TECHNICAL_REVIEW.md`, ditemukan kerentanan kritis arsitektur data:
1. **Black-Hole JSON (`Application.stageData`):** Seluruh hasil evaluasi dari 10 tahapan seleksi (*CV Screening*, *Interview HR*, *Psikotes*, *Test Skill*, *Interview User*, *Offering*, *MCU*, *Training*, *Induction*, *PKWT*) disimpan dalam satu kolom JSON `Json?` tanpa skema tipe yang jelas.
2. **Pelanggaran UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP):**
   - **Pasal 4 Ayat 2a:** Data kesehatan (hasil uji laboratorium *Medical Check-Up* dan kelayakan fisik *Fit to Work*) adalah **Data Pribadi Bersifat Spesifik**.
   - Menyimpan data medis dalam *plaintext* di dalam JSON umum tanpa enkripsi *at-rest* dan tanpa pemisahan hak akses medis melanggar standar pengamanan teknis (Pasal 35 & 39), dengan ancaman sanksi denda administratif hingga Rp 60 Miliar dan pertanggungjawaban pidana korporasi.
   - NIK dan KK kandidat pada `CandidateProfile` disimpan dalam teks mentah (*plaintext*).
3. **Ketiadaan Pelacakan Headcount Labor Supply:** PT Dian Pandu Pratama (DPP) mengelola pemenuhan kuota tenaga kerja ke klien tambang/maritim. Kolom `jumlahPermintaan` tidak memiliki metrik pemenuhan kuota (*fulfilled*, *on-site*).
4. **Ketiadaan Soft Delete & Indeks Komposit:** Data lamaran dan kandidat berisiko terhapus permanen (*hard delete*), serta query pencarian status lamaran rentan terhadap *full-table scan*.

## Keputusan Arsitektural

### 1. Implementasi Field-Level Encryption (AES-256-GCM & Blind Index)
Dibuat utilitas kriptografi bersertifikasi standar industri pada `lib/crypto.ts`:
- **Enkripsi Simetrik Otentikasi:** Menggunakan algoritma **AES-256-GCM** dengan *initialization vector* (IV) 96-bit unik per enkripsi dan *authentication tag* 128-bit untuk mencegah modifikasi/tampering data.
- **Format Ciphertext:** `enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`.
- **Backward-Compatibility:** Fungsi `decryptField` mendeteksi prefix `enc:v1:`. Jika mendapati data lama yang belum terenkripsi, data dikembalikan secara transparan tanpa error *runtime*.
- **Blind Index (HMAC-SHA256):** Untuk atribut yang memerlukan pencarian/indeks unik (seperti NIK pada `CandidateProfile.nikHash`), sistem menghitung *hash* deterministik ber-salt rahasia sehingga pencarian `O(1)` di database tetap bekerja tanpa pernah membuka plaintext NIK.

### 2. Dekopling `stageData` Menjadi 4 Model Relasional Formal
Prisma schema dinormalisasi menjadi model relasional dengan relasi integritas referensial dan enum eksplisit:
1. **`ApplicationAssessment`:** Menyimpan penilaian objektif bertahap (*CV Screening*, *Interview HR*, *Psikotes*, *Test Skill*, *Interview User*, dan *Validasi Sertifikasi BNSP*).
2. **`MedicalCheckUp`:** Menyimpan data klinik rujukan, jadwal, tanggal selesai, paket MCU, kategori fitness (*FIT*, *FIT_WITH_RESTRICTION*, *TEMPORARY_UNFIT*, *UNFIT*), bukti pelaksanaan, dan kolom **`doctorNotesEncrypted`** yang terenkripsi AES-256-GCM (UU PDP).
3. **`OfferingLetterRecord`:** Menyimpan status penawaran (*DRAFT*, *SENT*, *ACCEPTED*, *DECLINED*, *REJECTED_FINAL*), tanggal tanda tangan, berkas bertandatangan, serta enkripsi data kompensasi rahasia (*baseSalaryEncrypted*, *siteAllowanceEncrypted*).
4. **`ContractMobilization`:** Menyimpan nomor kontrak PKWT, NRP karyawan di site tambang, nomor *Mine Permit* / SIMPER, tanggal training & induksi, periode PKWT, status BAST, serta status mobilisasi fisik (*PENDING*, *TRAINING*, *INDUCTION*, *READY_TO_DEPLOY*, *IN_TRANSIT*, *ARRIVED_ON_SITE*, *COMPLETED*).

### 3. Kompatibilitas Transisi (Non-Destructive)
- Kolom legacy `Application.stageData` **TIDAK DIHAPUS**. Server Action membaca dan menyinkronkan data ke tabel relasional baru sekaligus memperbarui `stageData` JSON secara paralel.
- Seluruh antarmuka UI dan endpoint API yang ada tetap berjalan tanpa terpengaruh perubahan skema database.

### 4. Pelacakan Headcount & Optimasi Kinerja Database
- Menambahkan kolom `headcountTarget`, `headcountFulfilled`, dan `headcountOnSite` pada `JobOpening`.
- Menambahkan kolom `deletedAt DateTime?` (*soft delete*) pada `CandidateProfile`, `JobOpening`, dan `Application`.
- Menambahkan indeks komposit:
  - `JobOpening(status, customerId)`
  - `JobOpening(status, tanggalMasuk)`
  - `Application(jobId, status)`
  - `Application(candidateProfileId, status)`
  - `CandidateProfile(isTalentPool, isBlacklisted, isArchived)`

### 5. Script Migrasi & Backfill Data Idempoten
Dibuat script migrasi data aman `scripts/migrate-stagedata-to-relational.ts` (`npm run db:migrate:fase2`):
- Membaca data `CandidateProfile`, mengenkripsi NIK/KK lama, dan membuat `nikHash`.
- Mengurai data historis `stageData` JSON dan mengisinya ke `ApplicationAssessment`, `MedicalCheckUp`, `OfferingLetterRecord`, dan `ContractMobilization`.
- Menghitung ulang dan menyinkronkan kuota *headcount* untuk setiap lowongan pekerjaan.
- Dibuat berkas migrasi resmi `prisma/migrations/20261113140000_fase2_normalization_and_pdp/migration.sql` untuk deployment CI/CD dan staging/production VM.

## Konsekuensi & Verifikasi
- **Positif:**
  - Kepatuhan UU PDP No. 27/2022 terpenuhi untuk data medis (MCU) dan PII (NIK/KK).
  - Integritas data seleksi 10 tahapan terjamin oleh *foreign key* dan *constraint* tipe database PostgreSQL.
  - Performa query pelaporan meningkat secara signifikan melalui indeks komposit tanpa *full table scan*.
  - Alur bisnis *Labor Supply* DPP kini memiliki visibilitas langsung terhadap pemenuhan headcount per site tambang.
- **Verifikasi Teknis:**
  - `lib/__tests__/crypto.test.ts`: 7/7 tes unit kriptografi lulus (enkripsi, dekripsi, deteksi perusakan, blind index, masking NIK, backward compatibility).
  - Total unit test suite: 13/13 tes passing.
  - `npx tsc --noEmit`: 0 error tipe TypeScript.
  - `npm run build`: 54 rute Next.js 16 App Router terkompilasi bersih tanpa *breaking changes*.
