import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.masterDepartment.deleteMany({
    where: {
      name: {
        startsWith: 'Department',
        mode: 'insensitive'
      }
    }
  });
  console.log(`Deleted ${result.count} dummy departments.`);
}

main().finally(() => prisma.$disconnect());
