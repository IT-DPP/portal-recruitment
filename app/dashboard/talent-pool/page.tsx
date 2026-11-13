import React from "react";
import TalentPoolClient from "./TalentPoolClient";
import { getPaginatedTalentPool } from "@/app/actions/job";

export const dynamic = "force-dynamic";

export default async function TalentPoolPage() {
  const result = await getPaginatedTalentPool({ page: 1, limit: 10 });

  return (
    <TalentPoolClient
      initialCandidates={result.success ? result.data : []}
      initialPagination={
        result.success
          ? result.pagination
          : { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
      }
    />
  );
}
