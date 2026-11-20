"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { JobOpeningInput, JobOpeningSchema } from "@/lib/validations/job";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireStaffSession } from "@/lib/auth-guard";
import { recordAuditLog } from "@/lib/audit-log";
import { encryptField, decryptField, hashField } from "@/lib/crypto";
import bcrypt from "bcryptjs";
import {
  ApplicationStatus,
  AssessmentStage,
  AssessmentResult,
  McuFitnessStatus,
  OfferingLetterStatus,
  MobilizationStatus,
} from "@prisma/client";
import { generateJobSlug } from "@/lib/slug";

export async function getJobOpenings() {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const data = await prisma.jobOpening.findMany({
      include: {
        position: true,
        department: true,
        customer: true,
        city: true,
        province: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data };
  } catch (error) {
    console.error("getJobOpenings Error:", error);
    return { success: false, error: "Gagal mengambil data lowongan pekerjaan" };
  }
}

export async function getCalendarData() {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const [jobs, masterStages, apps] = await Promise.all([
      prisma.jobOpening.findMany({
        select: {
          id: true,
          noRegistrasi: true,
          positionName: true,
          position: { select: { name: true } },
          status: true,
          createdAt: true,
        }
      }),
      prisma.masterPipelineStage.findMany({
        orderBy: { orderIndex: "asc" }
      }),
      prisma.application.findMany({
        include: {
          currentStage: {
            select: {
              id: true,
              name: true,
              orderIndex: true,
            }
          },
          candidateProfile: {
            include: {
              user: { select: { name: true, email: true } },
              city: { select: { name: true } }
            }
          },
          history: {
            orderBy: { date: "asc" }
          },
          interviews: {
            orderBy: { scheduledAt: "desc" }
          }
        }
      })
    ]);

    const mappedJobs = jobs.map((j) => ({
      id: j.id,
      noRegistrasi: j.noRegistrasi,
      posisi: j.positionName || j.position?.name || "-",
      globalStatus: j.status === 'ACTIVE' ? 'Active' : j.status === 'CLOSED' ? 'Closed' : j.status,
      publishedDate: j.createdAt.toISOString()
    }));

    const stageMap = new Map(masterStages.map((s) => [s.id, s]));

    const mappedApps = apps.map((a) => {
      let sd: any = {};
      if (a.stageData) {
        try {
          sd = typeof a.stageData === "string" ? JSON.parse(a.stageData) : a.stageData;
        } catch {
          sd = {};
        }
      }

      // Map history entries with their stage orderIndex
      const historyEvents = a.history.map((h) => {
        const stageObj = h.stageId ? stageMap.get(h.stageId) : null;
        return {
          stageId: h.stageId,
          stageName: h.stageName,
          date: h.date.toISOString(),
          note: h.note,
          orderIndex: stageObj?.orderIndex ?? 999
        };
      });

      // Helper to find date from history for a given stageId
      const getHistoryDate = (sId: string) => {
        const h = a.history.slice().reverse().find((hist) => hist.stageId === sId);
        return h ? h.date.toISOString() : null;
      };
      const latestHistoryDate = a.history.length > 0 
        ? a.history[a.history.length - 1].date.toISOString() 
        : a.applicationDate.toISOString();

      // Extract current active schedule strictly for candidate's current stage
      let currentSchedule: {
        stageId: string;
        stageName: string;
        type: 'hr' | 'user' | 'skill' | 'psikotes' | 'mcu' | 'offering' | 'administration' | 'other';
        date: string;
        note?: string;
      } | null = null;

      const currentStageId = a.currentStageId || "stage_1";
      const currentStageObj = stageMap.get(currentStageId) || a.currentStage;
      const stageNameLower = (currentStageObj?.name || "").toLowerCase();

      if (currentStageId === "stage_2" || stageNameLower.includes("interview hr")) {
        const date = sd.hrInterview?.date 
          || a.interviews?.find(i => i.type.toUpperCase() === "HR")?.scheduledAt?.toISOString() 
          || getHistoryDate("stage_2") 
          || latestHistoryDate;
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Interview HR",
          type: "hr",
          date,
          note: sd.hrInterview?.feedback || sd.hrInterview?.note || "Jadwal Interview HR"
        };
      } else if (currentStageId === "stage_3" || stageNameLower.includes("psikotes")) {
        const date = sd.psikotes?.date 
          || sd.psikotesData?.date 
          || getHistoryDate("stage_3") 
          || latestHistoryDate;
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Psikotes",
          type: "psikotes",
          date,
          note: sd.psikotes?.notes || "Jadwal Psikotes"
        };
      } else if (currentStageId === "stage_4" || stageNameLower.includes("skill") || stageNameLower.includes("technical")) {
        const date = sd.testSkill?.date 
          || sd.testSkillData?.date 
          || getHistoryDate("stage_4") 
          || latestHistoryDate;
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Technical Test",
          type: "skill",
          date,
          note: sd.testSkill?.note || "Jadwal Test Skill / Technical"
        };
      } else if (currentStageId === "stage_5" || stageNameLower.includes("interview user")) {
        const date = sd.userInterview?.date 
          || a.interviews?.find(i => i.type.toUpperCase() === "USER")?.scheduledAt?.toISOString() 
          || getHistoryDate("stage_5") 
          || latestHistoryDate;
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Interview User",
          type: "user",
          date,
          note: sd.userInterview?.feedback || sd.userInterview?.note || "Jadwal Interview User"
        };
      } else if (currentStageId === "stage_6" || stageNameLower.includes("offering")) {
        const date = sd.offeringLetter?.date 
          || sd.offering?.date 
          || sd.offeringData?.date 
          || getHistoryDate("stage_6") 
          || latestHistoryDate;
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Offering Letter",
          type: "offering",
          date,
          note: sd.offeringLetter?.note || "Jadwal Offering Letter"
        };
      } else if (currentStageId === "stage_7" || stageNameLower.includes("mcu")) {
        const date = sd.mcu?.date 
          || sd.mcuData?.date 
          || getHistoryDate("stage_7") 
          || latestHistoryDate;
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "MCU",
          type: "mcu",
          date,
          note: sd.mcu?.note || "Jadwal Pelaksanaan MCU"
        };
      } else if (currentStageId === "stage_1" || stageNameLower.includes("screening") || stageNameLower.includes("administrasi")) {
        const date = a.applicationDate.toISOString();
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Administrasi",
          type: "administration",
          date,
          note: "Pengajuan Berkas Administrasi"
        };
      } else {
        // Stages 8 (Training), 9 (Induction), 10 (PKWT), etc.
        currentSchedule = {
          stageId: currentStageId,
          stageName: currentStageObj?.name || "Tahap Seleksi",
          type: "other",
          date: latestHistoryDate,
          note: currentStageObj?.name || "Tahap Lanjutan"
        };
      }

      return {
        id: a.id,
        jobId: a.jobId,
        candidateId: a.candidateProfileId,
        applicationDate: a.applicationDate.toISOString(),
        status: a.status,
        currentStageId: a.currentStageId,
        currentStage: currentStageObj ? {
          id: currentStageObj.id,
          name: currentStageObj.name,
          orderIndex: currentStageObj.orderIndex
        } : null,
        currentSchedule,
        history: historyEvents
      };
    });

    const mappedCandidates: Record<string, any> = {};
    apps.forEach((a) => {
      if (a.candidateProfile && !mappedCandidates[a.candidateProfileId]) {
        mappedCandidates[a.candidateProfileId] = {
          id: a.candidateProfile.id,
          nik: decryptField(a.candidateProfile.nik) || "-",
          fullName: a.candidateProfile.user?.name || "Unknown",
          email: a.candidateProfile.user?.email || "-",
          whatsapp: a.candidateProfile.whatsapp || "-",
          latestEducation: a.candidateProfile.latestEducation || "-",
          city: a.candidateProfile.city?.name || a.candidateProfile.currentAddress || "-"
        };
      }
    });

    return {
      success: true,
      jobs: mappedJobs,
      applications: mappedApps,
      candidates: mappedCandidates,
      stages: masterStages.map((s) => ({ id: s.id, name: s.name, orderIndex: s.orderIndex }))
    };
  } catch (error: any) {
    console.error("getCalendarData Error:", error);
    return { success: false, error: "Gagal mengambil data kalender: " + (error?.message || String(error)) };
  }
}

export async function createJobOpening(data: JobOpeningInput) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const parsed = JobOpeningSchema.safeParse(data);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: "Validasi gagal: " + errorMessages };
    }

    let { positionId, departmentId, positionName, departmentName, ...restData } = parsed.data;

    if (positionId === "0" || !positionId) {
      positionId = null;
    }

    if (departmentId === "0" || !departmentId) {
      departmentId = null;
    }

    // Generate unique slug
    let resolvedPos = positionName;
    if (!resolvedPos && positionId) {
      const pos = await prisma.masterPosition.findUnique({ where: { id: positionId } });
      resolvedPos = pos?.name;
    }
    const cust = await prisma.masterCustomer.findUnique({ where: { id: restData.customerId } });
    const baseSlug = generateJobSlug(resolvedPos || "posisi", cust?.name || "dpp");
    let slug = baseSlug;
    let counter = 2;
    while (await prisma.jobOpening.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const result = await prisma.jobOpening.create({
      data: {
        ...restData,
        positionId,
        departmentId,
        positionName,
        departmentName,
        slug,
      },
    });

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "JOB_CREATED",
      entityType: "JobOpening",
      entityId: result.id,
      metadata: {
        noRegistrasi: result.noRegistrasi,
        positionName: result.positionName,
        jumlahPermintaan: result.jumlahPermintaan,
      },
    });

    revalidatePath("/dashboard/job-openings");
    return { success: true, data: result };
  } catch (error) {
    console.error("createJobOpening Error:", error);
    return { success: false, error: "Gagal membuat lowongan pekerjaan" };
  }
}

