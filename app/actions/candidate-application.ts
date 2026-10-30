"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

interface FileAttachment {
  name: string;
  objectKey?: string;
  base64?: string;
  type?: string;
  sizeBytes?: number;
}

/**
 * Helper to get current authenticated candidate profile
 */
async function getAuthenticatedCandidate() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return { error: "Sesi Anda telah berakhir, silakan login kembali." };
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { user: true },
  });

  if (!profile) {
    return { error: "Profil kandidat tidak ditemukan." };
  }

  return { session, profile };
}

/**
 * Submit candidate's decision for Offering Letter (Accept with signed file, or Decline with reason)
 */
export async function submitOfferingResponse(
  appId: string,
  decision: "ACCEPTED" | "DECLINED",
  payload: {
    signedFile?: FileAttachment;
    note?: string;
  }
) {
  try {
    const auth = await getAuthenticatedCandidate();
    if ("error" in auth) {
      return { success: false, error: auth.error };
    }

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        job: {
          include: {
            position: true,
          },
        },
      },
    });

    if (!application) {
      return { success: false, error: "Lamaran tidak ditemukan." };
    }

    if (application.candidateProfileId !== auth.profile.id) {
      return { success: false, error: "Anda tidak memiliki akses ke lamaran ini." };
    }

    // Parse current stageData safely
    let currentStageData: Record<string, any> = {};
    if (application.stageData) {
      try {
        currentStageData =
          typeof application.stageData === "string"
            ? JSON.parse(application.stageData)
            : application.stageData;
      } catch {
        currentStageData = {};
      }
    }

    const currentOffering = currentStageData.offeringLetter || {};
    const messages = Array.isArray(currentStageData.messages)
      ? [...currentStageData.messages]
      : [];

    const candidateName = auth.profile.user?.name || "Kandidat";

    if (decision === "ACCEPTED") {
      if (!payload.signedFile || (!payload.signedFile.base64 && !payload.signedFile.objectKey)) {
        return {
          success: false,
          error: "Harap unggah dokumen Offering Letter yang telah ditandatangani.",
        };
      }

      // Validate file extension/MIME
      const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      const fileType = (payload.signedFile.type || "").toLowerCase();
      const fileName = (payload.signedFile.name || "").toLowerCase();
      const isAllowedExt = /\.(pdf|png|jpg|jpeg)$/i.test(fileName);

      if (!isAllowedExt && !allowedMimes.includes(fileType)) {
        return {
          success: false,
          error: "Format berkas tidak didukung. Harap unggah berkas bertipe PDF, PNG, JPG, atau JPEG.",
        };
      }

      // Max size check: 5MB
      if (payload.signedFile.sizeBytes && payload.signedFile.sizeBytes > 5 * 1024 * 1024) {
        return {
          success: false,
          error: "Ukuran berkas melebihi batas maksimum 5MB.",
        };
      }

      const signedAt = new Date().toISOString();
      const updatedOffering = {
        ...currentOffering,
        candidateResponse: {
          status: "ACCEPTED",
          signedAt,
          signedFile: payload.signedFile,
          note: payload.note || "Kandidat menyetujui penawaran.",
        },
      };

      messages.push({
        id: uuidv4(),
        sender: "CANDIDATE",
        senderName: candidateName,
        stage: application.currentStageId || "stage_6",
        text: `[Offering Letter Diterima]: Saya telah menyetujui penawaran kerja dan mengunggah berkas Offering Letter bertandatangan (${payload.signedFile.name}). ${payload.note ? `Catatan: ${payload.note}` : ""}`,
        date: signedAt,
      });

      const updatedStageData = {
        ...currentStageData,
        offeringLetter: updatedOffering,
        messages,
      };

      await prisma.application.update({
        where: { id: appId },
        data: {
          stageData: updatedStageData,
          history: {
            create: {
              stageId: application.currentStageId,
              stageName: "Offering Letter",
              note: `Kandidat menandatangani & menyetujui Offering Letter (${payload.signedFile.name})`,
            },
          },
        },
      });

      revalidatePath("/candidate/history");
      revalidatePath("/candidate/past-applications");
      revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);
      revalidatePath("/dashboard/pipeline");

      return {
        success: true,
        message: "Dokumen Offering Letter bertandatangan berhasil dikirim. Terima kasih atas konfirmasi Anda!",
      };
    } else {
      // DECLINED
      const note = (payload.note || "").trim();
      if (!note || note.length < 15) {
        return {
          success: false,
          error: "Harap berikan alasan penolakan secara jelas (minimal 15 karakter).",
        };
      }

      const declinedAt = new Date().toISOString();
      const updatedOffering = {
        ...currentOffering,
        candidateResponse: {
          status: "DECLINED_REVIEW_REQUIRED",
          declinedAt,
          note,
        },
      };

      messages.push({
        id: uuidv4(),
        sender: "CANDIDATE",
        senderName: candidateName,
        stage: application.currentStageId || "stage_6",
        text: `[Penolakan Penawaran]: ${note}`,
        date: declinedAt,
      });

      const updatedStageData = {
        ...currentStageData,
        offeringLetter: updatedOffering,
        messages,
      };

      await prisma.application.update({
        where: { id: appId },
        data: {
          stageData: updatedStageData,
          history: {
            create: {
              stageId: application.currentStageId,
              stageName: "Offering Letter",
              note: `Kandidat menolak tawaran. Alasan: ${note}`,
            },
          },
        },
      });

      revalidatePath("/candidate/history");
      revalidatePath("/candidate/past-applications");
      revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);
      revalidatePath("/dashboard/pipeline");

      return {
        success: true,
        message: "Pemberitahuan penolakan telah dikirimkan ke pihak recruiter untuk ditinjau.",
      };
    }
  } catch (error: any) {
    console.error("submitOfferingResponse error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat memproses respon penawaran: " + (error?.message || String(error)),
    };
  }
}

