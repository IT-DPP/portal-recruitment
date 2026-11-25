export const dynamic = "force-dynamic";

import React from "react";
import prisma from "@/lib/prisma";
import { decryptField } from "@/lib/crypto";
import PipelineClient from "./PipelineClient";

import { ensureExtendedPipelineStages } from "@/app/actions/master-data";

export default async function PipelinePage() {
  try {
    await ensureExtendedPipelineStages();

    const allStages = await prisma.masterPipelineStage.findMany({
      orderBy: { orderIndex: 'asc' }
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

    const [jobs, applications, customers] = await Promise.all([
      prisma.jobOpening.findMany({
        where: { status: "ACTIVE" },
        include: {
          timeline: true
        }
      }),
      prisma.application.findMany({
        where: {
          OR: [
            { status: "ACTIVE" },
            { status: "HIRED", currentStageId: { in: postMcuStageIds } }
          ]
        },
        include: {
          candidateProfile: {
            include: {
              user: true,
              documents: true
            }
          },
          job: true
        }
      }),
      prisma.masterCustomer.findMany()
    ]);

    const sanitizedApplications = applications.map((app) => ({
      ...app,
      candidateProfile: app.candidateProfile
        ? {
            ...app.candidateProfile,
            nik: decryptField(app.candidateProfile.nik),
            kk: decryptField(app.candidateProfile.kk),
          }
        : null,
    }));

    return (
      <PipelineClient
        initialJobs={jobs}
        initialApplications={sanitizedApplications}
        customers={customers}
        stages={allStages}
      />
    );
  } catch (err: any) {
    console.error("PipelinePage Server Component Error:", err);
    return (
      <PipelineClient
        initialJobs={[]}
        initialApplications={[]}
        customers={[]}
        stages={[]}
        errorMessage={`Gagal memuat data pipeline dari database: ${err?.message || String(err)}`}
      />
    );
  }
}
