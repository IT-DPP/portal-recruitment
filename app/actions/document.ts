"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 600): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isConnectionError =
        err?.code === "P1001" ||
        err?.code === "P1017" ||
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes("ECONNREFUSED") ||
        err?.message?.includes("ETIMEDOUT") ||
        err?.message?.includes("Connection lost") ||
        err?.message?.includes("Closed connection");

      if (attempt <= retries && isConnectionError) {
        console.warn(`[getDocumentGenerationData] Reconnecting to database (attempt ${attempt}/${retries})...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export type DocumentGenerationDataResult = {
  success: boolean;
  jobs?: any[];
  applications?: any[];
  customers?: any[];
  sites?: any[];
  stages?: any[];
  clinics?: any[];
  provinces?: any[];
  error?: string;
};

export async function getDocumentGenerationData(): Promise<DocumentGenerationDataResult> {
  try {
    return await withRetry(async () => {
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
          },
          orderBy: { applicationDate: "desc" },
        }),
        prisma.masterCustomer.findMany({
          orderBy: { name: "asc" },
        }),
        prisma.masterSite.findMany({
          include: {
            customer: true,
            city: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.masterPipelineStage.findMany({
          orderBy: { orderIndex: "asc" },
        }),
        prisma.masterClinic.findMany({
          include: { province: true },
          orderBy: { name: "asc" },
        }),
        prisma.masterProvince.findMany({
          orderBy: { name: "asc" },
        }),
      ]);

      // Format jobs with fallback position & location names
      const enrichedJobs = jobs.map((j) => ({
        ...j,
        posisi: j.positionName || j.position?.name || "-",
        customerName: j.customer?.name || "Perusahaan",
        location: j.site?.name || j.city?.name || "Site",
        noB1: j.noFormB1 || "-",
      }));

      return {
        success: true,
        jobs: enrichedJobs,
        applications,
        customers,
        sites,
        stages,
        clinics,
        provinces,
      };
    });
  } catch (error: any) {
    console.warn("getDocumentGenerationData database notice (fallback provided):", error?.message || error);
    return {
      success: false,
      error: "Gagal memuat data dokumen dari database: " + (error?.message || String(error)),
    };
  }
}

/**
 * Save candidate stage documentation data (Offering, BAST, or MCU details) to database
 */
export async function saveCandidateDocumentData(
  appId: string,
  docType: "offering" | "bast" | "mcu",
  data: Record<string, any>
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existingApp = await prisma.application.findUnique({
      where: { id: appId },
    });

    if (!existingApp) {
      return { success: false, error: "Lamaran (Application) tidak ditemukan." };
    }

    let existingStageData: Record<string, any> = {};
    if (existingApp.stageData) {
      try {
        existingStageData =
          typeof existingApp.stageData === "string"
            ? JSON.parse(existingApp.stageData)
            : existingApp.stageData;
      } catch (e) {
        existingStageData = {};
      }
    }

    // Merge document data
    const updatedStageData = {
      ...existingStageData,
      [docType]: {
        ...(existingStageData[docType] || {}),
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.name || session.user.email,
      },
    };

    const updatedApp = await prisma.application.update({
      where: { id: appId },
      data: {
        stageData: updatedStageData,
      },
      include: {
        candidateProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/generate-documents");
    revalidatePath("/dashboard/pipeline");
    revalidatePath(`/dashboard/job-openings/${updatedApp.jobId}`);

    return { success: true, data: updatedApp };
  } catch (error: any) {
    console.error("saveCandidateDocumentData Error:", error);
    return {
      success: false,
      error: "Gagal menyimpan data dokumen kandidat: " + (error?.message || String(error)),
    };
  }
}

/**
 * Batch save BAST table inputs to DB
 */
export async function batchSaveBastData(
  entries: { appId: string; data: Record<string, any> }[]
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    for (const item of entries) {
      const app = await prisma.application.findUnique({
        where: { id: item.appId },
      });

      if (app) {
        let currentStageData: any = {};
        if (app.stageData) {
          try {
            currentStageData =
              typeof app.stageData === "string"
                ? JSON.parse(app.stageData)
                : app.stageData;
          } catch {
            currentStageData = {};
          }
        }

        const merged = {
          ...currentStageData,
          bast: {
            ...(currentStageData.bast || {}),
            ...item.data,
            savedAt: new Date().toISOString(),
          },
        };

        await prisma.application.update({
          where: { id: item.appId },
          data: { stageData: merged },
        });
      }
    }

    revalidatePath("/dashboard/generate-documents");
    return { success: true };
  } catch (error: any) {
    console.error("batchSaveBastData Error:", error);
    return {
      success: false,
      error: "Gagal menyimpan batch data BAST: " + (error?.message || String(error)),
    };
  }
}
