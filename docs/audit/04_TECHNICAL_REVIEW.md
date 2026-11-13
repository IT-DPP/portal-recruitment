# 04. TINJAUAN TEKNIS & KUALITAS ARSITEKTUR
**DPP Recruitment Portal Dashboard**  
*Auditor: Joint Audit Team (Principal Engineer & DevOps Lead)*  
*Tanggal: 13 November 2026*  
*Status Dokumen: FINAL (Read-Only Audit)*

---

## 1. Arsitektur Aplikasi & Pola Next.js App Router

Aplikasi dibangun di atas pondasi **Next.js 16.2.12** dan **React 19.2.4**. Namun, pola implementasinya menunjukkan deviasi signifikan dari *best practices* modern Next.js:

```
Arsitektur Aktual Sistem Saat Ini (Heavy-Client SPA Pattern):

[ Browser Klien ]
       │
       ▼ (Menarik Seluruh Bundle JS Komponen Besar)
┌────────────────────────────────────────────────────────────────────────┐
│ Client Components ("use client" di level Page):                        │
│ • GenerateDocumentsClient.tsx (3.332 LOC)                             │
│ • verify/[candidateId]/page.tsx (2.893 LOC)                           │
│ • calendar/page.tsx (1.031 LOC)                                       │
│ • geosource/page.tsx (506 LOC)                                        │
│ • executive/page.tsx (467 LOC)                                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Server Action Calls / API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Server Layer:                                                          │
│ • app/actions/job.ts (1.717 LOC monolit)                              │
│ • In-Memory Rate Limiting (Map)                                       │
│ • Prisma Client ORM (PostgreSQL)                                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          [ PostgreSQL 15 ]                 [ Cloudflare R2 / S3 ]
```

### 1.1 Inversi Pola Server Component vs Client Component
- **Prinsip Next.js App Router:** Rute halaman idealnya berupa Server Component (RSC) untuk mengambil data secara paralel di server, meminimalisir bundle JavaScript yang dikirim ke browser, dan hanya menyertakan interaktivitas kecil sebagai Client Component di daun (*leaves*) pohon komponen.
- **Fakta di Repositori:** Hampir seluruh halaman utama menggunakan deklarasi `"use client"` di level teratas (`app/dashboard/job-openings/[id]/verify/[candidateId]/page.tsx:1`, `app/dashboard/generate-documents/GenerateDocumentsClient.tsx:1`, `app/dashboard/executive/page.tsx:1`, `app/dashboard/calendar/page.tsx:1`).
- **Dampak Kinerja:** Seluruh logika bisnis, template dokumen HTML, form verifikasi 10 tahap, hingga algoritma filter diunduh ke browser pengguna. Ini menyebabkan:
  1. Ukuran bundle JavaScript per rute membengkak drastis.
  2. Waktu render pertama (*First Contentful Paint / FCP* & *Largest Contentful Paint / LCP*) melambat, terutama saat diakses lewat jaringan seluler site tambang.
  3. Kegagalan memanfaatkan fitur *Streaming SSR* dan *Suspense boundaries* bawaan Next.js 16.

---

## 2. Tinjauan Database & Model Data (Prisma ORM)

Skema database didefinisikan dalam `prisma/schema.prisma` (327 baris, 23 model, 3 enum).

### 2.1 Entitas-Relasi Database Aktual (ERD Ringkas)
```
[ User ] 1 ──── 0..1 [ CandidateProfile ] 1 ──── * [ CandidateDocument ]
   │                        │
   │                        └──── * [ Application ] * ──── 1 [ JobOpening ]
   │                                     │                         │
   │                                     ├──── * [ ApplicationHistory ]
   │                                     └──── * [ Interview ]     │
   │                                                               ├──── 1 [ MasterCustomer ]
   │                                                               ├──── 1 [ MasterSite ]
   │                                                               ├──── 1 [ MasterPosition ]
   │                                                               └──── 1 [ MasterDepartment ]
[ MasterSite ] 1 ──── * [ SiteSla ] * ──── 1 [ MasterPipelineStage ]
[ AuditLog ] (Tabel independen untuk rekam jejak sistem)
```

