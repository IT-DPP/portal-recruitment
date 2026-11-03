# Estimasi Effort, Biaya Infrastruktur (OPEX/CAPEX), dan Backlog Sprint

Dokumen ini menyajikan perbandingan biaya infrastruktur untuk keputusan anggaran IT Leader, serta estimasi waktu dan pembagian backlog pengerjaan dari kondisi prototipe saat ini menuju Production-Ready.

---

## 1. Perbandingan Biaya Infrastruktur (OPEX / CAPEX)

Sesuai aturan proyek (§5 & §7), rekomendasi utama memaksimalkan **resource yang sudah dimiliki DPP** tanpa menambah beban layanan berbayar baru yang tidak perlu.

### Tabel Perbandingan Opsi Infrastruktur Bulanan (Estimasi)

| Komponen | Opsi 1: Memakai Infrastruktur Eksisting DPP (REKOMENDASI DEFAULT) | Opsi 2: Hybrid (VM Eksisting + Azure Database for PostgreSQL Managed) | Opsi 3: Full Managed Azure (App Service + Managed DB + Azure Blob) |
|---|---|---|---|
| **Compute (Next.js App — Prod & Staging)** | **US\$0 tambahan** (Memakai VM Azure Non-Odoo yang sudah ada dengan isolasi Docker Compose) | **US\$0 tambahan** (Tetap di VM Azure Non-Odoo yang sudah ada) | **~US\$55 – US\$75 / bulan** (Azure App Service Plan B2/P0v3 Linux dengan deployment slot) |
| **Database (PostgreSQL 15)** | **US\$0 tambahan** (Container PostgreSQL 15 di VM Non-Odoo + volume persisten) | **~US\$25 – US\$35 / bulan** (Azure Database for PostgreSQL Flexible Server Burstable B1ms, 32 GB storage) | **~US\$25 – US\$35 / bulan** (Azure Database for PostgreSQL Flexible Server Burstable B1ms) |
| **Object Storage (Dokumen Kandidat)** | **US\$0 – US\$1 / bulan** (Cloudflare R2: gratis 10 GB pertama, US\$0,015/GB setelahnya, Rp 0 biaya egress) | **US\$0 – US\$1 / bulan** (Cloudflare R2) | **~US\$2 – US\$5 / bulan** (Azure Blob Storage + biaya bandwidth egress) |
| **Backup Database Off-VM** | **US\$0 – US\$1 / bulan** (`pg_dump` terenkripsi dikirim ke bucket R2 khusus backup atau storage internal DPP yang sudah ada) | Sudah termasuk automated backup 7 hari di Azure DB | Sudah termasuk automated backup 7 hari di Azure DB |
| **Reverse Proxy & SSL/TLS** | **US\$0** (Nginx/Caddy + Let's Encrypt otomatis) | **US\$0** (Nginx/Caddy + Let's Encrypt) | **US\$0** (Managed Certificate App Service) |
| **DNS & Subdomain** | **US\$0 tambahan** (`portal.dpp.co.id` & `portal-staging.dpp.co.id` di cPanel eksisting) | **US\$0 tambahan** (cPanel eksisting) | **US\$0 tambahan** (cPanel eksisting) |
| **CI/CD & Container Registry** | **US\$0** (GitHub Actions + GHCR dalam kuota gratis untuk repo/org saat transisi) | **US\$0** | **US\$0 – US\$5 / bulan** (jika memakai Azure Container Registry Basic) |
| **TOTAL TAMBAHAN OPEX** | **~US\$0 – US\$2 / bulan** (~Rp 0 – Rp 35.000/bln) | **~US\$25 – US\$36 / bulan** (~Rp 400.000 – Rp 580.000/bln) | **~US\$82 – US\$120 / bulan** (~Rp 1,3 juta – Rp 1,9 juta/bln) |

### Kesimpulan Rekomendasi Biaya
- **Rekomendasi Default:** **Opsi 1 (Infrastruktur Eksisting + Cloudflare R2)** karena jumlah pengguna hanya $\le 30$ user ($\le 20$ bersamaan) dan data dimulai dari kosong.
- **Syarat Kelayakan Opsi 1:** Hasil pemeriksaan *read-only* pada VM Non-Odoo menunjukkan ketersediaan RAM bebas minimal **2,5 GB – 3 GB** (atau swap yang memadai) dan ruang disk kosong minimal **15 GB**. Jika RAM VM Non-Odoo ternyata sudah $>85\%$ terpakai oleh proyek web/mobile lain, barulah kita mempertimbangkan upgrade tier VM sedikit atau memindahkan beban build ke GitHub Actions lebih cepat.