/**
 * Upload candidate proof of MCU attendance or test slip
 */
export async function uploadCandidateMcuProof(
  appId: string,
  proofFile: FileAttachment,
  notes?: string
) {
  try {
    const auth = await getAuthenticatedCandidate();
    if ("error" in auth) {
      return { success: false, error: auth.error };
    }

    const application = await prisma.application.findUnique({
      where: { id: appId },
    });

    if (!application) {
      return { success: false, error: "Lamaran tidak ditemukan." };
    }

    if (application.candidateProfileId !== auth.profile.id) {
      return { success: false, error: "Anda tidak memiliki akses ke lamaran ini." };
    }

    let currentStageData: Record<string, any> = {};
    if (application.stageData) {
      try {
        currentStageData =
          typeof application.stageData === "string"
            ? JSON.parse(application.stageData)
            : application.stageData;
      } catch {
        currentStageData = {};
      }
    }

    const mcuData = currentStageData.mcu || {};
    const messages = Array.isArray(currentStageData.messages)
      ? [...currentStageData.messages]
      : [];

    const uploadedAt = new Date().toISOString();
    const candidateName = auth.profile.user?.name || "Kandidat";

    const updatedMcu = {
      ...mcuData,
      candidateProof: {
        file: proofFile,
        uploadedAt,
        notes: notes || "",
      },
    };

    messages.push({
      id: uuidv4(),
      sender: "CANDIDATE",
      senderName: candidateName,
      stage: application.currentStageId || "stage_7",
      text: `[Bukti MCU]: Saya telah mengunggah bukti pelaksanaan/kwitansi MCU (${proofFile.name}). ${notes ? `Catatan: ${notes}` : ""}`,
      date: uploadedAt,
    });

    const updatedStageData = {
      ...currentStageData,
      mcu: updatedMcu,
      messages,
    };

    await prisma.application.update({
      where: { id: appId },
      data: {
        stageData: updatedStageData,
        history: {
          create: {
            stageId: application.currentStageId,
            stageName: "MCU",
            note: `Kandidat mengunggah bukti pelaksanaan MCU (${proofFile.name})`,
          },
        },
      },
    });

    revalidatePath("/candidate/history");
    revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);

    return {
      success: true,
      message: "Bukti pelaksanaan MCU berhasil diunggah.",
    };
  } catch (error: any) {
    console.error("uploadCandidateMcuProof error:", error);
    return {
      success: false,
      error: "Gagal mengunggah bukti MCU: " + (error?.message || String(error)),
    };
  }
}

/**
 * Send a message / reply from candidate to recruiter for a specific application
 */
