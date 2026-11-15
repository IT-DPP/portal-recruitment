import { PrismaClient } from "@prisma/client";
import { generateJobSlug } from "../lib/slug";

const prisma = new PrismaClient();

async function backfillSlugs() {
  console.log("=== MEMULAI BACKFILL SLUG LOWONGAN KERJA PT DPP ===");
  const jobs = await prisma.jobOpening.findMany({
    include: {
      position: true,
      customer: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Ditemukan ${jobs.length} data lowongan pekerjaan.`);

  const usedSlugs = new Set<string>();

  for (const job of jobs) {
    const positionName = job.positionName || job.position?.name || "posisi";
    const customerName = job.customer?.name || "dpp";
    let baseSlug = generateJobSlug(positionName, customerName);
    let candidateSlug = baseSlug;
    let counter = 2;

    while (usedSlugs.has(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    usedSlugs.add(candidateSlug);

    await prisma.jobOpening.update({
      where: { id: job.id },
      data: { slug: candidateSlug },
    });

    console.log(`[UPDATED] Job ID: ${job.id} -> Slug: /jobs/${candidateSlug}`);
  }

  console.log("=== BACKFILL SLUG SELESAI DENGAN SUKSES ===");
}

backfillSlugs()
  .catch((e) => {
    console.error("Backfill Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
