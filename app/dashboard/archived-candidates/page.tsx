import React from "react";
import ArchivedCandidatesClient from "./ArchivedCandidatesClient";
import { getPaginatedArchivedCandidates } from "@/app/actions/job";

export const dynamic = "force-dynamic";

export default async function ArchivedCandidatesPage() {
  const result = await getPaginatedArchivedCandidates({ page: 1, limit: 10 });

  return (
    <ArchivedCandidatesClient
      initialApplications={result.success ? result.data : []}
      initialPositions={result.success ? result.allPositions : []}
      initialPagination={
        result.success
          ? result.pagination
          : { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
      }
    />
  );
}
