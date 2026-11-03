# ADR-005: Topologi Deployment pada Shared Azure VM

- **Status:** Accepted
- **Tanggal:** 2026-11-03
- **Pengambil Keputusan:** IT Leader, DevOps/Solution Architect

## 1. Konteks
- DPP memiliki 2 VM di Azure:
  1. **VM Odoo:** Dilarang keras disentuh, dibaca, atau diakses oleh proyek ini.
  2. **VM Non-Odoo:** Target deployment proyek ini, yang saat ini juga menjalankan beberapa proyek web dan mobile penting lainnya.
- DNS dikelola melalui cPanel dengan domain:
  - Production: `portal.dpp.co.id`
  - Staging: `portal-staging.dpp.co.id`
- Sesuai arahan IT Leader, untuk tahap awal deployment dipicu menggunakan `docker compose up -d --build` di VM hingga aplikasi benar-benar stabil digunakan.

## 2. Masalah pada `docker-compose.yml` Prototipe Saat Ini
File `docker-compose.yml` yang ada saat ini belum aman untuk dijalankan di VM bersama karena:
1. Belum memiliki definisi service `app` (Next.js) dan `next.config.ts` belum memiliki `output: "standalone"` (menyebabkan `Dockerfile` gagal pada tahap `COPY /app/.next/standalone`).
2. Membuka port PostgreSQL (`5433:5432`) dan MinIO (`9000:9000`, `9001:9001`) ke seluruh interface publik (`0.0.0.0`) dengan kredensial default `postgres123` dan `minioadmin`.
3. Menggunakan `container_name` statis (`recruitment_db`) tanpa batas pemakaian CPU/RAM (`deploy.resources.limits`), sehingga berisiko bertabrakan antara Staging dan Production serta mengganggu proyek web/mobile lain di VM yang sama.

## 3. Keputusan
1. **Isolasi Jaringan & Port:**
   - Database PostgreSQL hanya boleh terhubung ke jaringan internal Docker (`internal: true`) atau di-bind khusus ke loopback `127.0.0.1` jika butuh akses tunnel SSH. Port database **dilarang** dibuka ke publik `0.0.0.0`.
   - Container aplikasi Next.js di-bind ke `127.0.0.1:<PORT_PROD>` (mis. `127.0.0.1:3010`) dan `127.0.0.1:<PORT_STAGING>` (mis. `127.0.0.1:3011`), lalu diteruskan melalui **Reverse Proxy (Nginx/Caddy)** yang sudah berjalan di VM untuk terminasi TLS Let's Encrypt (`portal.dpp.co.id` & `portal-staging.dpp.co.id`).
2. **Isolasi Environment (Staging vs Production di Satu VM):**
   - Menggunakan nama project Compose dan database yang terpisah (`docker compose -p dpp-portal-prod` dan `docker compose -p dpp-portal-staging`) dengan file `.env` yang terpisah (`chmod 600`).
   - Karena dokumen disimpan di Cloudflare R2, container MinIO tidak perlu dijalankan di VM produksi/staging (menghemat ~300–500 MB RAM).
3. **Pembatasan Resource (Protecting Neighbor Projects):**
   - Menetapkan batas memori dan CPU pada setiap container (contoh: `app` prod maks 1 GB RAM, `db` prod maks 1 GB RAM, `app` staging maks 512 MB RAM) serta membatasi penggunaan CPU saat proses `docker build` (`--cpus` / `NEXT_CPU_COUNT`) agar proyek web/mobile lain di VM tidak mengalami *downtime* saat build berlangsung.

## 4. Konsekuensi
- **Positif:** Proyek lain di VM non-Odoo terlindungi dari perebutan resource dan konflik port; subdomain dapat diubah sewaktu-waktu hanya dengan mengubah vhost Reverse Proxy, DNS A record di cPanel, dan `NEXTAUTH_URL`.
- **Tindak Lanjut:** Ukuran pastinya akan disesuaikan setelah hasil perintah *read-only check* spesifikasi VM diperoleh.

