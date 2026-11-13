# 03. ANALISIS KESESUAIAN BISNIS (BUSINESS FIT)
**PT Dian Pandu Pratama (DPP) — Labor Supply & Job Supply**  
*Auditor: Joint Audit Team (Business Analyst & Principal Engineer)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Konteks Bisnis PT Dian Pandu Pratama (DPP)

PT Dian Pandu Pratama (DPP) beroperasi sebagai penyedia tenaga kerja (*Labor Supply*) dan penyedia lowongan penempatan (*Job Supply*), dengan klien utama korporasi skala besar di sektor **pertambangan (batubara, nikel, mineral), alat berat (heavy equipment dealership & maintenance), dan maritim (logistik pelabuhan/tongkang)**.

Karakteristik operasional utama bisnis ini:
1. **Model Bisnis B2B (Order-Driven):** Rekrutmen dipicu oleh Surat Perjanjian Kerja Sama (PKS), *Purchase Order* (PO), atau *Service Order* dari klien korporat (misal: PT Kaltim Prima Coal, PT Kideco Jaya Agung, PT Berau Coal, PT Vale Indonesia) dengan target kuota *headcount* dan batas waktu mobilisasi (*fulfillment SLA*) yang ketat.
2. **Kategori Tenaga Kerja Spesifik:** Mayoritas kebutuhan personil meliputi operator alat berat (Dump Truck 777/785, Excavator 200/400), mekanik alat berat, juru las (*welder* bersertifikat BNSP/Migas), rigger, safety officer (HSE K3 Tambang), serta tenaga staf operasional site dan *Back Office / Head Office (HO)*.
3. **Kepatuhan Sektor Tambang & Maritim:** Personil yang dikirim ke *site* wajib memenuhi persyaratan keselamatan kerja ketat: evaluasi kesehatan *Fit to Work* (MCU tambang komprehensif), kepemilikan SIMPER (Surat Izin Mengemudi Perusahaan), induksi K3, dan BAST (Berita Acara Serah Terima) personil antara DPP dan klien.

---

## 2. Analisis Kesenjangan Fitur (Gap Analysis)

Setelah membedah seluruh model data Prisma (`prisma/schema.prisma`) dan alur kode, ditemukan kesenjangan mendasar antara sistem yang ada saat ini dengan alur kerja nyata perusahaan *Labor Supply*:

### 2.1 GAP 1: Ketiadaan Pelacakan Pemenuhan Kuota Klien (*Headcount Fulfillment Tracking*)
- **Fakta di Kode:** Model `JobOpening` (`schema.prisma:240-272`) hanya memiliki atribut sederhana `jumlahPermintaan Int` dan `status JobStatus (DRAFT, ACTIVE, CLOSED, OVERDUE)`.
- **Kesenjangan Bisnis:** Dalam bisnis *Labor Supply*, unit transaksi bisnis adalah target pemenuhan kuota per klien. Recruiter membutuhkan matriks langsung:  
  $$\text{Target PO} \longrightarrow \text{Shortlisted} \longrightarrow \text{MCU Fit} \longrightarrow \text{Offering Accepted} \longrightarrow \text{Mobilized on Site} \longrightarrow \text{Drop-out/Cancel}$$
  Sistem saat ini tidak dapat menampilkan berapa tenaga kerja yang sudah aktif di *site* tambang vs berapa kuota yang masih tertunggak per klien/kontrak.

### 2.2 GAP 2: Ketiadaan Fitur Input Massal (*Assisted / Bulk Registration*) untuk Recruiter
- **Fakta di Kode:** Pendaftaran pelamar didesain untuk pelamar mandiri via web (`app/candidate/register/page.tsx`). Satu-satunya form input oleh staf adalah `app/dashboard/talent-pool/add/page.tsx` (524 baris), yang mengharuskan recruiter mengetik puluhan isian data satu per satu untuk setiap individu.
- **Kesenjangan Bisnis (Telah Dikonfirmasi User):** Di lapangan, banyak pelamar teknisi, operator, dan mekanik tambang tidak mendaftar mandiri melalui portal web modern. Berkas fisik atau resume WhatsApp/email dikumpulkan oleh staf lapangan DPP. Ketiadaan fitur **"Import Batch Kandidat via Excel/CSV"** memaksa staf melakukan input manual ratusan kali, yang jauh lebih lambat dibanding mengelola spreadsheet Excel biasa.

