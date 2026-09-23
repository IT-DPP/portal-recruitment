import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding essential data...');

  const hashedPassword = await bcrypt.hash('password', 10);
  
  // Seed Superadmin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  // Seed Master Pipeline Stages
  const stages = [
    { name: 'CV Screening', orderIndex: 1, slaDays: 3 },
    { name: 'Interview HR', orderIndex: 2, slaDays: 5 },
    { name: 'Skill Test', orderIndex: 3, slaDays: 7 },
    { name: 'Interview User', orderIndex: 4, slaDays: 5 },
    { name: 'Offering', orderIndex: 5, slaDays: 3 },
    { name: 'MCU', orderIndex: 6, slaDays: 5 },
  ];

  for (const stage of stages) {
    const existing = await prisma.masterPipelineStage.findFirst({
      where: { name: stage.name }
    });
    if (!existing) {
      await prisma.masterPipelineStage.create({ data: stage });
      console.log(`Created stage: ${stage.name}`);
    }
  }

  console.log('Seeding essential data finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