export async function getJobById(id: string) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const job = await prisma.jobOpening.findUnique({
      where: { id },
      include: {
        position: true,
        department: true,
        customer: true,
        city: true,
        province: true,
        site: true,
        timeline: {
          include: {
            stage: true
          }
        }
      },
    });
    if (!job) return { success: false, error: "Job tidak ditemukan" };
    return { success: true, data: job };
  } catch (error) {
    console.error("getJobById Error:", error);
    return { success: false, error: "Gagal mengambil data lowongan pekerjaan" };
  }
}

export async function updateJobOpening(id: string, data: Partial<JobOpeningInput>) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const existingJob = await prisma.jobOpening.findUnique({ where: { id } });
    if (!existingJob) {
      return { success: false, error: "Lowongan tidak ditemukan" };
    }

    if (existingJob.status !== "DRAFT") {
      // If it's already active/published, only allow editing noFormB1
      const updatedJob = await prisma.jobOpening.update({
        where: { id },
        data: {
          noFormB1: data.noFormB1
        }
      });
      revalidatePath("/dashboard/job-openings");
      revalidatePath(`/dashboard/job-openings/${id}`);
      return { success: true, data: updatedJob };
    }

    if (data.jumlahPermintaan !== undefined) {
      const parsedQty = Number(data.jumlahPermintaan);
      if (isNaN(parsedQty) || parsedQty <= 0 || !Number.isInteger(parsedQty)) {
        return { success: false, error: "Jumlah permintaan kandidat harus berupa bilangan bulat lebih dari 0." };
      }
      data.jumlahPermintaan = parsedQty;
    }

    let { positionId, departmentId, positionName, departmentName, ...restData } = data;

    if (positionId === "0" || !positionId) {
      positionId = null;
    }

    if (departmentId === "0" || !departmentId) {
      departmentId = null;
    }

    // If DRAFT, allow editing all fields
    const updatedJob = await prisma.jobOpening.update({
      where: { id },
      data: {
        ...restData,
        positionId,
        departmentId,
        positionName,
        departmentName,
      },
    });

    if (restData.requiresSkillTest === false) {
      await prisma.jobTimeline.deleteMany({
        where: {
          jobId: id,
          OR: [
            { stageId: "stage_4" },
            { stage: { name: { contains: "skill", mode: "insensitive" } } },
            { stage: { name: { contains: "technical", mode: "insensitive" } } },
          ]
        }
      });
    }
    revalidatePath("/dashboard/job-openings");
    revalidatePath(`/dashboard/job-openings/${id}`);
    return { success: true, data: updatedJob };
  } catch (error) {
    console.error("updateJobOpening Error:", error);
    return { success: false, error: "Gagal mengubah data lowongan pekerjaan" };
  }
}

export async function publishJobOpening(id: string) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const job = await prisma.jobOpening.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!job) return { success: false, error: "Lowongan tidak ditemukan" };
    if (job.status !== "DRAFT") return { success: false, error: "Hanya lowongan Draft yang bisa dipublish" };

    const stages = await prisma.masterPipelineStage.findMany({ orderBy: { orderIndex: 'asc' } });
    
    // Filter out skill test stage if not required by this job
    const isSkillStage = (s: any) => 
      s.id === "stage_4" || 
      (s.name || "").toLowerCase().includes("skill") || 
      (s.name || "").toLowerCase().includes("technical");

    const applicableStages = job.requiresSkillTest
      ? stages
      : stages.filter(s => !isSkillStage(s));

    // Determine which SLA to use
    let useSiteSla = false;
    if (job.site && job.site.useSpecificSla) {
      useSiteSla = true;
    }

    let siteSlas: any[] = [];
    if (useSiteSla) {
      siteSlas = await prisma.siteSla.findMany({ where: { siteId: job.siteId } });
    }

    const today = new Date();
    let currentStartDate = new Date(today);

    const timelineData = applicableStages.map(stage => {
      let slaDays = stage.slaDays;
      if (useSiteSla) {
        const specificSla = siteSlas.find(s => s.stageId === stage.id);
        if (specificSla) {
          slaDays = specificSla.slaDays;
        }
      }

      const isUnlimited = (slaDays === 0) || ['stage_8', 'stage_9', 'stage_10'].includes(stage.id) || ['training', 'induction', 'pkwt'].some(n => stage.name.toLowerCase().includes(n));

      const deadlineDate = new Date(currentStartDate);
      if (isUnlimited) {
        // Lifetime / limitless SLA: set deadline far in the future
        deadlineDate.setFullYear(deadlineDate.getFullYear() + 50);
      } else {
        deadlineDate.setDate(deadlineDate.getDate() + slaDays);
        currentStartDate = new Date(deadlineDate); // next stage starts when this one ends
      }

      const tData = {
        stageId: stage.id,
        status: "Pending",
        startDate: new Date(currentStartDate),
        deadlineDate: new Date(deadlineDate),
      };

      return tData;
    });

    const updatedJob = await prisma.jobOpening.update({
      where: { id },
      data: {
        status: "ACTIVE",
        publishedDate: today,
        timeline: {
          create: timelineData
        }
      },
      include: {
        timeline: true
      }
    });

    revalidatePath("/dashboard/job-openings");
    revalidatePath(`/dashboard/job-openings/${id}`);
    return { success: true, data: updatedJob };
  } catch (error) {
    console.error("publishJobOpening Error:", error);
    return { success: false, error: "Gagal publish lowongan pekerjaan" };
  }
}

export async function getPublicJobs(search?: string, provinceId?: string, cityId?: string, departmentId?: string) {
  try {
    const whereClause: any = {
      status: "ACTIVE",
    };

    if (search) {
      whereClause.OR = [
        { positionName: { contains: search, mode: "insensitive" } },
        { position: { name: { contains: search, mode: "insensitive" } } },
        { departmentName: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
        { city: { name: { contains: search, mode: "insensitive" } } },
        { province: { name: { contains: search, mode: "insensitive" } } },
        { site: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (provinceId) whereClause.provinceId = provinceId;
    if (cityId) whereClause.cityId = cityId;
    if (departmentId) whereClause.departmentId = departmentId;

    const data = await prisma.jobOpening.findMany({
      where: whereClause,
      include: {
        position: true,
        department: true,
        city: true,
        province: true,
      },
      orderBy: { publishedDate: "desc" },
    });
    return { success: true, data };
  } catch (error) {
    console.error("getPublicJobs Error:", error);
    return { success: false, error: "Gagal mengambil data lowongan" };
  }
}

export async function getPublicJobById(idOrSlug: string) {
  try {
    const job = await prisma.jobOpening.findFirst({
      where: {
        OR: [
          { slug: idOrSlug },
          { id: idOrSlug },
        ],
        status: "ACTIVE"
      },
      include: {
        position: true,
        department: true,
        customer: true,
        city: true,
        province: true,
        site: true,
      },
    });
    if (!job) return { success: false, error: "Lowongan tidak ditemukan atau sudah ditutup" };
    return { success: true, data: job };
  } catch (error) {
    console.error("getPublicJobById Error:", error);
    return { success: false, error: "Gagal mengambil data lowongan" };
  }
}

export async function publishJob(jobId: string, timelines: any[]) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const job = await prisma.jobOpening.update({
      where: { id: jobId },
      data: {
        status: "ACTIVE",
        publishedDate: new Date(),
      }
    });

    if (timelines && timelines.length > 0) {
      // Filter out skill test stage if job does not require it
      let filteredTimelines = timelines;
      if (!job.requiresSkillTest) {
        filteredTimelines = timelines.filter(
          (t: any) =>
            t.id !== "stage_4" &&
            !t.title?.toLowerCase().includes("skill") &&
            !t.title?.toLowerCase().includes("technical")
        );
      }

      // Clear existing timelines if any (to be safe)
      await prisma.jobTimeline.deleteMany({
        where: { jobId }
      });

      await prisma.jobTimeline.createMany({
        data: filteredTimelines.map(t => ({
          jobId,
          stageId: t.id,
          status: t.status,
          startDate: new Date(t.startDate),
          deadlineDate: new Date(t.deadlineDate),
        }))
      });
    }

    revalidatePath("/dashboard/job-openings");
    revalidatePath(`/dashboard/job-openings/${jobId}`);
    revalidatePath("/");
    revalidatePath("/jobs");
    revalidatePath("/candidate/jobs");
    return { success: true, data: job };
  } catch (error) {
    console.error("publishJob Error:", error);
    return { success: false, error: "Gagal mempublish job" };
  }
}

export async function updateApplicationStage(appId: string, targetStageId: string, note?: string) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: { job: true }
    });

    if (!app) {
      return { success: false, error: "Application not found" };
    }

    // Backend Guard: Recruiter cannot advance or resurrect candidate whose application is already REJECTED (Archived)
    if (app.status === "REJECTED") {
      return {
        success: false,
        error: "Lamaran kandidat ini telah ditolak (Archived). Kandidat yang telah ditolak tidak dapat dipindahkan kembali ke pipeline rekrutmen aktif."
      };
    }

    // Backend Guard: Recruiter cannot advance candidate from Offering Letter stage before candidate accepts
    const currentStageId = app.currentStageId || "";
    const isCurrentOfferingStage = currentStageId === "stage_6";

    if (isCurrentOfferingStage && targetStageId !== "stage_6" && targetStageId !== "Rejected") {
      let stageData: any = {};
      if (app.stageData) {
        try {
          stageData = typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData;
        } catch {
          stageData = {};
        }
      }
      const offering = stageData.offeringLetter || {};
      const candidateStatus = offering.candidateResponse?.status;

      if (candidateStatus !== "ACCEPTED") {
        return {
          success: false,
          error: "Kandidat belum menyetujui dan menandatangani Offering Letter. Pemindahan ke tahap berikutnya tidak diizinkan sebelum ada persetujuan resmi dari kandidat."
        };
      }
    }

    let targetStageName = targetStageId;
    if (targetStageId !== "Rejected" && targetStageId !== "Hired") {
      const stage = await prisma.masterPipelineStage.findUnique({
        where: { id: targetStageId }
      });
      targetStageName = stage?.name || targetStageId;
    }

    let newStatus: ApplicationStatus = app.status;
    let newCurrentStageId: string | null = targetStageId;

    if (targetStageId === "Rejected") {
      newStatus = "REJECTED";
      newCurrentStageId = app.currentStageId;
    } else if (targetStageId === "Hired") {
      newStatus = "HIRED";
      newCurrentStageId = null;
    } else if (
      ["stage_8", "stage_9", "stage_10"].includes(targetStageId) ||
      (targetStageName && ["training", "induction", "pkwt"].some(n => targetStageName.toLowerCase().includes(n)))
    ) {
      // Hired decision is locked in at MCU stage; post-MCU stages (Training, Induction, PKWT) track hired employees
      newStatus = "HIRED";
      newCurrentStageId = targetStageId;
    } else {
      newStatus = "ACTIVE";
      newCurrentStageId = targetStageId;
    }

    const updatedApp = await prisma.application.update({
      where: { id: appId },
      data: {
        currentStageId: newCurrentStageId,
        status: newStatus,
        history: {
          create: {
            stageId: targetStageId === "Rejected" || targetStageId === "Hired" ? undefined : targetStageId,
            stageName: targetStageId === "Rejected" ? "Rejected" : targetStageId === "Hired" ? "Hired" : targetStageName,
            note: note || `Moved to ${targetStageName}`,
          }
        }
      }
    });

    // Update live headcount fulfilled and on-site count on JobOpening (Fase 2)
    try {
      const [hiredCount, onSiteCount] = await Promise.all([
        prisma.application.count({ where: { jobId: app.jobId, status: "HIRED" } }),
        prisma.application.count({
          where: {
            jobId: app.jobId,
            OR: [
              { currentStageId: "stage_10" },
              { contractMobilization: { mobilizationStatus: { in: ["ARRIVED_ON_SITE", "COMPLETED"] } } },
            ],
          },
        }),
      ]);
      await prisma.jobOpening.update({
        where: { id: app.jobId },
        data: {
          headcountFulfilled: hiredCount,
          headcountOnSite: onSiteCount,
        },
      });
    } catch (e) {
      console.warn("Headcount sync warning:", e);
    }

    revalidatePath(`/dashboard/pipeline`);
    revalidatePath(`/dashboard/job-openings/${app.jobId}`);

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "STAGE_MOVED",
      entityType: "Application",
      entityId: appId,
      metadata: {
        jobId: app.jobId,
        targetStageId,
        targetStageName,
        newStatus,
        note: note || null,
      },
    });

    return { success: true, data: updatedApp };
  } catch (error) {
    console.error("updateApplicationStage Error:", error);
    return { success: false, error: "Gagal memindahkan kandidat" };
  }
}

