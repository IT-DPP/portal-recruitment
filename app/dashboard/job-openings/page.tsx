import React from "react";
import prisma from "@/lib/prisma";
import JobClient from "./JobClient";

export const dynamic = "force-dynamic";

export default async function JobOpeningsPage() {
  const [jobs, customers] = await Promise.all([
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
    prisma.masterCustomer.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return <JobClient initialData={jobs} customers={customers} />;
}
