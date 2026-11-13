import test from "node:test";
import assert from "node:assert/strict";
import {
  encryptField,
  decryptField,
  hashField,
  isEncrypted,
  maskNik,
} from "../crypto";

test("PDP Crypto — Encrypt and Decrypt Round-Trip", () => {
  const sampleNik = "6403061205900004";
  const encrypted = encryptField(sampleNik);

  assert.ok(encrypted);
  assert.ok(isEncrypted(encrypted));
  assert.ok(encrypted.startsWith("enc:v1:"));
  assert.notEqual(encrypted, sampleNik);

  const decrypted = decryptField(encrypted);
  assert.equal(decrypted, sampleNik);
});

test("PDP Crypto — Idempotency of Encryption", () => {
  const original = "Catatan Medis Rahasia: Fit to Work";
  const enc1 = encryptField(original);
  const enc2 = encryptField(enc1);

  assert.equal(enc1, enc2, "Encrypting already encrypted text must return identical ciphertext");
});

test("PDP Crypto — Backward Compatibility with Legacy Unencrypted Data", () => {
  const legacyNik = "3171010101900001";
  const result = decryptField(legacyNik);

  assert.equal(result, legacyNik, "Unencrypted legacy string must be returned as-is");
});

test("PDP Crypto — Tamper Detection (Authentication Tag Validation)", () => {
  const secretText = "Hasil Tes Bebas Narkoba: Positif";
  const encrypted = encryptField(secretText)!;

  // Modifikasi ciphertext payload
  const parts = encrypted.split(":");
  const corruptedDataHex = parts[4].slice(0, -2) + (parts[4].slice(-2) === "aa" ? "bb" : "aa");
  const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${corruptedDataHex}`;

  assert.throws(
    () => {
      decryptField(tampered);
    },
    /Gagal mendekripsi data terproteksi/,
    "Tampered ciphertext must fail decryption"
  );
});

test("PDP Crypto — Blind Index Hashing (HMAC-SHA256)", () => {
  const nikA = "6403061205900004";
  const nikB = "6403061205900005";

  const hashA1 = hashField(nikA);
  const hashA2 = hashField(nikA);
  const hashB = hashField(nikB);

  assert.ok(hashA1);
  assert.equal(hashA1, hashA2, "Same input must produce identical deterministic hash");
  assert.notEqual(hashA1, hashB, "Different inputs must produce different hashes");
  assert.equal(hashA1?.length, 64, "SHA-256 HMAC must be 64-character hex");
});

test("PDP Crypto — NIK Masking for Presentation", () => {
  const plaintextNik = "6403061205900004";
  assert.equal(maskNik(plaintextNik), "6403********0004");

  const encryptedNik = encryptField(plaintextNik);
  assert.equal(maskNik(encryptedNik), "6403********0004");

  assert.equal(maskNik(""), "-");
  assert.equal(maskNik(null), "-");
});

test("PDP Crypto — Null, Undefined, and Empty Handling", () => {
  assert.equal(encryptField(null), null);
  assert.equal(encryptField(undefined), null);
  assert.equal(encryptField(""), "");

  assert.equal(decryptField(null), null);
  assert.equal(decryptField(undefined), null);
  assert.equal(decryptField(""), "");

  assert.equal(hashField(null), null);
  assert.equal(hashField(undefined), null);
  assert.equal(hashField(""), null);
});
