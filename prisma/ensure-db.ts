import "./load-env";
import { PrismaClient } from "@prisma/client";

async function main() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error("❌ DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
  }

  const parsed = new URL(rawUrl);
  const targetDb = parsed.pathname.replace(/^\//, "") || "recruitment_db";

  const adminUrlObj = new URL(rawUrl);
  adminUrlObj.pathname = "/postgres";

  const adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: adminUrlObj.toString(),
      },
    },
  });

  try {
    const rows = await adminPrisma.$queryRawUnsafe<Array<{ exists: number }>>(
      `SELECT 1 AS exists FROM pg_database WHERE datname = '${targetDb.replace(/'/g, "''")}'`
    );

    if (rows.length > 0) {
      console.log(`✅ Database "${targetDb}" sudah tersedia.`);
    } else {
      await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${targetDb.replace(/"/g, '""')}"`);
      console.log(`✅ Database "${targetDb}" berhasil dibuat!`);
    }
  } finally {
    await adminPrisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Gagal membuat/mengecek database:", err?.message || err);
  process.exit(1);
});
