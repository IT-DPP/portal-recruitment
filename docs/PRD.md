# Product Requirements Document (PRD) — DPP Recruitment Portal Dashboard

| Atribut | Detail |
|---|---|
| **Nama Produk** | DPP Recruitment Portal Dashboard |
| **Pemilik Produk** | IT Leader — PT Dian Pandu Pratama (DPP) |
| **Key Users (UAT)** | Tim Recruitment DPP |
| **Target Pengguna** | $\le 30$ staf internal ($\le 20$ concurrent users) |
| **Domain Target** | `portal.dpp.co.id` (Production), `portal-staging.dpp.co.id` (Staging) |

---

## 1. Tujuan Bisnis & Sasaran Produk
1. **Single Source of Truth (System of Record):** Mengelola siklus rekrutmen DPP (*Labor Supply* & *Job Supply*) dari penerimaan Job Order klien hingga kandidat ditempatkan (*Hired/PKWT*) dalam satu basis data terpusat yang mandiri (tanpa ketergantungan ke Odoo).
2. **Digitalisasi Operasional Rekrutmen:** Mengeliminasi proses manual berbasis spreadsheet terpisah dan mempercepat pembuatan dokumen resmi (Offering Letter, Surat Pengantar MCU, Berita Acara Serah Terima/BAST).
3. **Visibilitas Manajemen Real-Time:** Menyajikan KPI rekrutmen, pemantauan SLA per tahapan dan per site operasi, serta demografi/sebaran geografis kandidat secara instan.

---

## 2. Peran Pengguna & Matriks RBAC

> [!NOTE]
> Sesuai keputusan Fase 0, selama masa *Knowledge Transfer* (KT) struktur role eksisting (`ADMIN`, `RECRUITER`, `CANDIDATE`) dipertahankan agar tidak memicu konflik kode, lalu diperluas secara *backward-compatible* untuk mendukung seluruh peran bisnis DPP di bawah ini.

| Fitur / Modul | Super Admin (`ADMIN`) | Recruitment Manager* | Recruiter (`RECRUITER`) | Account Manager (Client Relations)* | Management Viewer* | Candidate (`CANDIDATE` - *Flagged*) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| User Management (CRUD & Reset Password) | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Master Data & SLA Settings | ✅ Full | ✅ Full | 👁️ Read | 👁️ Read | ❌ | ❌ |
| Job Order / Job Openings | ✅ Full | ✅ Full + Approve | ✅ Create/Edit | 👁️ Read (Kliennya) | 👁️ Read | 👁️ Public Jobs (jika flag ON) |
| Candidate Pool, Archive & Deduplikasi | ✅ Full | ✅ Full | ✅ Create/Edit | 👁️ Read (Kandidat di Job Kliennya) | ❌ (Agregat saja) | 👤 Profil Sendiri |
| Blacklist Management | ✅ Full | ✅ Add/Remove | 👁️ Read + Usul | ❌ | 👁️ Read | ❌ |
| Pipeline Board (10 Stages) & Verifikasi | ✅ Full | ✅ Full | ✅ Move/Update | 👁️ Read | 👁️ Read | 👤 Status Lamaran Sendiri |
| Penjadwalan Interview & Evaluasi | ✅ Full | ✅ Full | ✅ Full | 👁️ Read | ❌ | 👤 Jadwal Sendiri |
| Generate Dokumen (Offering, MCU, BAST) | ✅ Full | ✅ Full | ✅ Full | 👁️ Read/Download | ❌ | 👤 Offering/MCU Sendiri |
| Executive & Reports Dashboard + Export | ✅ Full | ✅ Full | ✅ Read/Export | 👁️ Kliennya | ✅ Read/Export | ❌ |
| Audit Log Aktivitas | ✅ Read | 👁️ Read (Rekrutmen) | ❌ | ❌ | ❌ | ❌ |

*\*Role perluasan pasca-KT. Selama pra-KT, tim internal menggunakan `ADMIN` dan `RECRUITER`.*

---

