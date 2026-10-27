export const dynamic = "force-dynamic";
import React from "react";
import prisma from "@/lib/prisma";
import JobEditClient from "./JobEditClient";
import { notFound } from "next/navigation";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  
  const [job, customers, provinces, cities, sites, positions, departments] = await Promise.all([
    prisma.jobOpening.findUnique({ where: { id: unwrappedParams.id } }),
    prisma.masterCustomer.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterProvince.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterCity.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterSite.findMany({
      include: {
        customer: true,
        province: true,
        city: true,
      },
      orderBy: { name: 'asc' }
    }),
    prisma.masterPosition.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterDepartment.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!job) {
    notFound();
  }

  return (
    <JobEditClient
      job={job}
      customers={customers}
      provinces={provinces}
      cities={cities}
      sites={sites}
      positions={positions}
      departments={departments}
    />
  );
}
