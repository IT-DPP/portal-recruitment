import test from "node:test";
import assert from "node:assert/strict";
import { hashField, encryptField, decryptField } from "../crypto";

test("Bulk Candidate Import — NIK Validation & Formatting", () => {
  const sanitizeNik = (raw: string) => raw.replace(/\D/g, "");

  // Valid 16-digit NIK
  const validNik = "6403061205900001";
  assert.equal(sanitizeNik(validNik).length, 16);

  // Formatted with dashes/spaces
  const formattedNik = "6403-0612-0590-0001";
  assert.equal(sanitizeNik(formattedNik), "6403061205900001");
  assert.equal(sanitizeNik(formattedNik).length, 16);

  // Invalid NIK (short)
  const shortNik = "123456";
  assert.notEqual(sanitizeNik(shortNik).length, 16);

  // Invalid NIK (contains non-numeric only)
  const emptyNik = "ABC-XYZ";
  assert.equal(sanitizeNik(emptyNik).length, 0);
});

test("Bulk Candidate Import — PDP Encryption and Blind Indexing", () => {
  const rawNik = "6403061205900004";
  const rawKk = "6403061205900005";

  // Blind index hash must be deterministic
  const hash1 = hashField(rawNik);
  const hash2 = hashField(rawNik);
  assert.equal(hash1, hash2);
  assert.ok(hash1 && hash1.length === 64); // SHA-256 hex string

  // Different NIKs produce distinct blind index hashes
  const diffHash = hashField("6403061205900009");
  assert.notEqual(hash1, diffHash);

  // AES-256-GCM Encryption
  const encryptedNik = encryptField(rawNik);
  assert.ok(encryptedNik?.startsWith("enc:v1:"));
  assert.notEqual(encryptedNik, rawNik);

  // Decryption recovers plaintext perfectly
  const decryptedNik = decryptField(encryptedNik);
  assert.equal(decryptedNik, rawNik);

  // KK encryption
  const encryptedKk = encryptField(rawKk);
  assert.ok(encryptedKk?.startsWith("enc:v1:"));
  assert.equal(decryptField(encryptedKk), rawKk);
});

test("Bulk Actions — Offering Letter Lock Guard Logic", () => {
  // Candidate in stage_6 cannot be moved if status != "ACCEPTED"
  const evaluateOfferingLock = (currentStageId: string, targetStageId: string, candidateStatus?: string) => {
    if (currentStageId === "stage_6" && targetStageId !== "stage_6" && targetStageId !== "Rejected") {
      if (candidateStatus !== "ACCEPTED") {
        return { allowed: false, reason: "Offering belum disetujui" };
      }
    }
    return { allowed: true };
  };

  // Blocked if pending
  assert.equal(evaluateOfferingLock("stage_6", "stage_7", "PENDING").allowed, false);
  assert.equal(evaluateOfferingLock("stage_6", "stage_7", undefined).allowed, false);

  // Blocked if declined
  assert.equal(evaluateOfferingLock("stage_6", "stage_7", "DECLINED").allowed, false);

  // Allowed if accepted
  assert.equal(evaluateOfferingLock("stage_6", "stage_7", "ACCEPTED").allowed, true);

  // Rejection is always allowed even if offering not accepted
  assert.equal(evaluateOfferingLock("stage_6", "Rejected", "DECLINED").allowed, true);

  // Other stages are unaffected by offering lock
  assert.equal(evaluateOfferingLock("stage_1", "stage_2", undefined).allowed, true);
  assert.equal(evaluateOfferingLock("stage_2", "stage_3", undefined).allowed, true);
});

test("Bulk Actions — Standardized Rejection Reason Handling", () => {
  const standardizeReason = (selected: string, custom?: string) => {
    if (selected === "Lainnya") {
      return (custom || "").trim() || "Kualifikasi belum sesuai kebutuhan";
    }
    return selected.trim() || "Kualifikasi belum sesuai kebutuhan";
  };

  assert.equal(
    standardizeReason("Kualifikasi Belum Sesuai Kebutuhan Klien"),
    "Kualifikasi Belum Sesuai Kebutuhan Klien"
  );
  assert.equal(
    standardizeReason("Hasil MCU Unfit / Tidak Lolos Standar Medis Klien"),
    "Hasil MCU Unfit / Tidak Lolos Standar Medis Klien"
  );
  assert.equal(
    standardizeReason("Lainnya", "Gagal verifikasi SKCK"),
    "Gagal verifikasi SKCK"
  );
  assert.equal(
    standardizeReason("Lainnya", ""),
    "Kualifikasi belum sesuai kebutuhan"
  );
});

