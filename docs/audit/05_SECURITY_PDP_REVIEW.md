# 05. AUDIT KEAMANAN & KEPATUHAN UU PDP
**Evaluasi Keamanan Siber & Kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**  
*Auditor: Joint Audit Team (Security Reviewer & Principal Engineer)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Landasan Hukum & Regulasi (UU PDP No. 27 Tahun 2022)

Sebagai perusahaan penyedia tenaga kerja (*Labor Supply*), PT Dian Pandu Pratama (DPP) bertindak sebagai **Pengendali Data Pribadi (*Personal Data Controller*)**. 

Aplikasi ini memproses dua kategori data pribadi:
1. **Data Pribadi Bersifat Umum (Pasal 4 Ayat 3):** Nama lengkap, jenis kelamin, kewarganegaraan, agama, status perkawinan, data identitas tunggal (NIK KTP, Nomor Kartu Keluarga, SIM, NPWP), riwayat pendidikan, dan nomor telepon/WhatsApp.
2. **Data Pribadi Bersifat Spesifik (Pasal 4 Ayat 2 huruf a):** **Data dan informasi kesehatan**, yang mencakup hasil pemeriksaan *Medical Check-Up* (MCU), rontgen thorax, uji narkoba 6 parameter, riwayat penyakit kerja, dan status *Fit to Work*.

> [!CAUTION]
> **Sanksi Hukum Pelanggaran UU PDP:**  
> Menurut Pasal 57 & Pasal 67–68 UU No. 27/2022:  
> - **Denda Administratif:** Hingga 2% dari pendapatan tahunan atau maksimal Rp 60 Miliar bagi korporasi yang gagal menjaga kerahasiaan data pribadi pemohon.  
> - **Sanksi Pidana:** Penjara hingga 5 tahun dan/atau denda pidana hingga Rp 5 Miliar bagi pihak yang secara melawan hukum memperoleh atau mengungkapkan data pribadi milik orang lain.

---

## 2. Ringkasan Matriks Temuan Keamanan & Privasi

| ID Temuan | Tingkat Keparahan | Kategori Masalah | Lokasi Bukti File & Baris | Status Verifikasi |
| :--- | :---: | :--- | :--- | :---: |
| **SEC-01** | **KRITIS** | Bypass Autentikasi / Data Leakage pada Server Actions Baru | `app/actions/job.ts:1160, 1304, 1420, 1518, 1697, 1786` | **TERVERIFIKASI** |
| **PDP-01** | **KRITIS** | Data Medis Spesifik (MCU) Disimpan Plaintext Tanpa Enkripsi / RBAC Medis | `prisma/schema.prisma:283`, `app/actions/candidate-application.ts:278` | **TERVERIFIKASI** |
| **SEC-02** | **KRITIS** | PII Karyawan & Nomor Kontak Internal Hardcoded di Repositori Publik | `lib/mcu-clinics.ts:115-140` | **TERVERIFIKASI** |
| **SEC-03** | **TINGGI** | Matcher Middleware Melewatkan Seluruh Endpoint `/api/*` | `middleware.ts:68-74` | **TERVERIFIKASI** |
| **SEC-04** | **TINGGI** | Bypass Otorisasi pada Mutasi Master Data Skema Sertifikasi | `app/actions/master-data.ts:564-605` | **TERVERIFIKASI** |
| **SEC-05** | **TINGGI** | Potensi Public Directory Listing Dokumen KTP/KK/MCU saat S3 Unset | `app/actions/upload.ts:85-93` | **TERVERIFIKASI** |
| **PDP-02** | **TINGGI** | Ketiadaan Mekanisme Consent Khusus, Retensi, dan Hak Hapus (*Right to Erasure*) | `app/candidate/register/page.tsx`, `components/candidate/PrivacyModal.tsx` | **TERVERIFIKASI** |
| **SEC-06** | **SEDANG** | Rate Limiter Berbasis In-Memory Reset Saat Kontainer Restart | `lib/rate-limit.ts:12,25` | **TERVERIFIKASI** |
| **SEC-07** | **SEDANG** | Ketiadaan Pembatasan Domain Akun Google OAuth & Automatic Account Linking | `lib/auth.ts:13-26` | **TERVERIFIKASI** |
| **SEC-08** | **SEDANG** | Kredensial Default Fallback pada File Compose Deployment | `docker-compose.yml:10,23` | **TERVERIFIKASI** |
| **SEC-09** | **SEDANG** | Aset Marker Peta Geografis Diambil dari CDN Pihak Ketiga Unpinned | `components/dashboard/GeoMapComponent.tsx:10-12` | **TERVERIFIKASI** |

---

## 3. Penjelasan Detail Temuan Keamanan & Skenario Eksploitasi

