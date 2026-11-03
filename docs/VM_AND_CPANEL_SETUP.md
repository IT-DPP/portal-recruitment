# Panduan Running Lokal, Build Image di VM, & Setup Domain di cPanel

Dokumen operasional ini merangkum langkah praktis untuk:
1. Menjalankan aplikasi di komputer lokal (Development).
2. Mengatur subdomain `portal.dpp.co.id` & `portal-staging.dpp.co.id` di **cPanel Zone Editor**.
3. Menjalankan `docker compose up -d --build` di **VM Azure Non-Odoo** tanpa bentrok dengan 17 container proyek lain.

---

## Bagian 1: Menjalankan di Lokal (Local Development)

Di lokal, semua fitur (termasuk Portal Kandidat `/candidate/*` dan Lowongan Publik `/jobs/*`) dibuka melalui `FEATURE_CANDIDATE_PORTAL=true` dan `FEATURE_PUBLIC_JOBS=true`.

### 1.1 Konfigurasi `.env` Lokal
File `.env` lokal telah disiapkan dari `.env.example`. Pastikan `DATABASE_URL` sesuai dengan kredensial PostgreSQL lokal Anda di port `5432` (atau port `5435` jika memakai container DB Docker):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recruitment_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-key-at-least-32-chars-long"
FEATURE_CANDIDATE_PORTAL=true
FEATURE_PUBLIC_JOBS=true
```

### 1.2 Inisialisasi Database Lokal & Menjalankan Server
```powershell
# 1. Terapkan migrasi skema Prisma + isi data awal (Master Data, 10 Stage Pipeline, & Akun Admin)
npm run db:setup

# (Opsional) Jika ingin mengisi data kandidat/lowongan dummy untuk eksplorasi UI:
npm run db:seed:dummy

# 2. Jalankan server development lokal (http://localhost:3000)
npm run dev
```
- **Login Staf / Super Admin Default (Lokal):**
  - URL: `http://localhost:3000/login`
  - Email: `admin@example.com`
  - Password: `password` *(segera ubah melalui menu **Settings -> Users** setelah login)*

---

## Bagian 2: Setup Subdomain di cPanel (`portal.dpp.co.id` & `portal-staging.dpp.co.id`)

Untuk menghubungkan domain `dpp.co.id` di cPanel ke VM Azure Non-Odoo:

### 2.1 Menambahkan DNS `A Record` di cPanel
1. Login ke **cPanel** hosting `dpp.co.id`.
2. Buka menu **Domains** $\rightarrow$ **Zone Editor**.
3. Pada baris domain `dpp.co.id`, klik **Manage** (atau **+ A Record**).
4. Tambahkan 2 record berikut (ganti `<IP_PUBLIC_VM_NON_ODOO>` dengan IP publik VM Azure Non-Odoo Anda):

| Name | TTL | Type | Record (Value) |
|---|---|---|---|
| `portal.dpp.co.id.` | `300` (atau `14400`) | **A** | `<IP_PUBLIC_VM_NON_ODOO>` |
| `portal-staging.dpp.co.id.` | `300` (atau `14400`) | **A** | `<IP_PUBLIC_VM_NON_ODOO>` |

> [!TIP]
> **Catatan Penting di cPanel:** Jangan membuat menu *Subdomain* di cPanel jika web server-nya berada di VM Azure, karena menu *Subdomain* akan mengarahkan trafik ke server cPanel itu sendiri. Cukup buat **A Record** di menu **Zone Editor**.

### 2.2 Verifikasi Propagasi DNS
Dari terminal lokal atau VM, jalankan:
```bash
nslookup portal.dpp.co.id
nslookup portal-staging.dpp.co.id
```
Pastikan keduanya sudah mengembalikan IP publik VM Azure Non-Odoo.

