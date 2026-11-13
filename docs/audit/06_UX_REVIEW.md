# 06. TINJAUAN UX & USER JOURNEY PER ROLE
**Analisis Pengalaman Pengguna, Titik Gesekan (Friction Points), dan Usulan Redesain**  
*Auditor: Joint Audit Team (UX Auditor & Product Designer)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Analisis Peran Pengguna (User Personas)

Sistem melayani tiga peran pengguna dengan karakteristik dan kebutuhan yang sangat berbeda:
1. **ADMIN (IT / Operasional Superadmin):** Bertanggung jawab atas ketersediaan sistem, manajemen akun staf recruiter, konfigurasi master data (provinsi, site, posisi, klinik rekanan, skema sertifikasi), dan peninjauan log audit aktivitas.
2. **RECRUITER (Tim Rekrutmen DPP):** Pengguna dengan intensitas operasional tertinggi. Mengelola puluhan permintaan lowongan kerja dari klien tambang/maritim, memproses ratusan berkas pelamar di berbagai tahapan seleksi, menjadwalkan wawancara, menerbitkan surat pengantar MCU, hingga merakit arsip BAST penempatan kerja.
3. **CANDIDATE (Pencari Kerja Lapangan & Back Office):** Calon tenaga kerja (operator alat berat, mekanik, welder, staf administrasi). Sebagian besar mengakses sistem lewat ponsel (*mobile viewport*) dengan bandwidth terbatas di daerah pelosok.

---

## 2. Pemetaan Perjalanan Pengguna (User Journey) & Hitungan Klik

### 2.1 Role: RECRUITER

#### Tugas 1: Membuat Permintaan Lowongan Kerja Baru (*Job Order Klien*)
- **Rute:** `/dashboard/job-openings/create` (`JobCreateClient.tsx:1-562`)
- **Alur & Jumlah Langkah:**
  1. Klik menu *Job Openings* di sidebar (1 klik).
  2. Klik tombol *Tambah Job Opening* (1 klik).
  3. Mengisi **14 field form** secara manual: Nomor Registrasi, Posisi, Customer, Provinsi, Kota, Site, Status Permintaan, Jumlah Permintaan, Tanggal Masuk, Department, Benefit, Form B1, Checkbox BNSP, Checkbox Skill Test (14 input).
  4. Menetapkan rentang tanggal SLA timeline per tahapan seleksi (10 kali pemilihan datepicker = 20 klik).
  5. Klik tombol *Simpan sebagai Draft* atau *Publikasikan* (1 klik).
- **Total Beban Interaksi:** **37 klik / interaksi manual**.
- **Titik Gesekan (Friction):** Tidak ada fitur *"Template Job Order"* atau *"Duplikasi dari Job Sebelumnya"*. Setiap permintaan kuota baru dari klien yang sama harus diketik ulang dari awal.

---

#### Tugas 2: Memverifikasi Kandidat pada Satu Tahapan (*Verify Candidate Page*)
- **Rute:** `/dashboard/job-openings/[id]/verify/[candidateId]` (`page.tsx:1-2893`)
- **Alur & Jumlah Langkah:**
  1. Buka Job Openings Detail (1 klik).
  2. Cari baris pelamar di tabel kandidat (scroll & 1 klik).
  3. Sistem memuat komponen raksasa 2.893 baris (menunggu render browser ~2–4 detik).
  4. Recruiter memeriksa dokumen KTP/KK/CV di tab pratinjau (3 klik).
  5. Scroll ke bawah menuju section form tahapan aktif (misal BNSP).
  6. Mengisi nomor sertifikat, tanggal terbit, masa berlaku, dan memilih skema sertifikasi (4 input).
  7. Centang checkbox *Approved / Lolos* (1 klik).
  8. Klik tombol *Simpan Verifikasi* (1 klik).
  9. Klik tombol *Loloskan ke Tahap Berikutnya* (1 klik).
  10. Muncul popup dialog konfirmasi, klik *Konfirmasi Pindah Stage* (1 klik).
