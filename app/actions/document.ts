"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/auth-guard";
import { normalizeCandidateProfile } from "@/lib/crypto";

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
    const auth = await requireStaffSession();
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }
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
        applications: applications.map((app) => ({
          ...app,
          candidateProfile: normalizeCandidateProfile(app.candidateProfile),
        })),
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