/**
 * Sinkronisasi data stage kandidat ke tabel relasional formal & enkripsi data PDP (Fase 2)
 */
export async function syncStageDataToRelational(appId: string, stageData: any) {
  if (!stageData || typeof stageData !== "object") return;
  const sd = typeof stageData === "string" ? JSON.parse(stageData) : stageData;

  try {
    // 1. HR Interview
    if (sd.hrInterview) {
      const hr = sd.hrInterview;
      const conductedDate = hr.date ? new Date(hr.date) : null;
      let result: AssessmentResult = AssessmentResult.PENDING;
      if (hr.result === "Lulus") result = AssessmentResult.PASSED;
      else if (hr.result === "Gagal") result = AssessmentResult.FAILED;

      const existing = await prisma.applicationAssessment.findFirst({
        where: { applicationId: appId, stageType: AssessmentStage.HR_INTERVIEW },
      });
      if (existing) {
        await prisma.applicationAssessment.update({
          where: { id: existing.id },
          data: {
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : undefined,
            result,
            feedback: hr.feedback || null,
            metadata: hr,
          },
        });
      } else {
        await prisma.applicationAssessment.create({
          data: {
            applicationId: appId,
            stageType: AssessmentStage.HR_INTERVIEW,
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : null,
            result,
            feedback: hr.feedback || null,
            metadata: hr,
          },
        });
      }
    }

    // 2. User Interview
    if (sd.userInterview) {
      const ui = sd.userInterview;
      const conductedDate = ui.date ? new Date(ui.date) : null;
      let result: AssessmentResult = AssessmentResult.PENDING;
      if (ui.result === "Lulus") result = AssessmentResult.PASSED;
      else if (ui.result === "Gagal") result = AssessmentResult.FAILED;

      const existing = await prisma.applicationAssessment.findFirst({
        where: { applicationId: appId, stageType: AssessmentStage.USER_INTERVIEW },
      });
      if (existing) {
        await prisma.applicationAssessment.update({
          where: { id: existing.id },
          data: {
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : undefined,
            result,
            feedback: ui.feedback || null,
            metadata: ui,
          },
        });
      } else {
        await prisma.applicationAssessment.create({
          data: {
            applicationId: appId,
            stageType: AssessmentStage.USER_INTERVIEW,
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : null,
            result,
            feedback: ui.feedback || null,
            metadata: ui,
          },
        });
      }
    }

    // 3. Psikotes
    if (sd.psikotes) {
      const psi = sd.psikotes;
      const conductedDate = psi.date ? new Date(psi.date) : null;
      let result: AssessmentResult = AssessmentResult.CONSIDERED;
      if (psi.result?.includes("Disarankan")) result = AssessmentResult.RECOMMENDED;
      else if (psi.result?.includes("Tidak")) result = AssessmentResult.NOT_RECOMMENDED;

      const existing = await prisma.applicationAssessment.findFirst({
        where: { applicationId: appId, stageType: AssessmentStage.PSIKOTES },
      });
      if (existing) {
        await prisma.applicationAssessment.update({
          where: { id: existing.id },
          data: {
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : undefined,
            result,
            metadata: psi,
          },
        });
      } else {
        await prisma.applicationAssessment.create({
          data: {
            applicationId: appId,
            stageType: AssessmentStage.PSIKOTES,
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : null,
            result,
            metadata: psi,
          },
        });
      }
    }

    // 4. Test Skill
    if (sd.testSkill) {
      const ts = sd.testSkill;
      const conductedDate = ts.date ? new Date(ts.date) : null;
      const existing = await prisma.applicationAssessment.findFirst({
        where: { applicationId: appId, stageType: AssessmentStage.SKILL_TEST },
      });
      if (existing) {
        await prisma.applicationAssessment.update({
          where: { id: existing.id },
          data: {
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : undefined,
            attachmentUrl: ts.resultFile || null,
            metadata: ts,
          },
        });
      } else {
        await prisma.applicationAssessment.create({
          data: {
            applicationId: appId,
            stageType: AssessmentStage.SKILL_TEST,
            conductedDate: conductedDate && !isNaN(conductedDate.getTime()) ? conductedDate : null,
            attachmentUrl: ts.resultFile || null,
            metadata: ts,
          },
        });
      }
    }

    // 5. BNSP Validation
    if (sd.bnspValidation) {
      const bnsp = sd.bnspValidation;
      const existing = await prisma.applicationAssessment.findFirst({
        where: { applicationId: appId, stageType: AssessmentStage.BNSP_VALIDATION },
      });
      const result = bnsp.isApproved ? AssessmentResult.PASSED : AssessmentResult.PENDING;
      if (existing) {
        await prisma.applicationAssessment.update({
          where: { id: existing.id },
          data: { result, metadata: bnsp },
        });
      } else {
        await prisma.applicationAssessment.create({
          data: { applicationId: appId, stageType: AssessmentStage.BNSP_VALIDATION, result, metadata: bnsp },
        });
      }
    }

    // 6. Medical Check-Up (MCU) with AES-256-GCM encryption (UU PDP Pasal 4)
    if (sd.mcu) {
      const mcu = sd.mcu;
      let fitnessStatus: McuFitnessStatus = McuFitnessStatus.PENDING;
      const raw = (mcu.resultStatus || "").toUpperCase();
      if (raw.includes("FIT TO WORK") || (raw.includes("FIT") && !raw.includes("UNFIT"))) {
        fitnessStatus = raw.includes("RESTRICTION") ? McuFitnessStatus.FIT_WITH_RESTRICTION : McuFitnessStatus.FIT;
      } else if (raw.includes("TEMPORARY")) {
        fitnessStatus = McuFitnessStatus.TEMPORARY_UNFIT;
      } else if (raw.includes("UNFIT")) {
        fitnessStatus = McuFitnessStatus.UNFIT;
      }

      const completedDate = mcu.date ? new Date(mcu.date) : null;
      const notesToEncrypt = mcu.doctorNotes || mcu.resultStatus || "";
      const doctorNotesEncrypted = notesToEncrypt ? encryptField(notesToEncrypt) : null;

      await prisma.medicalCheckUp.upsert({
        where: { applicationId: appId },
        create: {
          applicationId: appId,
          fitnessStatus,
          clinicName: mcu.clinicName || null,
          completedDate: completedDate && !isNaN(completedDate.getTime()) ? completedDate : null,
          packageMcu: mcu.package || "Standar Tambang",
          doctorNotesEncrypted,
          candidateProofUrl: mcu.candidateProof?.file?.url || mcu.candidateProof?.file?.objectKey || null,
        },
        update: {
          fitnessStatus,
          clinicName: mcu.clinicName || undefined,
          completedDate: completedDate && !isNaN(completedDate.getTime()) ? completedDate : undefined,
          doctorNotesEncrypted: doctorNotesEncrypted || undefined,
          candidateProofUrl: mcu.candidateProof?.file?.url || mcu.candidateProof?.file?.objectKey || undefined,
        },
      });
    }

    // 7. Offering Letter Record
    if (sd.offeringLetter) {
      const ol = sd.offeringLetter;
      let status: OfferingLetterStatus = OfferingLetterStatus.DRAFT;
      const candStatus = ol.candidateResponse?.status;
      if (candStatus === "ACCEPTED") status = OfferingLetterStatus.ACCEPTED;
      else if (candStatus === "DECLINED") status = OfferingLetterStatus.DECLINED;
      else if (candStatus === "REJECTED_FINAL") status = OfferingLetterStatus.REJECTED_FINAL;
      else if (ol.file || ol.date) status = OfferingLetterStatus.SENT;

      const issuedDate = ol.date ? new Date(ol.date) : null;
      const signedAt = ol.candidateResponse?.signedAt ? new Date(ol.candidateResponse.signedAt) : null;

      await prisma.offeringLetterRecord.upsert({
        where: { applicationId: appId },
        create: {
          applicationId: appId,
          status,
          issuedDate: issuedDate && !isNaN(issuedDate.getTime()) ? issuedDate : null,
          signedAt: signedAt && !isNaN(signedAt.getTime()) ? signedAt : null,
          documentUrl: typeof ol.file === "string" ? ol.file : null,
          signedDocumentUrl: ol.candidateResponse?.signedFile?.url || null,
          signedDocumentKey: ol.candidateResponse?.signedFile?.objectKey || null,
          candidateNote: ol.candidateResponse?.note || null,
          baseSalaryEncrypted: ol.salary ? encryptField(String(ol.salary)) : null,
          siteAllowanceEncrypted: ol.siteAllowance ? encryptField(String(ol.siteAllowance)) : null,
        },
        update: {
          status,
          issuedDate: issuedDate && !isNaN(issuedDate.getTime()) ? issuedDate : undefined,
          signedAt: signedAt && !isNaN(signedAt.getTime()) ? signedAt : undefined,
          documentUrl: typeof ol.file === "string" ? ol.file : undefined,
          signedDocumentUrl: ol.candidateResponse?.signedFile?.url || undefined,
          signedDocumentKey: ol.candidateResponse?.signedFile?.objectKey || undefined,
          candidateNote: ol.candidateResponse?.note || undefined,
        },
      });
    }

    // 8. BAST & Contract Mobilization
    if (sd.bast) {
      const b = sd.bast;
      const start = b.start ? new Date(b.start) : null;
      const end = b.end ? new Date(b.end) : null;

      await prisma.contractMobilization.upsert({
        where: { applicationId: appId },
        create: {
          applicationId: appId,
          nrp: b.nrp || null,
          bastStatus: b.status || null,
          bastValidationLink: b.link || null,
          pkwtStartDate: start && !isNaN(start.getTime()) ? start : null,
          pkwtEndDate: end && !isNaN(end.getTime()) ? end : null,
          mobilizationStatus: MobilizationStatus.ARRIVED_ON_SITE,
        },
        update: {
          nrp: b.nrp || undefined,
          bastStatus: b.status || undefined,
          bastValidationLink: b.link || undefined,
          pkwtStartDate: start && !isNaN(start.getTime()) ? start : undefined,
          pkwtEndDate: end && !isNaN(end.getTime()) ? end : undefined,
        },
      });
    }
  } catch (error) {
    console.error("syncStageDataToRelational Error:", error);
  }
}