- **Total Beban Interaksi:** **14 klik per kandidat**.
- **Dampak pada Skala Nyata:** Jika terdapat **50 pelamar** yang harus diverifikasi pada hari yang sama, recruiter harus melakukan **700 kali klik interaksi manual**.

---

#### Tugas 3: Menolak Kandidat (*Reject Application*)
- **Rute:** `/dashboard/job-openings/[id]/verify/[candidateId]`
- **Alur & Jumlah Langkah:**
  1. Klik tombol merah *Tolak Kandidat* di pojok kanan atas (1 klik).
  2. Modal penolakan muncul (`showRejectModal`).
  3. Memilih alasan penolakan dari dropdown *Master Rejection Message* (2 klik).
  4. Mengetik catatan tambahan opsional (1 input).
  5. Menentukan apakah kandidat sekaligus dimasukkan ke *Blacklist* atau tidak (1 klik).
  6. Klik tombol *Konfirmasi Penolakan* (1 klik).
- **Total Beban Interaksi:** **6 klik**.

---

#### Tugas 4: Menghasilkan Paket Dokumen BAST & Pengantar MCU
- **Rute:** `/dashboard/generate-documents` (`GenerateDocumentsClient.tsx:1-3332`)
- **Alur & Jumlah Langkah:**
  1. Klik menu *Generate Documents* di sidebar (1 klik).
  2. Memilih tab: *MCU Letter*, *BAST Statement*, atau *BAST Package ZIP* (1 klik).
  3. Mengisi data kontak PIC dan nama dokter klinik tujuan (4 input).
  4. Mencari nama-nama kandidat yang lolos MCU pada tabel filter (5–10 klik).
  5. Klik tombol *Generate Batch MCU Docx* (1 klik).
  6. Menunggu browser melakukan DOM-raster capture via iframe tersembunyi (3–8 detik).
- **Titik Gesekan (Friction):**  
  Karena modul ini menyisipkan kandidat tiruan (`MOCK_MCU_CANDIDATES:142-209`), recruiter sering kali bingung membedakan antara data pelamar nyata dengan data contoh yang ikut muncul di tabel filter.

---

### 2.2 Role: CANDIDATE

#### Tugas: Mendaftar Akun, Mengisi Profil, dan Melamar Pekerjaan
- **Rute:** `/candidate/register` ──> `/candidate/profile` ──> `/jobs/[id]`
- **Alur & Beban Pengguna:**
  1. Halaman Pendaftaran: Isi Nama, Email, Password, Konfirmasi Password (4 input).
  2. Halaman Profil (`/candidate/profile` - 635 baris): Form terdiri dari **10 bagian terpisah**: Data Pribadi, NIK, KK, Tempat/Tanggal Lahir, Agama, Alamat Domisili, Pendidikan Terakhir, Nama Institusi, Pusat Pelatihan/BLK, Kontak Darurat, dan Unggah Berkas Pokok (KTP, KK, Ijazah, CV, Sertifikat).
  3. Kandidat harus mengunggah minimal 3–5 file dokumen (format PDF/JPG).
  4. Menavigasi ke katalog lowongan `/jobs` (1 klik).
  5. Membuka detail posisi dan klik *Lamar Sekarang* (2 klik).
- **Titik Gesekan Kritis (Friction):**
  - **Panjang Form Berlebihan untuk Pekerja Lapangan:** Pengisian form 10 section sangat menyulitkan calon operator/mekanik di lapangan yang mengakses web lewat ponsel pintar dengan layar kecil.
  - **Tanda Tangan Offering Letter Mobile:** Pada saat dinyatakan lolos, kandidat diwajibkan mengunduh file Word/PDF Offering Letter, menandatanganinya secara basah, men-scan ulang, dan mengunggahnya ke antarmuka (`OfferingActionCard.tsx`). Banyak pelamar di daerah tidak memiliki akses mesin printer/scanner, sehingga proses konfirmasi offering macet berhari-hari.

---

## 3. Titik Gesekan Utama (Major Friction Points) & Bukti Kode