### 2.3 GAP 3: Standar Hasil MCU Tambang yang Terlalu Dangkal
- **Fakta di Kode:** Status MCU hanya disimpan dalam field teks bebas di dalam JSON blob `Application.stageData` (`app/actions/candidate-application.ts:278`), atau opsi string rejection `"Failed Medical Check-Up (MCU)"` (`seed-essential.ts:230`).
- **Kesenjangan Bisnis:** Di sektor tambang dan maritim, hasil MCU tidak sekadar "Lolos" atau "Gagal". Terdapat klasifikasi resmi dokter okupasi tambang:
  1. *Category 1 (Fit for Job)*: Sehat tanpa catatan.
  2. *Category 2 (Fit with Note / Restriction)*: Sehat dengan catatan khusus (misal: harus berkacamata, pantau tensi rutin).
  3. *Category 3 (Temporary Unfit)*: Ditunda sementara untuk pengobatan (misal: kolesterol tinggi, gigi berlubang akut, infeksi ringan) dengan jadwal *re-check* MCU.
  4. *Category 4 (Unfit)*: Tidak layak bekerja di area tambang berisiko tinggi.
  Sistem saat ini tidak mendukung penjadwalan *re-check* MCU atau tracking kondisi *Temporary Unfit*, sehingga kandidat potensial langsung dianggap gagal atau tertahan statusnya tanpa kejelasan tindak lanjut.

### 2.4 GAP 4: Alur Pasca-MCU & Mobilisasi Site yang Hanya Berupa Folder Dokumen
- **Fakta di Kode:** Tahap 8 (Training), Tahap 9 (Induction), dan Tahap 10 (PKWT) diimplementasikan hanya sebagai tempat penampung berkas unggahan generik (`MultipleDocumentStoreWidget.tsx:1-247` dan `HiredCandidateStageAccordions.tsx:75-81`). Nilai SLA hari pada ketiga tahapan ini di-hardcode ke angka 0 hari (`seed-essential.ts:205-207: slaDays: 0`).
- **Kesenjangan Bisnis:** Fase setelah lolos MCU adalah fase paling krusial dalam *Labor Supply*:
  - **Induction Site:** Mengurus ID Pass / Mine Permit dari klien tambang.
  - **Ticketing & Mobilisasi:** Jadwal penerbangan/keberangkatan kandidat dari kota asal ke *site* tambang (misal transit Balikpapan menuju Melak/Batu Kajang).
  - **Tanda Tangan PKWT:** Tanggal mulai kerja resmi (*Effective Date*) penagihan *billing* ke klien.
  Sistem saat ini memperlakukan tiga tahap ini sekadar wadah file upload tanpa alur operasional mobilisasi.

---

## 3. Fitur Berlebihan / Kurang Berguna (*Bloat Features*)

Audit mengidentifikasi beberapa modul yang dibangun dengan usaha teknis besar tetapi tidak memberikan nilai tambah terhadap proses bisnis inti DPP:

| Fitur / Komponen | Bukti Kode | Alasan Ketidaksesuaian Bisnis |
| :--- | :--- | :--- |
| **GeoSource Map (Leaflet)** | `app/dashboard/geosource/page.tsx:1-506`, `GeoMapComponent.tsx` | Visualisasi peta sebaran asal pelamar tidak membantu tim recruiter menyelesaikan target pengiriman tenaga kerja ke site klien. Recruiter membutuhkan tabel ketersediaan (*availability list*) berdasarkan masa berlaku sertifikat, bukan koordinat peta geografis. |
| **Ranking Top 5 BLK/LPK** | `components/dashboard/TopBlkChart.tsx:1-41` | Grafik ini mengasumsikan pelamar berasal dari Balai Latihan Kerja tertentu. Kenyataannya, rekrutmen pekerja berpengalaman tambang (*experienced hire*) mayoritas berasal dari koneksi industri, mantan karyawan kontraktor tambang lain, atau pendaftaran langsung di site. |
| **Persetujuan Online Offering Letter via Mobile Canvas / Upload Mandiri** | `components/candidate/OfferingActionCard.tsx:1-796` | Mengharuskan kandidat mencetak PDF Offering, menandatanganinya secara basah, men-scan, dan mengunggah ulang ke portal kandidat. Untuk calon pekerja di daerah pelosok tanpa printer/scanner, ini menjadi titik mati proses (*bottleneck*). Di DPP, konfirmasi penawaran kerap dilakukan via telepon/WhatsApp resmi tim HR. |

---

## 4. Perbandingan Efisiensi: Sistem vs Spreadsheet Excel

Salah satu alasan tim operasional menolak sistem baru dan kembali menggunakan Excel adalah jika sistem baru membutuhkan lebih banyak langkah untuk tugas yang sama:

```
Perbandingan Alur Kerja: Memproses 20 Kandidat Lolos Screening ke Tahap MCU

Alur di Excel / Spreadsheet:
[Copy 20 Baris Kandidat] ──> [Paste ke Sheet Template Pengantar MCU] ──> [Kirim ke Klinik] 
Waktu: ~3 Menit

Alur di Sistem Saat Ini:
[Buka Job Opening Detail] 
  ──> [Klik Verifikasi Kandidat 1] (Layar 2.893 baris termuat lambat)
  ──> [Centang BNSP, Simpan] 
  ──> [Pindah ke HR Interview, Ketik Catatan, Simpan]
  ──> [Pindah ke Test Skill, Simpan]
  ──> [Pindah ke User Interview, Simpan]
  ──> [Pindah ke Offering, Upload Draft, Simpan]
  ──> [Ulangi 20 Kali untuk 20 Kandidat = 120 Transaksi Form Manual!]
  ──> [Buka Menu Generate Documents terpisah]
  ──> [Cari nama satu per satu di tabel MCU]
Waktu: ~60 - 90 Menit (Recruiter Mengalami Kelelahan Operasional)
```

> [!IMPORTANT]
> **Kesimpulan Efisiensi Bisnis:**  
> Sistem saat ini belum memiliki kemampuan **Tindakan Massal (*Bulk Actions*)**. Ketiadaan tombol *"Loloskan Massal ke Tahap X"* dan ketiadaan *"Import Massal Kandidat"* membuat produktivitas tim recruiter menurun signifikan dibandingkan memakai spreadsheet.

---

## 5. Pertanyaan Validasi Kritis untuk Tim HR & Recruiter DPP

Daftar pertanyaan ini wajib divalidasi oleh IT Leader bersama Manajer HR / Lead Recruiter DPP guna memastikan arah revamp tepat sasaran:

### Kategori A: Proses Bisnis & Kontrak Klien
1. **Bagaimana format dokumen resmi permintaan tenaga kerja dari klien tambang saat ini?**  
   *Asumsi Default Audit:* Menggunakan formulir Purchase Order (PO) atau Form Permintaan Karyawan Baru (FPKB) yang mencantumkan nama site, kuota personil, kualifikasi umur, sertifikat minimum, dan tanggal batas mobilisasi.
2. **Apakah ada denda / penalti finansial jika kuota tenaga kerja terlambat dipenuhi melewati batas SLA klien?**  
   *Asumsi Default Audit:* Ya, beberapa PKS tambang memiliki klausul penalti atau risiko pemutusan alokasi kuota ke vendor lain jika DPP gagal memenuhi headcount dalam jangka waktu tertentu (misal 30 hari). Sistem harus memiliki alert/notifikasi mendekati deadline SLA.
3. **Bagaimana status kepemilikan data kandidat yang tidak lolos seleksi klien A?**  
   *Asumsi Default Audit:* Masuk ke Talent Pool umum DPP dan dapat dialokasikan langsung untuk permintaan klien B tanpa perlu mengulang pendaftaran dari awal.

### Kategori B: Prosedur Medis (MCU Tambang)
4. **Klinik rekanan mana saja yang resmi bekerja sama dengan DPP dan bagaimana alur penagihan biayanya?**  
   *Asumsi Default Audit:* Menggunakan klinik spesialis okupasi kerja tambang (Klinik Tirta Medical, Prodia, Kimia Farma). Biaya ditagihkan secara berkala (*corporate billing / invoice*) kepada DPP berdasarkan surat pengantar resmi.
5. **Bagaimana prosedur penanganan kandidat dengan status MCU *Temporary Unfit*?**  
   *Asumsi Default Audit:* Kandidat diberikan waktu 7–14 hari untuk perbaikan kondisi (misal terapi obat atau istirahat), lalu dijadwalkan MCU ulang (*re-check*) khusus untuk parameter yang bermasalah saja.

### Kategori C: Alur Mobilisasi & Legal
6. **Kapan tepatnya dokumen PKWT ditandatangani oleh kandidat?**  
   *Asumsi Default Audit:* Ditandatangani sebelum tiket keberangkatan diterbitkan atau pada saat hari pertama induksi di Head Office / Transit Basecamp.
7. **Dokumen apa saja yang wajib disertakan dalam Berita Acara Serah Terima (BAST) ke klien tambang?**  
   *Asumsi Default Audit:* Berkas personalia lengkap (KTP, KK, Ijazah), Sertifikat BNSP/SIM BII, Lembar Pengesahan Hasil MCU *Fit to Work*, Bukti Kepesertaan BPJS Ketenagakerjaan, dan Surat Pernyataan Penempatan.

