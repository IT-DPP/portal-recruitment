# 02. LAPORAN DETEKSI "AI SLOP" & CODE SMELLS
**DPP Recruitment Portal Dashboard**  
*Auditor: Joint Audit Team (Principal Engineer & UX Auditor)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Definisi & Kriteria AI Slop dalam Proyek Ini
Dalam konteks audit teknik ini, **"AI Slop"** didefinisikan sebagai kode, komponen UI, copywriting, struktur data, dan konfigurasi yang dihasilkan secara instan oleh model AI (LLM) yang tampak berfungsi di permukaan (*happy path demo*), namun memiliki karakteristik:
1. **Monolitik & Tidak Modular:** Komponen ribuan baris disatukan dalam satu file dengan puluhan *state* tak terkelola.
2. **Duplikasi & Kode Terlantar:** Menghasilkan fungsi baru saat diminta revisi tanpa membersihkan kode lama (*orphaned code*).
3. **Penyembunyian Cacat (*Error Swallowing* & *Synthetic Fallbacks*):** Menelan exception diam-diam dengan `catch (e) {}` atau memalsukan berkas palsu saat data asli tidak ada.
4. **Desain Generik Tanpa Konteks Domain:** Template dashboard kartu warna-warni yang tidak memiliki nilai actionable bagi operasional rekrutmen tenaga kerja lapangan (*labor supply*).
5. **Kelebihan Dependensi (*Bloatware*):** Memasang library berat pihak ketiga yang tidak pernah diimpor atau digunakan.

---

## 2. Temuan Kategori A: Kualitas Kode & Arsitektur

### 2.1 Komponen Raksasa Monolitik (>400 Baris Kode)
Audit mendeteksi **25 file** yang melampaui batas wajar keterbacaan (clean code threshold: 400 baris). File-file ini menggabungkan logika manipulasi DOM, state antarmuka, parsing data, hingga kalkulasi bisnis dalam satu wadah raksasa:

| Path File | Baris (LOC) | Bukti Line | Kategori Masalah |
| :--- | :---: | :--- | :--- |
| `app/dashboard/generate-documents/GenerateDocumentsClient.tsx` | **3.332** | L1–L3535 | Mega-Monolit UI, generator template HTML, integrasi BAST/MCU, dan filter data client-side digabung dalam satu file. |
| `prisma/seed-dummy.ts` | **2.955** | L1–L2955 | Script seed raksasa dengan ribuan baris data hardcoded yang menyamarkan cacat skema relasional. |
| `app/dashboard/job-openings/[id]/verify/[candidateId]/page.tsx` | **2.893** | L1–L3040 | **Mega-Monolit Ekstrem**: 1 file berisi 50+ hook `useState` terpisah, 10 modal, dan alur 10 tahapan seleksi tanpa sub-komponen terpisah. |
| `lib/document-generator.ts` | **2.482** | L1–L2690 | Monolit generator file: manipulasi DOCX, format XLSX, perakitan ZIP, dan DOM-canvas screenshot PDF. |
| `app/actions/job.ts` | **1.717** | L1–L1892 | Monolit Server Action: seluruh query lowongan, kanban, kalender, blacklist, arsip, dan paginasi disatukan di satu file. |
| `scripts/generate-qa-testcases.ts` | **1.209** | L1–L1209 | Script generator matriks pengujian QA Excel. |
| `app/dashboard/calendar/page.tsx` | **1.031** | L1–L1031 | Monolit kalender: manajemen filter, state multi-view, modal interview, dan manipulasi tanggal. |
| `components/candidate/OfferingActionCard.tsx` | **796** | L1–L796 | Form kartu offering pelamar, upload file base64, signature view, dan interaksi pesan. |
| `app/dashboard/job-openings/[id]/JobDetailClient.tsx` | **779** | L1–L779 | Detail job order, metrik pemenuhan, dan tabel kandidat. |
| `app/actions/candidate-application.ts` | **748** | L1–L853 | Penanganan aksi kandidat: respon offering, upload MCU, kirim pesan, mutasi job. |
| `app/actions/master-data.ts` | **714** | L1–L714 | CRUD 13 entitas master data dalam satu file. |
| `components/dashboard/HiredCandidateStageAccordions.tsx` | **696** | L1–L726 | Accordion 10 tahapan kandidat hired. |
| `app/candidate/(dashboard)/profile/page.tsx` | **635** | L1–L635 | Form profil kandidat 10 section. |
| `components/dashboard/documents/McuDocumentTemplate.tsx` | **608** | L1–L608 | Template HTML/CSS inline surat pengantar MCU. |
| `app/dashboard/job-openings/[id]/edit/JobEditClient.tsx` | **573** | L1–L573 | Form edit job opening. |
| `app/dashboard/job-openings/create/JobCreateClient.tsx` | **562** | L1–L562 | Form pembuatan job order. |
| `app/dashboard/talent-pool/add/page.tsx` | **524** | L1–L524 | Form manual input talent pool oleh staf. |
| `app/dashboard/geosource/page.tsx` | **506** | L1–L561 | Dashboard analitik GeoSource + pemrosesan ranking institusi. |
| `components/PipelineBoard.tsx` | **496** | L1–L496 | Kanban board drag-and-drop. |
| `app/candidate/(dashboard)/jobs/CandidateJobsClient.tsx` | **492** | L1–L492 | List lowongan pelamar. |
| `components/candidate/CandidateApplicationItem.tsx` | **478** | L1–L478 | Komponen list riwayat lamaran. |
| `app/dashboard/executive/page.tsx` | **467** | L1–L504 | Dashboard analitik eksekutif. |
| `app/dashboard/settings/master-data/sites-operation/SiteClient.tsx` | **442** | L1–L442 | Pengaturan site dan SLA khusus. |
| `components/ui/SearchableSelect.tsx` | **430** | L1–L430 | Komponen dropdown custom searchable. |
| `app/dashboard/job-openings/JobClient.tsx` | **426** | L1–L426 | Tabel lowongan kerja staf. |
| `lib/seeder.ts` | **408** | L1–L408 | Utility helper seeder. |

