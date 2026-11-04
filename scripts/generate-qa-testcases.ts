import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";

interface TestCaseItem {
  id: string;
  module: string;
  subModule: string;
  role: "ADMIN" | "RECRUITER" | "CANDIDATE" | "PUBLIC / GUEST";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: "Positive" | "Negative" | "Security / RBAC" | "Edge Case" | "UI/UX";
  title: string;
  preCondition: string;
  steps: string;
  testData: string;
  expectedResult: string;
}

const TEST_CASES: TestCaseItem[] = [
  // =========================================================================
  // M01: AUTHENTICATION, GOOGLE SSO & LOGIN RATE LIMITING
  // =========================================================================
  {
    id: "TC-AUTH-001",
    module: "M01 - Authentication & Session",
    subModule: "Login (/login)",
    role: "ADMIN",
    priority: "CRITICAL",
    type: "Positive",
    title: "Login valid menggunakan akun Super Admin (Email & Password)",
    preCondition: "Halaman /login terbuka; database telah di-seed.",
    steps: "1. Buka halaman /login\n2. Masukkan Email Super Admin\n3. Masukkan Password yang valid\n4. Klik tombol 'Masuk'",
    testData: "Email: admin@example.com\nPassword: password123 (Staging) / password (Prod Essential)",
    expectedResult: "Login berhasil, session JWT terbentuk, dan pengguna diarahkan ke /dashboard (Executive Dashboard) dengan menu lengkap termasuk Settings -> Users & Audit Logs.",
  },
  {
    id: "TC-AUTH-002",
    module: "M01 - Authentication & Session",
    subModule: "Login (/login)",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Positive",
    title: "Login valid menggunakan akun Recruiter",
    preCondition: "Halaman /login terbuka; akun Recruiter tersedia.",
    steps: "1. Buka halaman /login\n2. Masukkan Email Recruiter\n3. Masukkan Password yang valid\n4. Klik tombol 'Masuk'",
    testData: "Email: recruiter.mining@example.com\nPassword: password123",
    expectedResult: "Login berhasil dan pengguna diarahkan ke /dashboard dengan akses operasional rekrutmen.",
  },
  {
    id: "TC-AUTH-003",
    module: "M01 - Authentication & Session",
    subModule: "Login (/login)",
    role: "CANDIDATE",
    priority: "HIGH",
    type: "Positive",
    title: "Login valid menggunakan akun Kandidat",
    preCondition: "FEATURE_CANDIDATE_PORTAL=true di environment Staging.",
    steps: "1. Buka halaman /login\n2. Masukkan Email Kandidat\n3. Masukkan Password yang valid\n4. Klik tombol 'Masuk'",
    testData: "Email: ahmad.fauzi@example.com\nPassword: password123",
    expectedResult: "Login berhasil dan kandidat diarahkan ke halaman portal kandidat (/candidate/jobs atau /candidate/dashboard), bukan ke /dashboard staf.",
  },
  {
    id: "TC-AUTH-004",
    module: "M01 - Authentication & Session",
    subModule: "Login (/login)",
    role: "PUBLIC / GUEST",
    priority: "HIGH",
    type: "Negative",
    title: "Login gagal menggunakan password yang salah",
    preCondition: "Halaman /login terbuka.",
    steps: "1. Masukkan email terdaftar (admin@example.com)\n2. Masukkan password yang salah\n3. Klik tombol 'Masuk'",
    testData: "Email: admin@example.com\nPassword: salahpassword999",
    expectedResult: "Sistem menolak login (HTTP 401), menampilkan pesan kesalahan kredensial tidak valid di UI, dan mencatat event AUTH_LOGIN_FAILED di Audit Log.",
  },
  {
    id: "TC-AUTH-005",
    module: "M01 - Authentication & Session",
    subModule: "Rate Limiter (/login)",
    role: "PUBLIC / GUEST",
    priority: "CRITICAL",
    type: "Security / RBAC",
    title: "Proteksi Brute-Force: Lockout sementara setelah 5x percobaan login gagal berturut-turut",
    preCondition: "Gunakan email uji (misal test.lockout@example.com) di halaman /login.",
    steps: "1. Masukkan email test.lockout@example.com dan password salah\n2. Klik 'Masuk' sebanyak 5 kali berturut-turut\n3. Lakukan percobaan ke-6",
    testData: "Email: test.lockout@example.com\nPassword: wrongpass (6x)",
    expectedResult: "Pada percobaan ke-6, sistem memblokir login selama 15 menit dan mencatat event AUTH_LOGIN_RATE_LIMITED pada Audit Log.",
  },
  {
    id: "TC-AUTH-006",
    module: "M01 - Authentication & Session",
    subModule: "Google OAuth SSO (/login)",
    role: "CANDIDATE",
    priority: "HIGH",
    type: "Positive",
    title: "Login menggunakan tombol SSO Google (Continue with Google)",
    preCondition: "Redirect URI domain telah terdaftar di Google Cloud Console.",
    steps: "1. Buka halaman /login\n2. Klik tombol 'Masuk dengan Google'\n3. Pilih akun Google aktif",
    testData: "Akun Google Tester",
    expectedResult: "Autentikasi OAuth berhasil, akun user otomatis terhubung/terbuat di database, tercatat di Audit Log (provider: google), dan masuk ke aplikasi.",
  },
  {
    id: "TC-AUTH-007",
    module: "M01 - Authentication & Session",
    subModule: "Logout",
    role: "ADMIN",
    priority: "MEDIUM",
    type: "Positive",
    title: "Logout mengakhiri sesi aktif dan mencegah akses kembali dengan tombol Back",
    preCondition: "User sudah login di /dashboard.",
    steps: "1. Klik tombol Sign Out / Keluar di sidebar bawah\n2. Setelah kembali ke /login, tekan tombol Back di browser atau akses langsung /dashboard",
    testData: "-",
    expectedResult: "Sesi terhapus, pengguna tetap diarahkan kembali ke halaman /login.",
  },

  // =========================================================================
  // M02: RBAC, AUTHORIZATION & SECURITY BOUNDARIES
  // =========================================================================
  {
    id: "TC-RBAC-001",
    module: "M02 - RBAC & Security Controls",
    subModule: "Middleware Protection",
    role: "PUBLIC / GUEST",
    priority: "CRITICAL",
    type: "Security / RBAC",
    title: "Pengguna belum login (Guest) mencoba mengakses URL internal /dashboard",
    preCondition: "Kondisi belum login (incognito / sudah logout).",
    steps: "1. Ketik URL /dashboard, /dashboard/job-openings, atau /dashboard/settings/users secara langsung di address bar browser",
    testData: "URL: /dashboard/settings/users",
    expectedResult: "Middleware memblokir akses dan otomatis me-redirect pengguna ke /login.",
  },
  {
    id: "TC-RBAC-002",
    module: "M02 - RBAC & Security Controls",
    subModule: "Role Isolation",
    role: "CANDIDATE",
    priority: "CRITICAL",
    type: "Security / RBAC",
    title: "Kandidat mencoba mengakses halaman internal HR/Admin (/dashboard)",
    preCondition: "Login menggunakan akun CANDIDATE (ahmad.fauzi@example.com).",
    steps: "1. Setelah login sebagai Kandidat, ubah URL di browser menjadi /dashboard atau /dashboard/job-openings",
    testData: "User Role: CANDIDATE\nTarget URL: /dashboard",
    expectedResult: "Akses ditolak dan kandidat otomatis diarahkan kembali ke area kandidat (/candidate/dashboard).",
  },
  {
    id: "TC-RBAC-003",
    module: "M02 - RBAC & Security Controls",
    subModule: "Admin API Protection (/api/users)",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Security / RBAC",
    title: "Recruiter mencoba mengakses API Manajemen User (/api/users) milik Super Admin",
    preCondition: "Login menggunakan akun RECRUITER (recruiter.mining@example.com).",
    steps: "1. Buka tab baru dan akses /api/users (GET)\n2. Atau coba kirim request POST /api/users",
    testData: "User Role: RECRUITER\nEndpoint: /api/users",
    expectedResult: "Server mengembalikan HTTP 403 Forbidden (hanya role ADMIN yang diizinkan mengelola user).",
  },
  {
    id: "TC-RBAC-004",
    module: "M02 - RBAC & Security Controls",
    subModule: "File Storage IDOR (/api/file)",
    role: "CANDIDATE",
    priority: "CRITICAL",
    type: "Security / RBAC",
    title: "Proteksi IDOR: Kandidat A mencoba membuka dokumen KTP/CV milik Kandidat B",
    preCondition: "Login sebagai Kandidat 1 (CAND-1: ahmad.fauzi@example.com).",
    steps: "1. Akses dokumen sendiri: /api/file?key=documents/CAND-1/ktp.pdf (Harus berhasil)\n2. Ubah URL menjadi milik Kandidat 2: /api/file?key=documents/CAND-2/ktp.pdf",
    testData: "Key Kandidat Lain: documents/CAND-2/ktp.pdf",
    expectedResult: "Permintaan ke dokumen CAND-2 ditolak dengan HTTP 403 Forbidden.",
  },
  {
    id: "TC-RBAC-005",
    module: "M02 - RBAC & Security Controls",
    subModule: "Path Traversal Guard (/api/file)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Security / RBAC",
    title: "Proteksi Path Traversal pada parameter key di /api/file",
    preCondition: "Login sebagai user aktif.",
    steps: "1. Akses URL /api/file?key=../../.env atau /api/file?key=../package.json",
    testData: "key=../../.env",
    expectedResult: "Server menolak request dengan HTTP 400 ('Invalid or missing file key').",
  },

  // =========================================================================
  // M03: EXECUTIVE DASHBOARD, REPORTS & GEOSOURCE MAP
  // =========================================================================
  {
    id: "TC-DASH-001",
    module: "M03 - Dashboard & Analytics",
    subModule: "Overview (/dashboard)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Positive",
    title: "Menampilkan ringkasan metrik utama di halaman Overview Dashboard",
    preCondition: "Login sebagai ADMIN atau RECRUITER.",
    steps: "1. Buka menu Dashboard Overview (/dashboard)\n2. Periksa kartu KPI, grafik pipeline, daftar lowongan prioritas, dan aktivitas terbaru",
    testData: "-",
    expectedResult: "Seluruh kartu KPI (Total Pelamar, Lowongan Aktif, Hired, SLA) dan grafik tampil akurat tanpa error console.",
  },
  {
    id: "TC-DASH-002",
    module: "M03 - Dashboard & Analytics",
    subModule: "Executive Dashboard (/dashboard/executive)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Positive",
    title: "Filter data pada Executive Dashboard berdasarkan Perusahaan / Periode",
    preCondition: "Login sebagai ADMIN/RECRUITER di /dashboard/executive.",
    steps: "1. Buka /dashboard/executive\n2. Pilih filter Perusahaan (misal PT Kaltim Prima Coal)\n3. Amati perubahan metrik pemenuhan (fulfillment) dan grafik",
    testData: "Filter Customer: PT Kaltim Prima Coal",
    expectedResult: "Angka grafik dan tabel otomatis terfilter sesuai perusahaan yang dipilih.",
  },
  {
    id: "TC-DASH-003",
    module: "M03 - Dashboard & Analytics",
    subModule: "Reports (/dashboard/reports)",
    role: "ADMIN",
    priority: "MEDIUM",
    type: "Positive",
    title: "Menampilkan halaman laporan analitik rekrutmen & ekspor data",
    preCondition: "Login sebagai ADMIN/RECRUITER di /dashboard/reports.",
    steps: "1. Buka menu Reports (/dashboard/reports)\n2. Periksa tabel laporan & uji tombol Export jika tersedia",
    testData: "-",
    expectedResult: "Data laporan rekrutmen tampil lengkap sesuai status kandidat di database.",
  },
  {
    id: "TC-DASH-004",
    module: "M03 - Dashboard & Analytics",
    subModule: "GeoSource Map (/dashboard/geosource)",
    role: "ADMIN",
    priority: "MEDIUM",
    type: "Positive",
    title: "Visualisasi peta sebaran kandidat & site operasional (Leaflet GeoMap)",
    preCondition: "Login sebagai ADMIN/RECRUITER.",
    steps: "1. Buka menu GeoSource (/dashboard/geosource)\n2. Periksa peta interaktif Indonesia, titik marker kandidat/site, dan statistik provinsi/kota",
    testData: "-",
    expectedResult: "Peta interaktif Leaflet ter-render dengan benar beserta marker lokasi dan statistik wilayah.",
  },

  // =========================================================================
  // M04: JOB OPENINGS MANAGEMENT
  // =========================================================================
  {
    id: "TC-JOB-001",
    module: "M04 - Job Openings",
    subModule: "Daftar Lowongan (/dashboard/job-openings)",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Melihat daftar lowongan pekerjaan beserta pencarian dan filter status",
    preCondition: "Login sebagai ADMIN/RECRUITER.",
    steps: "1. Buka menu Job Openings (/dashboard/job-openings)\n2. Gunakan kolom pencarian (misal 'Excavator' atau 'Surveyor')\n3. Filter berdasarkan Status (OPEN, CLOSED, DRAFT)",
    testData: "Keyword: Excavator",
    expectedResult: "Daftar lowongan tampil sesuai kata kunci dan status beserta jumlah pelamar di setiap lowongan.",
  },
  {
    id: "TC-JOB-002",
    module: "M04 - Job Openings",
    subModule: "Buat Lowongan (/dashboard/job-openings/new)",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Positive",
    title: "Membuat Lowongan Pekerjaan (Job Order) baru dengan konfigurasi lengkap",
    preCondition: "Master Perusahaan, Site, Departemen, dan Posisi sudah tersedia.",
    steps: "1. Klik tombol '+ Buat Lowongan' (/dashboard/job-openings/new)\n2. Isi Perusahaan, Site Operasional, Posisi, Departemen, Jumlah Kebutuhan (Headcount), Tipe Permintaan, Tanggal Target, Deskripsi & Persyaratan\n3. Aktifkan opsi Wajib Sertifikat BNSP / Uji Teknis\n4. Klik Simpan / Publish",
    testData: "Posisi: Operator Dump Truck HD785\nHeadcount: 5\nStatus: OPEN",
    expectedResult: "Lowongan berhasil disimpan ke database, timeline 10 stage terbentuk otomatis, dan aksi tercatat sebagai JOB_CREATED di Audit Log.",
  },
  {
    id: "TC-JOB-003",
    module: "M04 - Job Openings",
    subModule: "Buat Lowongan (/dashboard/job-openings/new)",
    role: "RECRUITER",
    priority: "MEDIUM",
    type: "Negative",
    title: "Validasi form saat membuat lowongan tanpa mengisi field wajib",
    preCondition: "Berada di halaman /dashboard/job-openings/new.",
    steps: "1. Kosongkan field wajib (misal Perusahaan atau Posisi)\n2. Klik tombol Simpan",
    testData: "Field wajib dikosongkan",
    expectedResult: "Sistem mencegah penyimpanan dan menampilkan peringatan field wajib diisi.",
  },
  {
    id: "TC-JOB-004",
    module: "M04 - Job Openings",
    subModule: "Edit Lowongan (/dashboard/job-openings/[id]/edit)",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Mengubah detail lowongan dan mengganti status lowongan (OPEN / HOLD / CLOSED)",
    preCondition: "Lowongan sudah tersedia di daftar Job Openings.",
    steps: "1. Pilih salah satu lowongan -> klik Edit\n2. Ubah jumlah kebutuhan (Headcount) atau deskripsi\n3. Simpan perubahan",
    testData: "Headcount diubah dari 5 menjadi 8",
    expectedResult: "Perubahan tersimpan dan tampil pada halaman detail lowongan.",
  },

  // =========================================================================
  // M05: RECRUITMENT PIPELINE & 10-STAGE WORKFLOW
  // =========================================================================
  {
    id: "TC-PIPE-001",
    module: "M05 - Pipeline & SLA Tracking",
    subModule: "Pipeline Board (/dashboard/pipeline)",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Positive",
    title: "Menampilkan kandidat di 10 tahapan seleksi pada halaman Pipeline & Detail Job",
    preCondition: "Database memiliki kandidat aktif di berbagai stage.",
    steps: "1. Buka menu Pipeline (/dashboard/pipeline) atau Detail Job (/dashboard/job-openings/[id])\n2. Periksa tab/kolom Stage 1 (CV Screening) hingga Stage 10 (PKWT)\n3. Pastikan foto profil kandidat tampil tanpa broken image",
    testData: "-",
    expectedResult: "Seluruh kartu kandidat tampil pada stage masing-masing lengkap dengan foto/avatar, nama, pendidikan, dan indikator SLA.",
  },
  {
    id: "TC-PIPE-002",
    module: "M05 - Pipeline & SLA Tracking",
    subModule: "SLA Monitoring (/dashboard/job-openings/[id])",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Verifikasi perhitungan indikator SLA tahapan seleksi (Normal vs Warning vs Overdue)",
    preCondition: "Terdapat lowongan dengan timeline SLA aktif.",
    steps: "1. Buka halaman detail lowongan (/dashboard/job-openings/[id])\n2. Periksa bagian SLA Timeline tahapan seleksi",
    testData: "-",
    expectedResult: "Durasi SLA per stage tampil sesuai konfigurasi SLA Site/Global beserta status ketepatan waktunya.",
  },

  // =========================================================================
  // M06: ADVANCED CANDIDATE VERIFICATION (STAGE 1 - STAGE 5)
  // =========================================================================
  {
    id: "TC-VER-001",
    module: "M06 - Verifikasi Kandidat (Stage 1-5)",
    subModule: "Document Preview Panel",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Positive",
    title: "Pratinjau (Preview) 6 dokumen kandidat pada panel kanan halaman Verifikasi",
    preCondition: "Buka halaman verifikasi kandidat (/dashboard/job-openings/[id]/verify/[candidateId]).",
    steps: "1. Klik tab 'KTP' pada panel Document Preview di sebelah kanan\n2. Klik tab 'CV', 'Ijazah', 'KK', 'Pas Foto', dan 'Sertifikat BNSP' secara bergantian\n3. Klik ikon Download pada salah satu dokumen",
    testData: "Tab: KTP, CV, Ijazah, KK, Pas Foto, Sertifikat BNSP",
    expectedResult: "Dokumen PDF tampil langsung di dalam iframe viewer dan Pas Foto tampil sebagai gambar tanpa error koneksi (200 OK dari /api/file).",
  },
  {
    id: "TC-VER-002",
    module: "M06 - Verifikasi Kandidat (Stage 1-5)",
    subModule: "Stage 1: CV Screening & Validasi BNSP",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Verifikasi kelengkapan administrasi & validasi nomor sertifikat BNSP di Stage 1",
    preCondition: "Kandidat berada pada Stage 1 (CV Screening).",
    steps: "1. Pilih Skema Sertifikasi BNSP\n2. Isi Nomor Sertifikat, Tanggal Terbit, dan Tanggal Masa Berlaku\n3. Centang 'Approve / Validasi Sertifikat'\n4. Klik Action -> Loloskan ke Tahap Berikutnya (Stage 2: Interview HR)",
    testData: "Skema: Operator Alat Berat\nNo: BNSP-2026-001",
    expectedResult: "Data validasi BNSP tersimpan, kandidat berpindah ke Stage 2 (Interview HR), riwayat tahapan bertambah, dan tercatat di Audit Log.",
  },
  {
    id: "TC-VER-003",
    module: "M06 - Verifikasi Kandidat (Stage 1-5)",
    subModule: "Stage 2: Interview HR",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Input hasil evaluasi Interview HR dan lanjut ke Stage 3 (Psikotes)",
    preCondition: "Kandidat berada pada Stage 2 (Interview HR).",
    steps: "1. Pilih Hasil Interview HR (Lulus / Disarankan)\n2. Pilih Tanggal Interview & isi Catatan Feedback HR\n3. Unggah file form evaluasi interview (PDF)\n4. Klik Action -> Lanjut ke Stage 3 (Psikotes)",
    testData: "Hasil: Lulus\nFeedback: Komunikasi dan motivasi kerja sangat baik.",
    expectedResult: "Data dan berkas Interview HR tersimpan ke R2/storage, kandidat naik ke Stage 3 (Psikotes).",
  },
  {
    id: "TC-VER-004",
    module: "M06 - Verifikasi Kandidat (Stage 1-5)",
    subModule: "Stage 3: Psikotes",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Input hasil Psikotes & unggah berkas psikogram kandidat",
    preCondition: "Kandidat berada pada Stage 3 (Psikotes).",
    steps: "1. Pilih Hasil Psikotes (Sangat Disarankan / Disarankan)\n2. Isi tanggal pelaksanaan & unggah file hasil psikotes (PDF)\n3. Lanjutkan kandidat ke Stage 4 (Technical Test / Test Skill)",
    testData: "Hasil: Disarankan",
    expectedResult: "Data psikotes tersimpan dan kandidat berpindah ke Stage 4.",
  },
  {
    id: "TC-VER-005",
    module: "M06 - Verifikasi Kandidat (Stage 1-5)",
    subModule: "Stage 4: Technical Test / Test Skill",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Input hasil Uji Teknis (Test Skill), link video praktik, dan bukti evaluasi",
    preCondition: "Kandidat berada pada Stage 4 (Technical Test).",
    steps: "1. Isi Tanggal Test Skill & Link Video Praktik\n2. Unggah file Laporan Hasil Test Skill (PDF)\n3. Lanjutkan kandidat ke Stage 5 (Interview User)",
    testData: "File: evaluasi-skill.pdf",
    expectedResult: "Berkas evaluasi teknis berhasil diunggah ke Cloudflare R2 dan kandidat berpindah ke Stage 5.",
  },
  {
    id: "TC-VER-006",
    module: "M06 - Verifikasi Kandidat (Stage 1-5)",
    subModule: "Stage 5: Interview User",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Input hasil Interview User dan lanjut ke Stage 6 (Offering Letter)",
    preCondition: "Kandidat berada pada Stage 5 (Interview User).",
    steps: "1. Pilih Hasil Interview User (Lulus)\n2. Isi Tanggal & Feedback dari User/Site Manager\n3. Lanjutkan kandidat ke Stage 6 (Offering)",
    testData: "Hasil: Lulus\nFeedback: Disetujui oleh Superintendent.",
    expectedResult: "Data Interview User tersimpan dan kandidat masuk ke Stage 6 (Offering).",
  },

  // =========================================================================
  // M07: OFFERING, MCU & ONBOARDING (STAGE 6 - STAGE 10 / HIRED)
  // =========================================================================
  {
    id: "TC-ONB-001",
    module: "M07 - Offering, MCU & Onboarding",
    subModule: "Stage 6: Offering Letter",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Positive",
    title: "Unggah dokumen Offering Letter untuk kandidat pada Stage 6",
    preCondition: "Kandidat berada pada Stage 6 (Offering).",
    steps: "1. Isi Tanggal Offering Letter\n2. Drag & drop atau pilih file PDF Offering Letter (Max 2MB)\n3. Pastikan pratinjau PDF Offering Letter tampil di kotak bawahnya\n4. Klik Save as Draft atau Lanjutkan ke Stage 7 (MCU)",
    testData: "File: offering-letter-kandidat.pdf",
    expectedResult: "File Offering Letter berhasil terunggah ke R2, pratinjau PDF muncul, dan kandidat dapat melihat Offering Letter di portal kandidat.",
  },
  {
    id: "TC-ONB-002",
    module: "M07 - Offering, MCU & Onboarding",
    subModule: "Stage 7: Medical Check-Up (MCU)",
    role: "RECRUITER",
    priority: "CRITICAL",
    type: "Positive",
    title: "Unggah Surat Pengantar MCU, Hasil MCU (Fit to Work), dan nyatakan Kandidat HIRED",
    preCondition: "Kandidat berada pada Stage 7 (MCU).",
    steps: "1. Isi Tanggal Pelaksanaan MCU\n2. Unggah Berkas Pengantar MCU & Hasil Pemeriksaan MCU (PDF)\n3. Lanjutkan ke Stage 8 (Training) / Hired",
    testData: "Status MCU: FIT TO WORK",
    expectedResult: "Berkas MCU tersimpan di R2, status lamaran kandidat menjadi HIRED (Onboarding), dan tampilan halaman berubah menjadi Accordion Rekapitulasi 10 Stage.",
  },
  {
    id: "TC-ONB-003",
    module: "M07 - Offering, MCU & Onboarding",
    subModule: "Stage 8, 9, 10: Training, Induction & PKWT",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Unggah multi-dokumen pada Stage 8 (Training), Stage 9 (Induction), dan Stage 10 (PKWT) serta Preview Berkas Stage",
    preCondition: "Buka halaman verifikasi kandidat berstatus HIRED (misal Ahmad Fauzi Nurcahyo).",
    steps: "1. Klik 'Buka Semua' pada Accordion Rekapitulasi Tahapan\n2. Pada Stage 8/9/10, masukkan Judul Dokumen (misal 'PKWT Signed 2026'), pilih file PDF, lalu klik Tambah Dokumen\n3. Klik tombol 'Preview' pada dokumen tersebut\n4. Klik 'Save as Draft' untuk menyimpan ke database",
    testData: "Judul: PKWT Signed 2026\nFile: pkwt-signed.pdf",
    expectedResult: "Dokumen berhasil ditambahkan ke daftar, tombol Preview menampilkan PDF di panel kanan, dan tersimpan permanen di R2 & database.",
  },

  // =========================================================================
  // M08: DOCUMENT GENERATOR (OFFERING, PENGANTAR MCU, BAST)
  // =========================================================================
  {
    id: "TC-DOC-001",
    module: "M08 - Document Generator",
    subModule: "Generate Documents (/dashboard/generate-documents)",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Generate dokumen Surat Penawaran Kerja (Offering Letter) / Pengantar MCU / BAST",
    preCondition: "Login sebagai ADMIN/RECRUITER.",
    steps: "1. Buka menu Generate Documents (/dashboard/generate-documents)\n2. Pilih jenis template dokumen (Offering Letter / Surat Pengantar MCU / BAST)\n3. Pilih kandidat/lowongan dan lengkapi parameter surat\n4. Klik Generate / Download PDF atau DOCX",
    testData: "Template: Surat Pengantar MCU / Offering Letter",
    expectedResult: "Dokumen berhasil di-generate dengan data kandidat yang sesuai dan dapat diunduh.",
  },

  // =========================================================================
  // M09: INTERVIEW CALENDAR, TALENT POOL, ARCHIVE & BLACKLIST
  // =========================================================================
  {
    id: "TC-POOL-001",
    module: "M09 - Interviews, Talent Pool & Blacklist",
    subModule: "Interview Calendar (/dashboard/interviews)",
    role: "RECRUITER",
    priority: "MEDIUM",
    type: "Positive",
    title: "Melihat jadwal wawancara kandidat pada halaman Interviews",
    preCondition: "Login sebagai ADMIN/RECRUITER.",
    steps: "1. Buka menu Interviews (/dashboard/interviews)\n2. Periksa daftar jadwal interview yang akan datang dan kalender",
    testData: "-",
    expectedResult: "Jadwal interview kandidat tampil lengkap beserta foto kandidat, posisi, pewawancara, dan tautan meeting.",
  },
  {
    id: "TC-POOL-002",
    module: "M09 - Interviews, Talent Pool & Blacklist",
    subModule: "Reject Candidate -> Archived (/dashboard/archived-candidates)",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Menolak (Reject) kandidat dengan alasan baku dan memverifikasi masuk ke Archived Candidates",
    preCondition: "Kandidat sedang berstatus On Process di salah satu lowongan.",
    steps: "1. Buka halaman verifikasi kandidat\n2. Klik tombol Action -> Reject Candidate\n3. Pilih Alasan Penolakan dari daftar baku\n4. Konfirmasi Reject, lalu buka menu Archived Candidates (/dashboard/archived-candidates)",
    testData: "Alasan: Does Not Meet Requirements",
    expectedResult: "Status lamaran berubah menjadi REJECTED, kandidat muncul di menu Archived Candidates, dan aksi tercatat di Audit Log.",
  },
  {
    id: "TC-POOL-003",
    module: "M09 - Interviews, Talent Pool & Blacklist",
    subModule: "Talent Pool (/dashboard/talent-pool)",
    role: "RECRUITER",
    priority: "MEDIUM",
    type: "Positive",
    title: "Mengelola kandidat potensial di menu Talent Pool",
    preCondition: "Login sebagai ADMIN/RECRUITER.",
    steps: "1. Buka menu Talent Pool (/dashboard/talent-pool)\n2. Cari kandidat berdasarkan keahlian/pendidikan\n3. Lihat detail profil atau salin/assign kandidat ke lowongan terbuka",
    testData: "-",
    expectedResult: "Daftar kandidat Talent Pool tampil akurat dan aksi assign ke lowongan berfungsi normal.",
  },
  {
    id: "TC-POOL-004",
    module: "M09 - Interviews, Talent Pool & Blacklist",
    subModule: "Blacklist (/dashboard/blacklist)",
    role: "RECRUITER",
    priority: "HIGH",
    type: "Positive",
    title: "Memasukkan kandidat ke daftar Blacklist dengan alasan pelanggaran & fitur Unblacklist",
    preCondition: "Login sebagai ADMIN/RECRUITER.",
    steps: "1. Buka profil/verifikasi kandidat -> pilih aksi Blacklist\n2. Isi alasan Blacklist (misal: Pemalsuan Dokumen Sertifikat)\n3. Buka menu Blacklist (/dashboard/blacklist) dan pastikan kandidat muncul dengan badge Blacklisted",
    testData: "Alasan Blacklist: Pemalsuan Dokumen Sertifikat",
    expectedResult: "Kandidat masuk ke daftar Blacklist, tidak dapat diloloskan di seleksi, dan aksi CANDIDATE_BLACKLIST_UPDATED tercatat di Audit Log.",
  },

  // =========================================================================
  // M10: MASTER DATA & SLA CONFIGURATION
  // =========================================================================
  {
    id: "TC-MST-001",
    module: "M10 - Master Data & SLA Settings",
    subModule: "Master Data (/dashboard/settings/master-data)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Positive",
    title: "Menambah, mengubah, dan menghapus entri pada modul Master Data (Perusahaan, Site, Klinik, Posisi, Departemen, Institusi)",
    preCondition: "Login sebagai ADMIN atau RECRUITER.",
    steps: "1. Buka menu Settings -> Master Data (/dashboard/settings/master-data)\n2. Pilih tab Klinik MCU / Departemen / Posisi\n3. Tambah data baru (misal Klinik Kimia Farma Balikpapan)\n4. Edit data tersebut lalu simpan",
    testData: "Nama Klinik: Klinik Kimia Farma Balikpapan\nKota: Balikpapan",
    expectedResult: "Data master baru berhasil ditambahkan, tampil di tabel, dan dapat dipilih pada dropdown form terkait.",
  },
  {
    id: "TC-MST-002",
    module: "M10 - Master Data & SLA Settings",
    subModule: "SLA Settings (/dashboard/settings/sla)",
    role: "ADMIN",
    priority: "MEDIUM",
    type: "Positive",
    title: "Mengubah target hari SLA pada tahapan rekrutmen",
    preCondition: "Login sebagai ADMIN di /dashboard/settings/sla.",
    steps: "1. Buka menu Settings -> SLA Settings (/dashboard/settings/sla)\n2. Ubah jumlah hari SLA pada salah satu stage (misal Interview HR dari 3 hari menjadi 4 hari)\n3. Klik Simpan",
    testData: "Stage: Interview HR -> 4 Hari",
    expectedResult: "Konfigurasi SLA berhasil diperbarui di database.",
  },

  // =========================================================================
  // M11: USER MANAGEMENT (SUPER ADMIN)
  // =========================================================================
  {
    id: "TC-USR-001",
    module: "M11 - User Management (Admin)",
    subModule: "Manage Users (/dashboard/settings/users)",
    role: "ADMIN",
    priority: "CRITICAL",
    type: "Positive",
    title: "Super Admin membuat akun pengguna baru (Role RECRUITER / ADMIN)",
    preCondition: "Login sebagai Super Admin (admin@example.com).",
    steps: "1. Buka menu Settings -> Users (/dashboard/settings/users)\n2. Klik tombol '+ Tambah User'\n3. Isi Nama, Email, Departemen, Role (RECRUITER), dan Password (>= 8 karakter)\n4. Klik Simpan, lalu coba login dengan akun baru tersebut",
    testData: "Nama: QA Recruiter Test\nEmail: qa.recruiter@dpp.co.id\nRole: RECRUITER\nPass: DppTest2026!",
    expectedResult: "User baru berhasil dibuat, password ter-hash dengan bcrypt, event USER_CREATED tercatat di Audit Log, dan akun dapat digunakan untuk login.",
  },
  {
    id: "TC-USR-002",
    module: "M11 - User Management (Admin)",
    subModule: "Manage Users (/dashboard/settings/users)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Negative",
    title: "Validasi penolakan pembuatan user atau reset password dengan panjang password < 8 karakter",
    preCondition: "Login sebagai Super Admin di /dashboard/settings/users.",
    steps: "1. Klik '+ Tambah User' atau 'Edit User'\n2. Masukkan password hanya 4 karakter (misal '1234')\n3. Klik Simpan",
    testData: "Password: 1234",
    expectedResult: "Sistem menolak penyimpanan dengan pesan validasi bahwa password minimal harus 8 karakter.",
  },
  {
    id: "TC-USR-003",
    module: "M11 - User Management (Admin)",
    subModule: "Manage Users (/dashboard/settings/users)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Positive",
    title: "Super Admin mengedit data user dan melakukan Reset Password user",
    preCondition: "Login sebagai Super Admin di /dashboard/settings/users.",
    steps: "1. Klik ikon Edit pada akun qa.recruiter@dpp.co.id\n2. Ubah Departemen atau isi Password Baru (>= 8 karakter)\n3. Klik Simpan Perubahan",
    testData: "Password Baru: DppReset2026!",
    expectedResult: "Data user dan password berhasil diperbarui, serta event USER_PASSWORD_RESET tercatat di Audit Log.",
  },
  {
    id: "TC-USR-004",
    module: "M11 - User Management (Admin)",
    subModule: "Self-Lockout Protection (/dashboard/settings/users)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Security / RBAC",
    title: "Proteksi Super Admin tidak dapat menghapus atau menurunkan role (demote) akunnya sendiri yang sedang login",
    preCondition: "Login sebagai Super Admin.",
    steps: "1. Di tabel Users, cari baris akun yang sedang digunakan login\n2. Coba ubah role diri sendiri menjadi RECRUITER atau hapus akun sendiri",
    testData: "Target: Akun Admin yang sedang aktif login",
    expectedResult: "Sistem mencegah penghapusan/penurunan role akun sendiri agar sistem tidak kehilangan akses Admin.",
  },

  // =========================================================================
  // M12: AUDIT LOG & UU PDP COMPLIANCE
  // =========================================================================
  {
    id: "TC-AUD-001",
    module: "M12 - Audit Log & Compliance",
    subModule: "Audit Logs (/dashboard/settings/audit-logs)",
    role: "ADMIN",
    priority: "HIGH",
    type: "Positive",
    title: "Melihat, mencari, dan memfilter riwayat Audit Log serta Export ke CSV",
    preCondition: "Login sebagai Super Admin.",
    steps: "1. Buka menu Settings -> Audit Logs (/dashboard/settings/audit-logs)\n2. Filter berdasarkan Action (misal AUTH_LOGIN_SUCCESS atau DOCUMENT_UPLOADED)\n3. Gunakan kotak pencarian berdasarkan email pelaku\n4. Klik tombol 'Export CSV'",
    testData: "Filter Action: AUTH_LOGIN_SUCCESS",
    expectedResult: "Tabel menampilkan jejak audit lengkap dengan waktu, aktor, role, target, dan file CSV berhasil terunduh.",
  },
  {
    id: "TC-AUD-002",
    module: "M12 - Audit Log & Compliance",
    subModule: "Sensitive Data Redaction",
    role: "ADMIN",
    priority: "HIGH",
    type: "Security / RBAC",
    title: "Memastikan kolom Metadata di Audit Log tidak pernah menyimpan plaintext password atau token rahasia",
    preCondition: "Telah dilakukan aksi pembuatan user atau reset password.",
    steps: "1. Buka /dashboard/settings/audit-logs\n2. Periksa baris USER_CREATED dan USER_PASSWORD_RESET pada kolom Metadata",
    testData: "-",
    expectedResult: "Tidak ada nilai password plaintext di dalam metadata Audit Log.",
  },

  // =========================================================================
  // M13: CLOUDFLARE R2 OBJECT STORAGE & FILE HANDLING
  // =========================================================================
  {
    id: "TC-STR-001",
    module: "M13 - Cloudflare R2 Object Storage",
    subModule: "Upload & Inline Preview (/api/file/upload & /api/file)",
    role: "CANDIDATE",
    priority: "CRITICAL",
    type: "Positive",
    title: "Unggah berkas PDF/JPG asli ke Cloudflare R2 dan buka kembali via Preview",
    preCondition: "Login sebagai Kandidat atau Recruiter.",
    steps: "1. Buka halaman Candidate Profile (/candidate/profile) atau halaman Verifikasi HR\n2. Pilih file PDF/JPG asli (< 5MB) lalu klik Simpan\n3. Klik tombol 'Lihat File' / 'Preview'",
    testData: "File: sample-cv-asli.pdf (ukuran ~300KB)",
    expectedResult: "Upload ke endpoint /api/file/upload mengembalikan HTTP 200 (storage: s3-r2), file tersimpan di bucket 'portal-recruitment', dan saat di-preview langsung menampilkan isi PDF asli tersebut.",
  },
  {
    id: "TC-STR-002",
    module: "M13 - Cloudflare R2 Object Storage",
    subModule: "File Type & Size Validation",
    role: "CANDIDATE",
    priority: "HIGH",
    type: "Negative",
    title: "Penolakan upload file berbahaya (.exe, .sh, .html) atau file melebihi batas ukuran",
    preCondition: "Berada pada form upload dokumen.",
    steps: "1. Coba unggah file dengan ekstensi tidak diizinkan (misal script.html atau app.exe)\n2. Coba unggah file berukuran > 10MB",
    testData: "File: berbahaya.html / file-besar-15mb.pdf",
    expectedResult: "Sistem menolak file tersebut dengan pesan error tipe file tidak didukung atau ukuran melebihi batas.",
  },

  // =========================================================================
  // M14: CANDIDATE PORTAL (SELF-SERVICE END-TO-END FLOW)
  // =========================================================================
  {
    id: "TC-CND-001",
    module: "M14 - Candidate Portal",
    subModule: "Registrasi Kandidat (/register)",
    role: "PUBLIC / GUEST",
    priority: "HIGH",
    type: "Positive",
    title: "Registrasi akun kandidat mandiri melalui halaman /register",
    preCondition: "FEATURE_CANDIDATE_PORTAL=true di Staging.",
    steps: "1. Buka halaman /register\n2. Isi Nama Lengkap, Email baru, dan Password\n3. Klik Daftar",
    testData: "Nama: Budi Santoso\nEmail: budi.santoso.qa@example.com\nPass: Kandidat2026!",
    expectedResult: "Akun berhasil terdaftar dengan role CANDIDATE dan diarahkan untuk login / masuk ke portal kandidat.",
  },
  {
    id: "TC-CND-002",
    module: "M14 - Candidate Portal",
    subModule: "Kelengkapan Profil & Dokumen (/candidate/profile)",
    role: "CANDIDATE",
    priority: "CRITICAL",
    type: "Positive",
    title: "Kandidat melengkapi biodata diri (NIK, Alamat, Pendidikan) dan mengunggah 6 dokumen wajib",
    preCondition: "Login menggunakan akun kandidat di /candidate/profile.",
    steps: "1. Buka menu Profil Saya (/candidate/profile)\n2. Lengkapi NIK (16 digit), No KK, Tempat/Tanggal Lahir, Alamat, Provinsi, Kota, dan Pendidikan\n3. Unggah CV, KTP, KK, Ijazah, Pas Foto, dan Sertifikat\n4. Klik Simpan Profil",
    testData: "NIK: 6472011203980001\nProvinsi: Kalimantan Timur\nKota: Samarinda",
    expectedResult: "Profil tersimpan dengan status 'Profil Lengkap' (isProfileCompleted = true) dan seluruh dokumen dapat di-preview.",
  },
  {
    id: "TC-CND-003",
    module: "M14 - Candidate Portal",
    subModule: "Melamar Lowongan (/candidate/jobs)",
    role: "CANDIDATE",
    priority: "CRITICAL",
    type: "Positive",
    title: "Kandidat mencari lowongan terbuka dan mengirim lamaran kerja (Apply Job)",
    preCondition: "Profil kandidat sudah lengkap (isProfileCompleted = true).",
    steps: "1. Buka menu Lowongan Kerja (/candidate/jobs)\n2. Pilih salah satu lowongan berstatus OPEN\n3. Klik tombol 'Lamar Sekarang' dan konfirmasi",
    testData: "Lowongan: Operator Excavator / Mine Surveyor",
    expectedResult: "Lamaran berhasil terkirim, masuk ke Stage 1 (CV Screening) di dashboard HR, dan muncul di menu Lamaran Saya (/candidate/history).",
  },
  {
    id: "TC-CND-004",
    module: "M14 - Candidate Portal",
    subModule: "Tracking Status, Offering & Bukti MCU (/candidate/history)",
    role: "CANDIDATE",
    priority: "HIGH",
    type: "Positive",
    title: "Kandidat memantau progres tahapan seleksi, merespons Offering Letter, dan mengunggah Bukti MCU",
    preCondition: "Kandidat memiliki lamaran aktif (gunakan akun kandidat di Stage 6 Offering atau Stage 7 MCU).",
    steps: "1. Buka menu Riwayat / Lamaran Saya (/candidate/history)\n2. Periksa timeline tahapan seleksi & pesan dari Recruiter\n3. Jika di tahap Offering: unduh Offering Letter dan unggah Signed Offering Letter\n4. Jika di tahap MCU: unduh Surat Pengantar MCU dan unggah Bukti Kehadiran MCU",
    testData: "-",
    expectedResult: "Aksi kandidat tersimpan dan langsung terlihat oleh HR pada banner halaman Verifikasi Kandidat.",
  },
];

