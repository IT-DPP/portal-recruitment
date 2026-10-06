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

export async function createJobOpening(data: JobOpeningInput) {
  try {
    const parsed = JobOpeningSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal: " + parsed.error.message };
    }

    const result = await prisma.jobOpening.create({
      data: parsed.data,
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

    // If DRAFT, allow editing all fields
    const updatedJob = await prisma.jobOpening.update({
      where: { id },
      data,
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
      include: { applications: true }
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
      }
    });

    // Option to also mark active apps as rejected could go here
    revalidatePath(`/dashboard/blacklist`);
    revalidatePath(`/dashboard/pipeline`);
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("blacklistCandidate Error:", error);
    return { success: false, error: "Gagal mem-blacklist kandidat" };
  }
}