### 3.1 [KRITIS - SEC-01] Server Actions Baru Membocorkan Seluruh Database Pelamar Tanpa Autentikasi
- **Lokasi Bukti:**  
  - `app/actions/job.ts:1160` (`getPaginatedTalentPool`)
  - `app/actions/job.ts:1304` (`getPaginatedArchivedCandidates`)
  - `app/actions/job.ts:1420` (`getPaginatedBlacklistedCandidates`)
  - `app/actions/job.ts:1518` (`getPaginatedInterviewsDashboardData`)
  - `app/actions/job.ts:1697` (`getPaginatedJobOpenings`)
  - `app/actions/job.ts:1786` (`getFilteredPipelineData`)
- **Fakta:**  
  Pada saat penambahan fitur paginasi dan filter tabel (komit penggabungan dari `main`), keenam fungsi Server Action ini **tidak dibungkus oleh `requireStaffSession()` atau `requireRole()`**.
- **Skenario Eksploitasi Singkat:**  
  Dalam arsitektur Next.js App Router, setiap Server Action dapat dieksekusi melalui permintaan HTTP POST langsung (`fetch`) dengan menyertakan header action ID tanpa memerlukan cookie sesi login. Pihak luar yang tidak terdaftar (atau pelamar biasa) dapat membuat script sederhana untuk memanggil `getPaginatedTalentPool({ limit: 1000 })` dan mengunduh seluruh data NIK KTP, nama lengkap, nomor WhatsApp, alamat domisili, dan riwayat pekerjaan seluruh pelamar yang tersimpan di database DPP.
- **Dampak Regulasi:** Pelanggaran berat Pasal 39 UU PDP (Kewajiban Pengendali Data Mencegah Kebocoran Data Pribadi).

---

### 3.2 [KRITIS - PDP-01] Data Medis Spesifik (MCU) Disimpan dalam Plaintext JSON Blob Tanpa Enkripsi / RBAC Khusus
- **Lokasi Bukti:**  
  - `prisma/schema.prisma:283` (`stageData Json? @default("{}")`)
  - `app/actions/candidate-application.ts:278` (`const mcuData = currentStageData.mcu || {};`)
- **Fakta:**  
  Hasil pemeriksaan laboratorium, kelainan medis, rontgen thorax, dan evaluasi *Fit to Work* disimpan sebagai teks mentah (*plaintext string/JSON*) di dalam database PostgreSQL. Tidak ada enkripsi kolom (*Field-Level Encryption* menggunakan AES-256-GCM), dan tidak ada pemisahan hak akses: setiap user dengan role `RECRUITER` umum dapat melihat seluruh riwayat medis pelamar tanpa perlu izin otorisasi petugas medis (*Occupational Health Officer*).
- **Dampak Regulasi:**  
  Berdasarkan Pasal 4 Ayat 2 huruf a UU No. 27/2022, data kesehatan adalah **Data Pribadi Bersifat Spesifik** yang mewajibkan Pengendali Data menerapkan penilaian dampak perlindungan data (*Data Protection Impact Assessment / DPIA*) dan mekanisme enkripsi ketat.

---

### 3.3 [KRITIS - SEC-02] Hardcoded Data Pribadi Karyawan di Repositori
- **Lokasi Bukti:** `lib/mcu-clinics.ts:115-140`
  ```typescript
  export const DEFAULT_MCU_CONTACT = {
    picName: "Annisa Nur Cahya Rahmadani",
    picJabatan: "Recruitment Staff",
    picPhone: "0895-2305-7314",
    resultEmails: [
      "annisa.rahmadani@dpp.co.id",
      ...
    ],
    billing: {
      company: "PT. Dian Pandu Pratama",
      up: "M Irfan Dzul Izzudin/ irfandzul@dpp.co.id",
      ...
    },
    signee: {
      name: "Mursidi",
      title: "Recruitment & Development Dept. Head",
      ...
    }
  };
  ```
- **Fakta:**  
  Nama lengkap pejabat dan staf rekrutmen, nomor telepon seluler pribadi/operasional, serta alamat email korporat `@dpp.co.id` tertulis secara permanen di dalam kode repositori.
- **Skenario Eksploitasi Singkat:**  
  Data ini terekspos kepada siapa pun yang memiliki akses ke repositori kode atau bundle JavaScript klien. Penyerang dapat memanfaatkan nama pejabat dan nomor telepon tersebut untuk melancarkan serangan rekayasa sosial (*Social Engineering / Spear Phishing*) yang mengatasnamakan manajemen rekrutmen DPP terhadap calon tenaga kerja atau klinik rekanan.

---

### 3.4 [TINGGI - SEC-03] Gerbang Middleware Melewatkan Seluruh Endpoint `/api/*`
- **Lokasi Bukti:** `middleware.ts:68-74`
  ```typescript
  export const config = {
    matcher: [
      "/",
      "/jobs/:path*",
      "/dashboard/:path*",
      "/candidate/:path*",
    ],
  };
  ```
