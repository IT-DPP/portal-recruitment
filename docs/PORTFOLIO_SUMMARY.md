# Portfolio Summary — DPP Recruitment Portal Dashboard

| Atribut | Detail |
|---|---|
| **Perusahaan** | PT Dian Pandu Pratama (DPP) — Labor Supply & Job Supply |
| **Peran** | IT Leader (Memimpin Arsitektur, Security Governance, DevOps/CI-CD, dan Delivery) |
| **Periode** | Q4 2026 – Q1 2027 |
| **Tech Stack** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma ORM, PostgreSQL 15, NextAuth.js, AWS SDK v3 (Cloudflare R2 / MinIO), Docker Compose, Nginx/Caddy, GitHub Actions |

---

## 1. Masalah Bisnis (Business Problem)
1. **Fragmentasi Data Rekrutmen:** Proses pemenuhan permintaan tenaga kerja (*Job Order*) dari klien korporasi dikelola secara terpisah menggunakan spreadsheet, chat, dan email, sehingga rawan duplikasi data dan sulit dilacak.
2. **Kurangnya Visibilitas Real-Time bagi Manajemen:** Manajemen kesulitan memantau KPI kritis seperti *fill rate* per klien/site, *time-to-fill*, *bottleneck* tahapan seleksi (Screening hingga MCU & PKWT), dan kepatuhan SLA secara langsung.
3. **Risiko Keamanan & Kepatuhan UU PDP:** Dokumen dan identitas pribadi kandidat (NIK, KTP, CV, hasil MCU) membutuhkan kontrol akses berbasis peran (RBAC), audit log, dan penyimpanan terenkripsi sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
4. **Kondisi Awal Teknis:** Terdapat prototipe aplikasi (~35.000 LOC pasca-pull) yang kaya fitur domain DPP namun belum memiliki pengamanan endpoint API/Server Actions, belum memiliki kontrol environment produksi, dan belum siap dideploy ke infrastruktur VM bersama (*shared VM*).

---

## 2. Solusi Arsitektur & Kepemimpinan Teknis (Solution)
1. **Governance Berbasis Fase (Gated Engineering Lifecycle):**
   - Menerapkan proses 8 fase terstruktur (Discovery $\rightarrow$ Planning $\rightarrow$ Foundation & Hardening $\rightarrow$ MVP $\rightarrow$ Import/Export $\rightarrow$ QA $\rightarrow$ Staging/Prod Deployment $\rightarrow$ Handover) dengan Architecture Decision Records (ADR) dan Risk Register.
2. **Strategi Brownfield Hardening yang Efisien Biaya:**
   - Menyelamatkan investasi prototipe yang sudah mencakup >75% alur spesifik DPP (10 tahap pipeline dari CV Screening s/d Induction/PKWT, generator dokumen BAST/Offering/MCU, GeoMap sebaran kandidat, dan SLA per site).
   - Menutup celah keamanan kritis (unauthenticated API routes, unguarded Server Actions, IDOR pada file download, dan penghapusan penyimpanan file di `public/uploads`) tanpa merusak fungsionalitas yang sedang berjalan.
3. **Feature Flagging untuk Pengendalian Risiko Rilis:**
   - Memisahkan rilis internal (Dashboard Recruiter/Admin) dari fitur eksternal (Portal Kandidat & Lowongan Publik) menggunakan feature flag berbasis environment agar tim internal dapat segera beroperasi dengan permukaan serangan (*attack surface*) minimal.
4. **Optimasi Infrastruktur Zero-New-CAPEX:**
   - Memanfaatkan VM Azure non-Odoo yang sudah ada dengan konfigurasi Docker Compose terisolasi (resource limits, internal network, localhost-bound ports) serta Cloudflare R2 untuk penyimpanan dokumen kandidat yang hemat biaya.

---

## 3. Hasil & Dampak Terukur (Target & Realisasi per Fase)

### Capaian Saat Ini (Akhir Fase 2 — Foundation & Security Hardening)
- **Penutupan Celah Keamanan Kritis (Zero Regression):** Menutup 5 risiko kritis/tinggi (`R-01` Unauthenticated User API, `R-02` Unguarded Server Actions, `R-03` Unvalidated Base64 Upload, `R-04` File Download IDOR, `R-07` Public Portal Exposure via Feature Flags) dengan `0` error TypeScript dan unit test terotomatisasi.
- **Penyelarasan Container di Shared VM:** Memetakan 17 container eksisting di VM Azure Non-Odoo, mencegah tabrakan port produksi pada port `3000`/`3001`/`5432`/`5433` dengan mengalokasikan port `3020` (App) dan `127.0.0.1:5435` (PostgreSQL), serta menyelaraskan `Dockerfile` ke standar `node:20-slim` + `HEALTHCHECK`.
- **Efisiensi Anggaran Infrastruktur:** Merancang arsitektur deployment dengan tambahan OPEX mendekati **US\$0 – US\$2/bulan** (memakai VM existing + R2 free/low tier), menghemat estimasi **US\$65 – US\$140/bulan** dibanding membeli layanan cloud managed baru.

### Target Metrik Bisnis Saat Go-Live (Fase 6)
- **100% Job Order & kandidat baru** tercatat terpusat di portal (menghentikan pembuatan tracker spreadsheet baru).
- **Real-time KPI Visibility:** Waktu pembuatan laporan mingguan manajemen turun dari jam/hari menjadi instan (<5 detik di Executive & Reports Dashboard).
- **Zero Critical/High Vulnerability** pada endpoint produksi dan 100% aksi sensitif tercatat pada Audit Log.

