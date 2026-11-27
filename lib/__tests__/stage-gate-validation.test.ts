import test from "node:test";
import assert from "node:assert/strict";
import { validateStageGateTransition } from "../stage-gate-validation";

test("Stage Gate Validation — Stage 1 (Screening / Administrasi)", () => {
  // Blocked without bnsp approval
  const res1 = validateStageGateTransition("stage_1", "stage_2", 1, 2, {});
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes("Tahap Administrasi / Screening belum disetujui"));

  // Allowed when bnsp approved
  const res2 = validateStageGateTransition("stage_1", "stage_2", 1, 2, {
    bnspValidation: { isApproved: true },
  });
  assert.equal(res2.valid, true);
});

test("Stage Gate Validation — Stage 2 (Interview HR)", () => {
  // Incomplete HR Interview
  const res1 = validateStageGateTransition("stage_2", "stage_3", 2, 3, {
    hrInterview: { date: "2026-04-01", result: "" },
  });
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes("Tahap Interview HR belum lengkap"));

  // Complete HR Interview
  const res2 = validateStageGateTransition("stage_2", "stage_3", 2, 3, {
    hrInterview: {
      date: "2026-04-01",
      result: "Lulus",
      feedback: "Kandidat sangat kompeten dan memenuhi standar",
      file: { name: "interview.pdf" },
    },
  });
  assert.equal(res2.valid, true);
});

test("Stage Gate Validation — Stage 3 (Psikotes)", () => {
  // Incomplete Psikotes
  const res1 = validateStageGateTransition("stage_3", "stage_4", 3, 4, {});
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes("Tahap Psikotes belum lengkap"));

  // Complete Psikotes
  const res2 = validateStageGateTransition("stage_3", "stage_4", 3, 4, {
    psikotes: {
      date: "2026-04-02",
      result: "Disarankan",
      file: { name: "psikotes.pdf" },
    },
  });
  assert.equal(res2.valid, true);
});

test("Stage Gate Validation — Stage 4 (Technical Test)", () => {
  // Incomplete Technical
  const res1 = validateStageGateTransition("stage_4", "stage_5", 4, 5, {});
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes("Tahap Test Skill / Technical belum lengkap"));

  // Complete Technical
  const res2 = validateStageGateTransition("stage_4", "stage_5", 4, 5, {
    testSkill: {
      date: "2026-04-03",
      videoLink: "https://drive.google.com/test",
      resultFile: { name: "test_result.pdf" },
    },
  });
  assert.equal(res2.valid, true);
});

test("Stage Gate Validation — Stage 5 (Interview User)", () => {
  // Incomplete User Interview
  const res1 = validateStageGateTransition("stage_5", "stage_6", 5, 6, {});
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes("Tahap Interview User belum lengkap"));

  // Complete User Interview
  const res2 = validateStageGateTransition("stage_5", "stage_6", 5, 6, {
    userInterview: {
      date: "2026-04-04",
      result: "Lulus",
      feedback: "Direkomendasikan oleh User Head",
      file: { name: "user_interview.pdf" },
    },
  });
  assert.equal(res2.valid, true);
});

test("Stage Gate Validation — Stage 6 (Offering Letter)", () => {
  // Missing file/date
  const res1 = validateStageGateTransition("stage_6", "stage_7", 6, 7, {});
  assert.equal(res1.valid, false);

  // Candidate has not accepted
  const res2 = validateStageGateTransition("stage_6", "stage_7", 6, 7, {
    offeringLetter: {
      date: "2026-04-05",
      file: { name: "ol.pdf" },
      candidateResponse: { status: "PENDING" },
    },
  });
  assert.equal(res2.valid, false);
  assert.ok(res2.error?.includes("Kandidat belum menyetujui"));

  // Accepted by candidate
  const res3 = validateStageGateTransition("stage_6", "stage_7", 6, 7, {
    offeringLetter: {
      date: "2026-04-05",
      file: { name: "ol.pdf" },
      candidateResponse: { status: "ACCEPTED" },
    },
  });
  assert.equal(res3.valid, true);
});

test("Stage Gate Validation — Stage 7 (MCU)", () => {
  // Incomplete MCU
  const res1 = validateStageGateTransition("stage_7", "stage_8", 7, 8, {});
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes("Tahap Medical Check-Up (MCU) belum lengkap"));

  // Complete MCU
  const res2 = validateStageGateTransition("stage_7", "stage_8", 7, 8, {
    mcu: {
      date: "2026-04-06",
      hasilFile: { name: "mcu_fit.pdf" },
    },
  });
  assert.equal(res2.valid, true);
});

test("Stage Gate Validation — Post-MCU Onboarding (Stages 8, 9, 10)", () => {
  // Stage 8 Training
  const r8_bad = validateStageGateTransition("stage_8", "stage_9", 8, 9, {});
  assert.equal(r8_bad.valid, false);
  const r8_good = validateStageGateTransition("stage_8", "stage_9", 8, 9, {
    trainingDocs: [{ name: "training.pdf" }],
  });
  assert.equal(r8_good.valid, true);

  // Stage 9 Induction
  const r9_bad = validateStageGateTransition("stage_9", "stage_10", 9, 10, {});
  assert.equal(r9_bad.valid, false);
  const r9_good = validateStageGateTransition("stage_9", "stage_10", 9, 10, {
    inductionDocs: [{ name: "induction.pdf" }],
  });
  assert.equal(r9_good.valid, true);

  // Stage 10 PKWT to Hired
  const r10_bad = validateStageGateTransition("stage_10", "Hired", 10, 999, {});
  assert.equal(r10_bad.valid, false);
  const r10_good = validateStageGateTransition("stage_10", "Hired", 10, 999, {
    pkwtDocs: [{ name: "pkwt_signed.pdf" }],
  });
  assert.equal(r10_good.valid, true);
});

test("Stage Gate Validation — Universal Permissions (Reject & Move Backward)", () => {
  // Rejection is always allowed even if forms are empty
  const rejectRes = validateStageGateTransition("stage_2", "Rejected", 2, -1, {});
  assert.equal(rejectRes.valid, true);

  // Moving backward to re-assess is allowed
  const backwardRes = validateStageGateTransition("stage_3", "stage_2", 3, 2, {});
  assert.equal(backwardRes.valid, true);
});
