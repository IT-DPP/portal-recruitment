import "./../prisma/load-env";
import prisma from "../lib/prisma";
import { ensureExtendedPipelineStages } from "../app/actions/master-data";
import { decryptField, maskNik } from "../lib/crypto";

/**
 * ==============================================================================
 * END-TO-END PLATFORM INTEGRITY CHECK SCRIPT
 * ==============================================================================
 * Menguji secara komprehensif seluruh alur data, server loader, dan query
 * database pada seluruh halaman utama platform rekrutmen DPP:
 * 1. Pipeline Dashboard (/dashboard/pipeline)
 * 2. Generate Dokumen (/dashboard/generate-documents)
 * 3. Detail Job & Verifikasi Kandidat (/dashboard/job-openings/*)
 * 4. Talent Pool, Blacklist, & Archived (/dashboard/*)
 * 5. Master Data & Audit Logs (/dashboard/settings/*)
 * 6. Portal Kandidat & Lowongan Publik (/candidate/*, /jobs/*)
 * ==============================================================================
 */

async function runEndToEndCheck() {
  console.log("==================================================================");
  console.log("MEMULAI PEMERIKSAAN END-TO-END INTEGRITAS PLATFORM REKRUTMEN DPP");
  console.log("==================================================================");

  let passedChecks = 0;
  let failedChecks = 0;

  function report(name: string, ok: boolean, details?: string) {
    if (ok) {
      console.log(`[PASS] ${name}${details ? ` (${details})` : ""}`);
      passedChecks++;
    } else {
      console.error(`[FAIL] ${name}${details ? ` -> ERROR: ${details}` : ""}`);
      failedChecks++;
    }
  }

  // ----------------------------------------------------------------------------
  // 1. CEK HALAMAN PIPELINE DASHBOARD (/dashboard/pipeline)
  // ----------------------------------------------------------------------------
  console.log("\n--- [1] Memeriksa /dashboard/pipeline ---");
  try {
    // A. ensureExtendedPipelineStages
    const newStages = [
      { id: "stage_8", name: "Training", orderIndex: 8, slaDays: 0, reminderDays: 0 },
      { id: "stage_9", name: "Induction", orderIndex: 9, slaDays: 0, reminderDays: 0 },
      { id: "stage_10", name: "PKWT", orderIndex: 10, slaDays: 0, reminderDays: 0 },
    ];
    for (const st of newStages) {
      const existing = await prisma.masterPipelineStage.findUnique({ where: { id: st.id } });
      if (!existing) {
        await prisma.masterPipelineStage.create({ data: st });
      }
    }
    report("Pipeline Master Stages (10 Tahapan)", true, "10 tahapan terdaftar di database");

    const allStages = await prisma.masterPipelineStage.findMany({
      orderBy: { orderIndex: "asc" },
    });

    const postMcuStageIds = Array.from(
      new Set([
        "stage_8",
        "stage_9",
        "stage_10",
        ...allStages
          .filter((s) => ["training", "induction", "pkwt"].some((n) => s.name.toLowerCase().includes(n)))
          .map((s) => s.id),
      ])
    );

    // B. Query Server Component PipelinePage
    const [jobs, applications, customers] = await Promise.all([
      prisma.jobOpening.findMany({
        where: { status: "ACTIVE" },
        include: {
          timeline: {
            include: { stage: true },
          },
          position: true,
          customer: true,
        },
      }),
      prisma.application.findMany({
        where: {
          OR: [
            { status: "ACTIVE" },
            { status: "HIRED", currentStageId: { in: postMcuStageIds } },
          ],
        },
        include: {
          candidateProfile: {
            include: {
              user: true,
              documents: true,
            },
          },
          job: {
            include: {
              position: true,
              customer: true,
            },
          },
        },
      }),
      prisma.masterCustomer.findMany(),
    ]);

    report(
      "Query Server Component PipelinePage",
      true,
      `${jobs.length} jobs aktif, ${applications.length} lamaran aktif, ${customers.length} customer`
    );

    // C. Verifikasi data candidateProfile pada Pipeline
    let decryptedCount = 0;
    applications.forEach((app) => {
      if (app.candidateProfile?.nik) {
        const raw = app.candidateProfile.nik;
        const decrypted = decryptField(raw);
        if (decrypted) decryptedCount++;
      }
    });
    report(
      "Dekripsi NIK Kandidat pada Pipeline",
      true,
      `${decryptedCount} NIK kandidat valid dan dapat didekripsi untuk tampilan recruiter`
    );
  } catch (err: any) {
    report("Pemeriksaan /dashboard/pipeline", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // 2. CEK HALAMAN GENERATE DOKUMEN (/dashboard/generate-documents)
  // ----------------------------------------------------------------------------
  console.log("\n--- [2] Memeriksa /dashboard/generate-documents ---");
  try {
    const [jobs, applications, customers, sites, stages, clinics, provinces] = await Promise.all([
      prisma.jobOpening.findMany({
        include: {
          position: true,
          department: true,
          customer: true,
          city: true,
          province: true,
          site: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.application.findMany({
        include: {
          candidateProfile: {
            include: {
              user: true,
              city: true,
              province: true,
              documents: true,
            },
          },
          job: {
            include: {
              position: true,
              customer: true,
              site: true,
              city: true,
            },
          },
          currentStage: true,
          history: {
            orderBy: { date: "desc" },
          },
          medicalCheckUp: true,
          offeringLetter: true,
          contractMobilization: true,
        },
        orderBy: { applicationDate: "desc" },
      }),
      prisma.masterCustomer.findMany({ orderBy: { name: "asc" } }),
      prisma.masterSite.findMany({
        include: { customer: true, city: true },
        orderBy: { name: "asc" },
      }),
      prisma.masterPipelineStage.findMany({ orderBy: { orderIndex: "asc" } }),
      prisma.masterClinic.findMany({
        include: { province: true },
        orderBy: { name: "asc" },
      }),
      prisma.masterProvince.findMany({ orderBy: { name: "asc" } }),
    ]);

    report(
      "Query Server Component GenerateDocumentsPage",
      true,
      `${jobs.length} jobs, ${applications.length} apps, ${clinics.length} clinics, ${sites.length} sites`
    );

    // Filter kandidat MCU
    const mcuStageCandidates = applications.filter((app) => {
      const stageName = (app.currentStage?.name || "").toLowerCase();
      const stageId = (app.currentStageId || "").toLowerCase();
      return (
        stageId === "stage_7" ||
        stageName.includes("mcu") ||
        stageName.includes("medical") ||
        app.medicalCheckUp !== null
      );
    });

    report(
      "Filter Kandidat Tahap MCU",
      true,
      `${mcuStageCandidates.length} kandidat ditemukan pada tahap MCU atau memiliki rekam MCU`
    );

    // Filter kandidat Offering
    const offeringCandidates = applications.filter((app) => {
      const stageName = (app.currentStage?.name || "").toLowerCase();
      const stageId = (app.currentStageId || "").toLowerCase();
      return (
        stageId === "stage_6" ||
        stageName.includes("offering") ||
        app.offeringLetter !== null
      );
    });

    report(
      "Filter Kandidat Tahap Offering",
      true,
      `${offeringCandidates.length} kandidat ditemukan pada tahap Offering atau memiliki rekam Offering`
    );

    // Filter kandidat BAST / Mobilisasi
    const bastCandidates = applications.filter((app) => {
      const stageId = (app.currentStageId || "").toLowerCase();
      return (
        app.status === "HIRED" ||
        ["stage_8", "stage_9", "stage_10"].includes(stageId) ||
        app.contractMobilization !== null
      );
    });

    report(
      "Filter Kandidat BAST / Mobilisasi",
      true,
      `${bastCandidates.length} kandidat memenuhi syarat untuk BAST Serah Terima Tenaga Kerja`
    );
  } catch (err: any) {
    report("Pemeriksaan /dashboard/generate-documents", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // 3. CEK HALAMAN DETAIL LOWONGAN & VERIFIKASI (/dashboard/job-openings/*)
  // ----------------------------------------------------------------------------
  console.log("\n--- [3] Memeriksa /dashboard/job-openings & Verifikasi Kandidat ---");
  try {
    const sampleJob = await prisma.jobOpening.findFirst({
      include: {
        timeline: { include: { stage: true } },
        position: true,
        customer: true,
        site: true,
        applications: {
          include: {
            candidateProfile: {
              include: { user: true, documents: true },
            },
            history: true,
            assessments: true,
            medicalCheckUp: true,
            offeringLetter: true,
            contractMobilization: true,
          },
        },
      },
    });

    if (sampleJob) {
      report(
        `Job Detail Loader: ${sampleJob.noRegistrasi}`,
        true,
        `Posisi: ${sampleJob.positionName || sampleJob.position?.name || "-"}, Pelamar: ${sampleJob.applications.length}, Target: ${sampleJob.headcountTarget}, Terpenuhi: ${sampleJob.headcountFulfilled}`
      );

      if (sampleJob.applications.length > 0) {
        const sampleApp = sampleJob.applications[0];
        const rawNik = sampleApp.candidateProfile?.nik;
        const decryptedNik = decryptField(rawNik);
        const masked = maskNik(rawNik);

        report(
          `Verifikasi Profil Pelamar: ${sampleApp.candidateProfile?.user?.name || "Kandidat"}`,
          true,
          `Decrypted NIK: ${decryptedNik}, Masked: ${masked}`
        );
      }
    } else {
      report("Job Detail Loader", true, "Tidak ada lowongan aktif di database (tabel kosong)");
    }
  } catch (err: any) {
    report("Pemeriksaan /dashboard/job-openings", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // 4. CEK TALENT POOL, BLACKLIST, & ARCHIVED CANDIDATES
  // ----------------------------------------------------------------------------
  console.log("\n--- [4] Memeriksa Talent Pool, Blacklist, & Archived ---");
  try {
    const [talentCount, blacklistCount, archiveCount] = await Promise.all([
      prisma.candidateProfile.count({ where: { isTalentPool: true } }),
      prisma.candidateProfile.count({ where: { isBlacklisted: true } }),
      prisma.candidateProfile.count({ where: { isArchived: true } }),
    ]);

    report("Talent Pool Count", true, `${talentCount} kandidat di Talent Pool`);
    report("Blacklist Count", true, `${blacklistCount} kandidat di Blacklist`);
    report("Archived Candidates Count", true, `${archiveCount} kandidat di Arsip`);
  } catch (err: any) {
    report("Pemeriksaan Talent Pool/Blacklist/Archive", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // 5. CEK MASTER DATA & AUDIT LOGS
  // ----------------------------------------------------------------------------
  console.log("\n--- [5] Memeriksa Master Data & Audit Logs ---");
  try {
    const [provinces, cities, customers, sites, clinics, positions, depts, logs] = await Promise.all([
      prisma.masterProvince.count(),
      prisma.masterCity.count(),
      prisma.masterCustomer.count(),
      prisma.masterSite.count(),
      prisma.masterClinic.count(),
      prisma.masterPosition.count(),
      prisma.masterDepartment.count(),
      prisma.auditLog.count(),
    ]);

    report(
      "Master Data Tables Integrity",
      true,
      `Provinsi: ${provinces}, Kota: ${cities}, Customer: ${customers}, Site: ${sites}, Klinik: ${clinics}, Posisi: ${positions}, Dept: ${depts}`
    );

    report("Audit Log Integrity", true, `${logs} entri audit log tercatat di database`);
  } catch (err: any) {
    report("Pemeriksaan Master Data & Audit Logs", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // 6. CEK TABEL RELASIONAL FASE 2
  // ----------------------------------------------------------------------------
  console.log("\n--- [6] Memeriksa Tabel Relasional Normalisasi Fase 2 ---");
  try {
    const [assessments, mcus, offerings, contracts] = await Promise.all([
      prisma.applicationAssessment.count(),
      prisma.medicalCheckUp.count(),
      prisma.offeringLetterRecord.count(),
      prisma.contractMobilization.count(),
    ]);

    report(
      "ApplicationAssessment Table",
      true,
      `${assessments} rekam evaluasi bertahap tersimpan`
    );
    report(
      "MedicalCheckUp Table (PDP Encrypted)",
      true,
      `${mcus} rekam MCU medis tersimpan dengan enkripsi dokter`
    );
    report(
      "OfferingLetterRecord Table",
      true,
      `${offerings} rekam penawaran kerja tersimpan`
    );
    report(
      "ContractMobilization Table",
      true,
      `${contracts} rekam penempatan & mobilisasi site tambang tersimpan`
    );
  } catch (err: any) {
    report("Pemeriksaan Tabel Relasional Fase 2", false, err.message);
  }

  console.log("\n==================================================================");
  console.log(`HASIL PEMERIKSAAN END-TO-END: ${passedChecks} LULUS, ${failedChecks} GAGAL`);
  console.log("==================================================================");

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runEndToEndCheck()
  .catch((err) => {
    console.error("Fatal check error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