### 2.2 Temuan & Cacat pada Model Data

1. **Anti-Pattern "Black-Hole" JSON Column (`Application.stageData` - Baris 283):**
   ```prisma
   model Application {
     ...
     stageData Json? @default("{}")
   }
   ```
   Seluruh data seleksi 10 tahapan (skor wawancara, nilai psikotes, berkas kelulusan, hasil MCU laboratorium klinik, status penawaran gaji, hingga dokumen PKWT) ditumpuk ke dalam satu kolom JSON mentah.  
   *Konsekuensi:* PostgreSQL tidak dapat menegakkan *foreign key constraints*, validasi integritas data, atau melakukan pencarian relasional secara efisien tanpa indeks GIN yang berat.
2. **Redundansi Kunci Relasi vs Nama String Bebas:**
   Pada model `JobOpening` (`prisma/schema.prisma:242,255,257`):
   - Terdapat `positionId String?` dan `positionName String?`.
   - Terdapat `departmentId String?` dan `departmentName String?`.
   Keduanya sering kali tidak sinkron jika salah satu diperbarui tanpa memperbarui pasangannya.
3. **Ketiadaan Fitur Penghapusan Aman (*Soft Delete*):**
   Model inti seperti `JobOpening`, `Application`, dan `User` tidak memiliki kolom `deletedAt DateTime?`. Operasi penghapusan di kode langsung mengeksekusi `prisma.jobOpening.delete()`, yang berisiko menghilangkan data historis laporan manajerial atau memicu pelanggaran integritas data referensial.
4. **Indeks Database yang Tidak Memadai:**
   Model `JobOpening` tidak memiliki indeks komposit untuk kombinasi kolom yang sering difilter bersamaan:
   ```prisma
   // Query di app/actions/job.ts:1707 secara konstan memfilter:
   where: { status, customerId, tanggalMasuk }
   // Namun pada JobOpening di schema.prisma:240-272 hanya terdapat @@unique([noRegistrasi])
   ```
   Ketiadaan indeks komposit akan memicu *Full Table Scan* pada PostgreSQL ketika jumlah lowongan dan kandidat meningkat di lingkungan produksi.

---

## 3. Analisis Kinerja Query Database & Skalabilitas

### 3.1 Masalah Penarikan Seluruh Baris ke Memori Browser (*In-Memory Aggregation*)
- **Lokasi Bukti:** `app/actions/dashboard.ts:86-130`
  ```typescript
  // Server Action menarik SELURUH lowongan dan lamaran tanpa batasan (take/limit):
  const [rawJobs, rawApps, rawSites, rawCustomers] = await Promise.all([
    prisma.jobOpening.findMany({ ... }),
    prisma.application.findMany({ ... }),
    ...
  ]);
  ```
- **Fakta:** Server Action `getExecutiveDashboardData` mengambil 100% data lamaran yang ada di database, memuatnya ke memori Node.js, mengirimkan seluruh array besar tersebut melalui jaringan ke klien, lalu browser klien mengeksekusi loop `filter()` dan `reduce()` untuk menghitung angka kartu KPI (`app/dashboard/executive/page.tsx:139-180`).
- **Skalabilitas:** Pola ini hanya berfungsi mulus saat database berisi data pengujian (di bawah 100 pelamar). Ketika DPP mengelola **5.000 hingga 20.000 pelamar**, penarikan data mentah ini akan menyebabkan:
  1. *Out-of-Memory (OOM)* pada kontainer Node.js.
  2. Beban jaringan ratusan Megabyte per refresh dashboard.
  3. *Browser freezing* di komputer recruiter.

---

## 4. Hasil Eksekusi Perintah Audit Teknis (Evidentiary Command Results)

Audit dijalankan secara lokal dan non-destruktif dengan hasil sebagai berikut:

### 4.1 Pemindaian Kerentanan Pustaka Dependensi (`npm audit --omit=dev`)
Ditemukan **12 kerentanan** pada paket produksi (2 Kritis, 7 High, 3 Moderate):