- **Fakta:**  
  Middleware NextAuth hanya melindungi rute antarmuka pengguna (halaman web). Rute `/api/*` sepenuhnya di luar cakupan filter gerbang utama middleware. Jika seorang developer menambahkan endpoint API baru di masa depan dan lupa menyematkan helper verifikasi sesi manual di dalamnya, endpoint tersebut akan otomatis menjadi publik tanpa perlindungan lapis pertama.

---

### 3.5 [TINGGI - SEC-04] Bypass Otorisasi pada Mutasi Master Data Sertifikasi
- **Lokasi Bukti:** `app/actions/master-data.ts:564-605`
  ```typescript
  export async function createCertificationSchema(...) {
    // FAKTA: Tidak memanggil requireStaffSession() atau requireAdminSession()
    return await prisma.masterCertificationSchema.create({ data: { code, name } });
  }
  ```
- **Fakta:**  
  Fungsi Server Action untuk membuat, mengubah, dan menghapus skema sertifikasi kompetensi dapat dipanggil oleh siapa saja tanpa verifikasi sesi atau peran *ADMIN*.

---

### 3.6 [TINGGI - SEC-05] Potensi Public Exposure Dokumen Sensitif Kandidat di Direktori Publik
- **Lokasi Bukti:** `app/actions/upload.ts:85-93`
  ```typescript
  // Local fallback only when S3/R2 env is not configured in local dev
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, uniqueFilename);
  fs.writeFileSync(filePath, buffer);
  return { success: true, url: `/uploads/${uniqueFilename}` };
  ```
- **Fakta:**  
  Ketika variabel environment S3/R2 tidak terkonfigurasi atau mengalami error koneksi, sistem secara otomatis beralih (*fallback*) menyimpan berkas unggahan ke folder `public/uploads/`.
- **Dampak Keamanan:**  
  Dalam Next.js, folder `public/` disajikan secara statis dan terbuka oleh web server tanpa melalui middleware autentikasi. Setiap dokumen KTP, Kartu Keluarga, ijazah, atau surat dokter yang tersimpan di `public/uploads/` dapat diakses langsung oleh publik melalui peramban web (`https://recruitment.dpp.co.id/uploads/<uuid>.pdf`) tanpa perlu login, hanya dengan mengetahui atau menebak nama filenya.

---

### 3.7 [TINGGI - PDP-02] Ketiadaan Kebijakan Retensi & Hak Penghapusan Data (Right to Erasure)
- **Lokasi Bukti:** `components/candidate/PrivacyModal.tsx:1-49`
- **Fakta:**  
  Modal privasi pada pendaftaran kandidat hanya berupa teks persetujuan umum singkat tanpa mencantumkan:
  1. Berapa lama berkas identitas dan rekam medis MCU disimpan oleh DPP (Masa Retensi Data).
  2. Bagaimana tata cara bagi pelamar yang tidak diterima untuk mengajukan penarikan persetujuan (*Consent Withdrawal*) dan permohonan penghapusan data pribadinya (*Right to be Forgotten*).
  3. Di database tidak tersedia prosedur operasional untuk menghapus atau menganonimkan (*anonymize*) data pelamar yang telah lewat masa retensinya (misal: pelamar tidak aktif lebih dari 2 tahun).

---

### 3.8 [SEDANG - SEC-06] In-Memory Rate Limiter Hilang Saat Kontainer Restart
- **Lokasi Bukti:** `lib/rate-limit.ts:12,25`
  ```typescript
  const buckets = new Map<string, RateLimitBucket>();
  ```
- **Fakta:**  
  Sistem perlindungan *brute-force* login menyimpan riwayat kegagalan di dalam objek `Map` memori lokal proses Node.js.
- **Konsekuensi:**  
  1. Jika kontainer Docker di-restart atau di-deploy ulang, memori terhapus dan seluruh limitasi percobaan password kembali ke nol.
  2. Jika aplikasi dijalankan dalam beberapa instance (*cluster / multi-container*), penyerang dapat menyebarkan serangan *credential stuffing* ke instance berbeda untuk menghindari limitasi.

---

### 3.9 [SEDANG - SEC-07] Ketiadaan Domain Restriction pada Akun Google OAuth
- **Lokasi Bukti:** `lib/auth.ts:13-26`
  ```typescript
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    allowDangerousEmailAccountLinking: true,
    ...
  })
  ```
- **Fakta:**  
  Login Google OAuth diaktifkan untuk semua pengguna tanpa memeriksa domain email. Akun Google publik apa pun (misal `@gmail.com`) dapat mendaftar dan masuk ke sistem. Selain itu, flag `allowDangerousEmailAccountLinking: true` mengizinkan penyatuan akun otomatis jika email sama, yang berisiko jika akun email pihak ketiga dikompromikan.

