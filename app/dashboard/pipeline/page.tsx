export const dynamic = "force-dynamic";

import React from "react";
import prisma from "@/lib/prisma";
import PipelineClient from "./PipelineClient";

export default async function PipelinePage() {
  const [jobs, applications, customers, stages] = await Promise.all([
    prisma.jobOpening.findMany({
      where: { status: "ACTIVE" },
      include: {
        timeline: true
      }
    }),
    prisma.application.findMany({
      include: {
        candidateProfile: {
          include: {
            user: true
          }
        },
        job: true
      }
    }),
    prisma.masterCustomer.findMany(),
    prisma.masterPipelineStage.findMany({
      orderBy: { orderIndex: 'asc' }
    })
  ]);

  return <PipelineClient initialJobs={jobs} initialApplications={applications} customers={customers} stages={stages} />;
}
