"use server";

import prisma from "@/lib/prisma";

export interface DashboardJob {
  id: string;
  noRegistrasi: string;
  posisi: string;
  siteId: string;
  jumlahPermintaan: number;
  globalStatus: string;
  priority: boolean;
  customerId: string;
  publishedDate?: string;
  tanggalMasuk?: string;
  timeline?: {
    id: string;
    stageId: string;
    status: string;
    startDate: string;
    deadlineDate: string;
    overdueNotes?: string;
  }[];
}

export interface DashboardApplication {
  id: string;
  jobId: string;
  candidateId: string;
  applicationDate: string;
  currentStage: string;
  history: {
    stageId: string;
    stageName: string;
    date: string;
    note: string;
  }[];
}

export interface DashboardSite {
  id: string;
  siteName: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DashboardCustomer {
  id: string;
  name: string;
}

export interface DashboardCandidate {
  id: string;
  fullName: string;
  province?: string;
  city?: string;
  trainingCenter?: string;
}

export interface DashboardInstitute {
  id: string;
  name: string;
  type: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  status?: string | null;
}

/**
 * Optimized endpoint / server action for Executive Dashboard
 * Executes parallel lean queries and aggregates relational data
 */
export async function getExecutiveDashboardData() {
  try {
    const [rawJobs, rawApps, rawSites, rawCustomers] = await Promise.all([
      prisma.jobOpening.findMany({
        select: {
          id: true,
          noRegistrasi: true,
          positionName: true,
          position: { select: { name: true } },
          siteId: true,
          jumlahPermintaan: true,
          status: true,
          isPriority: true,
          customerId: true,
          publishedDate: true,
          tanggalMasuk: true,
          createdAt: true,
          timeline: {
            select: {
              id: true,
              stageId: true,
              status: true,
              startDate: true,
              deadlineDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.application.findMany({
        select: {
          id: true,
          jobId: true,
          candidateProfileId: true,
          applicationDate: true,
          currentStageId: true,
          status: true,
          history: {
            select: {
              stageId: true,
              stageName: true,
              date: true,
              note: true,
            },
            orderBy: { date: "asc" },
          },
          candidateProfile: {
            select: {
              id: true,
              user: { select: { name: true } },
              province: { select: { name: true } },
              city: { select: { name: true } },
              trainingCenterName: true,
            },
          },
        },
        orderBy: { applicationDate: "desc" },
      }),
      prisma.masterSite.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.masterCustomer.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Map jobs to clean dashboard format
    const jobs: DashboardJob[] = rawJobs.map((j) => ({
      id: j.id,
      noRegistrasi: j.noRegistrasi,
      posisi: j.positionName || j.position?.name || "-",
      siteId: j.siteId,
      jumlahPermintaan: j.jumlahPermintaan,
      globalStatus:
        j.status === "ACTIVE"
          ? "Active"
          : j.status === "CLOSED"
          ? "Closed"
          : j.status,
      priority: j.isPriority,
      customerId: j.customerId,
      publishedDate: j.publishedDate
        ? j.publishedDate.toISOString()
        : j.createdAt.toISOString(),
      tanggalMasuk: j.tanggalMasuk.toISOString(),
      timeline: j.timeline.map((t) => ({
        id: t.stageId,
        stageId: t.stageId,
        status: t.status,
        startDate: t.startDate.toISOString(),
        deadlineDate: t.deadlineDate.toISOString(),
      })),
    }));

    // Map candidates dictionary
    const candidates: Record<string, DashboardCandidate> = {};

    // Map applications
    const applications: DashboardApplication[] = rawApps.map((a) => {
      if (a.candidateProfile) {
        candidates[a.candidateProfileId] = {
          id: a.candidateProfileId,
          fullName: a.candidateProfile.user?.name || "Unknown",
          province: a.candidateProfile.province?.name || "",
          city: a.candidateProfile.city?.name || "",
          trainingCenter: a.candidateProfile.trainingCenterName || "",
        };
      }

      // Map current stage: REJECTED -> "Rejected", HIRED -> "stage_7"
      let currentStage = a.currentStageId || "stage_1";
      if (a.status === "REJECTED") {
        currentStage = "Rejected";
      } else if (a.status === "HIRED") {
        currentStage = "stage_7";
      }

      return {
        id: a.id,
        jobId: a.jobId,
        candidateId: a.candidateProfileId,
        applicationDate: a.applicationDate.toISOString(),
        currentStage,
        history: a.history.map((h) => ({
          stageId:
            h.stageId ||
            (h.stageName === "Rejected"
              ? "Rejected"
              : h.stageName === "Hired"
              ? "stage_7"
              : "stage_1"),
          stageName: h.stageName,
          date: h.date.toISOString(),
          note: h.note || "",
        })),
      };
    });

    const sites: DashboardSite[] = rawSites.map((s) => ({
      id: s.id,
      siteName: s.name,
    }));

    const customers: DashboardCustomer[] = rawCustomers.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    return {
      success: true,
      data: {
        jobs,
        applications,
        sites,
        customers,
        candidates,
      },
    };
  } catch (error: any) {
    console.error("getExecutiveDashboardData Error:", error);
    return {
      success: false,
      error: "Gagal mengambil data Executive Dashboard: " + (error?.message || String(error)),
    };
  }
}

/**
 * Optimized endpoint / server action for GeoSource Dashboard
 * Fetches geographical locations of site operations and candidate source institutions
 */
export async function getGeoSourceDashboardData() {
  try {
    const [rawSites, rawInstitutes, rawJobs, rawApps] = await Promise.all([
      prisma.masterSite.findMany({
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.masterInstitute.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          city: true,
          province: true,
          status: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.jobOpening.findMany({
        select: {
          id: true,
          siteId: true,
          publishedDate: true,
          tanggalMasuk: true,
          createdAt: true,
        },
      }),
      prisma.application.findMany({
        select: {
          id: true,
          jobId: true,
          candidateProfileId: true,
          currentStageId: true,
          status: true,
          candidateProfile: {
            select: {
              id: true,
              user: { select: { name: true } },
              province: { select: { name: true } },
              city: { select: { name: true } },
              trainingCenterName: true,
            },
          },
        },
      }),
    ]);

    const candidates: Record<string, DashboardCandidate> = {};

    const applications = rawApps.map((a) => {
      if (a.candidateProfile) {
        candidates[a.candidateProfileId] = {
          id: a.candidateProfileId,
          fullName: a.candidateProfile.user?.name || "Unknown",
          province: a.candidateProfile.province?.name || "",
          city: a.candidateProfile.city?.name || "",
          trainingCenter: a.candidateProfile.trainingCenterName || "",
        };
      }

      let currentStage = a.currentStageId || "stage_1";
      if (a.status === "REJECTED") {
        currentStage = "Rejected";
      } else if (a.status === "HIRED") {
        currentStage = "stage_7";
      }

      return {
        id: a.id,
        jobId: a.jobId,
        candidateId: a.candidateProfileId,
        currentStage,
      };
    });

    const jobs = rawJobs.map((j) => ({
      id: j.id,
      siteId: j.siteId,
      publishedDate: j.publishedDate
        ? j.publishedDate.toISOString()
        : j.createdAt.toISOString(),
      tanggalMasuk: j.tanggalMasuk.toISOString(),
    }));

    const sites: DashboardSite[] = rawSites.map((s) => ({
      id: s.id,
      siteName: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
    }));

    const institutes: DashboardInstitute[] = rawInstitutes.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type || "LPK",
      address: i.address,
      city: i.city,
      province: i.province,
      status: i.status,
    }));

    return {
      success: true,
      data: {
        applications,
        candidates,
        jobs,
        sites,
        institutes,
      },
    };
  } catch (error: any) {
    console.error("getGeoSourceDashboardData Error:", error);
    return {
      success: false,
      error: "Gagal mengambil data GeoSource Dashboard: " + (error?.message || String(error)),
    };
  }
}