export async function updateApplicationStageData(appId: string, stageData: any) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const updatedApp = await prisma.application.update({
      where: { id: appId },
      data: {
        stageData
      }
    });

    // Sinkronisasi data stage ke model relasional ternormalisasi (Fase 2)
    await syncStageDataToRelational(appId, stageData);

    revalidatePath(`/dashboard/pipeline`);
    revalidatePath(`/dashboard/job-openings/${updatedApp.jobId}`);

    return { success: true, data: updatedApp };
  } catch (error) {
    console.error("updateApplicationStageData Error:", error);
    return { success: false, error: "Gagal menyimpan data stage kandidat" };
  }
}

export async function getApplicationForVerify(jobId: string, candidateProfileId: string) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const app = await prisma.application.findFirst({
      where: {
        jobId,
        candidateProfileId,
      },
      include: {
        job: {
          include: {
            timeline: {
              include: {
                stage: true
              }
            },
            position: true
          }
        },
        candidateProfile: {
          include: {
            documents: true,
            user: true,
          }
        },
        history: true
      }
    });

    if (!app) return { success: false, error: "Application not found" };

    // Dekripsi data PII kandidat (UU PDP) untuk tampilan recruiter
    if (app.candidateProfile) {
      if (app.candidateProfile.nik) {
        app.candidateProfile.nik = decryptField(app.candidateProfile.nik);
      }
      if (app.candidateProfile.kk) {
        app.candidateProfile.kk = decryptField(app.candidateProfile.kk);
      }
    }

    return { success: true, data: app };
  } catch (error) {
    console.error("getApplicationForVerify Error:", error);
    return { success: false, error: "Failed to fetch application" };
  }
}

export async function applyToJob(jobId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: { applications: true, documents: true }
    });

    if (!profile) {
      return { success: false, error: "Profil tidak ditemukan. Harap lengkapi profil Anda." };
    }

    if (!profile.isProfileCompleted) {
      return { success: false, error: "Harap lengkapi profil dan dokumen Anda sebelum melamar." };
    }

    const rawCandidateNik = profile.nik?.trim();
    const candidateNik = decryptField(rawCandidateNik) || "";
    if (!candidateNik) {
      return {
        success: false,
        error: "Nomor Induk Kependudukan (NIK) belum terdaftar pada profil Anda. Harap lengkapi NIK Anda pada menu profil terlebih dahulu."
      };
    }
    const candidateNikHash = hashField(candidateNik);

    // Aturan Seleksi Perusahaan: 1 kandidat hanya boleh melamar ke 1 lowongan aktif (dicek via blind index / NIK)
    const nikMatchConditions = [
      ...(candidateNikHash ? [{ nikHash: candidateNikHash }] : []),
      ...(rawCandidateNik ? [{ nik: rawCandidateNik }] : []),
      { nik: candidateNik },
    ];

    const existingActiveApp = await prisma.application.findFirst({
      where: {
        candidateProfile: {
          OR: nikMatchConditions,
        },
        status: {
          in: ["ACTIVE", "HIRED"],
        },
      },
      include: {
        job: {
          include: {
            position: true,
          },
        },
      },
    });

    if (existingActiveApp) {
      const activeJobTitle =
        existingActiveApp.job?.positionName ||
        existingActiveApp.job?.position?.name ||
        "Lowongan Pekerjaan";
      const activeJobRef = existingActiveApp.job?.noRegistrasi || "-";

      return {
        success: false,
        error: `Sesuai aturan rekrutmen perusahaan, 1 kandidat (NIK: ${candidateNik}) hanya dapat melamar pada 1 lowongan pekerjaan. Anda saat ini masih terdaftar dalam proses seleksi aktif untuk posisi "${activeJobTitle}" (No. Registrasi: ${activeJobRef}).`,
      };
    }

    // Check if already applied to this specific job
    const alreadyAppliedThisJob = await prisma.application.findFirst({
      where: {
        jobId,
        candidateProfile: {
          OR: nikMatchConditions,
        },
      },
    });

    if (alreadyAppliedThisJob) {
      return { success: false, error: "Anda sudah pernah melamar ke lowongan ini sebelumnya." };
    }

    // Check if job is still active
    const job = await prisma.jobOpening.findUnique({ where: { id: jobId } });
    if (!job || job.status !== "ACTIVE") {
      return { success: false, error: "Lowongan sudah tidak aktif atau ditutup." };
    }

    // Check BNSP requirement
    if (job.requiresBnsp) {
      const hasBnsp = profile.documents?.some(doc => {
        const type = (doc.documentType || "").toLowerCase();
        const hasValidFile = Boolean(doc.fileUrl || doc.objectKey);
        return (type.includes("bnsp") || type.includes("sertifikat")) && hasValidFile;
      });
      if (!hasBnsp) {
        return {
          success: false,
          error: "Lowongan ini mewajibkan sertifikasi kompetensi BNSP resmi. Proses pelamaran digagalkan karena Anda belum mengunggah sertifikat BNSP di menu My Profile."
        };
      }
    }

    // Get the first stage (Screening/Administration)
    const firstStage = await prisma.masterPipelineStage.findFirst({
      orderBy: { orderIndex: "asc" }
    });

    // Create the application
    await prisma.application.create({
      data: {
        jobId,
        candidateProfileId: profile.id,
        currentStageId: firstStage?.id,
        status: "ACTIVE",
        history: {
          create: {
            stageId: firstStage?.id,
            stageName: firstStage?.name || "Administration",
            note: "Application Submitted"
          }
        }
      }
    });

    revalidatePath("/candidate/jobs");
    revalidatePath("/candidate/history");
    return { success: true };
  } catch (error: any) {
    console.error("applyToJob Error:", error);
    return { success: false, error: "Gagal mengirim lamaran. Silakan coba lagi." };
  }
}

