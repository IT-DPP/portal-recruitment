import prisma from "../lib/prisma";
import { decryptField, isEncrypted } from "../lib/crypto";

async function restorePlaintextNik() {
  console.log("==================================================================");
  console.log("MEMULAI RESTORASI DATA NIK & KK KE FORMAT ASLI (PLAINTEXT)");
  console.log("==================================================================");

  const profiles = await prisma.candidateProfile.findMany({
    select: {
      id: true,
      nik: true,
      kk: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  console.log(`Ditemukan ${profiles.length} profil kandidat di database.\n`);

  let restoredCount = 0;
  let alreadyPlainCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    let newNik = profile.nik;
    let newKk = profile.kk;
    let needsUpdate = false;

    if (profile.nik) {
      if (isEncrypted(profile.nik)) {
        try {
          newNik = decryptField(profile.nik);
          needsUpdate = true;
        } catch (err: any) {
          console.error(`[ERROR] Gagal mendekripsi NIK profil ID ${profile.id}:`, err.message);
          errorCount++;
        }
      } else {
        alreadyPlainCount++;
      }
    }

    if (profile.kk && isEncrypted(profile.kk)) {
      try {
        newKk = decryptField(profile.kk);
        needsUpdate = true;
      } catch (err: any) {
        console.error(`[ERROR] Gagal mendekripsi KK profil ID ${profile.id}:`, err.message);
        errorCount++;
      }
    }

    if (needsUpdate) {
      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: {
          nik: newNik,
          kk: newKk,
        },
      });
      restoredCount++;
      console.log(`[RESTORED] ID: ${profile.id} | Nama: ${profile.user?.name || "-"} | NIK: ${newNik}`);
    }
  }

  console.log("\n==================================================================");
  console.log(`HASIL RESTORASI:`);
  console.log(`- Berhasil dipulihkan ke Plaintext: ${restoredCount}`);
  console.log(`- Sudah berformat Plaintext: ${alreadyPlainCount}`);
  console.log(`- Gagal / Error: ${errorCount}`);
  console.log("==================================================================");
}

restorePlaintextNik()
  .catch((e) => {
    console.error("Fatal error during restorePlaintextNik:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
