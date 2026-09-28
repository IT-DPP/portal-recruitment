import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDefaultId() {
  try {
    // Upsert MasterPosition ID "0"
    await prisma.masterPosition.upsert({
      where: { id: "0" },
      update: {},
      create: {
        id: "0",
        code: "CUST-POS-0",
        name: "Custom / Data Baru"
      }
    });
    console.log("Seeded MasterPosition ID 0");

    // Upsert MasterDepartment ID "0"
    await prisma.masterDepartment.upsert({
      where: { id: "0" },
      update: {},
      create: {
        id: "0",
        code: "CUST-DEPT-0",
        name: "Custom / Data Baru"
      }
    });
    console.log("Seeded MasterDepartment ID 0");

  } catch (error) {
    console.error("Error seeding default IDs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDefaultId();
