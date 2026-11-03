# ADR-006: Roadmap CI/CD dan Transisi Kepemilikan Repository (Dua Tahap)

- **Status:** Accepted
- **Tanggal:** 2026-11-03
- **Pengambil Keputusan:** IT Leader

## 1. Konteks
Saat ini pengembangan fitur oleh developer masih berlangsung di repository GitHub `https://github.com/fahruulc/recruitment-portal-dashboard` dan deployment direncanakan menggunakan alur konvensional via SSH (`git pull --ff-only origin main` $\rightarrow$ `docker compose up -d --build`).

IT Leader telah menetapkan bahwa:
1. Selama pengembangan belum 100% selesai, proses tetap berada di repo saat ini dan build dilakukan langsung di VM agar alur kerja developer tidak terganggu.
2. Setelah pengembangan selesai 100% dan hosting berjalan stabil, repository akan ditransfer ke GitHub Organization resmi perusahaan (`https://github.com/IT-DPP`) dan build image dipindahkan ke GitHub Actions + GitHub Container Registry (GHCR) guna menghemat resource VM.

## 2. Keputusan: Strategi CI/CD Dua Tahap

### Tahap 1 (Saat Ini s/d Go-Live Awal): CI Verifikasi + Build di VM
1. **GitHub Actions hanya untuk CI Quality Gate (Read/Verify):**
   - Menjalankan `npm ci`, `npx prisma generate`, `npm run lint`, `tsc --noEmit`, dan unit test pada setiap Push/PR.
   - Tidak mengubah cara deploy developer: deployment di VM tetap menggunakan `git pull --ff-only origin main && docker compose up -d --build`.
2. **Mitigasi Beban Build di VM:**
   - Memastikan `.dockerignore` dikonfigurasi dengan benar (`node_modules`, `.next`, `.git`) agar *build context* ringan.
   - Mengaktifkan Docker BuildKit cache agar layer `npm ci` tidak diunduh ulang jika `package-lock.json` tidak berubah.

### Tahap 2 (Pasca Development 100% & Transfer ke `IT-DPP`): Build di GitHub Actions + GHCR
1. Repository ditransfer ke `https://github.com/IT-DPP/recruitment-portal-dashboard`.
2. GitHub Actions membangun Docker image dan mengunggahnya ke `ghcr.io/it-dpp/recruitment-portal-dashboard:<git-sha>`.
3. Di VM, file Compose produksi beralih menggunakan `image: ghcr.io/it-dpp/recruitment-portal-dashboard:${IMAGE_TAG}` sehingga VM hanya melakukan `docker compose pull && docker compose up -d` (tanpa kompilasi TypeScript/Next.js di VM).

## 3. Konsekuensi
- **Positif:** Selaras penuh dengan ritme kerja developer saat ini tanpa menghambat progres; sekaligus memberikan peta jalan modernisasi CI/CD yang jelas untuk tahap pasca-handover ke organisasi `IT-DPP`.

