const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const apps = await prisma.application.findMany({ include: { currentStage: true } });
  console.log('Apps:', JSON.stringify(apps, null, 2));
  const jobs = await prisma.jobOpening.findMany({ include: { timeline: true } });
  console.log('Jobs:', JSON.stringify(jobs, null, 2));
}
main().finally(() => prisma.$disconnect());
