"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/auth-guard";
import { recordAuditLog } from "@/lib/audit-log";
import { encryptField, decryptField, hashField, normalizeCandidateProfile } from "@/lib/crypto";
import { v4 as uuidv4 } from "uuid";

export interface TalentPoolCandidateInput {
  fullName: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  religion?: string;
  maritalStatus?: string;
  nik?: string;
  kk?: string;
  email?: string;
  whatsapp?: string;
  emergencyContact?: string;
  domicileAddress?: string;
  currentAddress?: string;
  province?: string;
  city?: string;
  educationType?: string;
  latestEducation?: string;
  educationInstitution?: string;
  trainingCenterType?: string;
  trainingCenter?: string;
  fileCv?: any;
  fileIjazah?: any;
  fileKtp?: any;
  fileKk?: any;
  fileSertifikat?: any;
  filePhoto?: any;
}

/**
 * Mengecek apakah data profil kandidat sudah lengkap untuk melamar/ditugaskan ke lowongan.
 */
function checkProfileCompleteness(data: {
  fullName?: string | null;
  nik?: string | null;
  whatsapp?: string | null;
  birthDate?: Date | string | null;
  domicileAddress?: string | null;
  currentAddress?: string | null;
  latestEducation?: string | null;
}): boolean {
  const hasName = Boolean(data.fullName && data.fullName.trim().length > 0);
  const cleanNik = (data.nik || "").replace(/\D/g, "");
  const hasNik = cleanNik.length === 16;
  const hasWhatsapp = Boolean(data.whatsapp && data.whatsapp.trim().length > 0);
  const hasBirthDate = Boolean(data.birthDate);
  const hasAddress = Boolean(
    (data.domicileAddress && data.domicileAddress.trim().length > 0) ||
    (data.currentAddress && data.currentAddress.trim().length > 0)
  );
  const hasEducation = Boolean(data.latestEducation && data.latestEducation.trim().length > 0);

  return hasName && hasNik && hasWhatsapp && hasBirthDate && hasAddress && hasEducation;
}

/**
 * Helper untuk sinkronisasi dokumen upload ke tabel CandidateDocument
 */
async function syncCandidateDocuments(candidateProfileId: string, data: TalentPoolCandidateInput) {
  const docFields = [
    { key: "fileCv", type: "cv" },
    { key: "fileIjazah", type: "ijazah" },
    { key: "fileKtp", type: "ktp" },
    { key: "fileKk", type: "kk" },
    { key: "fileSertifikat", type: "sertifikat" },
    { key: "filePhoto", type: "photo" },
  ];

  for (const { key, type } of docFields) {
    const docData = (data as any)[key];
    if (docData && typeof docData === "object") {
      const fileUrl = docData.url || docData.fileUrl || (docData.base64 ? docData.base64 : "") || (docData.objectKey ? `/api/file?key=${encodeURIComponent(docData.objectKey)}` : "");
      const objectKey = docData.objectKey || `talent-pool/${candidateProfileId}/${type}-${uuidv4()}`;

      if (fileUrl) {
        // Hapus dokumen lama dengan tipe yang sama
        await prisma.candidateDocument.deleteMany({
          where: {
            candidateProfileId,
            documentType: type,
          },
        });

        // Simpan dokumen baru
        await prisma.candidateDocument.create({
          data: {
            candidateProfileId,
            documentType: type,
            fileUrl,
            objectKey,
            mimeType: docData.type || "application/pdf",
          },
        });
      }
    }
  }
}

/**
 * Menambahkan talent baru ke Talent Pool secara manual oleh recruiter/admin.
 * Memungkinkan penyimpanan data parsial/belum lengkap sebagai draf.
 */