| No | Titik Gesekan (Friction Point) | Dampak terhadap Pengguna | Bukti Lokasi Kode |
| :---: | :--- | :--- | :--- |
| **1** | **Ketiadaan Tindakan Massal (*Bulk Actions*) pada Pipeline & Verifikasi** | Recruiter harus membuka dan menyimpan 100 pelamar satu per satu. Tidak bisa mencentang 20 kandidat dan memilih *"Loloskan ke Interview HR"*. | `components/PipelineBoard.tsx`, `verify/[candidateId]/page.tsx` |
| **2** | **Beban Muat Komponen Mega-Monolitik** | Komponen verifikasi 2.893 baris memuat seluruh DOM tahapan 1–10 secara bersamaan, memicu kelambatan browser (*lagging*) saat membuka berkas PDF pelamar. | `app/dashboard/job-openings/[id]/verify/[candidateId]/page.tsx:1-2893` |
| **3** | **Ketiadaan Fitur Import Spreadsheet (Excel/CSV)** | Data pelamar dari lapangan tidak bisa diunggah sekaligus (*batch import*). Recruiter terpaksa mengetik ulang data dari Excel ke form web satu per satu. | `app/dashboard/talent-pool/add/page.tsx:1-524` |
| **4** | **Pencarian Kandidat pada Dropdown Tanpa Paginasi yang Berat** | Dropdown `SearchableSelect.tsx` (430 baris) memuat seluruh daftar posisi dan institusi tanpa *virtual scrolling*, memberatkan memori browser. | `components/ui/SearchableSelect.tsx:1-430` |
| **5** | **Feedback Status yang Membingungkan (Data Mock Tercampur)** | Munculnya data pelamar tiruan di modul cetak BAST/MCU membingungkan recruiter apakah berkas tersebut benar-benar tersimpan di database atau tidak. | `GenerateDocumentsClient.tsx:970-977` |

---

## 4. Usulan Penyederhanaan Antarmuka (UX Simplification Recommendations)

### 4.1 Penyederhanaan Alur Verifikasi Recruiter (Dari 14 Klik Menjadi 2 Klik)
```
[ Alur Verifikasi Saat Ini (14 Klik) ]
Buka Detail ──> Buka Layar 2893 Baris ──> Scroll Tahap ──> Isi Form ──> Simpan ──> Buka Dialog ──> Konfirmasi

[ Rekomendasi Alur Baru: Batch Action Table (2 Klik) ]
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [✓] 20 Kandidat Terpilih     [ Aksi Cepat: Loloskan ke MCU ▼ ] [ Ekspor Excel ] │
├──────────────────────────────────────────────────────────────────────────────────┤
│ [✓] Bambang Tri  │ Welder 6G │ KTP ✓ │ BNSP ✓ │ Fit to Work   │ [Detail Cepat ↗] │
│ [✓] Agus Prasetyo│ Mechanic  │ KTP ✓ │ BNSP ✓ │ Temporary Unfit│ [Detail Cepat ↗] │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Ganti Komponen Mega-Monolit 2.893 Baris dengan Slide-over Modal Modular:**  
   Halaman verifikasi detail dipisah menjadi panel laci (*drawer/slide-over*) ringkas yang hanya memuat tahapan yang sedang aktif, bukan memuat 10 tahapan sekaligus.
2. **Implementasikan Bulk Action Bar di Tabel Pipeline:**  
   Tambahkan kotak centang (*checkbox*) di sisi kiri tabel kandidat. Recruiter dapat memilih beberapa pelamar sekaligus untuk:
   - *Loloskan Massal ke Tahap X*.
   - *Tolak Massal dengan Alasan Y*.
   - *Kirim Surat Pengantar MCU Massal*.
3. **Penyederhanaan Konfirmasi Offering Letter Pelamar:**  
   Sediakan opsi konfirmasi digital satu klik: *"Saya Menyetujui Penawaran Kerja Ini"* dengan kode OTP WhatsApp atau checklist persetujuan digital, tanpa mewajibkan pelamar lapangan mencetak dan men-scan ulang kertas fisik.

