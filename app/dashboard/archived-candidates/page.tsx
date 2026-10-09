import React from "react";
import prisma from "@/lib/prisma";
import ArchivedCandidatesClient from "./ArchivedCandidatesClient";

export const dynamic = "force-dynamic";

export default async function ArchivedCandidatesPage() {
  const rejectedApps = await prisma.application.findMany({
    where: {
      status: "REJECTED"
    },
    include: {
      job: true,
      candidateProfile: {
        include: {
          user: true,
          documents: true
        }
      },
      history: true
    },
    orderBy: {
      applicationDate: "desc"
    }
  });

  const jobs = await prisma.jobOpening.findMany({
    where: {
      id: {
        in: rejectedApps.map(a => a.jobId)
      }
    },
    select: {
      id: true,
      positionName: true,
      position: true
    }
  });

  const mappedJobs = jobs.map(j => ({
    id: j.id,
    posisi: j.positionName || j.position?.name
  }));

  return <ArchivedCandidatesClient initialApplications={rejectedApps} initialJobs={mappedJobs} />;
}