export async function sendCandidateApplicationMessage(appId: string, text: string) {
  try {
    const auth = await getAuthenticatedCandidate();
    if ("error" in auth) {
      return { success: false, error: auth.error };
    }

    const messageText = (text || "").trim();
    if (!messageText) {
      return { success: false, error: "Pesan tidak boleh kosong." };
    }

    const application = await prisma.application.findUnique({
      where: { id: appId },
    });

    if (!application) {
      return { success: false, error: "Lamaran tidak ditemukan." };
    }

    if (application.candidateProfileId !== auth.profile.id) {
      return { success: false, error: "Akses ditolak." };
    }

    let currentStageData: Record<string, any> = {};
    if (application.stageData) {
      try {
        currentStageData =
          typeof application.stageData === "string"
            ? JSON.parse(application.stageData)
            : application.stageData;
      } catch {
        currentStageData = {};
      }
    }

    const messages = Array.isArray(currentStageData.messages)
      ? [...currentStageData.messages]
      : [];

    const candidateName = auth.profile.user?.name || "Kandidat";

    messages.push({
      id: uuidv4(),
      sender: "CANDIDATE",
      senderName: candidateName,
      stage: application.currentStageId || "",
      text: messageText,
      date: new Date().toISOString(),
    });

    const updatedStageData = {
      ...currentStageData,
      messages,
    };

    await prisma.application.update({
      where: { id: appId },
      data: { stageData: updatedStageData },
    });

    revalidatePath("/candidate/history");
    revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);

    return { success: true };
  } catch (error: any) {
    console.error("sendCandidateApplicationMessage error:", error);
    return {
      success: false,
      error: "Gagal mengirim pesan: " + (error?.message || String(error)),
    };
  }
}

/**
 * Recruiter actions when candidate has DECLINED_REVIEW_REQUIRED
 */
export async function resolveOfferDeclined(
  appId: string,
  action: "ACCEPT_DECLINE" | "MOVE_JOB",
  payload?: { reason?: string; targetJobId?: string }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "RECRUITER")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: appId },
    });

    if (!application) {
      return { success: false, error: "Lamaran tidak ditemukan." };
    }

    let currentStageData: Record<string, any> = {};
    if (application.stageData) {
      try {
        currentStageData =
          typeof application.stageData === "string"
            ? JSON.parse(application.stageData)
            : application.stageData;
      } catch {
        currentStageData = {};
      }
    }

    const recruiterName = session.user.name || "Recruiter";

    if (action === "ACCEPT_DECLINE") {
      const updatedOffering = {
        ...(currentStageData.offeringLetter || {}),
        candidateResponse: {
          ...(currentStageData.offeringLetter?.candidateResponse || {}),
          status: "REJECTED_FINAL",
          resolvedAt: new Date().toISOString(),
          resolvedBy: recruiterName,
          resolutionNote: payload?.reason || "Penolakan offering diterima oleh recruiter.",
        },
      };

      const messages = Array.isArray(currentStageData.messages)
        ? [...currentStageData.messages]
        : [];

      messages.push({
        id: uuidv4(),
        sender: "RECRUITER",
        senderName: recruiterName,
        stage: application.currentStageId || "stage_6",
        text: `Penolakan penawaran Anda telah kami terima dan proses. Terima kasih atas partisipasi Anda dalam proses seleksi ini.`,
        date: new Date().toISOString(),
      });

      const updatedStageData = {
        ...currentStageData,
        offeringLetter: updatedOffering,
        messages,
      };

      await prisma.application.update({
        where: { id: appId },
        data: {
          status: "REJECTED",
          stageData: updatedStageData,
          history: {
            create: {
              stageId: "Rejected",
              stageName: "Rejected",
              note: payload?.reason || "Kandidat menolak penawaran kerja (Diterima oleh recruiter)",
            },
          },
        },
      });

      revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);
      revalidatePath(`/dashboard/job-openings/${application.jobId}`);
      revalidatePath("/dashboard/pipeline");
      revalidatePath("/candidate/history");
      revalidatePath("/candidate/past-applications");

      return { success: true };
    }

    return { success: false, error: "Action tidak dikenal." };
  } catch (error: any) {
    console.error("resolveOfferDeclined error:", error);
    return {
      success: false,
      error: "Gagal memproses penolakan tawaran: " + (error?.message || String(error)),
    };
  }
}