export async function blacklistCandidate(candidateProfileId: string, note: string) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const updatedProfile = await prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: {
        isBlacklisted: true,
        blacklistReason: note,
        blacklistedAt: new Date(),
      }
    });

    revalidatePath(`/dashboard/blacklist`);
    revalidatePath(`/dashboard/pipeline`);
    revalidatePath(`/dashboard/archived-candidates`);

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "CANDIDATE_BLACKLISTED",
      entityType: "CandidateProfile",
      entityId: candidateProfileId,
      metadata: {
        reason: note,
      },
    });

    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("blacklistCandidate Error:", error);
    return { success: false, error: "Gagal mem-blacklist kandidat" };
  }
}

export async function getBlacklistedCandidates() {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const profiles = await prisma.candidateProfile.findMany({
      where: { isBlacklisted: true },
      include: {
        user: true,
        documents: true,
        applications: {
          orderBy: { applicationDate: "desc" },
          take: 1,
          include: {
            job: {
              include: {
                position: true
              }
            },
            currentStage: true,
            history: {
              orderBy: { date: "desc" }
            }
          }
        }
      },
      orderBy: { blacklistedAt: "desc" }
    });

    const mapped = profiles.map(p => {
      const photoDoc = p.documents?.find(d => {
        const dt = (d.documentType || "").toLowerCase();
        return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
      });

      const photoUrl = photoDoc?.objectKey
        ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
        : photoDoc?.fileUrl || p.user?.image || null;

      const lastApp = p.applications?.[0];
      const lastJobApplied = lastApp?.job?.positionName || lastApp?.job?.position?.name || "-";
      const lastStage = lastApp?.currentStage?.name || lastApp?.history?.find(h => h.stageName !== "Rejected")?.stageName || lastApp?.history?.[0]?.stageName || "-";

      return {
        id: p.id,
        fullName: p.user?.name || "Unknown",
        nik: decryptField(p.nik) || "-",
        email: p.user?.email || "-",
        phone: p.whatsapp || "-",
        lastJobApplied,
        lastStage,
        blacklistedDate: p.blacklistedAt ? p.blacklistedAt.toISOString() : p.updatedAt.toISOString(),
        blacklistNote: p.blacklistReason || "Tidak ada catatan.",
        filePhoto: photoUrl ? { base64: photoUrl } : null
      };
    });

    return { success: true, data: mapped };
  } catch (error: any) {
    console.error("getBlacklistedCandidates Error:", error);
    return { success: false, error: "Gagal mengambil data blacklist" };
  }
}

export async function getInterviewsDashboardData() {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };
    const stages = await prisma.masterPipelineStage.findMany({
      orderBy: { orderIndex: "asc" }
    });

    const interviewStages = stages.filter(s =>
      s.name.toLowerCase().includes("interview") || s.id === "stage_2" || s.id === "stage_5"
    );
    const interviewStageIds = interviewStages.map(s => s.id);

    const [applications, customers] = await Promise.all([
      prisma.application.findMany({
        where: {
          status: "ACTIVE",
          currentStageId: {
            in: interviewStageIds
          }
        },
        include: {
          job: {
            include: {
              customer: true,
              site: true,
              position: true,
              timeline: {
                include: { stage: true }
              }
            }
          },
          candidateProfile: {
            include: {
              user: true,
              documents: true
            }
          },
          currentStage: true,
          interviews: {
            orderBy: { scheduledAt: "desc" }
          }
        },
        orderBy: {
          applicationDate: "desc"
        }
      }),
      prisma.masterCustomer.findMany({
        orderBy: { name: "asc" }
      })
    ]);

    const positionsSet = new Set<string>();
    const interviewList = applications.map(app => {
      const job = app.job;
      const jobPosition = job.positionName || job.position?.name || "General";
      if (jobPosition) positionsSet.add(jobPosition);

      const customerName = job.customer?.name || "-";
      const siteName = job.site?.name || "-";
      const candidateName = app.candidateProfile.user?.name || "Unknown";
      const stageTitle = app.currentStage?.name || "Interview";

      const timelineStage = job.timeline?.find(t => t.stageId === app.currentStageId);
      const deadlineDate = timelineStage ? timelineStage.deadlineDate.toISOString() : app.applicationDate.toISOString();

      const deadline = new Date(deadlineDate);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let slaStatus = "On Track";
      if (diffDays < 0) slaStatus = "Overdue";
      else if (diffDays <= 2) slaStatus = "Reminder";

      const sd = app.stageData ? (typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData) : {};
      const scheduledDate = sd.hrInterview?.date || sd.userInterview?.date || (app.interviews?.[0]?.scheduledAt ? app.interviews[0].scheduledAt.toISOString() : null);

      const photoDoc = app.candidateProfile.documents?.find(d => {
        const dt = (d.documentType || "").toLowerCase();
        return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
      });
      const photoUrl = photoDoc?.objectKey
        ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
        : photoDoc?.fileUrl || app.candidateProfile.user?.image || null;

      return {
        id: `${app.jobId}-${app.candidateProfileId}`,
        applicationId: app.id,
        jobId: app.jobId,
        candidateId: app.candidateProfileId,
        jobPosition,
        customerId: job.customerId,
        customerName,
        siteName,
        candidateName,
        stageTitle,
        scheduledDate,
        deadlineDate,
        slaStatus,
        diffDays,
        filePhoto: photoUrl ? { base64: photoUrl } : null
      };
    });

    interviewList.sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());

    return {
      success: true,
      data: {
        interviews: interviewList,
        customers: customers.map(c => ({ id: c.id, name: c.name })),
        allPositions: Array.from(positionsSet).sort()
      }
    };
  } catch (error: any) {
    console.error("getInterviewsDashboardData Error:", error);
    return { success: false, error: "Gagal mengambil jadwal interview dari database" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATED SERVER ACTIONS FOR AUDIT IMPROVEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedTalentPoolParams {
  page?: number;
  limit?: number;
  search?: string;
  education?: string;
}

export async function getPaginatedTalentPool({
  page = 1,
  limit = 10,
  search = "",
  education = "",
}: PaginatedTalentPoolParams = {}) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const where: any = {};
    if (education) {
      if (education === "SMA/SMK") {
        where.OR = [
          { latestEducation: { contains: "SMA", mode: "insensitive" } },
          { latestEducation: { contains: "SMK", mode: "insensitive" } },
          { latestEducation: { contains: "SLTA", mode: "insensitive" } },
        ];
      } else {
        where.latestEducation = { contains: education, mode: "insensitive" };
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { nik: { contains: q, mode: "insensitive" } },
        { whatsapp: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        {
          applications: {
            some: {
              job: {
                OR: [
                  { positionName: { contains: q, mode: "insensitive" } },
                  { position: { name: { contains: q, mode: "insensitive" } } },
                ]
              }
            }
          }
        }
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions }
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [totalItems, candidates] = await Promise.all([
      prisma.candidateProfile.count({ where }),
      prisma.candidateProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          documents: true,
          applications: {
            orderBy: { applicationDate: "desc" },
            take: 1,
            include: {
              job: {
                include: {
                  position: true,
                }
              },
              currentStage: true,
              history: {
                orderBy: { date: "desc" },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const formatted = candidates.map(c => {
      const photoDoc = c.documents?.find(d => {
        const dt = (d.documentType || "").toLowerCase();
        return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
      });
      const photoUrl = photoDoc?.objectKey 
        ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
        : photoDoc?.fileUrl || c.user?.image || null;

      const lastApp = c.applications?.[0];
      const lastJobApplied = lastApp?.job?.positionName || lastApp?.job?.position?.name || null;
      let lastStage = null;
      if (lastApp) {
        if (lastApp.status === "HIRED") {
          lastStage = "Hired";
        } else if (lastApp.status === "REJECTED") {
          lastStage = `Ditolak (${lastApp.currentStage?.name || "Seleksi"})`;
        } else {
          lastStage = lastApp.currentStage?.name || "Active Screening";
        }
      }

      return {
        ...c,
        fullName: c.user?.name || "Unknown",
        email: c.user?.email || "-",
        whatsapp: c.whatsapp || "-",
        city: c.domicileAddress || "-",
        lastJobApplied: lastJobApplied || "Belum Ada Lamaran",
        lastStage: lastStage || "Belum Melamar",
        hasApplied: !!lastApp,
        filePhoto: photoUrl ? { base64: photoUrl } : null
      };
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      success: true,
      data: formatted,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      }
    };
  } catch (error: any) {
    console.error("getPaginatedTalentPool Error:", error);
    return { success: false, error: "Gagal mengambil data talent pool" };
  }
}

export interface PaginatedArchivedCandidatesParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
}

export async function getPaginatedArchivedCandidates({
  page = 1,
  limit = 10,
  search = "",
  position = "",
  startDate = "",
  endDate = "",
}: PaginatedArchivedCandidatesParams = {}) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const where: any = {
      status: "REJECTED",
      candidateProfile: {
        isBlacklisted: false,
      }
    };

    if (position) {
      where.job = {
        OR: [
          { positionName: position },
          { position: { name: position } }
        ]
      };
    }

    if (startDate || endDate) {
      where.applicationDate = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.applicationDate.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.applicationDate.lte = e;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.candidateProfile = {
        ...where.candidateProfile,
        OR: [
          { nik: { contains: q, mode: "insensitive" } },
          { whatsapp: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ]
      };
    }

    const [totalItems, applications, distinctJobs] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          job: {
            include: {
              position: true,
            }
          },
          currentStage: true,
          candidateProfile: {
            include: {
              user: true,
              documents: true,
            }
          },
          history: {
            orderBy: { date: "desc" }
          }
        },
        orderBy: {
          applicationDate: "desc"
        }
      }),
      prisma.jobOpening.findMany({
        select: {
          id: true,
          positionName: true,
          position: { select: { name: true } }
        }
      })
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const allPositions = Array.from(
      new Set(distinctJobs.map(j => j.positionName || j.position?.name).filter(Boolean) as string[])
    ).sort();

    return {
      success: true,
      data: applications,
      allPositions,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      }
    };
  } catch (error: any) {
    console.error("getPaginatedArchivedCandidates Error:", error);
    return { success: false, error: "Gagal mengambil data kandidat terarsip" };
  }
}

export interface PaginatedBlacklistParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getPaginatedBlacklistedCandidates({
  page = 1,
  limit = 10,
  search = "",
}: PaginatedBlacklistParams = {}) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const where: any = { isBlacklisted: true };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { nik: { contains: q, mode: "insensitive" } },
        { whatsapp: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [totalItems, profiles] = await Promise.all([
      prisma.candidateProfile.count({ where }),
      prisma.candidateProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          documents: true,
          applications: {
            orderBy: { applicationDate: "desc" },
            take: 1,
            include: {
              job: {
                include: { position: true }
              },
              currentStage: true,
              history: {
                orderBy: { date: "desc" },
                take: 1
              }
            }
          }
        },
        orderBy: { blacklistedAt: "desc" }
      })
    ]);

    const mapped = profiles.map(p => {
      const photoDoc = p.documents?.find(d => {
        const dt = (d.documentType || "").toLowerCase();
        return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
      });
      const photoUrl = photoDoc?.objectKey
        ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
        : photoDoc?.fileUrl || p.user?.image || null;

      const lastApp = p.applications?.[0];
      const lastJobApplied = lastApp?.job?.positionName || lastApp?.job?.position?.name || "-";
      const lastStage = lastApp?.currentStage?.name || lastApp?.history?.[0]?.stageName || "-";

      return {
        id: p.id,
        fullName: p.user?.name || "Unknown",
        nik: decryptField(p.nik) || "-",
        email: p.user?.email || "-",
        phone: p.whatsapp || "-",
        lastJobApplied,
        lastStage,
        blacklistedDate: p.blacklistedAt ? p.blacklistedAt.toISOString() : p.updatedAt.toISOString(),
        blacklistNote: p.blacklistReason || "Tidak ada catatan.",
        filePhoto: photoUrl ? { base64: photoUrl } : null
      };
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      success: true,
      data: mapped,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      }
    };
  } catch (error: any) {
    console.error("getPaginatedBlacklistedCandidates Error:", error);
    return { success: false, error: "Gagal mengambil data blacklist" };
  }
}