## 3. Definisi Tahapan Pipeline Rekrutmen DPP (10 Stages)
Berdasarkan implementasi aktual di prototipe DPP (`prisma/seed-essential.ts`), siklus seleksi memiliki **10 tahapan berurutan** dengan target SLA default yang dapat disesuaikan per Site Operasi (`SiteSla`):

| Order | Stage ID | Nama Tahapan | SLA Default (Hari) | Output / Aksi Kunci di Sistem |
|:---:|---|---|:---:|---|
| 1 | `stage_1` | **CV Screening** | 3 | Verifikasi dokumen awal & kelengkapan profil |
| 2 | `stage_2` | **Interview HR** | 5 | Jadwal interview HR & catatan evaluasi HR |
| 3 | `stage_3` | **Psikotes** | 7 | Input skor/hasil psikotes |
| 4 | `stage_4` | **Technical Test** | 5 | Evaluasi uji keterampilan / sertifikasi BNSP |
| 5 | `stage_5` | **Interview User** | 5 | Jadwal & hasil wawancara dengan klien |
| 6 | `stage_6` | **Offering** | 3 | Generate Offering Letter & respons tanda tangan kandidat |
| 7 | `stage_7` | **MCU** | 5 | Pilih klinik (`MasterClinic`), paket MCU, & surat pengantar MCU |
| 8 | `stage_8` | **Training** | 0 | Pencatatan pelatihan pra-penempatan |
| 9 | `stage_9` | **Induction** | 0 | Orientasi site / K3 |
| 10 | `stage_10` | **PKWT** | 0 | Penandatanganan PKWT, Generate BAST, status aplikasi `HIRED` |

Selain alur maju di atas, setiap tahap mendukung aksi **Reject** (dengan pilihan alasan standar dari `MasterRejectionMessage`), **Withdraw**, **Move to Other Job**, dan **Blacklist**.

---

## 4. Definisi Metrik & KPI Dashboard
1. **Funnel Conversion Rate:** Persentase kandidat yang berhasil lolos dari Tahap $n$ ke Tahap $n+1$ ($\frac{\text{Jumlah Kandidat Masuk Tahap } n+1}{\text{Jumlah Kandidat Masuk Tahap } n} \times 100\%$).
2. **Fill Rate per Job Order / Klien:** $\frac{\text{Jumlah Aplikasi Berstatus HIRED (PKWT)}}{\text{Jumlah Permintaan Headcount (\texttt{jumlahPermintaan})}} \times 100\%$.
3. **Time-to-Fill (Hari):** Rata-rata selisih hari kalender sejak `JobOpening.tanggalMasuk` hingga kandidat mencapai tahap akhir/`HIRED`.
4. **SLA Compliance & Aging Job Order:**
   - **Stage SLA Overdue:** Aplikasi yang bertahan di suatu tahap melebihi `SiteSla.slaDays` (atau `MasterPipelineStage.slaDays` jika site tidak memakai SLA spesifik).
   - **Job Order Aging:** Umur Job Order berstatus `ACTIVE` sejak `tanggalMasuk` dan indikator `OVERDUE` jika melewati `JobTimeline.deadlineDate`.
5. **Rejection Analysis:** Distribusi alasan penolakan berdasarkan `MasterRejectionMessage` per tahapan untuk mengevaluasi kualitas pasokan kandidat.
6. **Regional & Institute (BLK) Distribution:** Sebaran domisili kandidat (GeoMap Provinsi/Kota) dan peringkat institusi pendidikan/BLK (`MasterInstitute`) penyumbang kandidat terbanyak.

---

## 5. Gap Analysis: Prototipe Saat Ini vs Kebutuhan MVP Produksi

