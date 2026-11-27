import test from "node:test";
import assert from "node:assert/strict";
import { isCandidatePortalEnabled, isPublicJobsEnabled } from "../feature-flags";
import {
  isObjectKeyOwnedByUser,
  isApplicationKeyOwnedByCandidate,
  validateUploadMetadata,
  MAX_UPLOAD_SIZE_BYTES,
} from "../auth-guard";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginRateLimit,
} from "../rate-limit";
import { sanitizeAuditMetadata } from "../audit-log";

test("Feature Flags — default to true when env variables are unset", () => {
  const prevCandidate = process.env.FEATURE_CANDIDATE_PORTAL;
  const prevPublicJobs = process.env.FEATURE_PUBLIC_JOBS;

  try {
    delete process.env.FEATURE_CANDIDATE_PORTAL;
    delete process.env.FEATURE_PUBLIC_JOBS;

    assert.equal(isCandidatePortalEnabled(), true);
    assert.equal(isPublicJobsEnabled(), true);
  } finally {
    if (prevCandidate !== undefined) process.env.FEATURE_CANDIDATE_PORTAL = prevCandidate;
    if (prevPublicJobs !== undefined) process.env.FEATURE_PUBLIC_JOBS = prevPublicJobs;
  }
});

test("Feature Flags — return false when set to false/0/off in Staging or Production", () => {
  const prevCandidate = process.env.FEATURE_CANDIDATE_PORTAL;
  const prevPublicJobs = process.env.FEATURE_PUBLIC_JOBS;

  try {
    process.env.FEATURE_CANDIDATE_PORTAL = "false";
    process.env.FEATURE_PUBLIC_JOBS = "0";

    assert.equal(isCandidatePortalEnabled(), false);
    assert.equal(isPublicJobsEnabled(), false);
  } finally {
    if (prevCandidate !== undefined) process.env.FEATURE_CANDIDATE_PORTAL = prevCandidate;
    else delete process.env.FEATURE_CANDIDATE_PORTAL;
    if (prevPublicJobs !== undefined) process.env.FEATURE_PUBLIC_JOBS = prevPublicJobs;
    else delete process.env.FEATURE_PUBLIC_JOBS;
  }
});

test("Storage IDOR Guard — only allows candidate access to their own namespace and blocks path traversal", () => {
  const userA = "cuid_user_a";
  const userB = "cuid_user_b";

  assert.equal(isObjectKeyOwnedByUser(`candidates/${userA}/profile/cv.pdf`, userA), true);
  assert.equal(isObjectKeyOwnedByUser(`/candidates/${userA}/profile/ktp.png`, userA), true);
  assert.equal(isObjectKeyOwnedByUser(`candidates/${userB}/profile/cv.pdf`, userA), false);
  assert.equal(isObjectKeyOwnedByUser(`candidates/${userA}/../${userB}/cv.pdf`, userA), false);
  assert.equal(isObjectKeyOwnedByUser("", userA), false);

  // Application document ownership (Offering Letter, MCU, etc.)
  const candProfileId = "cand_profile_123";
  const otherProfileId = "cand_profile_999";
  const appId = "app_abc_456";

  // Recruiter uploaded offering letter to applications/<jobId>/<candidateProfileId>/stage_6/...
  assert.equal(
    isApplicationKeyOwnedByCandidate(
      `applications/job_1/${candProfileId}/stage_6/offering.pdf`,
      candProfileId,
      [appId]
    ),
    true
  );

  // Candidate uploaded signed offering to applications/<jobId>/<applicationId>/signed-offering/...
  assert.equal(
    isApplicationKeyOwnedByCandidate(
      `applications/job_1/${appId}/signed-offering/signed.pdf`,
      candProfileId,
      [appId]
    ),
    true
  );

  // Blocked if key belongs to another candidate
  assert.equal(
    isApplicationKeyOwnedByCandidate(
      `applications/job_1/${otherProfileId}/stage_6/offering.pdf`,
      candProfileId,
      [appId]
    ),
    false
  );

  // Blocked on path traversal attempts
  assert.equal(
    isApplicationKeyOwnedByCandidate(
      `applications/job_1/../${otherProfileId}/stage_6/offering.pdf`,
      candProfileId,
      [appId]
    ),
    false
  );
});

test("Upload Metadata Guard — validates allowed MIME types, extensions, and 5MB size limit", () => {
  const validPdf = validateUploadMetadata("cv-pelamar.pdf", "application/pdf", 1024 * 500);
  assert.equal(validPdf.valid, true);

  const validPng = validateUploadMetadata("ktp.PNG", "image/png", 1024 * 1024);
  assert.equal(validPng.valid, true);

  const blockedHtml = validateUploadMetadata("exploit.html", "text/html", 1024);
  assert.equal(blockedHtml.valid, false);

  const blockedMismatch = validateUploadMetadata("malicious.exe", "application/pdf", 1024);
  assert.equal(blockedMismatch.valid, false);

  const blockedOversize = validateUploadMetadata(
    "large.pdf",
    "application/pdf",
    MAX_UPLOAD_SIZE_BYTES + 1
  );
  assert.equal(blockedOversize.valid, false);
});

test("Login Rate Limiter — blocks account after 5 consecutive failures and resets on success", () => {
  const email = "recruiter.test@dpp.co.id";
  const now = 1_700_000_000_000;

  resetLoginRateLimit(email);
  assert.equal(checkLoginRateLimit(email, now).allowed, true);

  for (let i = 1; i <= 4; i++) {
    const res = recordLoginFailure(email, now + i * 1000);
    assert.equal(res.blocked, false);
  }

  const fifth = recordLoginFailure(email, now + 5000);
  assert.equal(fifth.blocked, true);

  const checkAfterFifth = checkLoginRateLimit(email, now + 6000);
  assert.equal(checkAfterFifth.allowed, false);

  resetLoginRateLimit(email);
  assert.equal(checkLoginRateLimit(email, now + 7000).allowed, true);
});

test("Audit Metadata Sanitizer — redacts sensitive secret/password fields", () => {
  const sanitized = sanitizeAuditMetadata({
    targetEmail: "staff@dpp.co.id",
    password: "SuperSecretPassword123",
    token: "jwt-token-xyz",
    role: "RECRUITER",
  });

  assert.equal(sanitized?.targetEmail, "staff@dpp.co.id");
  assert.equal(sanitized?.role, "RECRUITER");
  assert.equal(sanitized?.password, "[REDACTED]");
  assert.equal(sanitized?.token, "[REDACTED]");
});