---

### 2.2 Penelanan Error Tanpa Jejak (*Silent Error Swallowing*)
AI cenderung membungkus kode rapuh dengan blok `try/catch` kosong agar antarmuka tidak mengalami crash (white screen of death), tetapi akibatnya bug operasional menjadi tidak terdeteksi:

1. **`app/dashboard/generate-documents/GenerateDocumentsClient.tsx:613`**
   ```typescript
   // Bukti: Error generation diabaikan begitu saja
   } catch (e) {}
   ```
2. **`app/dashboard/job-openings/[id]/verify/[candidateId]/page.tsx:526`**
   ```typescript
   // Bukti: Parsing dokumen verifikasi gagal secara diam-diam
   } catch (e) {}
   ```
3. **`components/PipelineBoard.tsx:187`**
   ```typescript
   // Bukti: Gagal update stage drag-and-drop ditelan tanpa notifikasi ke recruiter
   } catch (e) {}
   ```
4. **`lib/document-generator.ts:1666` & `lib/document-generator.ts:2026`**
   ```typescript
   // Bukti: Error styling dan parsing tabel DOCX/Excel ditelan tanpa log
   } catch (e) {}
   ...
   } catch {}
   ```

---

### 2.3 Pelanggaran Type Safety & Penumpukan Tipe `any`
Hasil eksekusi `npx eslint .` membuktikan adanya **644 masalah kode** (482 error kritis, 162 warning), di mana sebagian besar disebabkan oleh penggunaan tipe `any` yang melumpuhkan kemampuan static typing TypeScript:

| File Sumber | Frekuensi `any` | Dampak |
| :--- | :---: | :--- |
| `app/dashboard/job-openings/[id]/JobDetailClient.tsx` | **28** kali | Data kandidat dan job tidak memiliki interface schema yang ketat. |
| `app/dashboard/job-openings/[id]/verify/[candidateId]/page.tsx` | **27** kali | Seluruh payload verifikasi 10 tahap tidak tervalidasi. |
| `app/actions/job.ts` | **27** kali | Input query database bebas dari pemeriksaan tipe data saat runtime. |
| `app/dashboard/generate-documents/GenerateDocumentsClient.tsx` | **18** kali | Variabel generator dokumen rentan mengalami runtime undefined error. |
| `lib/document-generator.ts` | **18** kali | Objek dokumen dinamis rentan menghasilkan file korup. |
| `app/candidate/(dashboard)/profile/page.tsx` | **17** kali | Form input data pelamar kehilangan proteksi tipe. |
| `app/actions/candidate-profile.ts` | **14** kali | Manipulasi dokumen profil tanpa validasi bentuk data. |
| `components/dashboard/HiredCandidateStageAccordions.tsx` | **13** kali | Props data kelulusan kandidat dioper tanpa schema. |
| `app/actions/document.ts` | **13** kali | Payload data dokumen tidak terikat contract Zod. |

