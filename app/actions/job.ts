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
      },
    });
    if (!job) return { success: false, error: "Job tidak ditemukan" };
    return { success: true, data: job };
  } catch (error) {
    console.error("getJobById Error:", error);
    return { success: false, error: "Gagal mengambil data lowongan pekerjaan" };
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
