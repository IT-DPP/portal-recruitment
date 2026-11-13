"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { getPresignedUploadUrl, deleteS3Object, getPresignedDownloadUrl } from "@/lib/s3"
import { v4 as uuidv4 } from "uuid"
import { isObjectKeyOwnedByUser, validateUploadMetadata } from "@/lib/auth-guard"
import { encryptField, decryptField, hashField } from "@/lib/crypto"

export async function getCandidateProfile() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        documents: true,
        user: true,
        province: true,
        city: true,
        applications: {
          include: {
            currentStage: true,
            job: {
              include: {
                timeline: true,
                position: true,
                department: true,
                customer: true,
                site: true,
                city: true,
                province: true,
              }
            },
            history: {
              orderBy: { date: "asc" }
            }
          }
        },
      }
    })

    if (!profile) {
      return { success: true, data: { user: session.user } } // return just user data if no profile yet
    }

    // Dekripsi data PII sensitif kandidat (UU PDP)
    if (profile.nik) {
      profile.nik = decryptField(profile.nik);
    }
    if (profile.kk) {
      profile.kk = decryptField(profile.kk);
    }

    return { success: true, data: profile }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return { success: false, error: "Gagal mengambil data profil" }
  }
}

export async function saveCandidateProfile(data: any, isDraft: boolean) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized" }
  }

  const userId = (session.user as any).id;

  try {
    // Basic validation
    if (!isDraft) {
      const required = [
        "fullName", "birthPlace", "birthDate", "gender", "religion", 
        "maritalStatus", "nik", "kk", "whatsapp", "emergencyContact", 
        "domicileAddress", "currentAddress", "province", "city", 
        "educationType", "latestEducation", "educationInstitution"
      ]
      for (const field of required) {
        if (!data[field]) return { success: false, error: `Field ${field} wajib diisi` }
      }
    }

    // Update User table for fullName
    if (data.fullName) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.fullName }
      })
    }

    // Lookup provinceId and cityId
    let provinceId: string | null = null
    let cityId: string | null = null

    if (data.province) {
      const prov = await prisma.masterProvince.findFirst({
        where: {
          OR: [
            { id: data.province },
            { name: { equals: data.province, mode: "insensitive" } },
            { code: { equals: data.province, mode: "insensitive" } }
          ]
        }
      })
      if (prov) provinceId = prov.id
    }

    if (data.city) {
      const c = await prisma.masterCity.findFirst({
        where: {
          OR: [
            { id: data.city },
            { name: { equals: data.city, mode: "insensitive" } },
            { code: { equals: data.city, mode: "insensitive" } }
          ],
          ...(provinceId ? { provinceId } : {})
        }
      })
      if (c) cityId = c.id
    }

    // Enkripsi PII dan hitung Blind Index untuk NIK (UU PDP)
    let encryptedNik: string | null = null
    let nikHash: string | null = null
    let encryptedKk: string | null = null

    if (data.nik && data.nik.trim().length > 0) {
      const cleanNik = data.nik.trim()
      nikHash = hashField(cleanNik)

      // Cek apakah NIK ini sudah digunakan oleh akun lain
      if (nikHash) {
        const duplicate = await prisma.candidateProfile.findFirst({
          where: {
            nikHash,
            userId: { not: userId },
          },
          select: { id: true },
        })
        if (duplicate) {
          return { success: false, error: "Nomor Induk Kependudukan (NIK) sudah terdaftar pada akun lain." }
        }
      }

      encryptedNik = encryptField(cleanNik)
    }

    if (data.kk && data.kk.trim().length > 0) {
      encryptedKk = encryptField(data.kk.trim())
    }

    // Upsert CandidateProfile
    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
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
        educationType: data.educationType || null,
        latestEducation: data.latestEducation || null,
        educationInstitution: data.educationInstitution || null,
        trainingCenterType: data.trainingCenterType || null,
        trainingCenterName: data.trainingCenter || null,
        provinceId: provinceId || null,
        cityId: cityId || null,
        isProfileCompleted: !isDraft,
      },
      create: {
        userId,
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
        educationType: data.educationType || null,
        latestEducation: data.latestEducation || null,
        educationInstitution: data.educationInstitution || null,
        trainingCenterType: data.trainingCenterType || null,
        trainingCenterName: data.trainingCenter || null,
        provinceId: provinceId || null,
        cityId: cityId || null,
        isProfileCompleted: !isDraft,
      }
    })

    // Kembalikan NIK & KK dalam bentuk plaintext untuk respons client
    if (profile.nik) profile.nik = decryptField(profile.nik);
    if (profile.kk) profile.kk = decryptField(profile.kk);

    // Upsert Documents if provided (save documents metadata)
    const docTypes = ["cv", "ijazah", "ktp", "kk", "sertifikat", "photo"]
    for (const type of docTypes) {
      const docData = data[`file${type.charAt(0).toUpperCase() + type.slice(1)}`]
      if (docData && docData.objectKey) { // we expect { objectKey, fileUrl, name, type }
        const existingDoc = await prisma.candidateDocument.findFirst({
          where: { candidateProfileId: profile.id, documentType: type }
        })
        if (existingDoc) {
          if (existingDoc.objectKey && existingDoc.objectKey !== docData.objectKey) {
            try {
              await deleteS3Object(existingDoc.objectKey)
            } catch (e) {
              console.error("Failed to delete old S3 object:", e)
            }
          }
          await prisma.candidateDocument.update({
            where: { id: existingDoc.id },
            data: {
              fileUrl: docData.url || docData.fileUrl || docData.publicUrl || "",
              objectKey: docData.objectKey,
              mimeType: docData.type,
              sizeBytes: docData.sizeBytes,
            }
          })
        } else {
          await prisma.candidateDocument.create({
            data: {
              candidateProfileId: profile.id,
              documentType: type,
              fileUrl: docData.url || docData.fileUrl || docData.publicUrl || "",
              objectKey: docData.objectKey,
              mimeType: docData.type,
              sizeBytes: docData.sizeBytes,
            }
          })
        }
      }
    }

    revalidatePath("/candidate/profile")
    return { success: true, data: profile }
  } catch (error: any) {
    console.error("Error saving profile:", error)
    return { success: false, error: "Gagal menyimpan data profil: " + error.message }
  }
}