---

### 2.4 Kode Terlantar (*Dead Code*) & Bloatware Dependensi
AI sering menginstal paket atau membuat file alternatif ketika gagal menyelesaikan tugas, lalu membiarkan file lama terlantar di repositori:

1. **Komponen Kalender Terlantar (`components/dashboard/InterviewCalendar.tsx` - 76 baris):**  
   *Fakta:* File ini adalah komponen kalender awal. Ketika developer/AI membuat `components/dashboard/AdvancedCalendar.tsx` (169 baris), `InterviewCalendar.tsx` ditinggalkan begitu saja dan **tidak pernah diimpor oleh file mana pun di proyek**.
2. **Dependensi Editor Teks Terbengkalai (`@tiptap/*`):**  
   *Fakta:* Di `package.json:25-27` terpasang tiga paket `@tiptap/pm` (v3.31.3), `@tiptap/react` (v3.31.3), dan `@tiptap/starter-kit` (v3.31.3). Hasil pencarian global di seluruh folder `app/`, `components/`, dan `lib/` menunjukkan **0 impor (@tiptap tidak pernah dipakai sama sekali)**.
3. **Dependensi Pengubah Word Terbengkalai (`html-to-docx`):**  
   *Fakta:* `html-to-docx` (v1.8.0) tercatat di `package.json:30`. Tidak ada satu pun file di repositori yang mengimpor paket ini karena dokumen dibuat manual melalui library `docx`.
4. **Dualitas Library Excel & Vulnerability `xlsx`:**  
   *Fakta:* Di `package.json:44,51` terpasang `xlsx: ^0.18.5` dan `exceljs: ^4.4.0`. Library `xlsx` memiliki kerentanan kritis *Prototype Pollution* (GHSA-4r6h-8v6p-xvw6) dan ReDoS (GHSA-5pgg-2g8v-p4x9). Di `lib/document-generator.ts:3`, `XLSX` diimpor (`import * as XLSX from "xlsx"`), namun fungsi ekspor BAST sepenuhnya menggunakan `ExcelJS.Workbook()`. Dependensi `xlsx` adalah bloatware berbahaya yang tidak diperlukan.

---

## 3. Temuan Kategori B: UI & UX Slop

### 3.1 Komponen Rendering PDF DOM-Screenshot yang Rapuh
- *Lokasi Bukti:* `lib/document-generator.ts:1500-1605`
- *Metode yang Dipakai:* AI mengimplementasikan konversi dokumen cetak ke PDF dengan cara:
  1. Membuat `iframe` tersembunyi di DOM browser user.
  2. Menginjeksi string HTML mentah ke dalam iframe (`iframeDoc.write(...)`).
  3. Menunggu hardcoded timeout 200ms (`setTimeout(resolve, 200)`).
  4. Menjalankan `html2canvas` untuk mengambil **tangkapan layar grafis (bitmap screenshot)** dari elemen DOM.
  5. Menempelkan gambar raster tersebut ke dalam lembar `jspdf`.
- *Dampak Negatif:*
  - Teks pada dokumen PDF yang dihasilkan **tidak dapat di-blok, disalin (copy), atau dicari (searchable)** karena hanya berupa gambar bitmap statis.
  - Resolusi cetak pada printer fisik menjadi kabur (*blurry/pixelated*).
  - Proses ini menghabiskan memori RAM browser klien secara masif dan rentan mengalami *freeze/timeout* di perangkat mobile atau laptop spesifikasi rendah.

### 3.2 Terlalu Banyak Widget KPI yang Tidak Actionable
- *Lokasi Bukti:* `app/dashboard/executive/page.tsx:1-467`
- *Fakta:* Executive Dashboard memuat banyak kartu indikator KPI (Total Jobs, Open Positions, Total Candidates, Funnel Stage) yang bersifat statis dan murni presentasional. Recruiter tidak dapat melakukan *actionable trigger* dari dashboard tersebut (misalnya: tidak dapat mengklik angka "5 Overdue Stage" untuk langsung membuka daftar kandidat yang macet).