```
# npm audit report

1. dompurify <=3.4.16 [CRITICAL]
   - Isu: DOM XSS via armed detached subtree handlers & rawtext reparse bypass.
   - Dampak: Potensi eksekusi script berbahaya saat menampilkan preview dokumen HTML/rich-text.

2. next 9.3.4-canary.0 - 16.4.0 [CRITICAL]
   - Isu: Remote Code Execution (RCE) pada server berbasis Windows, SSRF pada Image Optimization, DoS Server Actions, dan Cache Poisoning pada self-hosted SSR/SSG.
   - Dampak: Server host rentan disusupi jika konfigurasi image dan action dieksploitasi.

3. xlsx * [HIGH]
   - Isu: Prototype Pollution in SheetJS (GHSA-4r6h-8v6p-xvw6) & ReDoS (GHSA-5pgg-2g8v-p4x9).
   - Catatan: Tidak ada patch fix resmi dari vendor SheetJS; paket ini harus dibuang karena kode sudah memakai exceljs.

4. zod <4.6.6 [HIGH]
   - Isu: Memory exhaustion DoS saat memvalidasi koleksi input besar.

5. postcss, sharp, source-map-js, brace-expansion, image-size [HIGH/MODERATE]
   - Isu: DoS via infinite loop, Path traversal pada locale, dan unescaped CSS injection.
```

### 4.2 Analisis Kualitas Kode & Sintaks (`npx eslint .`)
- **Total Masalah Terdeteksi:** **644 masalah** (482 error, 162 warning).
- **Karakteristik Masalah:**
  - 400+ error `@typescript-eslint/no-explicit-any`: Membuktikan tipe data diabaikan oleh AI dalam penulisan logika transaksi.
  - 40+ warning `@typescript-eslint/no-unused-vars`: Variabel dan import terlantar yang menambah beban runtime.
  - 20 error `prefer-const` & unescaped entities di komponen JSX.

### 4.3 Evaluasi Pengujian Perangkat Lunak (`npm test`)
- **Hasil:** 6 pengujian lolos dalam 1 file (`lib/__tests__/security-foundation.test.ts`).
- **Evaluasi:** Pengujian hanya mencakup helper fungsi kecil (validasi nama file, rate limit memory, sanitasi audit log). Logika bisnis utama (pemrosesan 10 tahapan seleksi, perhitungan SLA, mutasi status pelamar, pembuatan dokumen BAST) **memiliki cakupan pengujian 0%**.

---

## 5. Tinjauan Infrastruktur & Kontainerisasi (Docker & Azure VM)

### 5.1 Evaluasi Dockerfile Multi-Stage (`Dockerfile:1-79`)
1. **Pemisahan Stage (Deps, Builder, Runner):**  
   Menggunakan `node:20-alpine`, `npm ci`, dan output standalone Next.js (`output: "standalone"` di `next.config.ts`). Ukuran image akhir relatif efisien (~250MB - 350MB).
2. **Healthcheck Kontainer:**  
   Sudah dikonfigurasi (`HEALTHCHECK ... curl -fsS http://localhost:3020/api/health || exit 1`), memantau rute `/api/health` setiap 30 detik.
3. **Kelemahan Entrypoint Script (`entrypoint.sh:1-18`):**  
   Script entrypoint mengeksekusi `prisma migrate deploy` secara otomatis saat kontainer menyala. Jika migrasi database gagal atau terjadi *race condition* dengan kontainer PostgreSQL yang baru *starting up*, kontainer aplikasi akan langsung keluar (*exit code 1*) dan masuk ke siklus *Restarting loop* (seperti insiden yang dialami pengguna sebelumnya).

### 5.2 Evaluasi Docker Compose (`docker-compose.yml:1-46`)
1. **Isolasi Staging vs Production:**  
   Menggunakan variabel dinamis `COMPOSE_PROJECT_NAME` untuk membedakan container port (Production port 3020 / DB 5435; Staging port 3021 / DB 5436). Ini adalah pemisahan yang benar untuk mencegah kontaminasi data testing.
2. **Celah Kredensial Default:**  
   Baris `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres123}` menyediakan nilai default yang mudah ditebak jika file `.env` tidak terpasang dengan benar pada saat inisialisasi volume kontainer.

