# ADR-002: Pemilihan Arsitektur Aplikasi & ORM (Next.js App Router Fullstack + Prisma)

- **Status:** Accepted
- **Tanggal:** 2026-11-03
- **Pengambil Keputusan:** IT Leader, Solution Architect

## 1. Konteks
Aplikasi DPP Recruitment Portal Dashboard berdiri mandiri (*standalone*) tanpa integrasi ke sistem eksternal yang kompleks (seperti Odoo) pada fase saat ini. Pengguna aktif berjumlah $\le 30$ staf internal dengan beban puncak $\le 20$ pengguna bersamaan. Tim pemelihara utama berlatar belakang Frontend/Fullstack TypeScript.

Codebase prototipe saat ini menggunakan **Next.js 16.2.12 (App Router)** dengan **Server Actions + Route Handlers** dan **Prisma ORM 5.15** di atas **PostgreSQL 15**.

## 2. Opsi yang Dipertimbangkan

### Opsi A: Next.js Fullstack (App Router) + Prisma ORM (Pertahankan Stack Saat Ini)
- **Kelebihan:**
  - Sudah terimplementasi penuh pada 22 model database dan >30 halaman di prototipe.
  - Satu bahasa dan satu *deployment unit* (hemat RAM di VM bersama dibanding menjalankan container frontend dan backend NestJS terpisah).
  - Prisma Migration (`prisma migrate deploy`) memudahkan pengelolaan skema secara terukur.
- **Kekurangan:**
  - Server Actions di Next.js memaparkan *endpoint* HTTP POST yang wajib dijaga dengan helper autentikasi/otorisasi eksplisit di setiap fungsi.

### Opsi B: Memisahkan Backend ke NestJS
- **Kelebihan:** Pemisahan layer controller/service/guard yang ketat secara *out-of-the-box*.
- **Kekurangan:** Harus menulis ulang ~3.000 baris logika di `app/actions/*`, menggandakan penggunaan memori Node.js di VM bersama, dan memperpanjang waktu delivery tanpa manfaat bisnis nyata untuk skala $\le 30$ user.

### Opsi C: Mengganti Prisma dengan Drizzle ORM
- **Kelebihan:** Query SQL lebih ringan dan ukuran bundle lebih kecil.
- **Kekurangan:** Memerlukan penulisan ulang seluruh query di seluruh codebase dan membuang skema serta migrasi Prisma yang sudah berjalan.

## 3. Keputusan
Memilih **Opsi A (Next.js Fullstack + Prisma ORM)** dengan aturan arsitektur tambahan:
1. Membuat helper terpusat `requireAuth(allowedRoles)` dan `withAuditLog()` di `lib/auth-guard.ts` yang wajib dipanggil di baris pertama setiap Server Action dan API Route.
2. Untuk fitur baru (seperti Audit Log, User Management Hardening, dan Bulk Import/Export), logika bisnis ditempatkan di modul terpisah (`lib/services/*`) agar tidak bercampur dengan komponen UI dan siap jika di masa depan diperlukan integrasi eksternal.

## 4. Konsekuensi
- **Positif:** Nol biaya penulisan ulang ORM/framework; jejak memori container tunggal sangat hemat untuk VM bersama.
- **Negatif / Mitigasi:** Wajib mematuhi panduan Next.js 16 di `node_modules/next/dist/docs/` saat melakukan perubahan kode di Fase 2–3.