export interface PaginatedInterviewsParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  customerId?: string;
}

export async function getPaginatedInterviewsDashboardData({
  page = 1,
  limit = 10,
  search = "",
  position = "",
  customerId = "",
}: PaginatedInterviewsParams = {}) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const stages = await prisma.masterPipelineStage.findMany({
      orderBy: { orderIndex: "asc" }
    });

    const interviewStages = stages.filter(s => 
      s.name.toLowerCase().includes("interview") || s.id === "stage_2" || s.id === "stage_5"
    );
    const interviewStageIds = interviewStages.map(s => s.id);

    const where: any = {
      status: "ACTIVE",
      currentStageId: {
        in: interviewStageIds
      }
    };

    if (customerId) {
      where.job = { customerId };
    }

    if (position) {
      where.job = {
        ...where.job,
        OR: [
          { positionName: position },
          { position: { name: position } }
        ]
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.candidateProfile = {
        OR: [
          { nik: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
        ]
      };
    }

    const [totalItems, applications, customers, jobsWithPositions] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          job: {
            include: {
              customer: true,
              site: true,
              position: true,
              timeline: {
                include: { stage: true }
              }
            }
          },
          candidateProfile: {
            include: {
              user: true,
              documents: true
            }
          },
          currentStage: true,
          interviews: {
            orderBy: { scheduledAt: "desc" }
          }
        },
        orderBy: {
          applicationDate: "desc"
        }
      }),
      prisma.masterCustomer.findMany({
        orderBy: { name: "asc" }
      }),
      prisma.jobOpening.findMany({
        select: {
          positionName: true,
          position: { select: { name: true } }
        }
      })
    ]);

    const positionsSet = new Set<string>();
    jobsWithPositions.forEach(j => {
      const p = j.positionName || j.position?.name;
      if (p) positionsSet.add(p);
    });

    const interviewList = applications.map(app => {
      const job = app.job;
      const jobPosition = job.positionName || job.position?.name || "General";
      const customerName = job.customer?.name || "-";
      const siteName = job.site?.name || "-";
      const candidateName = app.candidateProfile?.user?.name || "Unknown";
      const stageTitle = app.currentStage?.name || "Interview";

      const timelineStage = job.timeline?.find(t => t.stageId === app.currentStageId);
      const deadlineDate = timelineStage ? timelineStage.deadlineDate.toISOString() : app.applicationDate.toISOString();

      const deadline = new Date(deadlineDate);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let slaStatus = "On Track";
      if (diffDays < 0) slaStatus = "Overdue";
      else if (diffDays <= 2) slaStatus = "Reminder";

      const sd = app.stageData ? (typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData) : {};
      const scheduledDate = sd.hrInterview?.date || sd.userInterview?.date || (app.interviews?.[0]?.scheduledAt ? app.interviews[0].scheduledAt.toISOString() : null);

      const photoDoc = app.candidateProfile?.documents?.find(d => {
        const dt = (d.documentType || "").toLowerCase();
        return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
      });
      const photoUrl = photoDoc?.objectKey 
        ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
        : photoDoc?.fileUrl || app.candidateProfile?.user?.image || null;

      return {
        id: `${app.jobId}-${app.candidateProfileId}`,
        applicationId: app.id,
        jobId: app.jobId,
        candidateId: app.candidateProfileId,
        jobPosition,
        customerId: job.customerId,
        customerName,
        siteName,
        candidateName,
        stageTitle,
        scheduledDate,
        deadlineDate,
        slaStatus,
        diffDays,
        filePhoto: photoUrl ? { base64: photoUrl } : null
      };
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      success: true,
      data: {
        interviews: interviewList,
        customers: customers.map(c => ({ id: c.id, name: c.name })),
        allPositions: Array.from(positionsSet).sort(),
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        }
      }
    };
  } catch (error: any) {
    console.error("getPaginatedInterviewsDashboardData Error:", error);
    return { success: false, error: "Gagal mengambil data interview dari database" };
  }
}

export interface PaginatedJobOpeningsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getPaginatedJobOpenings({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  customerId = "",
  startDate = "",
  endDate = "",
}: PaginatedJobOpeningsParams = {}) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.tanggalMasuk = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        where.tanggalMasuk.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.tanggalMasuk.lte = e;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { noRegistrasi: { contains: q, mode: "insensitive" } },
        { positionName: { contains: q, mode: "insensitive" } },
        { departmentName: { contains: q, mode: "insensitive" } },
        { position: { name: { contains: q, mode: "insensitive" } } },
        { department: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [totalItems, jobs] = await Promise.all([
      prisma.jobOpening.count({ where }),
      prisma.jobOpening.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          position: true,
          department: true,
          customer: true,
          city: true,
          province: true,
          site: true,
        },
        orderBy: { createdAt: "desc" },
      })
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      success: true,
      data: jobs,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      }
    };
  } catch (error: any) {
    console.error("getPaginatedJobOpenings Error:", error);
    return { success: false, error: "Gagal mengambil data lowongan pekerjaan" };
  }
}

export interface PipelineFilterParams {
  search?: string;
  position?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getFilteredPipelineData({
  search = "",
  position = "",
  customerId = "",
  startDate = "",
  endDate = "",
}: PipelineFilterParams = {}) {
  try {
    const auth = await requireStaffSession();
    if (!auth.authorized) return { success: false, error: auth.error };

    const jobWhere: any = { status: "ACTIVE" };
    if (customerId) jobWhere.customerId = customerId;
    if (position) {
      jobWhere.OR = [
        { positionName: { contains: position, mode: "insensitive" } },
        { position: { name: { contains: position, mode: "insensitive" } } }
      ];
    }
    if (startDate || endDate) {
      jobWhere.tanggalMasuk = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        jobWhere.tanggalMasuk.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        jobWhere.tanggalMasuk.lte = e;
      }
    }

    const allStages = await prisma.masterPipelineStage.findMany({
      orderBy: { orderIndex: "asc" }
    });

    const postMcuStageIds = Array.from(
      new Set([
        "stage_8",
        "stage_9",
        "stage_10",
        ...allStages
          .filter((s) => ["training", "induction", "pkwt"].some((n) => s.name.toLowerCase().includes(n)))
          .map((s) => s.id)
      ])
    );

    const appWhere: any = {
      OR: [
        { status: "ACTIVE" },
        { status: "HIRED", currentStageId: { in: postMcuStageIds } }
      ],
      job: jobWhere
    };

    if (search && search.trim()) {
      const q = search.trim();
      appWhere.candidateProfile = {
        OR: [
          { nik: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } }
        ]
      };
    }

