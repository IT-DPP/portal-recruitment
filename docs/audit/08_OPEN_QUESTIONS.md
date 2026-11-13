# 08. DAFTAR PERTANYAAN TERBUKA & ASUMSI DEFAULT
**Rekapitulasi Hal-Hal yang Memerlukan Konfirmasi Manajemen & Tim Lapangan DPP**  
*Auditor: Joint Audit Team (Principal Engineer & Business Analyst)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Pendahuluan
Selama pelaksanaan audit komprehensif berbasis bukti (*evidence-based read-only audit*), tim auditor mengidentifikasi beberapa area kebijakan operasional, hukum, dan arsitektur tingkat lanjut yang belum memiliki dokumentasi tertulis resmi di repositori. 

Untuk menyelesaikan analisis secara tuntas tanpa terhenti, tim auditor telah menetapkan **Asumsi Default** yang masuk akal berdasarkan praktik standar industri penyedia tenaga kerja tambang/maritim di Indonesia dan regulasi UU PDP No. 27/2022. Dokumen ini merangkum seluruh pertanyaan tersebut beserta asumsi yang digunakan agar dapat divalidasi oleh IT Leader bersama manajemen DPP.

---

## 2. Rekapitulasi Pertanyaan & Asumsi Default

### Topik 1: Proses Operasional Rekrutmen & Alur Klien

#### Pertanyaan 1.1: Alur Input Pelamar Lapangan vs Back Office
*Pertanyaan:*  
Apakah ke depannya portal registrasi mandiri pelamar (`/candidate/register` dan `/candidate/profile`) tetap dipertahankan untuk lowongan Back Office / Head Office, sementara untuk lowongan lapangan (operator, mekanik, welder) tim recruiter akan dibekali fitur input massal (*Bulk Import Excel*)?  
*Asumsi Default Auditor:*  
**YA.** Alur hibrida adalah solusi paling realistis: pelamar staf HO/BO dapat mengisi data secara mandiri melalui web, sedangkan pelamar teknis lapangan diproses secara terpusat oleh staf recruiter menggunakan template spreadsheet massal.

#### Pertanyaan 1.2: Fleksibilitas 10 Tahapan Seleksi
*Pertanyaan:*  
Apakah seluruh lowongan kerja wajib melalui seluruh 10 tahapan seleksi secara kaku (misal: posisi staf administrasi kantor apakah tetap wajib melalui tes skill alat berat dan induksi K3 tambang)?  
*Asumsi Default Auditor:*  
Secara default, tahapan seleksi harus **dapat dikonfigurasi aktif/nonaktif (*toggleable stages*)** per lowongan pekerjaan. Untuk lowongan staf kantor, tahapan tes teknis alat berat dan induksi site tambang dapat dilewati (*bypassed*), sedangkan untuk operator tambang seluruh 10 tahapan wajib dipenuhi.

#### Pertanyaan 1.3: Hak Akses Klinik Rekanan (Vendor MCU)
*Pertanyaan:*  
Apakah klinik rekanan (misal: Klinik Tirta Medical, Prodia, Kimia Farma) nantinya akan diberikan akun portal khusus (*Role: CLINIC*) untuk mengunggah berkas hasil MCU langsung ke sistem, atau berkas hasil MCU fisik/PDF selalu diterima oleh staf HR DPP lalu diunggah secara manual?  
*Asumsi Default Auditor:*  
Saat ini seluruh hasil pemeriksaan medis **diunggah secara manual oleh tim internal recruiter DPP** dari hasil email/dokumen cetak klinik. Memberikan akses akun eksternal ke klinik rekanan saat ini belum diimplementasikan karena membutuhkan pengaturan kontrol akses data medis yang lebih ketat.

---

### Topik 2: Hukum, Kepatuhan UU PDP, & Tata Kelola Data

#### Pertanyaan 2.1: Masa Retensi Berkas Dokumen & Hasil MCU
*Pertanyaan:*  
Berapa lama DPP diwajibkan menyimpan berkas identitas (KTP, KK) dan berkas rekam medis MCU dari pelamar yang **TIDAK DITERIMA (Gagal / Ditolak)** dan pelamar yang **SUDAH HIRED**?  
*Asumsi Default Auditor:*  
Berdasarkan norma kepatuhan UU PDP No. 27/2022 dan hukum ketenagakerjaan:  
- Berkas pelamar yang **ditolak**: Disimpan maksimal **1 hingga 2 tahun** untuk keperluan talent pool atau sanggahan hukum rekrutmen, setelah itu wajib dihapus permanen atau dianomimkan (*anonymized*).  
- Berkas pelamar yang **diterima (hired)**: Disimpan sepanjang masa kontrak kerja berlangsung ditambah masa retensi audit ketenagakerjaan (5 tahun).

#### Pertanyaan 2.2: Enkripsi Data Medis & KTP/KK
*Pertanyaan:*  
Apakah DPP akan menerapkan enkripsi tingkat kolom (*Field-Level Encryption*) pada level database atau cukup mengandalkan enkripsi disk penyimpanan VM Azure (*At-Rest Volume Encryption*)?  
*Asumsi Default Auditor:*  
Karena data MCU adalah data pribadi bersifat spesifik menurut UU PDP, direkomendasikan menerapkan **Field-Level Encryption (AES-256-GCM)** pada kolom database yang memuat NIK, No KK, dan rincian diagnosa MCU, menggunakan *key* terpisah yang disimpan di environment variable aman.

---

### Topik 3: Infrastruktur & Teknologi

#### Pertanyaan 3.1: Kesiapan Penambahan Kontainer Redis di VM Azure
*Pertanyaan:*  
Apakah VM Azure non-Odoo saat ini memiliki alokasi memori yang cukup untuk menjalankan satu kontainer tambahan `redis:7-alpine` (~50MB RAM) guna menangani *distributed rate limiting*, *job queue*, dan penyimpanan sesi pengguna?  
*Asumsi Default Auditor:*  
**YA, sangat mencukupi.** Spesifikasi VM Azure standar untuk Docker Compose umumnya memiliki minimal 4GB–8GB RAM. Penambahan kontainer Redis ringan (~50MB) tidak akan membebani server dan secara permanen menyelesaikan masalah in-memory rate limiter yang reset saat kontainer reboot.

#### Pertanyaan 3.2: Standardisasi Template Dokumen Legal (BAST & Offering)
*Pertanyaan:*  
Apakah template surat Offering Letter dan Berita Acara Serah Terima (BAST) yang ada saat ini di `lib/document-generator.ts` sudah mendapatkan persetujuan resmi (*formal sign-off*) dari Divisi Legal / Manajemen DPP?  
*Asumsi Default Auditor:*  
Struktur pasal dan klausul saat ini merupakan draft prototipe hasil AI. Format tata letak (*layout*), klausul hak/kewajiban, dan susunan tabel BAST wajib ditinjau ulang dan disahkan oleh Departemen Legal sebelum dokumen dihasilkan secara massal ke klien tambang.