### 2.3 Apakah Subdomain Bisa Diubah di Kemudian Hari?
**Sangat bisa (< 5 menit) tanpa mengubah kode aplikasi:**
1. Tambahkan `A Record` subdomain baru di **cPanel Zone Editor**.
2. Ubah `server_name` di konfigurasi Nginx VM (`/etc/nginx/sites-available/portal.dpp.co.id`) lalu jalankan `sudo certbot --nginx -d subdomain-baru.dpp.co.id`.
3. Ubah nilai `NEXTAUTH_URL=https://subdomain-baru.dpp.co.id` di file `.env` pada VM, lalu restart container: `docker compose up -d`.

---

## Bagian 3: Persiapan & Eksekusi Build Image di VM Azure Non-Odoo

Berdasarkan inventaris container di VM Anda, alokasi port kita sudah diamankan agar **tidak bentrok** dengan container lain:
- `crm-frontend-1` memakai `3000` & `be_dashboard_app` memakai `3001` $\rightarrow$ Portal Recruitment memakai **`3020`**.
- `be_ehs_db` memakai `5432` & `be_dashboard_db` memakai `5433` $\rightarrow$ DB Portal Recruitment memakai **`127.0.0.1:5435`**.

### 3.1 Membuat File `.env` di VM
Di dalam folder project pada VM, buat file `.env` dan batasi izin bacanya (`chmod 600 .env`):

```bash
cat << 'EOF' > .env
PORT=3020
APP_HOST_PORT=3020
DB_HOST_PORT=5435

POSTGRES_USER=dpp_portal
POSTGRES_PASSWORD=GantiDenganPasswordDatabaseYangKuat2026!
POSTGRES_DB=recruitment_db
DATABASE_URL=postgresql://dpp_portal:GantiDenganPasswordDatabaseYangKuat2026!@db:5432/recruitment_db?schema=public

NEXTAUTH_URL=https://portal.dpp.co.id
NEXTAUTH_SECRET=GantiDenganHasil_openssl_rand_base64_32

# Sembunyikan portal kandidat & lowongan publik di Production tahap awal
FEATURE_CANDIDATE_PORTAL=false
FEATURE_PUBLIC_JOBS=false

# Konfigurasi Cloudflare R2 Object Storage
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<R2_ACCESS_KEY_ID>
S3_SECRET_KEY=<R2_SECRET_ACCESS_KEY>
S3_BUCKET_NAME=recruitment-bucket
S3_REGION=auto
EOF

chmod 600 .env
```

### 3.2 Build & Jalankan Container di VM
Sesuai alur kerja Anda di VM:

```bash
# 1. Test koneksi SSH ke GitHub & tarik kode terbaru
ssh -T git@github.com
git pull --ff-only origin main

# 2. Build image & nyalakan container (db + app)
docker compose up -d --build

# 3. Cek status container & healthcheck
docker compose ps
curl -fsS http://127.0.0.1:3020/api/health

# 4. (Khusus Deploy Pertama Kali dari DB Kosong) Jalankan seed master data esensial & akun Super Admin
docker compose exec app npm run db:seed:essential
```
*(Catatan: Migrasi database `npx prisma migrate deploy` sudah otomatis dijalankan oleh `entrypoint.sh` setiap kali container `app` menyala).*

### 3.3 Setup Nginx Reverse Proxy & SSL Let's Encrypt di VM
Jika VM menggunakan Nginx di host untuk meneruskan domain ke container:

```bash
# 1. Salin template konfigurasi Nginx yang sudah disiapkan di repo
sudo cp deploy/nginx/portal.dpp.co.id.conf /etc/nginx/sites-available/portal.dpp.co.id
sudo ln -sf /etc/nginx/sites-available/portal.dpp.co.id /etc/nginx/sites-enabled/portal.dpp.co.id

# 2. Uji konfigurasi Nginx & reload
sudo nginx -t && sudo systemctl reload nginx

# 3. Terbitkan sertifikat HTTPS gratis via Certbot
sudo certbot --nginx -d portal.dpp.co.id
```