    const [jobs, applications, customers] = await Promise.all([
      prisma.jobOpening.findMany({
        where: jobWhere,
        include: {
          timeline: true,
          position: true
        }
      }),
      prisma.application.findMany({
        where: appWhere,
        include: {
          candidateProfile: {
            include: {
              user: true,
              documents: true
            }
          },
          job: {
            include: {
              position: true
            }
          }
        },
        orderBy: { applicationDate: "desc" }
      }),
      prisma.masterCustomer.findMany({
        orderBy: { name: "asc" }
      })
    ]);

    return {
      success: true,
      data: {
        jobs,
        applications,
        customers,
        stages: allStages
      }
    };
  } catch (error: any) {
    console.error("getFilteredPipelineData Error:", error);
    return { success: false, error: "Gagal mengambil data pipeline" };
  }
}

/**
 * ==============================================================================
 * FASE 3: BULK ACTIONS & RECRUITER EFFICIENCY
 * ==============================================================================
 */

export interface BulkCandidateInput {
  nik: string;
  fullName: string;
  kk?: string | null;
  email?: string | null;
  phone?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  latestEducation?: string | null;
  educationInstitution?: string | null;
  domicileAddress?: string | null;
  notes?: string | null;
}

/**
 * Memindahkan banyak aplikasi kandidat sekaligus ke stage tertentu (Bulk Advance Stage).
 */
export async function bulkAdvanceApplicationStage(
  appIds: string[],
  targetStageId: string,
  note?: string
) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!Array.isArray(appIds) || appIds.length === 0) {
    return { success: false, error: "Pilih minimal 1 kandidat untuk dipindahkan." };
  }

  try {
    const apps = await prisma.application.findMany({
      where: { id: { in: appIds }, deletedAt: null },
      include: { job: true },
    });

    if (apps.length === 0) {
      return { success: false, error: "Tidak ada aplikasi kandidat yang ditemukan." };
    }

    let targetStageName = targetStageId;
    if (targetStageId !== "Rejected" && targetStageId !== "Hired") {
      const stage = await prisma.masterPipelineStage.findUnique({
        where: { id: targetStageId },
      });
      targetStageName = stage?.name || targetStageId;
    }

    let updatedCount = 0;
    const skippedErrors: string[] = [];
    const affectedJobIds = new Set<string>();

    for (const app of apps) {
      affectedJobIds.add(app.jobId);

      // Guard: Kandidat yang sudah ditolak (REJECTED/Archived) tidak boleh dipindahkan ke pipeline aktif
      if (app.status === "REJECTED") {
        skippedErrors.push(`Kandidat ID ${app.id.slice(0, 8)}: Lamaran telah ditolak (Archived) dan tidak dapat dimajukan.`);
        continue;
      }

      const currentStageId = app.currentStageId || "";
      const isCurrentOfferingStage = currentStageId === "stage_6";

      // Guard: Candidat di tahap offering letter harus disetujui kandidat dulu sebelum lanjut
      if (isCurrentOfferingStage && targetStageId !== "stage_6" && targetStageId !== "Rejected") {
        let stageData: any = {};
        if (app.stageData) {
          try {
            stageData = typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData;
          } catch {
            stageData = {};
          }
        }
        const offering = stageData.offeringLetter || {};
        if (offering.candidateResponse?.status !== "ACCEPTED") {
          skippedErrors.push(`Kandidat ID ${app.id.slice(0, 8)}: Belum menyetujui Offering Letter.`);
          continue;
        }
      }

      let newStatus: ApplicationStatus = app.status;
      let newCurrentStageId: string | null = targetStageId;

      if (targetStageId === "Rejected") {
        newStatus = "REJECTED";
        newCurrentStageId = app.currentStageId;
      } else if (targetStageId === "Hired") {
        newStatus = "HIRED";
        newCurrentStageId = null;
      } else if (
        ["stage_8", "stage_9", "stage_10"].includes(targetStageId) ||
        (targetStageName && ["training", "induction", "pkwt"].some((n) => targetStageName.toLowerCase().includes(n)))
      ) {
        newStatus = "HIRED";
        newCurrentStageId = targetStageId;
      } else {
        newStatus = "ACTIVE";
        newCurrentStageId = targetStageId;
      }

      await prisma.application.update({
        where: { id: app.id },
        data: {
          currentStageId: newCurrentStageId,
          status: newStatus,
          history: {
            create: {
              stageId: targetStageId === "Rejected" || targetStageId === "Hired" ? undefined : targetStageId,
              stageName: targetStageId === "Rejected" ? "Rejected" : targetStageId === "Hired" ? "Hired" : targetStageName,
              note: note || `Lolos massal ke ${targetStageName}`,
            },
          },
        },
      });

      updatedCount++;
    }

    // Update headcount sync pada job yang terdampak
    for (const jId of Array.from(affectedJobIds)) {
      try {
        const [hiredCount, onSiteCount] = await Promise.all([
          prisma.application.count({ where: { jobId: jId, status: "HIRED", deletedAt: null } }),
          prisma.application.count({
            where: {
              jobId: jId,
              deletedAt: null,
              OR: [
                { currentStageId: "stage_10" },
                { contractMobilization: { mobilizationStatus: { in: ["ARRIVED_ON_SITE", "COMPLETED"] } } },
              ],
            },
          }),
        ]);
        await prisma.jobOpening.update({
          where: { id: jId },
          data: {
            headcountFulfilled: hiredCount,
            headcountOnSite: onSiteCount,
          },
        });
      } catch (e) {
        console.warn("Headcount sync warning for job", jId, e);
      }
    }

    revalidatePath("/dashboard/pipeline");
    for (const jId of Array.from(affectedJobIds)) {
      revalidatePath(`/dashboard/job-openings/${jId}`);
    }

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "BULK_STAGE_MOVED",
      entityType: "Application",
      metadata: {
        totalRequested: appIds.length,
        updatedCount,
        targetStageId,
        targetStageName,
        note: note || null,
        skippedCount: skippedErrors.length,
      },
    });

    return {
      success: true,
      data: {
        updatedCount,
        skippedCount: skippedErrors.length,
        errors: skippedErrors,
      },
    };
  } catch (error: any) {
    console.error("bulkAdvanceApplicationStage Error:", error);
    return { success: false, error: "Gagal memindahkan kandidat secara massal" };
  }
}

/**
 * Menolak banyak aplikasi kandidat sekaligus dengan alasan standar (Bulk Reject).
 */
export async function bulkRejectApplications(
  appIds: string[],
  rejectionReason: string
) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!Array.isArray(appIds) || appIds.length === 0) {
    return { success: false, error: "Pilih minimal 1 kandidat untuk ditolak." };
  }

  const reason = (rejectionReason || "").trim() || "Kualifikasi belum sesuai kebutuhan";

  try {
    const apps = await prisma.application.findMany({
      where: { id: { in: appIds }, deletedAt: null },
      select: { id: true, jobId: true, candidateProfileId: true },
    });

    if (apps.length === 0) {
      return { success: false, error: "Tidak ada aplikasi kandidat yang ditemukan." };
    }

    const affectedJobIds = new Set<string>();

    for (const app of apps) {
      affectedJobIds.add(app.jobId);
      await prisma.application.update({
        where: { id: app.id },
        data: {
          status: "REJECTED",
          history: {
            create: {
              stageName: "Rejected",
              note: `Ditolak massal: ${reason}`,
            },
          },
        },
      });
    }

    // Sync headcount pada job terdampak
    for (const jId of Array.from(affectedJobIds)) {
      try {
        const [hiredCount, onSiteCount] = await Promise.all([
          prisma.application.count({ where: { jobId: jId, status: "HIRED", deletedAt: null } }),
          prisma.application.count({
            where: {
              jobId: jId,
              deletedAt: null,
              OR: [
                { currentStageId: "stage_10" },
                { contractMobilization: { mobilizationStatus: { in: ["ARRIVED_ON_SITE", "COMPLETED"] } } },
              ],
            },
          }),
        ]);
        await prisma.jobOpening.update({
          where: { id: jId },
          data: {
            headcountFulfilled: hiredCount,
            headcountOnSite: onSiteCount,
          },
        });
      } catch (e) {
        console.warn("Headcount sync warning on reject:", e);
      }
    }

    revalidatePath("/dashboard/pipeline");
    for (const jId of Array.from(affectedJobIds)) {
      revalidatePath(`/dashboard/job-openings/${jId}`);
    }

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "BULK_REJECTED",
      entityType: "Application",
      metadata: {
        count: apps.length,
        reason,
        appIds,
      },
    });

    return { success: true, count: apps.length };
  } catch (error: any) {
    console.error("bulkRejectApplications Error:", error);
    return { success: false, error: "Gagal menolak kandidat secara massal" };
  }
}

/**
 * Menandai banyak profil kandidat sebagai Talent Pool (Bulk Add to Talent Pool).
 */