| Area Scope (§4 Brief) | Status di Prototipe (`2d95345`) | Gap Menuju Produksi (Target Fase 2–5) |
|---|---|---|
| **1. Auth, RBAC & User Management** | ✅ Login Email+Password, Google OAuth, halaman `/dashboard/settings/users` sudah ada. | 🔴 **Kritis:** `/api/users` & `/api/users/[id]` belum memvalidasi session `ADMIN` (`R1`). Perlu validasi password kuat, rate-limiting login, dan pencatatan perubahan user di Audit Log. |
| **2. Master Data** | ✅ Sangat lengkap (12 entitas: Provinsi, Kota, Customer, Site, Klinik, Posisi, Dept, BLK, Sertifikasi, Skema, Tipe Request, Pesan Reject, SLA). | 🟡 Server Actions di `app/actions/master-data.ts` belum memvalidasi session/role (`R2`). Perlu ditambahkan sumber kandidat (*candidate source*) jika diperlukan setelah KT. |
| **3. Job Order Management** | ✅ CRUD lengkap dengan `noRegistrasi`, `noFormB1`, kuota headcount, status, prioritas, BNSP/Skill test, dan timeline otomatis. | 🟡 Perlu guard otorisasi pada `app/actions/job.ts` dan filter per klien jika role `ACCOUNT_MANAGER` diaktifkan. |
| **4. Candidate Pool & Dokumen** | ✅ Talent Pool, tambah kandidat manual, arsip, blacklist, upload ke S3/R2. | 🔴 **Kritis:** Penyatuan upload agar tidak ada lagi yang menulis ke `public/uploads` (`R3`), perbaikan IDOR pada `/api/file` (`R4`), serta validasi duplikasi NIK/Email/WA yang konsisten. |
| **5. Pipeline Rekrutmen** | ✅ Kanban & detail verifikasi 10 tahap, pindah tahap, pindah lowongan, chat kandidat, kartu MCU & Offering. | 🟡 Guard otorisasi pada seluruh mutasi pipeline & pencatatan pelaku (*actor*) perubahan tahap di `ApplicationHistory` / `AuditLog`. |
| **6. Interview & Evaluasi** | ✅ Kalender wawancara (`InterviewCalendar`, `AdvancedCalendar`) & penyimpanan jadwal interview. | 🟡 Memastikan catatan evaluasi interviewer tersimpan terstruktur dan hanya dapat diakses role berwenang. |
| **7. Dashboard KPI & GeoSource** | ✅ Executive dashboard, Reports widget, GeoMap Leaflet, Top BLK chart. | 🟡 Guard autentikasi pada `app/actions/dashboard.ts` (`R2`). |
| **8. Import Data Awal (CSV/XLSX)** | ⚠️ Library `xlsx` & `exceljs` sudah terinstal; import baru ada sebagian di master data. | 🟡 Karena go-live dimulai dari data kosong, fokus Fase 4 adalah template import standar untuk Master Data & Bulk Candidate beserta validasi baris & laporan error (menggunakan `exceljs` untuk menghindari CVE pada `xlsx`). |
| **9. Export Laporan & Audit Log** | ⚠️ Generator DOCX/XLSX/PDF untuk BAST, Offering, MCU sudah ada. **Audit Log belum ada.** | 🔴 Perlu tabel & layanan `AuditLog` untuk mencatat aktivitas sensitif (login, manajemen user, perubahan status/tahap, unduh dokumen, blacklist) sesuai UU PDP. |
| **10. Feature Flag Portal Publik** | ❌ Portal Kandidat (`/candidate/*`) & `/jobs/*` saat ini terbuka penuh. | 🔴 Perlu *feature flag* di middleware/layout agar tersembunyi di Staging/Prod tetapi tetap aktif di lokal. |

---

## 6. User Stories & Acceptance Criteria (Fokus Hardening & Penyelesaian MVP)

### US-01: Manajemen User Aman oleh Super Admin
- **Sebagai** Super Admin (`ADMIN`), **saya ingin** menambah user internal, mengubah data/role, dan me-reset password mereka, **agar** hanya staf berwenang yang dapat mengakses portal.
- **Acceptance Criteria:**
  1. Permintaan `GET/POST /api/users` dan `PUT/DELETE /api/users/[id]` tanpa session `ADMIN` wajib ditolak dengan HTTP `401/403`.
  2. Password baru divalidasi minimal 8 karakter dan disimpan menggunakan `bcrypt` ($\text{cost} \ge 12$).
  3. Super Admin tidak dapat menghapus akunnya sendiri atau mengubah rolenya sendiri menjadi non-admin.
  4. Setiap pembuatan, perubahan role, reset password, dan penghapusan user tercatat di `AuditLog`.

