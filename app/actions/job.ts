"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { JobOpeningInput, JobOpeningSchema } from "@/lib/validations/job";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getJobOpenings() {
  try {
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
    const jobs = await prisma.jobOpening.findMany({
      select: {
        id: true,
        noRegistrasi: true,
        positionName: true,
        position: { select: { name: true } },
        status: true,
        createdAt: true,
      }
    });

    const mappedJobs = jobs.map((j) => ({
      id: j.id,
      noRegistrasi: j.noRegistrasi,
      posisi: j.positionName || j.position?.name || "-",
      globalStatus: j.status === 'ACTIVE' ? 'Active' : j.status === 'CLOSED' ? 'Closed' : j.status,
      publishedDate: j.createdAt.toISOString()
    }));

    const apps = await prisma.application.findMany({
      include: {
        candidateProfile: {
          include: {
            user: { select: { name: true } }
          }
        },
        history: true
      }
    });

    const mappedApps = apps.map((a) => {
      let historyEvents = a.history.map((h) => ({
        stageId: h.stageId,
        stageName: h.stageName,
        date: h.date.toISOString(),
        note: h.note,
        isSchedule: false
      }));

      // Merge in scheduled dates from stageData
      if (a.stageData) {
        let sd: any = typeof a.stageData === "string" ? JSON.parse(a.stageData) : a.stageData;
        if (sd.hrInterview && sd.hrInterview.date) {
           historyEvents.push({
             stageId: 'stage_2',
             stageName: 'Interview HR (Scheduled)',
             date: sd.hrInterview.date,
             note: 'Jadwal Interview HR',
             isSchedule: true
           });
        }
        if (sd.userInterview && sd.userInterview.date) {
           historyEvents.push({
             stageId: 'stage_5',
             stageName: 'Interview User (Scheduled)',
             date: sd.userInterview.date,
             note: 'Jadwal Interview User',
             isSchedule: true
           });
        }
        if (sd.testSkill && sd.testSkill.date) {
           historyEvents.push({
             stageId: 'stage_4',
             stageName: 'Test Skill (Scheduled)',
             date: sd.testSkill.date,
             note: 'Jadwal Test Skill',
             isSchedule: true
           });
        }
      }

      return {
        id: a.id,
        jobId: a.jobId,
        candidateId: a.candidateProfileId,
        applicationDate: a.applicationDate.toISOString(),
        currentStage: a.currentStageId,
        history: historyEvents
      };
    });

    const mappedCandidates: any = {};
    apps.forEach((a) => {
      if (a.candidateProfile) {
        mappedCandidates[a.candidateProfileId] = {
          ...a.candidateProfile,
          fullName: a.candidateProfile.user?.name || "Unknown",
        };
      }
    });

    return { success: true, jobs: mappedJobs, applications: mappedApps, candidates: mappedCandidates };
  } catch (error: any) {
    console.error("getCalendarData Error:", error);
    return { success: false, error: "Gagal mengambil data kalender: " + (error?.message || String(error)) };
  }
}

export async function createJobOpening(data: JobOpeningInput) {
  try {
    const parsed = JobOpeningSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal: " + parsed.error.message };
    }

    let { positionId, departmentId, positionName, departmentName, ...restData } = parsed.data;

    if (positionId === "0" || !positionId) {
      positionId = null;
    }

    if (departmentId === "0" || !departmentId) {
      departmentId = null;
    }

    const result = await prisma.jobOpening.create({
      data: {
        ...restData,
        positionId,
        departmentId,
        positionName,
        departmentName,
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
    const job = await prisma.jobOpening.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!job) return { success: false, error: "Lowongan tidak ditemukan" };
    if (job.status !== "DRAFT") return { success: false, error: "Hanya lowongan Draft yang bisa dipublish" };

    const stages = await prisma.masterPipelineStage.findMany({ orderBy: { orderIndex: 'asc' } });
    
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

    const timelineData = stages.map(stage => {
      let slaDays = stage.slaDays;
      if (useSiteSla) {
        const specificSla = siteSlas.find(s => s.stageId === stage.id);
        if (specificSla) {
          slaDays = specificSla.slaDays;
        }
      }

      const deadlineDate = new Date(currentStartDate);
      deadlineDate.setDate(deadlineDate.getDate() + slaDays);

      const tData = {
        stageId: stage.id,
        status: "Pending",
        startDate: new Date(currentStartDate),
        deadlineDate: new Date(deadlineDate),
      };

      currentStartDate = new Date(deadlineDate); // next stage starts when this one ends

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

export async function getPublicJobById(id: string) {
  try {
    const job = await prisma.jobOpening.findFirst({
      where: { 
        id,
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
    const job = await prisma.jobOpening.update({
      where: { id: jobId },
      data: {
        status: "ACTIVE",
        publishedDate: new Date(),
      }
    });

    if (timelines && timelines.length > 0) {
      // Clear existing timelines if any (to be safe)
      await prisma.jobTimeline.deleteMany({
        where: { jobId }
      });

      await prisma.jobTimeline.createMany({
        data: timelines.map(t => ({
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: { job: true }
    });

    if (!app) {
      return { success: false, error: "Application not found" };
    }

    let targetStageName = targetStageId;
    if (targetStageId !== "Rejected" && targetStageId !== "Hired") {
      const stage = await prisma.masterPipelineStage.findUnique({
        where: { id: targetStageId }
      });
      targetStageName = stage?.name || targetStageId;
    }

    const updatedApp = await prisma.application.update({
      where: { id: appId },
      data: {
        currentStageId: targetStageId === "Rejected" || targetStageId === "Hired" ? app.currentStageId : targetStageId,
        status: targetStageId === "Rejected" ? "REJECTED" : targetStageId === "Hired" ? "HIRED" : "ACTIVE",
        history: {
          create: {
            stageId: targetStageId === "Rejected" || targetStageId === "Hired" ? undefined : targetStageId,
            stageName: targetStageId === "Rejected" ? "Rejected" : targetStageId === "Hired" ? "Hired" : targetStageName,
            note: note || `Moved to ${targetStageName}`,
          }
        }
      }
    });

    revalidatePath(`/dashboard/pipeline`);
    revalidatePath(`/dashboard/job-openings/${app.jobId}`);
    
    return { success: true, data: updatedApp };
  } catch (error) {
    console.error("updateApplicationStage Error:", error);
    return { success: false, error: "Gagal memindahkan kandidat" };
  }
}

export async function updateApplicationStageData(appId: string, stageData: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updatedApp = await prisma.application.update({
      where: { id: appId },
      data: {
        stageData
      }
    });

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

    // Check if already applied to this specific job
    const alreadyApplied = profile.applications.some(app => app.jobId === jobId);
    if (alreadyApplied) {
      return { success: false, error: "Anda sudah pernah melamar ke lowongan ini." };
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
        return type.includes("bnsp") || type.includes("sertifikat");
      });
      if (!hasBnsp) {
        return {
          success: false,
          error: "Lowongan ini mewajibkan sertifikasi kompetensi BNSP. Harap unggah sertifikat BNSP Anda di menu My Profile terlebih dahulu."
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized" };
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
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("blacklistCandidate Error:", error);
    return { success: false, error: "Gagal mem-blacklist kandidat" };
  }
}

export async function getBlacklistedCandidates() {
  try {
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
        nik: p.nik || "-",
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
