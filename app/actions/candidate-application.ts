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
              stageId: null,
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

    if (action === "MOVE_JOB") {
      if (!payload?.targetJobId) {
        return { success: false, error: "Lowongan tujuan harus dipilih." };
      }

      if (payload.targetJobId === application.jobId) {
        return { success: false, error: "Lowongan tujuan tidak boleh sama dengan lowongan saat ini." };
      }

      const targetJob = await prisma.jobOpening.findUnique({
        where: { id: payload.targetJobId },
        include: {
          position: true,
          customer: true,
          site: true,
          department: true,
        },
      });

      if (!targetJob) {
        return { success: false, error: "Lowongan tujuan tidak ditemukan." };
      }

      const targetJobTitle = targetJob.position?.name || targetJob.positionName || "Posisi Baru";
      const targetJobRegistrationNo = targetJob.noRegistrasi || "-";

      const updatedMoveProposal = {
        targetJobId: targetJob.id,
        targetJobTitle,
        targetJobRegistrationNo,
        targetCustomerName: targetJob.customer?.name || "-",
        targetSiteName: targetJob.site?.name || "-",
        targetDepartmentName: targetJob.department?.name || "-",
        targetOpenPositions: targetJob.jumlahPermintaan || 1,
        status: "PENDING",
        proposedAt: new Date().toISOString(),
        proposedBy: recruiterName,
        note: payload?.reason || "Recruiter menawarkan pengalihan lowongan kerja.",
      };

      const messages = Array.isArray(currentStageData.messages)
        ? [...currentStageData.messages]
        : [];

      messages.push({
        id: uuidv4(),
        sender: "RECRUITER",
        senderName: recruiterName,
        stage: application.currentStageId || "stage_6",
        text: `Tawaran Pemindahan Lowongan: Kami menawarkan Anda untuk dialihkan ke lowongan "${targetJobTitle}" (Ref: ${targetJobRegistrationNo}, ${targetJob.customer?.name || "-"} - ${targetJob.site?.name || "-"}). Silakan periksa rincian tawaran dan berikan konfirmasi persetujuan Anda melalui portal kandidat. Catatan: ${payload?.reason || "-"}`,
        date: new Date().toISOString(),
      });

      const updatedStageData = {
        ...currentStageData,
        moveProposal: updatedMoveProposal,
        messages,
      };

      await prisma.application.update({
        where: { id: appId },
        data: {
          stageData: updatedStageData,
          history: {
            create: {
              stageId: application.currentStageId || null,
              stageName: "Move Proposal Sent",
              note: `Recruiter mengajukan tawaran pindah ke ${targetJobTitle} (Ref: ${targetJobRegistrationNo})`,
            },
          },
        },
      });

      revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);
      revalidatePath(`/dashboard/job-openings/${application.jobId}`);
      revalidatePath("/dashboard/pipeline");
      revalidatePath("/candidate/history");

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

/**
 * Fetch active job openings for candidate move proposal with debounced search support
 */
