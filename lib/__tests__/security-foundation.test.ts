import test from "node:test";
import assert from "node:assert/strict";
import { isCandidatePortalEnabled, isPublicJobsEnabled } from "../feature-flags";
import {
  isObjectKeyOwnedByUser,
  validateUploadMetadata,
  MAX_UPLOAD_SIZE_BYTES,
} from "../auth-guard";

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

