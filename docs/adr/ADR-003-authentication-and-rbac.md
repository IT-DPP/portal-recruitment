# ADR-003: Strategi Autentikasi, Manajemen User, dan RBAC

- **Status:** Accepted
- **Tanggal:** 2026-11-03
- **Pengambil Keputusan:** IT Leader

## 1. Konteks
Berdasarkan keputusan IT Leader:
1. Login portal menggunakan **Email dan Password** lokal yang dikelola di dalam aplikasi (bukan SSO Entra ID untuk saat ini).
2. **MFA tidak diaktifkan** untuk saat ini agar tidak menghambat adopsi awal tim.
3. Harus tersedia fitur **User Management** di mana Super Admin dapat menambah user, mengubah data/role user, serta me-reset password user.
4. Sementara menunggu *knowledge transfer* (KT) dengan developer, skema `UserRole` yang sudah ada (`ADMIN`, `RECRUITER`, `CANDIDATE`) tidak boleh dirusak, tetapi kita perlu menyiapkan perluasan ke 5 role target (`SUPER_ADMIN`/`ADMIN`, `RECRUITMENT_MANAGER`, `RECRUITER`, `ACCOUNT_MANAGER`, `MANAGEMENT_VIEWER`).

## 2. Opsi yang Dipertimbangkan

### Opsi A: Microsoft Entra ID (OIDC)
- Ditunda ke fase masa depan karena membutuhkan konfigurasi tenant korporat dan lisensi M365 untuk seluruh pengguna.

### Opsi B: NextAuth Credentials Provider (Email + Password) dengan Penguatan Keamanan & Admin User Management
- Mempertahankan NextAuth JWT session yang sudah ada di `lib/auth.ts`, dengan menutup celah keamanan kritis pada manajemen user.

## 3. Keputusan
Memilih **Opsi B** dengan spesifikasi teknis berikut:
1. **Penyimpanan Password:** Password wajib di-hash dengan `bcryptjs` (cost factor $\ge 12$). Karena disimpan sebagai satu arah (*one-way hash*), Super Admin tidak menampilkan password lama dalam teks biasa, melainkan melakukan **Set / Reset Password Baru** untuk user tersebut.
2. **Pengamanan Endpoint User Management (`/api/users` & `/api/users/[id]`):**
   - Menutup celah R1: semua endpoint wajib memverifikasi `getServerSession(authOptions)` dan memastikan `session.user.role === 'ADMIN'`.
   - Admin tidak dapat menghapus atau menurunkan role dirinya sendiri (*self-lockout protection*).
3. **Mitigasi Tanpa MFA:**
   - Kebijakan password minimal 8 karakter (kombinasi huruf besar, huruf kecil, angka).
   - *Rate limiting* pada endpoint login dan registrasi (maksimal 5 percobaan gagal per 15 menit per IP/email) untuk mencegah *brute-force*.
   - Masa berlaku sesi JWT dibatasi (misal 8–12 jam kerja) dan pencatatan setiap aktivitas login/perubahan user ke `AuditLog`.
4. **Kompatibilitas Role (RBAC):**
   - Fase 2 (Pra-KT): Mempertahankan `ADMIN`, `RECRUITER`, `CANDIDATE` agar kode eksisting tidak rusak.
   - Fase 3 (Pasca-KT): Menambahkan nilai enum `RECRUITMENT_MANAGER`, `ACCOUNT_MANAGER`, dan `MANAGEMENT_VIEWER` secara *backward-compatible* (tanpa menghapus nilai enum lama) beserta matriks hak aksesnya.

## 4. Konsekuensi
- **Positif:** Sesuai penuh dengan kebutuhan operasional DPP saat ini; mudah dikelola oleh IT Leader; tidak memerlukan biaya lisensi SSO tambahan.
- **Risiko yang Diterima:** Tanpa MFA, keamanan akun bergantung pada kekuatan password dan rate-limiting (tercatat di `docs/RISK_REGISTER.md` sebagai risiko yang diterima dengan mitigasi kompensasi).

