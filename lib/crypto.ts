import crypto from "crypto";

/**
 * ==============================================================================
 * FIELD-LEVEL ENCRYPTION UTILITY (AES-256-GCM & BLIND INDEXING)
 * ==============================================================================
 * Kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
 * - Pasal 4 Ayat 2a: Data kesehatan (Medical Check-Up) adalah Data Pribadi Bersifat Spesifik.
 * - Pasal 35 & 39: Kewajiban Pengendali Data menjamin keamanan enkripsi data pribadi.
 *
 * Menggunakan authenticated symmetric encryption: AES-256-GCM dengan:
 * - 256-bit Key (berasal dari ENCRYPTION_KEY env var)
 * - 96-bit (12-byte) random Initialization Vector (IV) unik per enkripsi
 * - 128-bit (16-byte) Authentication Tag untuk integritas & anti-tampering
 * - Prefix versi "enc:v1:" untuk backward-compatibility & seamless migration
 * - Blind Index (HMAC-SHA256) untuk pencarian/indeks database O(1) tanpa membuka dekripsi
 * ==============================================================================
 */

const ENCRYPTION_PREFIX = "enc:v1:";
const DEV_FALLBACK_KEY_SEED = "dpp-recruitment-dev-secret-key-2026-fallback-never-use-in-production";

let warnedAboutDevKey = false;

/**
 * Mendapatkan atau menurunkan 32-byte key untuk AES-256.
 */
export function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;

  if (envKey && envKey.trim().length > 0) {
    const trimmed = envKey.trim();
    // Jika 64 char hex string
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, "hex");
    }
    // Jika 32 char string
    if (Buffer.byteLength(trimmed, "utf8") === 32) {
      return Buffer.from(trimmed, "utf8");
    }
    // Jika base64 dengan 32 bytes
    try {
      const b64 = Buffer.from(trimmed, "base64");
      if (b64.length === 32) return b64;
    } catch {
      // ignore
    }
    // Jika panjang lain, turunkan secara aman dengan SHA-256
    return crypto.createHash("sha256").update(trimmed).digest();
  }

  // Cek environment production
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[PDP_SECURITY_FATAL] ENCRYPTION_KEY environment variable is mandatory in production for UU PDP compliance!"
    );
  }

  if (!warnedAboutDevKey) {
    console.warn(
      "[PDP_SECURITY_WARNING] ENCRYPTION_KEY is not configured. Using deterministic fallback key for DEVELOPMENT only."
    );
    warnedAboutDevKey = true;
  }

  return crypto.createHash("sha256").update(DEV_FALLBACK_KEY_SEED).digest();
}

/**
 * Memeriksa apakah teks sudah dienkripsi dengan skema enc:v1:
 */
export function isEncrypted(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  return value.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Enkripsi field menggunakan AES-256-GCM.
 * Bersifat idempoten (jika string sudah terenkripsi, tidak akan dienkripsi ulang).
 */
export function encryptField(plaintext?: string | null): string | null {
  if (plaintext === null || plaintext === undefined) return null;
  const str = String(plaintext);
  if (str.length === 0) return "";
  if (isEncrypted(str)) return str;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV standar untuk GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(str, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 128-bit authentication tag

  return `${ENCRYPTION_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Dekripsi field terenkripsi AES-256-GCM.
 * Backward compatible: Jika string belum berformat enc:v1: (data lama sebelum migrasi),
 * fungsi mengembalikan plaintext asli secara aman tanpa error.
 */
export function decryptField(ciphertext?: string | null): string | null {
  if (ciphertext === null || ciphertext === undefined) return null;
  const str = String(ciphertext);
  if (str.length === 0) return "";
  if (!isEncrypted(str)) {
    // Data historis belum terenkripsi, kembalikan apa adanya (graceful fallback)
    return str;
  }

  const parts = str.slice(ENCRYPTION_PREFIX.length).split(":");
  if (parts.length !== 3) {
    console.error("[PDP_DECRYPT_ERROR] Invalid encrypted payload format:", str);
    return str;
  }

  const [ivHex, tagHex, dataHex] = parts;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const data = Buffer.from(dataHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[PDP_DECRYPT_TAMPER_ERROR] Gagal mendekripsi field. Data telah dimodifikasi atau key salah:", error);
    throw new Error("Gagal mendekripsi data terproteksi (Integritas data tidak valid).");
  }
}

/**
 * Menghasilkan Blind Index (HMAC-SHA256) untuk pencarian/indeks unik di database.
 * Memungkinkan pencarian O(1) pada kolom sensitif (seperti NIK) tanpa membuka plaintext ke database.
 */
export function hashField(value?: string | null): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str.length === 0) return null;

  const key = getEncryptionKey();
  return crypto.createHmac("sha256", key).update(str).digest("hex");
}

/**
 * Masking NIK untuk tampilan non-privilege / audit logs (contoh: 6403061205900004 -> 6403********0004).
 */
export function maskNik(nik?: string | null): string {
  if (!nik) return "-";
  const decrypted = decryptField(nik) || "";
  const clean = decrypted.trim();
  if (clean.length < 8) return clean;
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  const stars = "*".repeat(clean.length - 8);
  return `${prefix}${stars}${suffix}`;
}