export async function createTalentPoolCandidate(data: TalentPoolCandidateInput) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const cleanName = (data.fullName || "").trim();
    if (!cleanName) {
      return { success: false, error: "Nama lengkap kandidat wajib diisi." };
    }

    // Tangani Email (Jika kosong, generate placeholder internal unik)
    let candidateEmail = (data.email || "").trim().toLowerCase();
    if (candidateEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: candidateEmail },
      });
      if (existingUser) {
        return {
          success: false,
          error: `Email "${candidateEmail}" sudah digunakan oleh kandidat/pengguna lain. Gunakan email yang berbeda.`,
        };
      }
    } else {
      const uniqueSuffix = uuidv4().slice(0, 8);
      const sanitizedNameTag = cleanName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "talent";
      candidateEmail = `talent.${sanitizedNameTag}.${uniqueSuffix}@internal.talentpool`;
    }

    // Tangani NIK & UU PDP Encryption
    let encryptedNik: string | null = null;
    let nikHash: string | null = null;
    const rawNik = (data.nik || "").replace(/\D/g, "");

    if (rawNik.length > 0) {
      nikHash = hashField(rawNik);
      if (nikHash) {
        const duplicateNik = await prisma.candidateProfile.findUnique({
          where: { nikHash },
          include: { user: true },
        });
        if (duplicateNik) {
          return {
            success: false,
            error: `NIK "${rawNik}" sudah terdaftar pada kandidat "${duplicateNik.user?.name || "Lain"}".`,
          };
        }
      }
      encryptedNik = encryptField(rawNik);
    }

    // Tangani KK
    let encryptedKk: string | null = null;
    const rawKk = (data.kk || "").replace(/\D/g, "");
    if (rawKk.length > 0) {
      encryptedKk = encryptField(rawKk);
    }

    // Lookup Master Province & City
    let provinceId: string | null = null;
    let cityId: string | null = null;

    if (data.province) {
      const prov = await prisma.masterProvince.findFirst({
        where: {
          OR: [
            { id: data.province },
            { name: { equals: data.province, mode: "insensitive" } },
            { code: { equals: data.province, mode: "insensitive" } },
          ],
        },
      });
      if (prov) provinceId = prov.id;
    }

    if (data.city) {
      const c = await prisma.masterCity.findFirst({
        where: {
          OR: [
            { id: data.city },
            { name: { equals: data.city, mode: "insensitive" } },
            { code: { equals: data.city, mode: "insensitive" } },
          ],
          ...(provinceId ? { provinceId } : {}),
        },
      });
      if (c) cityId = c.id;
    }

    // Hitung status kelengkapan profil
    const isCompleted = checkProfileCompleteness({
      fullName: cleanName,
      nik: rawNik,
      whatsapp: data.whatsapp,
      birthDate: data.birthDate,
      domicileAddress: data.domicileAddress,
      currentAddress: data.currentAddress,
      latestEducation: data.latestEducation,
    });

    // Buat User dan CandidateProfile dalam satu transaksi database
    const newCandidate = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: cleanName,
          email: candidateEmail,
          role: "CANDIDATE",
        },
      });

      const profile = await tx.candidateProfile.create({
        data: {
          userId: user.id,
          nik: encryptedNik,
          nikHash,
          kk: encryptedKk,
          birthPlace: data.birthPlace || null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          gender: data.gender || null,
          religion: data.religion || null,
          maritalStatus: data.maritalStatus || null,
          whatsapp: data.whatsapp || null,
          emergencyContact: data.emergencyContact || null,
          domicileAddress: data.domicileAddress || null,
          currentAddress: data.currentAddress || null,
          provinceId,
          cityId,
          educationType: data.educationType || null,
          latestEducation: data.latestEducation || null,
          educationInstitution: data.educationInstitution || null,
          trainingCenterType: data.trainingCenterType || null,
          trainingCenterName: data.trainingCenter || null,
          isProfileCompleted: isCompleted,
          isTalentPool: true,
        },
      });

      return { user, profile };
    });

    // Simpan dokumen jika ada
    await syncCandidateDocuments(newCandidate.profile.id, data);

    // Audit log
    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "TALENT_CREATED",
      entityType: "CandidateProfile",
      entityId: newCandidate.profile.id,
      metadata: {
        candidateName: cleanName,
        isProfileCompleted: isCompleted,
      },
    });

    revalidatePath("/dashboard/talent-pool");

    return {
      success: true,
      data: {
        id: newCandidate.profile.id,
        isProfileCompleted: isCompleted,
      },
    };
  } catch (error: any) {
    console.error("createTalentPoolCandidate Error:", error);
    return {
      success: false,
      error: "Gagal menyimpan kandidat ke Talent Pool: " + (error?.message || String(error)),
    };
  }
}

/**
 * Mengambil detail profil kandidat dari Talent Pool berdasarkan ID untuk diedit.
 */
export async function getTalentPoolCandidateById(candidateProfileId: string) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        user: true,
        documents: true,
        province: true,
        city: true,
        applications: {
          include: {
            job: {
              include: { position: true },
            },
            currentStage: true,
          },
          orderBy: { applicationDate: "desc" },
          take: 1,
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Profil kandidat tidak ditemukan." };
    }

    const normalized = normalizeCandidateProfile(profile);

    return { success: true, data: normalized };
  } catch (error: any) {
    console.error("getTalentPoolCandidateById Error:", error);
    return { success: false, error: "Gagal mengambil data kandidat: " + (error?.message || String(error)) };
  }
}

/**
 * Memperbarui data profil kandidat yang sudah ada di Talent Pool.
 */
