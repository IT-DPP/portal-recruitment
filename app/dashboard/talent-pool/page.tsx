import React from "react";
import TalentPoolClient from "./TalentPoolClient";
import { getPaginatedTalentPool } from "@/app/actions/job";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TalentPoolPage() {
  const [result, activeJobs] = await Promise.all([
    getPaginatedTalentPool({ page: 1, limit: 10 }),
    prisma.jobOpening.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, positionName: true, noRegistrasi: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <TalentPoolClient
      initialCandidates={result.success ? result.data : []}
      initialPagination={
        result.success
          ? result.pagination
          : { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
      }
      activeJobs={activeJobs}
    />
  );
}
