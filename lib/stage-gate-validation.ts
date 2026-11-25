/**
 * ==============================================================================
 * PIPELINE STAGE GATE VALIDATION UTILITY
 * ==============================================================================
 * Memastikan setiap tahapan seleksi rekrutmen (Stage 1 Administrasi hingga Stage 10 PKWT)
 * memenuhi seluruh prasyarat formulir, jadwal, catatan asesmen, dan dokumen bukti (evidence)
 * sebelum kandidat diizinkan untuk dipindahkan ke tahap selanjutnya.
 * Mencegah bypass pemindahan status baik melalui drag-and-drop Kanban maupun direct action.
 * ==============================================================================
 */

export interface StageGateValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validasi transisi tahapan seleksi kandidat.
 *
 * @param currentStageId ID stage asal kandidat (contoh: "stage_1", "stage_2")
 * @param targetStageId ID stage tujuan (contoh: "stage_3", "Hired", "Rejected")
 * @param currentStageOrder Indeks urutan stage asal (orderIndex)
 * @param targetStageOrder Indeks urutan stage tujuan (orderIndex)
 * @param rawStageData JSON stageData aplikasi kandidat
 */
export function validateStageGateTransition(
  currentStageId: string,
  targetStageId: string,
  currentStageOrder: number,
  targetStageOrder: number,
  rawStageData: any
): StageGateValidationResult {
  // Rejecting candidate is always permitted from any stage
  if (targetStageId === "Rejected") return { valid: true };

  // Moving backwards to an earlier stage or staying in the same stage is allowed
  if (targetStageOrder <= currentStageOrder) return { valid: true };

  let sd: any = {};
  if (rawStageData) {
    try {
      sd = typeof rawStageData === "string" ? JSON.parse(rawStageData) : rawStageData;
    } catch {
      sd = {};
    }
  }

  // Stage 1: Administrasi / Screening
  if (currentStageId === "stage_1") {
    const bnsp = sd.bnspValidation;
    if (!bnsp || !bnsp.isApproved) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Administrasi / Screening belum disetujui (Approved) oleh recruiter.",
      };
    }
  }

  // Stage 2: Interview HR
  if (currentStageId === "stage_2") {
    const hr = sd.hrInterview;
    const hasResult = hr && hr.result && String(hr.result).trim().length > 0;
    const hasDate = hr && hr.date;
    const hasFeedback = hr && hr.feedback && String(hr.feedback).trim().length > 0;
    const hasProof = hr && (hr.file || hr.resultFile);
    if (!hasResult || !hasDate || !hasFeedback || !hasProof) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Interview HR belum lengkap. Tanggal jadwal, hasil wawancara (Lulus), catatan feedback, dan berkas bukti wawancara wajib diisi sebelum lanjut ke tahap berikutnya.",
      };
    }
  }

  // Stage 3: Psikotes
  if (currentStageId === "stage_3") {
    const psi = sd.psikotes;
    const hasResult = psi && psi.result && String(psi.result).trim().length > 0;
    const hasDate = psi && psi.date;
    const hasProof = psi && psi.file;
    if (!hasResult || !hasDate || !hasProof) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Psikotes belum lengkap. Tanggal pelaksanaan, hasil penilaian, dan berkas bukti hasil psikotes wajib diisi.",
      };
    }
  }

  // Stage 4: Test Skill / Technical
  if (currentStageId === "stage_4") {
    const skill = sd.testSkill;
    const hasDate = skill && skill.date;
    const hasProof = skill && (skill.videoLink || skill.resultFile || (skill.proofs && skill.proofs.length > 0));
    if (!hasDate || !hasProof) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Test Skill / Technical belum lengkap. Tanggal pelaksanaan dan bukti uji teknis / hasil penilaian wajib diisi.",
      };
    }
  }

  // Stage 5: Interview User
  if (currentStageId === "stage_5") {
    const usr = sd.userInterview;
    const hasResult = usr && usr.result && String(usr.result).trim().length > 0;
    const hasDate = usr && usr.date;
    const hasFeedback = usr && usr.feedback && String(usr.feedback).trim().length > 0;
    const hasProof = usr && usr.file;
    if (!hasResult || !hasDate || !hasFeedback || !hasProof) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Interview User belum lengkap. Tanggal wawancara, hasil wawancara (Lulus), catatan feedback, dan bukti wawancara wajib diisi.",
      };
    }
  }

  // Stage 6: Offering Letter
  if (currentStageId === "stage_6") {
    const off = sd.offeringLetter || {};
    const hasDate = off.date;
    const hasFile = off.file;
    const candidateStatus = off.candidateResponse?.status;
    if (!hasDate || !hasFile) {
      return {
        valid: false,
        error: "Validasi Gagal: Tanggal dan berkas Offering Letter wajib dilengkapi oleh recruiter.",
      };
    }
    if (candidateStatus !== "ACCEPTED") {
      return {
        valid: false,
        error: "Validasi Gagal: Kandidat belum menyetujui dan menandatangani Offering Letter. Pemindahan ke tahap berikutnya tidak diizinkan sebelum ada persetujuan resmi dari kandidat.",
      };
    }
  }

  // Stage 7: Medical Check-Up (MCU)
  if (currentStageId === "stage_7") {
    const mcu = sd.mcu;
    const hasDate = mcu && mcu.date;
    const hasProof = mcu && (mcu.pengantarFile || mcu.hasilFile);
    if (!hasDate || !hasProof) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Medical Check-Up (MCU) belum lengkap. Tanggal pelaksanaan dan surat pengantar / hasil MCU wajib diunggah.",
      };
    }
  }

  // Stage 8: Training
  if (currentStageId === "stage_8") {
    const hasDocs = sd.trainingDocs && sd.trainingDocs.length > 0;
    const hasScheduleAndFile = (sd.trainingUser?.date || sd.trainingDate) && (sd.trainingUser?.file || sd.trainingFile);
    if (!hasDocs && !hasScheduleAndFile) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Training belum lengkap. Tanggal pelaksanaan training dan berkas bukti pengajuan/pelaksanaan wajib dilengkapi.",
      };
    }
  }

  // Stage 9: Induction
  if (currentStageId === "stage_9") {
    const hasDocs = sd.inductionDocs && sd.inductionDocs.length > 0;
    const hasScheduleAndFile = (sd.induction?.date || sd.inductionDate) && (sd.induction?.file || sd.inductionFile);
    if (!hasDocs && !hasScheduleAndFile) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap Induksi belum lengkap. Tanggal pelaksanaan induksi dan berkas bukti pengajuan/pelaksanaan wajib dilengkapi.",
      };
    }
  }

  // Stage 10: PKWT
  if (currentStageId === "stage_10") {
    const hasDocs = sd.pkwtDocs && sd.pkwtDocs.length > 0;
    const hasDetails = (sd.pkwt?.startDate || sd.pkwtStartDate) && (sd.pkwt?.endDate || sd.pkwtEndDate) && (sd.pkwt?.file || sd.pkwtFile);
    if (!hasDocs && !hasDetails) {
      return {
        valid: false,
        error: "Validasi Gagal: Tahap PKWT belum lengkap. Durasi kontrak (tanggal awal & akhir) serta berkas PKWT bertandatangan wajib dilengkapi sebelum menyelesaikan proses onboarding.",
      };
    }
  }

  return { valid: true };
}