export async function updateTalentPoolCandidate(
  candidateProfileId: string,
  data: TalentPoolCandidateInput
) {
  const auth = await requireStaffSession();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const existing = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: { user: true },
    });

    if (!existing) {
      return { success: false, error: "Profil kandidat tidak ditemukan." };
    }

    const cleanName = (data.fullName || "").trim();
    if (!cleanName) {
      return { success: false, error: "Nama lengkap kandidat wajib diisi." };
    }

    // Cek Email jika diubah
    const candidateEmail = (data.email || "").trim().toLowerCase();
    if (candidateEmail && candidateEmail !== existing.user?.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: candidateEmail,
          id: { not: existing.userId },
        },
      });
      if (emailConflict) {
        return {
          success: false,
          error: `Email "${candidateEmail}" sudah digunakan oleh kandidat/pengguna lain.`,
        };
      }
    }

    // Tangani NIK
    const rawNik = (data.nik || "").replace(/\D/g, "");
    let encryptedNik = existing.nik;
    let nikHash = existing.nikHash;

    if (rawNik.length > 0) {
      const currentDecryptedNik = existing.nik ? decryptField(existing.nik) : "";
      if (rawNik !== currentDecryptedNik) {
        nikHash = hashField(rawNik);
        if (nikHash) {
          const duplicate = await prisma.candidateProfile.findFirst({
            where: {
              nikHash,
              id: { not: candidateProfileId },
            },
            include: { user: true },
          });
          if (duplicate) {
            return {
              success: false,
              error: `NIK "${rawNik}" sudah terdaftar pada kandidat "${duplicate.user?.name || "Lain"}".`,
            };
          }
        }
        encryptedNik = encryptField(rawNik);
      }
    } else {
      encryptedNik = null;
      nikHash = null;
    }

    // Tangani KK
    const rawKk = (data.kk || "").replace(/\D/g, "");
    let encryptedKk = existing.kk;
    if (rawKk.length > 0) {
      const currentDecryptedKk = existing.kk ? decryptField(existing.kk) : "";
      if (rawKk !== currentDecryptedKk) {
        encryptedKk = encryptField(rawKk);
      }
    } else {
      encryptedKk = null;
    }

    // Lookup Master Province & City
    let provinceId: string | null = null;
    let cityId: string | null = null;

    if (data.province) {
      const prov = await prisma.masterProvince.findFirst({
        where: {
          OR: [
            { id: data.province },
            { name: { equals: data.province, mode: "insensitive" } },
            { code: { equals: data.province, mode: "insensitive" } },
          ],
        },
      });
      if (prov) provinceId = prov.id;
    }

    if (data.city) {
      const c = await prisma.masterCity.findFirst({
        where: {
          OR: [
            { id: data.city },
            { name: { equals: data.city, mode: "insensitive" } },
            { code: { equals: data.city, mode: "insensitive" } },
          ],
          ...(provinceId ? { provinceId } : {}),
        },
      });
      if (c) cityId = c.id;
    }

    // Hitung status kelengkapan profil
    const isCompleted = checkProfileCompleteness({
      fullName: cleanName,
      nik: rawNik,
      whatsapp: data.whatsapp,
      birthDate: data.birthDate,
      domicileAddress: data.domicileAddress,
      currentAddress: data.currentAddress,
      latestEducation: data.latestEducation,
    });

    // Update dalam transaksi
    await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          name: cleanName,
          ...(candidateEmail ? { email: candidateEmail } : {}),
        },
      });

      // Update CandidateProfile
      await tx.candidateProfile.update({
        where: { id: candidateProfileId },
        data: {
          nik: encryptedNik,
          nikHash,
          kk: encryptedKk,
          birthPlace: data.birthPlace || null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          gender: data.gender || null,
          religion: data.religion || null,
          maritalStatus: data.maritalStatus || null,
          whatsapp: data.whatsapp || null,
          emergencyContact: data.emergencyContact || null,
          domicileAddress: data.domicileAddress || null,
          currentAddress: data.currentAddress || null,
          provinceId,
          cityId,
          educationType: data.educationType || null,
          latestEducation: data.latestEducation || null,
          educationInstitution: data.educationInstitution || null,
          trainingCenterType: data.trainingCenterType || null,
          trainingCenterName: data.trainingCenter || null,
          isProfileCompleted: isCompleted,
        },
      });
    });

    // Simpan dokumen jika ada
    await syncCandidateDocuments(candidateProfileId, data);

    // Audit log
    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "TALENT_UPDATED",
      entityType: "CandidateProfile",
      entityId: candidateProfileId,
      metadata: {
        candidateName: cleanName,
        isProfileCompleted: isCompleted,
      },
    });

    revalidatePath("/dashboard/talent-pool");

    return {
      success: true,
      data: {
        id: candidateProfileId,
        isProfileCompleted: isCompleted,
      },
    };
  } catch (error: any) {
    console.error("updateTalentPoolCandidate Error:", error);
    return {
      success: false,
      error: "Gagal memperbarui profil kandidat: " + (error?.message || String(error)),
    };
  }
}