export async function getUploadUrl(fileName: string, contentType: string, folderPath?: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  if (!session || !session.user || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  const metaCheck = validateUploadMetadata(fileName, contentType);
  if (!metaCheck.valid) {
    return { success: false, error: metaCheck.error };
  }

  const extension = metaCheck.extension;
  const sanitizedFileName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  
  let basePath = `candidates/${userId}/profile`;
  if (folderPath) {
    const cleanFolder = folderPath.replace(/^\/+|\/+$/g, "");
    if (cleanFolder.includes("..")) {
      return { success: false, error: "Folder path tidak valid" };
    }
    // Candidates can only upload inside their own namespace or application stage folder
    if (
      userRole === "CANDIDATE" &&
      !cleanFolder.startsWith(`candidates/${userId}`) &&
      !cleanFolder.startsWith("applications/")
    ) {
      return { success: false, error: "Forbidden folder path" };
    }
    basePath = cleanFolder;
  }
  
  const objectKey = `${basePath}/${sanitizedFileName}-${uuidv4()}.${extension}`;

  try {
    const uploadUrl = `/api/file/upload?key=${encodeURIComponent(objectKey)}&type=${encodeURIComponent(contentType)}`;
    const publicUrl = `/api/file?key=${encodeURIComponent(objectKey)}`;
    return { success: true, uploadUrl, objectKey, publicUrl };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return { success: false, error: "Gagal generate upload URL" };
  }
}

export async function getPreviewUrl(objectKey: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined;
  const userRole = (session?.user as any)?.role as string | undefined;
  if (!session || !session.user || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  if (!objectKey || objectKey.includes("..")) {
    return { success: false, error: "Object key tidak valid" };
  }

  if (userRole === "CANDIDATE" && !isObjectKeyOwnedByUser(objectKey, userId)) {
    const docRecord = await prisma.candidateDocument.findFirst({
      where: {
        objectKey,
        candidateProfile: { userId },
      },
      select: { id: true },
    });
    if (!docRecord) {
      return { success: false, error: "Forbidden" };
    }
  }

  const url = `/api/file?key=${encodeURIComponent(objectKey)}`;
  return { success: true, url };
}

export async function deleteCandidateDocument(documentType: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !(session.user as any).id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: { documents: true }
    })
    
    if (!profile) return { success: false, error: "Profile not found" }

    const existingDoc = profile.documents.find(d => d.documentType === documentType)
    if (existingDoc) {
      if (existingDoc.objectKey) {
        try {
          await deleteS3Object(existingDoc.objectKey)
        } catch (e) {
          console.error("Failed to delete S3 object:", e)
        }
      }
      
      await prisma.candidateDocument.delete({
        where: { id: existingDoc.id }
      })
      
      revalidatePath("/candidate/profile")
      return { success: true }
    }
    
    return { success: true } // Already deleted/doesn't exist
  } catch (error) {
    console.error("Error deleting document:", error)
    return { success: false, error: "Gagal menghapus dokumen" }
  }
}