async function generateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DPP IT & QA Engineering";
  workbook.created = new Date();
  workbook.modified = new Date();

  const totalCases = TEST_CASES.length;
  const lastRow = 5 + totalCases - 1; // Test cases start at row 5 in Sheet 2

  // =========================================================================
  // SHEET 1: 01_Executive_Summary_&_SignOff
  // =========================================================================
  const summarySheet = workbook.addWorksheet("01_Executive_Summary_&_SignOff", {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { width: 4 },
    { width: 34 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
  ];

  // Title Banner
  summarySheet.mergeCells("B2:I2");
  const titleCell = summarySheet.getCell("B2");
  titleCell.value = "DOKUMEN UAT & QA MANUAL TEST CASE — DPP RECRUITMENT PORTAL DASHBOARD";
  titleCell.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  summarySheet.getRow(2).height = 34;

  summarySheet.mergeCells("B3:I3");
  const subTitleCell = summarySheet.getCell("B3");
  subTitleCell.value = "PT Dian Pandu Pratama (DPP) — Laporan Hasil Pengujian Fungsional, Keamanan (RBAC), & Integrasi Cloudflare R2";
  subTitleCell.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF1E293B" } };
  subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  subTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  summarySheet.getRow(3).height = 22;

  // Project Metadata Table
  const metaRows = [
    ["Nama Proyek", "DPP Recruitment Portal Dashboard", "URL Staging (UAT)", "https://recruitment-staging.dpp.co.id"],
    ["Versi / Branch", "v1.0.0-MVP (feat/phase-3-mvp)", "URL Production", "https://recruitment.dpp.co.id"],
    ["Nama QA Tester", "[Isi Nama QA Tester]", "Tanggal Mulai Uji", new Date().toISOString().split("T")[0]],
    ["PIC Developer", "[Isi Nama Developer]", "Tanggal Selesai Uji", "[YYYY-MM-DD]"],
  ];

  let rIdx = 5;
  for (const m of metaRows) {
    const row = summarySheet.getRow(rIdx);
    row.getCell(2).value = m[0];
    row.getCell(2).font = { bold: true, color: { argb: "FF0F172A" } };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    summarySheet.mergeCells(`C${rIdx}:E${rIdx}`);
    row.getCell(3).value = m[1];

    row.getCell(6).value = m[2];
    row.getCell(6).font = { bold: true, color: { argb: "FF0F172A" } };
    row.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    summarySheet.mergeCells(`G${rIdx}:I${rIdx}`);
    row.getCell(7).value = m[3];

    for (let c = 2; c <= 9; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    }
    row.height = 20;
    rIdx++;
  }

  // Test Credentials Reference Section
  rIdx += 1;
  summarySheet.mergeCells(`B${rIdx}:I${rIdx}`);
  const credHeader = summarySheet.getCell(`B${rIdx}`);
  credHeader.value = "1. DAFTAR AKUN UJI (TEST CREDENTIALS — ENVIRONMENT STAGING)";
  credHeader.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  credHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
  summarySheet.getRow(rIdx).height = 24;
  rIdx++;

  const credCols = ["Role", "Email Login", "Password Default", "Hak Akses & Cakupan Pengujian"];
  const credTitleRow = summarySheet.getRow(rIdx);
  credTitleRow.getCell(2).value = credCols[0];
  credTitleRow.getCell(3).value = credCols[1];
  summarySheet.mergeCells(`C${rIdx}:D${rIdx}`);
  credTitleRow.getCell(5).value = credCols[2];
  summarySheet.mergeCells(`F${rIdx}:I${rIdx}`);
  credTitleRow.getCell(6).value = credCols[3];
  for (let c = 2; c <= 9; c++) {
    credTitleRow.getCell(c).font = { bold: true, color: { argb: "FF0F172A" } };
    credTitleRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    credTitleRow.getCell(c).border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }
  rIdx++;

  const credsData = [
    ["ADMIN (Super Admin)", "admin@example.com", "password123 (Staging) / password (Prod)", "Akses penuh seluruh modul + Settings -> Manage Users & Audit Logs"],
    ["RECRUITER (HR Staff)", "recruiter.mining@example.com", "password123", "Akses operasional HR (Dashboard, Job Openings, Pipeline, Verify, Master Data)"],
    ["CANDIDATE (Hired Stage 10)", "ahmad.fauzi@example.com", "password123", "Portal Kandidat (/candidate/*) — profil lengkap & riwayat lamaran Hired"],
    ["CANDIDATE (On Process)", "fajar.nugraha@example.com", "password123", "Portal Kandidat (/candidate/*) — lamaran sedang dalam proses seleksi"],
  ];

  for (const cd of credsData) {
    const row = summarySheet.getRow(rIdx);
    row.getCell(2).value = cd[0];
    row.getCell(2).font = { bold: true };
    summarySheet.mergeCells(`C${rIdx}:D${rIdx}`);
    row.getCell(3).value = cd[1];
    row.getCell(5).value = cd[2];
    summarySheet.mergeCells(`F${rIdx}:I${rIdx}`);
    row.getCell(6).value = cd[3];
    for (let c = 2; c <= 9; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    }
    row.height = 20;
    rIdx++;
  }

  // Live Execution Summary by Module (Formulas linked to 02_Master_Test_Cases)
  rIdx += 1;
  summarySheet.mergeCells(`B${rIdx}:I${rIdx}`);
  const statHeader = summarySheet.getCell(`B${rIdx}`);
  statHeader.value = "2. RINGKASAN HASIL EKSEKUSI QA PER MODUL (OTOMATIS TERHITUNG DARI SHEET 02)";
  statHeader.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  statHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
  summarySheet.getRow(rIdx).height = 24;
  rIdx++;

  const modHeaders = [
    "Modul Pengujian",
    "Total TC",
    "PASS",
    "FAIL",
    "BLOCKED",
    "NOT RUN",
    "% Progress",
    "% Pass Rate",
  ];
  const mhRow = summarySheet.getRow(rIdx);
  modHeaders.forEach((h, i) => {
    const cell = mhRow.getCell(i + 2);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCFBF1" } };
    cell.alignment = { horizontal: i === 0 ? "left" : "center", vertical: "middle" };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  mhRow.height = 22;
  rIdx++;

  const uniqueModules = Array.from(new Set(TEST_CASES.map((tc) => tc.module)));
  const modStartRow = rIdx;

  for (const modName of uniqueModules) {
    const row = summarySheet.getRow(rIdx);
    row.getCell(2).value = modName;
    // Column B in Sheet 2 is Module, Column M in Sheet 2 is Status Eksekusi
    row.getCell(3).value = {
      formula: `COUNTIF('02_Master_Test_Cases'!$B$5:$B$${lastRow},"${modName}")`,
    };
    row.getCell(4).value = {
      formula: `COUNTIFS('02_Master_Test_Cases'!$B$5:$B$${lastRow},"${modName}",'02_Master_Test_Cases'!$M$5:$M$${lastRow},"PASS")`,
    };
    row.getCell(5).value = {
      formula: `COUNTIFS('02_Master_Test_Cases'!$B$5:$B$${lastRow},"${modName}",'02_Master_Test_Cases'!$M$5:$M$${lastRow},"FAIL")`,
    };
    row.getCell(6).value = {
      formula: `COUNTIFS('02_Master_Test_Cases'!$B$5:$B$${lastRow},"${modName}",'02_Master_Test_Cases'!$M$5:$M$${lastRow},"BLOCKED")`,
    };
    row.getCell(7).value = {
      formula: `COUNTIFS('02_Master_Test_Cases'!$B$5:$B$${lastRow},"${modName}",'02_Master_Test_Cases'!$M$5:$M$${lastRow},"NOT RUN")`,
    };
    row.getCell(8).value = {
      formula: `IF(C${rIdx}>0,(C${rIdx}-G${rIdx})/C${rIdx},0)`,
    };
    row.getCell(8).numFmt = "0.0%";
    row.getCell(9).value = {
      formula: `IF(C${rIdx}>0,D${rIdx}/C${rIdx},0)`,
    };
    row.getCell(9).numFmt = "0.0%";

    for (let c = 2; c <= 9; c++) {
      row.getCell(c).alignment = { horizontal: c === 2 ? "left" : "center", vertical: "middle" };
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    }
    row.height = 20;
    rIdx++;
  }

  const modEndRow = rIdx - 1;
  const totalRow = summarySheet.getRow(rIdx);
  totalRow.getCell(2).value = "TOTAL KESELURUHAN";
  totalRow.getCell(3).value = { formula: `SUM(C${modStartRow}:C${modEndRow})` };
  totalRow.getCell(4).value = { formula: `SUM(D${modStartRow}:D${modEndRow})` };
  totalRow.getCell(5).value = { formula: `SUM(E${modStartRow}:E${modEndRow})` };
  totalRow.getCell(6).value = { formula: `SUM(F${modStartRow}:F${modEndRow})` };
  totalRow.getCell(7).value = { formula: `SUM(G${modStartRow}:G${modEndRow})` };
  totalRow.getCell(8).value = { formula: `IF(C${rIdx}>0,(C${rIdx}-G${rIdx})/C${rIdx},0)` };
  totalRow.getCell(8).numFmt = "0.0%";
  totalRow.getCell(9).value = { formula: `IF(C${rIdx}>0,D${rIdx}/C${rIdx},0)` };
  totalRow.getCell(9).numFmt = "0.0%";

  for (let c = 2; c <= 9; c++) {
    totalRow.getCell(c).font = { bold: true, color: { argb: "FF0F172A" } };
    totalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    totalRow.getCell(c).alignment = { horizontal: c === 2 ? "left" : "center", vertical: "middle" };
    totalRow.getCell(c).border = {
      top: { style: "medium" },
      bottom: { style: "double" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }
  totalRow.height = 24;
  rIdx += 2;

  // Sign-off Block
  summarySheet.mergeCells(`B${rIdx}:I${rIdx}`);
  const signHeader = summarySheet.getCell(`B${rIdx}`);
  signHeader.value = "3. PERSETUJUAN HASIL PENGUJIAN (UAT & QA SIGN-OFF)";
  signHeader.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  signHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  summarySheet.getRow(rIdx).height = 24;
  rIdx++;

  const signRowTitle = summarySheet.getRow(rIdx);
  summarySheet.mergeCells(`B${rIdx}:C${rIdx}`);
  signRowTitle.getCell(2).value = "Ditested Oleh (QA Tester)";
  summarySheet.mergeCells(`D${rIdx}:F${rIdx}`);
  signRowTitle.getCell(4).value = "Diperiksa Oleh (Developer)";
  summarySheet.mergeCells(`G${rIdx}:I${rIdx}`);
  signRowTitle.getCell(7).value = "Disetujui Oleh (IT Leader)";
  for (let c = 2; c <= 9; c++) {
    signRowTitle.getCell(c).font = { bold: true };
    signRowTitle.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
    signRowTitle.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    signRowTitle.getCell(c).border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  }
  rIdx++;

  const signBoxRow = summarySheet.getRow(rIdx);
  summarySheet.mergeCells(`B${rIdx}:C${rIdx}`);
  signBoxRow.getCell(2).value = "\n\n\n( Nama & Tanda Tangan )\nTanggal: ....................";
  summarySheet.mergeCells(`D${rIdx}:F${rIdx}`);
  signBoxRow.getCell(4).value = "\n\n\n( Nama & Tanda Tangan )\nTanggal: ....................";
  summarySheet.mergeCells(`G${rIdx}:I${rIdx}`);
  signBoxRow.getCell(7).value = "\n\n\n( Nama & Tanda Tangan )\nTanggal: ....................";
  for (let c = 2; c <= 9; c++) {
    signBoxRow.getCell(c).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    signBoxRow.getCell(c).border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  }
  signBoxRow.height = 75;

  // =========================================================================
  // SHEET 2: 02_Master_Test_Cases
  // =========================================================================
  const tcSheet = workbook.addWorksheet("02_Master_Test_Cases", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 4, showGridLines: true }],
  });

  tcSheet.columns = [
    { key: "id", width: 15 },
    { key: "module", width: 28 },
    { key: "subModule", width: 26 },
    { key: "role", width: 16 },
    { key: "priority", width: 13 },
    { key: "type", width: 16 },
    { key: "title", width: 38 },
    { key: "preCondition", width: 30 },
    { key: "steps", width: 44 },
    { key: "testData", width: 28 },
    { key: "expectedResult", width: 42 },
    { key: "actualResult", width: 36 },
    { key: "status", width: 16 },
    { key: "severity", width: 20 },
    { key: "evidence", width: 28 },
    { key: "notes", width: 34 },
    { key: "tester", width: 18 },
    { key: "testDate", width: 15 },
    { key: "devStatus", width: 22 },
  ];

  tcSheet.mergeCells("A1:S1");
  const tcBanner = tcSheet.getCell("A1");
  tcBanner.value = "MASTER TEST CASES — DPP RECRUITMENT PORTAL DASHBOARD (ISI KOLOM L S/D S SAAT PENGUJIAN)";
  tcBanner.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  tcBanner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  tcBanner.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  tcSheet.getRow(1).height = 28;

  tcSheet.mergeCells("A2:S2");
  const tcInstruction = tcSheet.getCell("A2");
  tcInstruction.value = "Petunjuk QA: Pilih 'Status Eksekusi' (Kolom M) menggunakan dropdown (PASS / FAIL / BLOCKED / NOT RUN). Jika FAIL, isi Hasil Aktual (Kolom L), Severity Bug (Kolom N), Bukti Screenshot (Kolom O), dan Catatan (Kolom P).";
  tcInstruction.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF1E293B" } };
  tcInstruction.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
  tcSheet.getRow(2).height = 20;

  const headers = [
    "TC ID",
    "Modul",
    "Sub-Modul / Route",
    "Role Uji",
    "Prioritas",
    "Kategori Uji",
    "Judul Skenario Uji (Test Scenario)",
    "Prasyarat (Pre-Condition)",
    "Langkah Pengujian (Test Steps)",
    "Data Uji (Test Data)",
    "Hasil yang Diharapkan (Expected Result)",
    "Hasil Aktual (Actual Result - Diisi QA)",
    "Status Eksekusi",
    "Severity Bug (Jika FAIL)",
    "Link Bukti / Screenshot",
    "Catatan untuk Dev & IT Leader",
    "Nama QA Tester",
    "Tanggal Uji",
    "Status Perbaikan Dev",
  ];

  const headerRow = tcSheet.getRow(4);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    // Color code QA input columns (L to S) differently so QA knows what to fill
    const isQaInput = idx >= 11;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isQaInput ? "FF047857" : "FF1E3A8A" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  });
  headerRow.height = 30;

  tcSheet.autoFilter = "A4:S4";

  TEST_CASES.forEach((tc, idx) => {
    const rowNum = 5 + idx;
    const row = tcSheet.getRow(rowNum);

    row.values = [
      tc.id,
      tc.module,
      tc.subModule,
      tc.role,
      tc.priority,
      tc.type,
      tc.title,
      tc.preCondition,
      tc.steps,
      tc.testData,
      tc.expectedResult,
      "", // Actual Result
      "NOT RUN", // Status
      "-", // Severity
      "", // Evidence
      "", // Notes
      "", // Tester
      "", // Date
      "-", // Dev Status
    ];

    const isEven = idx % 2 === 0;
    const baseBg = isEven ? "FFFFFFFF" : "FFF8FAFC";

    for (let c = 1; c <= 19; c++) {
      const cell = row.getCell(c);
      cell.alignment = {
        vertical: "top",
        horizontal: [1, 4, 5, 6, 13, 14, 18, 19].includes(c) ? "center" : "left",
        wrapText: true,
      };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baseBg } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }

    row.getCell(1).font = { bold: true, color: { argb: "FF1E3A8A" } };

    // Priority styling
    const prioCell = row.getCell(5);
    if (tc.priority === "CRITICAL") {
      prioCell.font = { bold: true, color: { argb: "FF991B1B" } };
      prioCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
    } else if (tc.priority === "HIGH") {
      prioCell.font = { bold: true, color: { argb: "FF9A3412" } };
      prioCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } };
    }

    // Dropdown validations for Status, Severity, and Dev Status
    row.getCell(13).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"NOT RUN,PASS,FAIL,BLOCKED,IN PROGRESS"'],
    };
    row.getCell(13).font = { bold: true };

    row.getCell(14).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"-,S1 - Critical/Blocker,S2 - Major,S3 - Minor,S4 - Cosmetic"'],
    };

    row.getCell(19).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"-,OPEN,IN PROGRESS,FIXED - READY FOR RETEST,CLOSED,WONT FIX"'],
    };

    row.height = 64;
  });

  // =========================================================================
  // SHEET 3: 03_Bug_&_Defect_Log
  // =========================================================================
  const bugSheet = workbook.addWorksheet("03_Bug_&_Defect_Log", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 3, showGridLines: true }],
  });

  bugSheet.columns = [
    { width: 14 },
    { width: 15 },
    { width: 26 },
    { width: 16 },
    { width: 38 },
    { width: 44 },
    { width: 36 },
    { width: 36 },
    { width: 20 },
    { width: 28 },
    { width: 18 },
    { width: 24 },
    { width: 32 },
  ];

  bugSheet.mergeCells("A1:M1");
  const bugBanner = bugSheet.getCell("A1");
  bugBanner.value = "DAFTAR TEMUAN BUG / DEFECT LOG — DPP RECRUITMENT PORTAL DASHBOARD";
  bugBanner.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  bugBanner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F1D1D" } };
  bugSheet.getRow(1).height = 28;

  const bugHeaders = [
    "Bug ID",
    "Ref TC ID",
    "Modul / Halaman",
    "Role Saat Uji",
    "Ringkasan Masalah (Bug Title)",
    "Langkah Reproduksi (Steps to Reproduce)",
    "Hasil yang Diharapkan (Expected)",
    "Hasil Aktual / Pesan Error (Actual)",
    "Severity",
    "Link Screenshot / Video / Log",
    "Dilaporkan Oleh",
    "Status Perbaikan Developer",
    "Catatan Developer / Hasil Retest QA",
  ];

  const bugHeaderRow = bugSheet.getRow(3);
  bugHeaders.forEach((h, i) => {
    const cell = bugHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  bugHeaderRow.height = 28;
  bugSheet.autoFilter = "A3:M3";

  // Pre-create 25 clean rows with dropdown validation for Bug Log
  for (let i = 1; i <= 25; i++) {
    const r = bugSheet.getRow(3 + i);
    r.getCell(1).value = `BUG-${String(i).padStart(3, "0")}`;
    r.getCell(1).font = { bold: true, color: { argb: "FF991B1B" } };
    r.getCell(1).alignment = { horizontal: "center", vertical: "top" };

    r.getCell(9).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"S1 - Critical/Blocker,S2 - Major,S3 - Minor,S4 - Cosmetic"'],
    };
    r.getCell(12).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"OPEN,IN PROGRESS,FIXED - READY FOR RETEST,CLOSED,REJECTED"'],
    };

    for (let c = 1; c <= 13; c++) {
      r.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (c > 1) {
        r.getCell(c).alignment = { vertical: "top", wrapText: true };
      }
    }
    r.height = 42;
  }

  const outDir = path.resolve(process.cwd(), "docs", "qa");
  await fs.promises.mkdir(outDir, { recursive: true });
  const outFile = path.resolve(outDir, "DPP_Recruitment_Portal_QA_Test_Cases.xlsx");
  await workbook.xlsx.writeFile(outFile);
  console.log(`✅ File Excel QA Test Cases berhasil dibuat: ${outFile}`);
  console.log(`📊 Total Modul: ${uniqueModules.length} | Total Skenario Uji: ${TEST_CASES.length}`);
}

generateWorkbook().catch((err) => {
  console.error("❌ Gagal membuat workbook QA:", err);
  process.exit(1);
});
