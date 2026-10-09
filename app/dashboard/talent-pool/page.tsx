import React from "react";
import prisma from "@/lib/prisma";
import TalentPoolClient from "./TalentPoolClient";

export const dynamic = "force-dynamic";

export default async function TalentPoolPage() {
  const candidates = await prisma.candidateProfile.findMany({
    include: {
      user: true,
      documents: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return <TalentPoolClient initialCandidates={candidates} />;
}