### US-02: Feature Flag Portal Kandidat & Lowongan Publik
- **Sebagai** IT Leader, **saya ingin** menonaktifkan akses publik ke `/candidate/*`, `/jobs/*`, dan `/api/auth/register` di Staging/Production melalui variabel environment, **agar** portal internal dapat go-live dengan aman sementara pengembangan fitur kandidat tetap bisa berjalan di lokal.
- **Acceptance Criteria:**
  1. Jika `FEATURE_CANDIDATE_PORTAL=false`, akses ke `/candidate/*` dan `/api/auth/register` mengembalikan redirect ke `/login` atau HTTP `404/403`.
  2. Jika `FEATURE_PUBLIC_JOBS=false`, halaman `/` dan `/jobs/*` mengarahkan pengguna langsung ke `/login` staf.
  3. Di environment lokal (`FEATURE_CANDIDATE_PORTAL=true`, `FEATURE_PUBLIC_JOBS=true`), seluruh halaman berfungsi normal tanpa perubahan perilaku.

### US-03: Proteksi Dokumen Kandidat di Cloudflare R2
- **Sebagai** Staf Rekrutmen, **saya ingin** mengunggah dan melihat dokumen kandidat (CV, KTP, MCU, PKWT) dengan aman di Cloudflare R2, **agar** dokumen tidak bocor ke publik dan tidak hilang saat container di-rebuild.
- **Acceptance Criteria:**
  1. Endpoint `/api/file?key=...` memverifikasi bahwa pemanggil memiliki role internal (`ADMIN`/`RECRUITER`) atau merupakan pemilik sah dokumen (`candidateProfile.userId === session.user.id`). Jika tidak, kembalikan `403 Forbidden`.
  2. Hanya file bertipe PDF, JPG, dan PNG dengan ukuran $\le 5\text{ MB}$ yang diizinkan.
  3. Tidak ada dokumen baru yang disimpan ke `public/uploads/` di filesystem container.

### US-04: Siklus Job Order hingga BAST/PKWT End-to-End
- **Sebagai** Recruiter, **saya ingin** membuat Job Order untuk klien/site, memasukkan kandidat ke pipeline, memproses tahapan seleksi hingga tahap 10 (PKWT), dan men-generate dokumen Offering/MCU/BAST, **agar** pemenuhan tenaga kerja terdokumentasi rapi.
- **Acceptance Criteria:**
  1. Job Order memiliki nomor registrasi unik, target headcount, dan timeline SLA otomatis per tahapan sesuai konfigurasi site.
  2. Setiap perpindahan tahapan kandidat mencatat waktu, catatan, dan user yang memindahkan di riwayat aplikasi.
  3. Dokumen Offering Letter, Pengantar MCU, dan BAST dapat diunduh dalam format yang rapi sesuai data kandidat dan Job Order.

### US-05: Audit Log Kepatuhan UU PDP
- **Sebagai** IT Leader / Admin, **saya ingin** meninjau jejak audit (siapa melakukan apa dan kapan) untuk aksi sensitif, **agar** memenuhi prinsip akuntabilitas UU PDP No. 27/2022.
- **Acceptance Criteria:**
  1. Tersedia tabel `AuditLog` yang mencatat minimal: `actorId`, `actorEmail`, `action`, `entityType`, `entityId`, `metadata` (JSON tanpa password/secret), `ipAddress`, dan `createdAt`.
  2. Aksi yang wajib tercatat: login berhasil/gagal, perubahan user/password, pembuatan/penghapusan Job Order, perubahan status blacklist, dan pengunduhan dokumen kandidat.