### 3.3 Dashboard GeoSource yang Tidak Bernilai Operasional
- *Lokasi Bukti:* `app/dashboard/geosource/page.tsx:1-506`
- *Fakta:* Modul GeoSource menampilkan peta Leaflet sebaran koordinat kandidat dan grafik *Top 5 BLK/LPK* (`TopBlkChart.tsx`). Dalam bisnis *Labor Supply* ke tambang, penempatan didasarkan pada kualifikasi sertifikat, hasil MCU, dan ketersediaan mobilisasi, bukan titik koordinat demografis pelamar. Fitur ini tipikal *gimmick* AI demo yang menyerap waktu pengembangan tetapi tidak digunakan dalam operasional sehari-hari.

### 3.4 Ketergantungan Aset Visual pada CDN Pihak Ketiga
- *Lokasi Bukti:* `components/dashboard/GeoMapComponent.tsx:9-17`
- *Fakta:* Marker pin Leaflet di-load langsung dari URL CDN eksternal unpinned (`https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png`). Jika unpkg mengalami gangguan atau jaringan intranet klien memblokir CDN publik, peta akan kehilangan indikator marker.

---

## 4. Temuan Kategori C: Copywriting & Bahasa

1. **Pencampuran Bahasa (Indoglish) yang Tidak Konsisten:**  
   Antarmuka mencampurkan istilah Bahasa Inggris dan Bahasa Indonesia tanpa standardisasi baku:
   - Menu Sidebar: *"Executive Dashboard"*, *"GeoSource Dashboard"*, *"Job Openings"*, *"Pipeline"*, *"Archived Candidates"*, *"Talent Pool"*, *"Generate Documents"*, namun submenunya bertuliskan *"Master Data"*, *"Pengaturan"*, *"Daftar Hitam"*.
   - Status Pipeline: *"CV Screening"*, *"Interview HR"*, *"Psikotes"*, *"Technical Test"*, *"Offering"*, *"MCU"*, *"Training"*, *"Induction"*, *"PKWT"*.
   - Dokumen Cetak: Kop surat menggunakan Bahasa Indonesia resmi (*PT Dian Pandu Pratama*), namun field tombol menggunakan *"Download Signed OL"*, *"Generate Batch Docx"*, *"Submit Response"*.
2. **Kebocoran Pesan Kesalahan Teknis ke Pengguna:**  
   - `app/api/file/route.ts:25`: `"Error generating URL"`
   - `app/api/file/upload/route.ts:74`: `"Internal Server Error"`
   - `app/actions/job.ts:634`: Menampilkan pesan error Prisma langsung ke toast antarmuka jika terjadi kegagalan foreign key constraint.

---

## 5. Temuan Kategori D: Domain Modeling & Data Slop

### 5.1 "Black-Hole" Kolom JSON `Application.stageData`
- *Lokasi Bukti:* `prisma/schema.prisma:294`
  ```prisma
  model Application {
    ...
    stageData Json? @default("{}")
  }
  ```
- *Fakta Kritis:* Seluruh riwayat penilaian dari 10 tahapan seleksi—mulai dari verifikasi BNSP, catatan interview, file psikotes, skor tes teknis, penawaran gaji (*offering letter*), hasil medis laboratorium MCU, jadwal training, sertifikat induksi, hingga draft kontrak PKWT—**dilempar ke dalam satu kolom teks JSON tanpa tipe (*untyped JSON blob*)**.
- *Dampak:* Tidak ada integritas referensial (foreign keys), tidak dapat di-query dengan efisien (*indexing JSON field*), dan data medis sensitif (MCU) tercampur dengan metadata percakapan biasa tanpa kontrol akses granular.

### 5.2 Seeder Fiktif yang Menyembunyikan Kerapuhan Relasi
- *Lokasi Bukti:* `prisma/seed-dummy.ts:1-2955`
- *Fakta:* Script seeder dummy memuat 2.955 baris data rekaan yang sangat spesifik. Data rekaan ini menutupi fakta bahwa relasi antar tabel (seperti `MasterClinic`, `MasterSite`, `MasterDepartment`) memiliki banyak atribut string bebas yang tidak terikat relasi kunci formal di database.

---

## 6. Temuan Kategori E: Dokumentasi & Testing Slop

1. **README Default create-next-app:**  
   *Lokasi:* `README.md:1-36`  
   *Fakta:* Dokumentasi repositori utama masih berupa template bawaan create-next-app (*"This is a Next.js project bootstrapped with create-next-app... Getting Started... Deploy on Vercel"*). Tidak ada petunjuk arsitektur, flow bisnis DPP, konfigurasi Azure VM, maupun panduan environment.
