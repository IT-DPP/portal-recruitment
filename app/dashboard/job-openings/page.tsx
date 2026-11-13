import React from "react";
import prisma from "@/lib/prisma";
import JobClient from "./JobClient";
import { getPaginatedJobOpenings } from "@/app/actions/job";

export const dynamic = "force-dynamic";

export default async function JobOpeningsPage() {
  const [jobResult, customers] = await Promise.all([
    getPaginatedJobOpenings({ page: 1, limit: 10 }),
    prisma.masterCustomer.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <JobClient
      initialData={jobResult.success ? jobResult.data : []}
      initialPagination={
        jobResult.success
          ? jobResult.pagination
          : { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
      }
      customers={customers}
    />
  );
}