export async function bulkAddToTalentPool(candidateProfileIds: string[]) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!Array.isArray(candidateProfileIds) || candidateProfileIds.length === 0) {
    return { success: false, error: "Pilih minimal 1 kandidat." };
  }

  try {
    const res = await prisma.candidateProfile.updateMany({
      where: { id: { in: candidateProfileIds } },
      data: { isTalentPool: true },
    });

    revalidatePath("/dashboard/talent-pool");

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "BULK_TALENT_POOL_ADDED",
      entityType: "CandidateProfile",
      metadata: {
        count: res.count,
        candidateProfileIds,
      },
    });

    return { success: true, count: res.count };
  } catch (error: any) {
    console.error("bulkAddToTalentPool Error:", error);
    return { success: false, error: "Gagal memindahkan kandidat ke Talent Pool" };
  }
}

/**
 * Menugaskan banyak kandidat dari Talent Pool ke lowongan kerja aktif (Bulk Assign to Job).
 */
export async function bulkAssignCandidatesToJob(
  candidateProfileIds: string[],
  targetJobId: string
) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!Array.isArray(candidateProfileIds) || candidateProfileIds.length === 0) {
    return { success: false, error: "Pilih minimal 1 kandidat." };
  }

  if (!targetJobId) {
    return { success: false, error: "Lowongan tujuan wajib dipilih." };
  }

  try {
    const job = await prisma.jobOpening.findUnique({
      where: { id: targetJobId },
    });
    if (!job) {
      return { success: false, error: "Lowongan tujuan tidak ditemukan." };
    }

    let assignedCount = 0;
    let skippedCount = 0;

    for (const profileId of candidateProfileIds) {
      const existingApp = await prisma.application.findFirst({
        where: {
          jobId: targetJobId,
          candidateProfileId: profileId,
          deletedAt: null,
        },
      });

      if (existingApp) {
        skippedCount++;
        continue;
      }

      await prisma.application.create({
        data: {
          jobId: targetJobId,
          candidateProfileId: profileId,
          currentStageId: "stage_1",
          status: "ACTIVE",
          stageData: {
            bnspValidation: {
              isApproved: true,
              verifiedAt: new Date().toISOString(),
              notes: "Ditugaskan dari Talent Pool oleh recruiter",
            },
          },
          history: {
            create: {
              stageId: "stage_1",
              stageName: "CV Screening",
              note: `Ditugaskan dari Talent Pool oleh ${auth.user.name || auth.user.email}`,
            },
          },
          assessments: {
            create: {
              stageType: AssessmentStage.CV_SCREENING,
              result: AssessmentResult.PASSED,
              score: 100,
              feedback: "Ditugaskan langsung dari Talent Pool",
            },
          },
        },
      });

      assignedCount++;
    }

    revalidatePath("/dashboard/pipeline");
    revalidatePath(`/dashboard/job-openings/${targetJobId}`);
    revalidatePath("/dashboard/talent-pool");

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "BULK_ASSIGNED_TO_JOB",
      entityType: "JobOpening",
      entityId: targetJobId,
      metadata: {
        assignedCount,
        skippedCount,
        targetJobId,
      },
    });

    return { success: true, assignedCount, skippedCount };
  } catch (error: any) {
    console.error("bulkAssignCandidatesToJob Error:", error);
    return { success: false, error: "Gagal menugaskan kandidat ke lowongan." };
  }
}

/**
 * Import kandidat massal (Excel / CSV) dengan validasi NIK 16-digit, deduplikasi blind index (nikHash),
 * dan proteksi field-level encryption AES-256-GCM sesuai UU PDP.
 */
export async function bulkImportCandidates(
  jobId: string | null,
  candidates: BulkCandidateInput[]
) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { success: false, error: "Tidak ada data kandidat yang diberikan." };
  }

  if (candidates.length > 500) {
    return { success: false, error: "Maksimal import per batch adalah 500 kandidat." };
  }

  let job: any = null;
  if (jobId) {
    job = await prisma.jobOpening.findUnique({
      where: { id: jobId },
      select: { id: true, positionName: true, status: true },
    });
    if (!job) {
      return { success: false, error: "Lowongan tujuan tidak valid." };
    }
  }

  let createdCount = 0;
  let updatedCount = 0;
  let existingAppsCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i];
    const rowNum = i + 1;

    const rawNik = (row.nik || "").toString().trim().replace(/\D/g, "");
    const rawFullName = (row.fullName || "").toString().trim();

    if (!rawNik || rawNik.length !== 16) {
      errors.push(`Baris ${rowNum}: NIK "${row.nik || ""}" tidak valid (harus tepat 16 digit angka).`);
      continue;
    }

    if (!rawFullName || rawFullName.length < 2) {
      errors.push(`Baris ${rowNum}: Nama lengkap wajib diisi minimal 2 karakter.`);
      continue;
    }

    try {
      const nikHash = hashField(rawNik);
      const encryptedNik = encryptField(rawNik);
      const rawKk = (row.kk || "").toString().trim().replace(/\D/g, "");
      const encryptedKk = rawKk && rawKk.length === 16 ? encryptField(rawKk) : null;

      // Parse birth date
      let parsedBirthDate: Date | null = null;
      if (row.birthDate) {
        const d = new Date(row.birthDate);
        if (!isNaN(d.getTime())) {
          parsedBirthDate = d;
        }
      }

      // Format email
      const userEmail =
        (row.email || "").toString().trim() || `kandidat.${rawNik}@recruitment.dpp.co.id`;

      // Cek apakah profil kandidat sudah ada berdasarkan nikHash atau enkripsi
      let profile = await prisma.candidateProfile.findFirst({
        where: {
          OR: [
            ...(nikHash ? [{ nikHash }] : []),
            ...(encryptedNik ? [{ nik: encryptedNik }] : []),
            { nik: rawNik },
          ],
        },
        include: { user: true },
      });

      if (profile) {
        await prisma.candidateProfile.update({
          where: { id: profile.id },
          data: {
            nikHash: profile.nikHash || nikHash,
            nik: encryptedNik,
            kk: encryptedKk || profile.kk,
            birthPlace: row.birthPlace?.toString().trim() || profile.birthPlace,
            birthDate: parsedBirthDate || profile.birthDate,
            gender: row.gender?.toString().trim() || profile.gender,
            whatsapp: row.phone?.toString().trim() || profile.whatsapp,
            latestEducation: row.latestEducation?.toString().trim() || profile.latestEducation,
            educationInstitution: row.educationInstitution?.toString().trim() || profile.educationInstitution,
            domicileAddress: row.domicileAddress?.toString().trim() || profile.domicileAddress,
            isTalentPool: true,
            isProfileCompleted: true,
          },
        });

        if (profile.user && rawFullName) {
          await prisma.user.update({
            where: { id: profile.userId },
            data: { name: rawFullName },
          });
        }

        updatedCount++;
      } else {
        let user = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!user) {
          const defaultPasswordHash = await bcrypt.hash(rawNik, 10);
          user = await prisma.user.create({
            data: {
              name: rawFullName,
              email: userEmail,
              password: defaultPasswordHash,
              role: "CANDIDATE",
            },
          });
        }

        profile = await prisma.candidateProfile.create({
          data: {
            userId: user.id,
            nik: encryptedNik,
            nikHash,
            kk: encryptedKk,
            birthPlace: row.birthPlace?.toString().trim() || null,
            birthDate: parsedBirthDate,
            gender: row.gender?.toString().trim() || null,
            whatsapp: row.phone?.toString().trim() || null,
            latestEducation: row.latestEducation?.toString().trim() || null,
            educationInstitution: row.educationInstitution?.toString().trim() || null,
            domicileAddress: row.domicileAddress?.toString().trim() || null,
            isProfileCompleted: true,
            isTalentPool: true,
          },
          include: { user: true },
        });

        createdCount++;
      }

      // Jika jobId diberikan, daftarkan kandidat ke lowongan kerja pada Stage 1 (CV Screening)
      if (jobId && profile) {
        const existingApp = await prisma.application.findFirst({
          where: {
            jobId,
            candidateProfileId: profile.id,
            deletedAt: null,
          },
        });

        if (existingApp) {
          existingAppsCount++;
        } else {
          await prisma.application.create({
            data: {
              jobId,
              candidateProfileId: profile.id,
              currentStageId: "stage_1",
              status: "ACTIVE",
              stageData: {
                bnspValidation: {
                  isApproved: true,
                  verifiedAt: new Date().toISOString(),
                  notes: row.notes?.toString().trim() || "Import massal recruiter",
                },
              },
              history: {
                create: {
                  stageId: "stage_1",
                  stageName: "CV Screening",
                  note: `Diinput massal oleh recruiter (${auth.user.name || auth.user.email})`,
                },
              },
              assessments: {
                create: {
                  stageType: AssessmentStage.CV_SCREENING,
                  result: AssessmentResult.PASSED,
                  score: 100,
                  feedback: "Disetujui otomatis melalui impor massal berkas staf.",
                },
              },
            },
          });
        }
      }
    } catch (err: any) {
      console.error(`Import error row ${rowNum}:`, err);
      errors.push(`Baris ${rowNum} (${rawFullName}): ${err.message || "Gagal memproses data"}`);
    }
  }

  if (jobId) {
    revalidatePath(`/dashboard/job-openings/${jobId}`);
  }
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard/talent-pool");

  await recordAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "BULK_CANDIDATE_IMPORTED",
    entityType: jobId ? "JobOpening" : "CandidateProfile",
    entityId: jobId || undefined,
    metadata: {
      totalRows: candidates.length,
      createdCount,
      updatedCount,
      existingAppsCount,
      errorsCount: errors.length,
      jobId,
    },
  });

  return {
    success: true,
    data: {
      total: candidates.length,
      created: createdCount,
      updated: updatedCount,
      existingApps: existingAppsCount,
      errors,
    },
  };
}