2. **Uji Mutu Hanya Formalitas:**  
   *Lokasi:* `lib/__tests__/security-foundation.test.ts:1-116`  
   *Fakta:* Dari seluruh sistem berskala 40.845 baris, hanya terdapat 1 file pengujian (95 baris) yang menguji helper sanitasi string dan feature flag. Tidak ada pengujian logika bisnis rekrutmen sama sekali.

---

## 7. Matriks "Skor Slop" per Modul (Skala 0 – 5)

*Keterangan Skor: 0 = Bersih, spesifik, arsitektur matang; 5 = AI Slop murni, generik, rapuh, monolitik.*

| Modul / Komponen Sistem | Skor Slop (0–5) | Kategori Predominan | Alasan Teknis Berdasarkan Bukti Kode |
| :--- | :---: | :--- | :--- |
| **Document Generator & BAST** (`GenerateDocumentsClient`, `document-generator.ts`) | **5.0** | Mega-Monolit, Mock Injection, DOM Rasterize | 5.814 baris kode dalam 2 file, injeksi fake candidate MCU (`lib/mcu-clinics.ts:142`), DOM screenshot iframe (`html2canvas`), error swallowed. |
| **Verifikasi Kandidat 10 Stage** (`verify/[candidateId]/page.tsx`) | **5.0** | Mega-Monolit, State Sprawl | 2.893 baris kode dalam 1 Client Component, 50+ hook useState, menelan seluruh 10 tahapan seleksi dalam satu layar raksasa. |
| **GeoSource & Mapping** (`geosource/page.tsx`, `GeoMap*.tsx`) | **4.5** | Gimmick UI, In-Memory Filter | Modul tidak relevan dengan kebutuhan dispatching tenaga kerja, menarik semua data ke memori klien, CDN eksternal unpinned. |
| **Executive Dashboard & Reports** (`executive/page.tsx`, `dashboard.ts`) | **4.0** | Heavy Client, Non-Actionable KPI | Query database tanpa paginasi (`dashboard.ts:86`), kalkulasi agregasi di browser user, kartu statistik statis. |
| **Pipeline Kanban Board** (`PipelineBoard.tsx`, `pipeline/`) | **3.5** | Silent Catch, Untyped State | Drag-and-drop kanban menelan error secara diam-diam, data bergantung pada untyped JSON `stageData`. |
| **Job Openings CRUD** (`job-openings/*`, `job.ts`) | **3.0** | Duplikasi Field, Monolit Action | Redundansi field ganda (`positionId` & `positionName`, `departmentId` & `departmentName`), Server Actions tanpa paginasi awal. |
| **Talent Pool, Blacklist, Archive** (`talent-pool/`, `blacklist/`, `archived/`) | **3.5** | Celah Auth Server Action | Menggunakan Server Action paginasi baru yang tidak memiliki auth guard (`job.ts:1160, 1304, 1420`), pembocoran data pelamar. |
| **Master Data & SLA** (`settings/master-data/*`, `master-data.ts`) | **2.5** | Duplikasi Tabel, Missing Auth | Memiliki 13 sub-halaman teratur, namun ada duplikasi tabel sertifikasi (`schema.prisma:173,185`) dan bypass auth pada skema sertifikasi. |
| **Candidate Portal (Self-Service)** (`app/candidate/*`) | **3.0** | Friction Form, Mobile Mismatch | Form profil terlalu panjang (635 baris) untuk kandidat lapangan, respon offering letter via upload dokumen ditandatangani sulit diakses mobile. |
| **Sistem Autentikasi & RBAC** (`lib/auth.ts`, `middleware.ts`, `auth-guard.ts`) | **2.0** | Missing API Matcher, In-Memory Rate Limit | Logika NextAuth dan password bcrypt solid, namun matcher middleware melewatkan `/api/*` dan rate limit hilang saat reboot. |
| **Audit Logging System** (`lib/audit-log.ts`, `settings/audit-logs/`) | **1.5** | Solid Foundation | Memiliki model database formal (`AuditLog`), pencatatan aktor dan IP rapi, sanitasi password metadata berjalan baik. |

**Rata-rata Skor Slop Sistem: 3.4 / 5.0 (Tinggi / Kategori Rapuh)**

