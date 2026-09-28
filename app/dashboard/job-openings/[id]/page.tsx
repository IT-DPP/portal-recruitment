import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await prisma.jobOpening.findUnique({
    where: { id },
    include: {
      position: true,
      department: true,
      customer: true,
      city: true,
      province: true,
      site: true,
      timeline: {
        include: {
          stage: true
        }
      }
    },
  });

  if (!job) {
    notFound();
  }

  const [sites, customers, provinces, cities, pipelineStages, siteSlas] = await Promise.all([
    prisma.masterSite.findMany({ orderBy: { name: "asc" } }),
    prisma.masterCustomer.findMany({ orderBy: { name: "asc" } }),
    prisma.masterProvince.findMany({ orderBy: { name: "asc" } }),
    prisma.masterCity.findMany({ orderBy: { name: "asc" } }),
    prisma.masterPipelineStage.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.siteSla.findMany({ where: { siteId: job.siteId } })
  ]);

  return (
    <JobDetailClient
      initialJob={job}
      sites={sites}
      customers={customers}
      provinces={provinces}
      cities={cities}
      pipelineStages={pipelineStages}
      siteSlas={siteSlas}
    />
  );
}
