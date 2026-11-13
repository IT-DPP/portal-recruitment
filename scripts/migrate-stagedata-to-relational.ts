import "./../prisma/load-env";
import prisma from "../lib/prisma";
import { encryptField, decryptField, hashField, isEncrypted } from "../lib/crypto";
import {
  AssessmentStage,
  AssessmentResult,
  McuFitnessStatus,
  OfferingLetterStatus,
  MobilizationStatus,
} from "@prisma/client";

/**
 * ==============================================================================
 * SCRIPT MIGRASI DATA: stageData JSON -> Relational Models & PDP Field Encryption
 * ==============================================================================
 * Script ini aman dijalankan berulang kali (idempotent / non-destructive).
 * Data asli di kolom JSON `Application.stageData` TIDAK dihapus sebagai fallback.
 * ==============================================================================
 */

async function main() {
  console.log("==================================================================");
  console.log("Memulai Migrasi Fase 2: Normalisasi DB & Kepatuhan UU PDP");
  console.log("==================================================================");

  let profilesUpdated = 0;
  let applicationsMigrated = 0;
  let assessmentsCreated = 0;
  let mcuRecordsCreated = 0;
  let offeringRecordsCreated = 0;
  let contractRecordsCreated = 0;
  let jobsUpdated = 0;

  // ----------------------------------------------------------------------------
  // LANGKAH 1: Proteksi PII CandidateProfile (Enkripsi NIK & KK, Blind Index)
  // ----------------------------------------------------------------------------
  console.log("\n[1/3] Memeriksa dan mengenkripsi NIK/KK CandidateProfile...");
  const profiles = await prisma.candidateProfile.findMany({
    select: { id: true, nik: true, nikHash: true, kk: true },
  });

  for (const prof of profiles) {
    let needsUpdate = false;
    let newNik = prof.nik;
    let newNikHash = prof.nikHash;
    let newKk = prof.kk;

    if (prof.nik) {
      if (!isEncrypted(prof.nik)) {
        // Plaintext NIK ditemukan, buat blind index & enkripsi AES-256-GCM
        newNikHash = hashField(prof.nik);
        newNik = encryptField(prof.nik);
        needsUpdate = true;
      } else if (!prof.nikHash) {
        // NIK sudah terenkripsi tapi belum memiliki nikHash
        const decrypted = decryptField(prof.nik);
        newNikHash = hashField(decrypted);
        needsUpdate = true;
      }
    }

    if (prof.kk && !isEncrypted(prof.kk)) {
      newKk = encryptField(prof.kk);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.candidateProfile.update({
        where: { id: prof.id },
        data: {
          nik: newNik,
          nikHash: newNikHash,
          kk: newKk,
        },
      });
      profilesUpdated++;
    }
  }
  console.log(`✓ Selesai memproteksi ${profilesUpdated} dari ${profiles.length} profil kandidat.`);

  // ----------------------------------------------------------------------------
  // LANGKAH 2: Migrasi Aplikasi stageData -> Relational Models
  // ----------------------------------------------------------------------------
  console.log("\n[2/3] Membaca dan menormalisasi JSON Application.stageData...");
  const applications = await prisma.application.findMany({
    include: {
      assessments: true,
      medicalCheckUp: true,
      offeringLetter: true,
      contractMobilization: true,
    },
  });

  for (const app of applications) {
    if (!app.stageData) continue;

    let sd: Record<string, any> = {};
    try {
      sd = typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData;
    } catch {
      continue;
    }

    if (!sd || Object.keys(sd).length === 0) continue;

    let appHasMigratedParts = false;

    // A. Migrasi BNSP Validation Assessment
    if (sd.bnspValidation && typeof sd.bnspValidation === "object") {
      const bnsp = sd.bnspValidation;
      const isPassed = bnsp.isApproved === true;
      const existing = app.assessments.find((a) => a.stageType === AssessmentStage.BNSP_VALIDATION);

      if (!existing) {
        await prisma.applicationAssessment.create({
          data: {
            applicationId: app.id,
            stageType: AssessmentStage.BNSP_VALIDATION,
            result: isPassed ? AssessmentResult.PASSED : AssessmentResult.PENDING,
            feedback: bnsp.skema ? `Skema: ${bnsp.skema} (No: ${bnsp.certNumber || "-"})` : null,
            metadata: bnsp,
          },
        });
        assessmentsCreated++;
        appHasMigratedParts = true;
      }
    }

    // B. Migrasi HR Interview
    if (sd.hrInterview && typeof sd.hrInterview === "object") {
      const hr = sd.hrInterview;
      const existing = app.assessments.find((a) => a.stageType === AssessmentStage.HR_INTERVIEW);

      if (!existing) {
        let res: AssessmentResult = AssessmentResult.PENDING;
        if (hr.result === "Lulus") res = AssessmentResult.PASSED;
        else if (hr.result === "Gagal") res = AssessmentResult.FAILED;

        let conductedDate: Date | null = null;
        if (hr.date) {
          const d = new Date(hr.date);
          if (!isNaN(d.getTime())) conductedDate = d;
        }

        await prisma.applicationAssessment.create({
          data: {
            applicationId: app.id,
            stageType: AssessmentStage.HR_INTERVIEW,
            result: res,
            feedback: hr.feedback || null,
            conductedDate,
            metadata: hr,
          },
        });
        assessmentsCreated++;
        appHasMigratedParts = true;
      }
    }

    // C. Migrasi Psikotes
    if (sd.psikotes && typeof sd.psikotes === "object") {
      const psi = sd.psikotes;
      const existing = app.assessments.find((a) => a.stageType === AssessmentStage.PSIKOTES);

      if (!existing) {
        let res: AssessmentResult = AssessmentResult.CONSIDERED;
        if (psi.result?.includes("Sangat Disarankan") || psi.result?.includes("Disarankan")) {
          res = AssessmentResult.RECOMMENDED;
        } else if (psi.result?.includes("Tidak Disarankan")) {
          res = AssessmentResult.NOT_RECOMMENDED;
        }

        let conductedDate: Date | null = null;
        if (psi.date) {
          const d = new Date(psi.date);
          if (!isNaN(d.getTime())) conductedDate = d;
        }

        await prisma.applicationAssessment.create({
          data: {
            applicationId: app.id,
            stageType: AssessmentStage.PSIKOTES,
            result: res,
            conductedDate,
            metadata: psi,
          },
        });
        assessmentsCreated++;
        appHasMigratedParts = true;
      }
    }

    // D. Migrasi Test Skill
    if (sd.testSkill && typeof sd.testSkill === "object") {
      const ts = sd.testSkill;
      const existing = app.assessments.find((a) => a.stageType === AssessmentStage.SKILL_TEST);

      if (!existing) {
        let conductedDate: Date | null = null;
        if (ts.date) {
          const d = new Date(ts.date);
          if (!isNaN(d.getTime())) conductedDate = d;
        }

        await prisma.applicationAssessment.create({
          data: {
            applicationId: app.id,
            stageType: AssessmentStage.SKILL_TEST,
            result: AssessmentResult.PASSED,
            attachmentUrl: ts.resultFile || null,
            conductedDate,
            metadata: ts,
          },
        });
        assessmentsCreated++;
        appHasMigratedParts = true;
      }
    }

    // E. Migrasi User Interview
    if (sd.userInterview && typeof sd.userInterview === "object") {
      const ui = sd.userInterview;
      const existing = app.assessments.find((a) => a.stageType === AssessmentStage.USER_INTERVIEW);

      if (!existing) {
        let res: AssessmentResult = AssessmentResult.PENDING;
        if (ui.result === "Lulus") res = AssessmentResult.PASSED;
        else if (ui.result === "Gagal") res = AssessmentResult.FAILED;

        let conductedDate: Date | null = null;
        if (ui.date) {
          const d = new Date(ui.date);
          if (!isNaN(d.getTime())) conductedDate = d;
        }

        await prisma.applicationAssessment.create({
          data: {
            applicationId: app.id,
            stageType: AssessmentStage.USER_INTERVIEW,
            result: res,
            feedback: ui.feedback || null,
            conductedDate,
            metadata: ui,
          },
        });
        assessmentsCreated++;
        appHasMigratedParts = true;
      }
    }

    // F. Migrasi Medical Check-Up (MCU) dengan Enkripsi Rekam Medis (UU PDP Pasal 4)
    if (sd.mcu && typeof sd.mcu === "object" && !app.medicalCheckUp) {
      const mcu = sd.mcu;
      let status: McuFitnessStatus = McuFitnessStatus.PENDING;
      const rawStatus = (mcu.resultStatus || "").toUpperCase();

      if (rawStatus.includes("FIT TO WORK") || rawStatus.includes("FIT") && !rawStatus.includes("UNFIT")) {
        status = rawStatus.includes("RESTRICTION")
          ? McuFitnessStatus.FIT_WITH_RESTRICTION
          : McuFitnessStatus.FIT;
      } else if (rawStatus.includes("TEMPORARY")) {
        status = McuFitnessStatus.TEMPORARY_UNFIT;
      } else if (rawStatus.includes("UNFIT")) {
        status = McuFitnessStatus.UNFIT;
      }

      let completedDate: Date | null = null;
      if (mcu.date) {
        const d = new Date(mcu.date);
        if (!isNaN(d.getTime())) completedDate = d;
      }

      // Enkripsi catatan medis dokter & ringkasan hasil
      const notesToEncrypt = mcu.doctorNotes || mcu.resultStatus || "";
      const doctorNotesEncrypted = notesToEncrypt ? encryptField(notesToEncrypt) : null;

      await prisma.medicalCheckUp.create({
        data: {
          applicationId: app.id,
          fitnessStatus: status,
          clinicName: mcu.clinicName || null,
          packageMcu: mcu.package || "Standar Tambang / Alat Berat",
          completedDate,
          doctorNotesEncrypted,
          candidateProofUrl: mcu.candidateProof?.file?.url || mcu.candidateProof?.file?.objectKey || null,
        },
      });
      mcuRecordsCreated++;
      appHasMigratedParts = true;
    }

    // G. Migrasi Offering Letter Record
    if (sd.offeringLetter && typeof sd.offeringLetter === "object" && !app.offeringLetter) {
      const ol = sd.offeringLetter;
      let olStatus: OfferingLetterStatus = OfferingLetterStatus.DRAFT;

      const candResp = ol.candidateResponse?.status;
      if (candResp === "ACCEPTED") olStatus = OfferingLetterStatus.ACCEPTED;
      else if (candResp === "DECLINED") olStatus = OfferingLetterStatus.DECLINED;
      else if (candResp === "REJECTED_FINAL") olStatus = OfferingLetterStatus.REJECTED_FINAL;
      else if (ol.file || ol.date) olStatus = OfferingLetterStatus.SENT;

      let issuedDate: Date | null = null;
      if (ol.date) {
        const d = new Date(ol.date);
        if (!isNaN(d.getTime())) issuedDate = d;
      }

      let signedAt: Date | null = null;
      if (ol.candidateResponse?.signedAt) {
        const d = new Date(ol.candidateResponse.signedAt);
        if (!isNaN(d.getTime())) signedAt = d;
      }

      await prisma.offeringLetterRecord.create({
        data: {
          applicationId: app.id,
          status: olStatus,
          issuedDate,
          signedAt,
          documentUrl: typeof ol.file === "string" ? ol.file : null,
          signedDocumentUrl: ol.candidateResponse?.signedFile?.url || null,
          signedDocumentKey: ol.candidateResponse?.signedFile?.objectKey || null,
          candidateNote: ol.candidateResponse?.note || null,
          baseSalaryEncrypted: ol.salary ? encryptField(String(ol.salary)) : null,
          siteAllowanceEncrypted: ol.siteAllowance ? encryptField(String(ol.siteAllowance)) : null,
        },
      });
      offeringRecordsCreated++;
      appHasMigratedParts = true;
    }

    // H. Migrasi BAST / Kontrak PKWT & Mobilisasi
    if (sd.bast && typeof sd.bast === "object" && !app.contractMobilization) {
      const b = sd.bast;
      let start: Date | null = null;
      let end: Date | null = null;

      if (b.start) {
        const d = new Date(b.start);
        if (!isNaN(d.getTime())) start = d;
      }
      if (b.end) {
        const d = new Date(b.end);
        if (!isNaN(d.getTime())) end = d;
      }

      await prisma.contractMobilization.create({
        data: {
          applicationId: app.id,
          nrp: b.nrp || null,
          bastStatus: b.status || null,
          bastValidationLink: b.link || null,
          pkwtStartDate: start,
          pkwtEndDate: end,
          mobilizationStatus:
            app.status === "HIRED" ? MobilizationStatus.ARRIVED_ON_SITE : MobilizationStatus.READY_TO_DEPLOY,
        },
      });
      contractRecordsCreated++;
      appHasMigratedParts = true;
    }

    if (appHasMigratedParts) {
      applicationsMigrated++;
    }
  }
  console.log(`✓ Selesai menormalisasi data dari ${applicationsMigrated} lamaran.`);
  console.log(`  - Assessment dibuat: ${assessmentsCreated}`);
  console.log(`  - Rekam MCU dibuat: ${mcuRecordsCreated}`);
  console.log(`  - Offering Letter dibuat: ${offeringRecordsCreated}`);
  console.log(`  - Kontrak & Mobilisasi dibuat: ${contractRecordsCreated}`);

  // ----------------------------------------------------------------------------
  // LANGKAH 3: Sinkronisasi Headcount Target & Fulfillment pada JobOpening
  // ----------------------------------------------------------------------------
  console.log("\n[3/3] Menghitung dan menyinkronkan kuota Headcount JobOpening...");
  const jobs = await prisma.jobOpening.findMany({
    select: { id: true, jumlahPermintaan: true, headcountTarget: true },
  });

  for (const job of jobs) {
    const hiredCount = await prisma.application.count({
      where: {
        jobId: job.id,
        status: "HIRED",
      },
    });

    const onSiteCount = await prisma.application.count({
      where: {
        jobId: job.id,
        contractMobilization: {
          mobilizationStatus: { in: [MobilizationStatus.ARRIVED_ON_SITE, MobilizationStatus.COMPLETED] },
        },
      },
    });

    const target = job.jumlahPermintaan > 0 ? job.jumlahPermintaan : (job.headcountTarget || 1);

    await prisma.jobOpening.update({
      where: { id: job.id },
      data: {
        headcountTarget: target,
        headcountFulfilled: hiredCount,
        headcountOnSite: onSiteCount,
      },
    });
    jobsUpdated++;
  }
  console.log(`✓ Selesai menyinkronkan headcount untuk ${jobsUpdated} lowongan pekerjaan.`);

  console.log("\n==================================================================");
  console.log("MIGRASI FASE 2 SELESAI DENGAN SUKSES");
  console.log("==================================================================");
}

main()
  .catch((e) => {
    console.error("[FATAL] Migrasi Fase 2 gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