---

## 2. Estimasi Effort & Backlog per Sprint (Brownfield Hardening to Go-Live)

Karena >75% fitur fungsional UI dan skema database sudah terbangun di prototipe, effort utama terfokus pada **Security Hardening, Stabilisasi Build/Docker, Audit Log, Automasi Testing, dan Deployment Aman**.

| Sprint / Fase | Fokus Utama | Deliverables Kunci | Estimasi Durasi |
|---|---|---|---|
| **Sprint 1 (Fase 2: Foundation & Security Stop-the-Bleed)** | Keamanan Kritis, Feature Flag, Build & Docker Readiness | 1. Instalasi dependency & pembacaan docs Next.js 16 (`AGENTS.md`).<br>2. Perbaikan R-01 (Auth guard `/api/users`), R-02 (Auth guard seluruh Server Actions), R-04 (IDOR fix `/api/file`).<br>3. Implementasi Feature Flag `FEATURE_CANDIDATE_PORTAL` & `FEATURE_PUBLIC_JOBS`.<br>4. Perbaikan `next.config.ts` (`output: "standalone"`), `.dockerignore`, dan konfigurasi Docker Compose yang aman.<br>5. Setup Vitest + test pertama untuk Auth/RBAC & CI workflow dasar. | **3 – 5 Hari Kerja** |
| **Sprint 2 (Fase 3: MVP Polish, Audit Log & Storage Consolidation)** | Penyempurnaan Fitur MVP Pasca-KT, Audit Log, R2 Storage | 1. Implementasi tabel & service `AuditLog` (login, perubahan user, perubahan tahap pipeline, blacklist, download file).<br>2. Penyatuan upload ke Cloudflare R2 (menghentikan penulisan dokumen kandidat ke `public/uploads/`).<br>3. Penguatan User Management (validasi password, reset password oleh Super Admin, rate-limiting login).<br>4. Penyesuaian temuan hasil *Knowledge Transfer* (KT) dengan developer. | **5 – 7 Hari Kerja** |
| **Sprint 3 (Fase 4: Template Import & Export Standar)** | Import Master Data / Bulk Candidate & Export | 1. Karena go-live mulai dari data kosong, penyediaan fitur import XLSX/CSV terstandar (Master Data & Bulk Candidate) memakai `exceljs` dengan validasi baris, deteksi duplikasi NIK/Email, dan laporan baris error.<br>2. Verifikasi seluruh fungsi export laporan (XLSX/PDF/DOCX: Offering, MCU, BAST). | **3 – 4 Hari Kerja** |
| **Sprint 4 (Fase 5: Hardening, QA & UAT)** | Pengujian Menyeluruh & UAT Tim Recruitment | 1. Security review (OWASP Top 10, HTTP security headers, `npm audit`).<br>2. E2E testing alur kritis dengan Playwright (Login $\rightarrow$ Buat Job Order $\rightarrow$ Proses Pipeline $\rightarrow$ Generate Dokumen).<br>3. Pelaksanaan UAT bersama Tim Recruitment & perbaikan bug UAT. | **4 – 5 Hari Kerja** |
| **Sprint 5 (Fase 6 & 7: Staging/Prod Deployment & Handover)** | Go-Live `portal-staging` & `portal.dpp.co.id` + Runbook | 1. Provisioning Staging & Production di VM Non-Odoo, konfigurasi Nginx/Caddy + Let's Encrypt TLS, DNS cPanel.<br>2. Setup cron backup PostgreSQL otomatis + uji coba *restore drill*.<br>3. Smoke test, Go-Live Production, dokumentasi Runbook Operasional & rencana transisi ke GitHub Org `IT-DPP`. | **3 – 4 Hari Kerja** |
| **Total Estimasi** | | **Dari Fase 2 hingga Production Handover** | **~18 – 25 Hari Kerja (~3,5 – 5 Minggu)** |

