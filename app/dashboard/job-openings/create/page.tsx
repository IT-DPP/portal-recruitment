export const dynamic = "force-dynamic";
import React from "react";
import prisma from "@/lib/prisma";
import JobCreateClient from "./JobCreateClient";

export default async function CreateJobPage() {
  const [customers, provinces, cities, sites, positions, departments] = await Promise.all([
    prisma.masterCustomer.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterProvince.findMany({
 orderBy: { name: 'asc' } }),
    prisma.masterCity.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterSite.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterPosition.findMany({ orderBy: { name: 'asc' } }),
    prisma.masterDepartment.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <JobCreateClient
      customers={customers}
      provinces={provinces}
      cities={cities}
      sites={sites}
      positions={positions}
      departments={departments}
    />
  );
}