export async function getActiveJobOpeningsForMove(excludeJobId?: string) {
  try {
    const jobs = await prisma.jobOpening.findMany({
      where: {
        status: "ACTIVE",
        ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
      },
      include: {
        position: true,
        customer: true,
        site: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: jobs.map((j) => ({
        id: j.id,
        noRegistrasi: j.noRegistrasi || "-",
        positionName: j.position?.name || j.positionName || "Posisi Umum",
        customerName: j.customer?.name || "-",
        siteName: j.site?.name || "-",
        departmentName: j.department?.name || "-",
        openPositions: j.jumlahPermintaan || 1,
      })),
    };
  } catch (err: any) {
    console.error("getActiveJobOpeningsForMove error:", err);
    return { success: false, error: err.message, data: [] };
  }
}

/**
 * Candidate decision on job move proposal (ACCEPT or DECLINE)
 */
export async function respondToJobMoveProposal(
  appId: string,
  decision: "ACCEPT" | "DECLINE",
  payload?: { reason?: string }
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
        candidateProfile: true,
      },
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

    const moveProposal = currentStageData.moveProposal;
    if (!moveProposal || moveProposal.status !== "PENDING") {
      return { success: false, error: "Tidak ada tawaran pemindahan lowongan yang sedang menunggu konfirmasi." };
    }

    const candidateName = auth.profile.user?.name || "Kandidat";

    if (decision === "ACCEPT") {
      const targetJobId = moveProposal.targetJobId;
      const targetJob = await prisma.jobOpening.findUnique({
        where: { id: targetJobId },
        include: {
          position: true,
          timeline: {
            include: { stage: true },
            orderBy: { stage: { orderIndex: "asc" } },
          },
        },
      });

      if (!targetJob) {
        return { success: false, error: "Lowongan tujuan sudah tidak aktif atau tidak ditemukan." };
      }

      const firstStage = targetJob.timeline?.[0]?.stage || await prisma.masterPipelineStage.findFirst({ orderBy: { orderIndex: "asc" } });

      const messages = Array.isArray(currentStageData.messages)
        ? [...currentStageData.messages]
        : [];

      messages.push({
        id: uuidv4(),
        sender: "CANDIDATE",
        senderName: candidateName,
        stage: application.currentStageId || "stage_6",
        text: `Saya menyetujui tawaran pemindahan proses seleksi ke lowongan "${moveProposal.targetJobTitle}".`,
        date: new Date().toISOString(),
      });

      const updatedOldStageData = {
        ...currentStageData,
        moveProposal: {
          ...moveProposal,
          status: "ACCEPTED",
          resolvedAt: new Date().toISOString(),
        },
        messages,
      };

      // 1. Mark previous application as WITHDRAWN so candidate can transition cleanly
      await prisma.application.update({
        where: { id: appId },
        data: {
          status: "WITHDRAWN",
          stageData: updatedOldStageData,
          history: {
            create: {
              stageId: null,
              stageName: "Transferred",
              note: `Lamaran dialihkan ke lowongan ${moveProposal.targetJobTitle} atas persetujuan kandidat.`,
            },
          },
        },
      });

      // 2. Create new active application for target job opening
      const prevJobTitle = application.job?.position?.name || application.job?.positionName || "Lowongan Sebelumnya";
      await prisma.application.create({
        data: {
          jobId: targetJobId,
          candidateProfileId: application.candidateProfileId,
          currentStageId: firstStage?.id || null,
          status: "ACTIVE",
          stageData: {
            transferredFrom: {
              previousApplicationId: application.id,
              previousJobId: application.jobId,
              previousJobTitle: prevJobTitle,
              transferredAt: new Date().toISOString(),
            },
            messages: [
              {
                id: uuidv4(),
                sender: "SYSTEM",
                senderName: "Sistem Rekrutmen",
                stage: firstStage?.id || "stage_1",
                text: `Lamaran dialihkan dari posisi "${prevJobTitle}" atas persetujuan kandidat. Anda memulai proses seleksi untuk lowongan ini dari tahap awal.`,
                date: new Date().toISOString(),
              },
            ],
          },
          history: {
            create: {
              stageId: firstStage?.id || null,
              stageName: firstStage?.name || "Administration",
              note: `Lamaran baru hasil pengalihan dari lowongan "${prevJobTitle}" atas persetujuan kandidat.`,
            },
          },
        },
      });

      revalidatePath("/candidate/history");
      revalidatePath("/candidate/past-applications");
      revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);
      revalidatePath(`/dashboard/job-openings/${targetJobId}`);
      revalidatePath(`/dashboard/job-openings/${application.jobId}`);
      revalidatePath("/dashboard/pipeline");

      return {
        success: true,
        message: `Pemindahan ke lowongan ${moveProposal.targetJobTitle} berhasil disetujui!`,
      };
    } else {
      // DECLINE
      const declineReason = payload?.reason?.trim() || "Kandidat tidak berminat dengan tawaran pemindahan lowongan ini.";
      const messages = Array.isArray(currentStageData.messages)
        ? [...currentStageData.messages]
        : [];

      messages.push({
        id: uuidv4(),
        sender: "CANDIDATE",
        senderName: candidateName,
        stage: application.currentStageId || "stage_6",
        text: `Saya menolak tawaran pemindahan ke lowongan "${moveProposal.targetJobTitle}". Alasan: ${declineReason}`,
        date: new Date().toISOString(),
      });

      const updatedOldStageData = {
        ...currentStageData,
        moveProposal: {
          ...moveProposal,
          status: "DECLINED",
          resolvedAt: new Date().toISOString(),
          candidateDeclineReason: declineReason,
        },
        messages,
      };

      await prisma.application.update({
        where: { id: appId },
        data: {
          stageData: updatedOldStageData,
          history: {
            create: {
              stageId: null,
              stageName: "Move Declined",
              note: `Kandidat menolak tawaran pemindahan lowongan (${moveProposal.targetJobTitle}). Alasan: ${declineReason}`,
            },
          },
        },
      });

      revalidatePath("/candidate/history");
      revalidatePath(`/dashboard/job-openings/${application.jobId}/verify/${application.candidateProfileId}`);
      revalidatePath(`/dashboard/job-openings/${application.jobId}`);
      revalidatePath("/dashboard/pipeline");

      return {
        success: true,
        message: "Penolakan tawaran pemindahan lowongan telah disampaikan ke tim rekrutmen.",
      };
    }
  } catch (error: any) {
    console.error("respondToJobMoveProposal error:", error);
    return {
      success: false,
      error: "Gagal memproses respon pemindahan lowongan: " + (error?.message || String(error)),
    };
  }
}

