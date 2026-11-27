import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getS3ObjectBuffer } from "@/lib/s3";
import { decryptField } from "@/lib/crypto";
import JSZip from "jszip";

const TYPE_MAPPING: Record<string, { prefix: string; label: string }> = {
  ktp: { prefix: "01", label: "KTP" },
  kk: { prefix: "02", label: "Kartu_Keluarga" },
  "kartu keluarga": { prefix: "02", label: "Kartu_Keluarga" },
  cv: { prefix: "03", label: "Curriculum_Vitae" },
  ijazah: { prefix: "04", label: "Ijazah_Terakhir" },
  photo: { prefix: "05", label: "Pas_Foto" },
  "pas foto": { prefix: "05", label: "Pas_Foto" },
  sertifikat: { prefix: "06", label: "Sertifikat" },
  "sertifikat bnsp": { prefix: "06", label: "Sertifikat_BNSP" },
  bnsp: { prefix: "06", label: "Sertifikat_BNSP" },
};

function getFileExtension(doc: { mimeType?: string | null; objectKey?: string | null; fileUrl?: string | null }): string {
  if (doc.mimeType) {
    const mime = doc.mimeType.toLowerCase();
    if (mime.includes("pdf")) return ".pdf";
    if (mime.includes("png")) return ".png";
    if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
    if (mime.includes("webp")) return ".webp";
  }
  const key = doc.objectKey || doc.fileUrl || "";
  const match = key.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  if (match && match[1]) {
    return `.${match[1].toLowerCase()}`;
  }
  return ".pdf";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized. Harap login terlebih dahulu." }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN" && userRole !== "RECRUITER") {
      return NextResponse.json(
        { message: "Akses ditolak. Hanya recruiter atau admin yang dapat mengunduh dokumen kandidat." },
        { status: 403 }
      );
    }

    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ message: "Candidate ID diperlukan." }, { status: 400 });
    }

    // Cari CandidateProfile berdasarkan id atau userId
    let profile = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      include: {
        documents: true,
        user: true,
      },
    });

    if (!profile) {
      profile = await prisma.candidateProfile.findUnique({
        where: { userId: candidateId },
        include: {
          documents: true,
          user: true,
        },
      });
    }

    if (!profile) {
      return NextResponse.json({ message: "Profil kandidat tidak ditemukan." }, { status: 404 });
    }

    const documents = profile.documents || [];
    if (documents.length === 0) {
      return NextResponse.json(
        { message: "Kandidat ini belum memiliki dokumen pokok yang diunggah." },
        { status: 404 }
      );
    }

    const candidateName = profile.user?.name || "Kandidat";
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const decryptedNik = (profile.nik ? decryptField(profile.nik) : null) || "NoNIK";
    const cleanNik = decryptedNik.replace(/[^a-zA-Z0-9]/g, "");
    const dateStr = new Date().toISOString().split("T")[0];
    const zipFileName = `Dokumen_${sanitizedName}_${cleanNik}_${dateStr}.zip`;

    const zip = new JSZip();
    const manifestLines: string[] = [
      "============================================================",
      "ARSIP DOKUMEN POKOK KANDIDAT",
      "============================================================",
      `Nama Kandidat : ${candidateName}`,
      `NIK           : ${decryptedNik}`,
      `Email         : ${profile.user?.email || "-"}`,
      `Waktu Ekspor  : ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`,
      "============================================================",
      "DAFTAR BERKAS TERLAMPIR:",
    ];

    let validFilesCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docTypeLower = (doc.documentType || "").toLowerCase().trim();
      const typeInfo = TYPE_MAPPING[docTypeLower] || {
        prefix: String(i + 1).padStart(2, "0"),
        label: (doc.documentType || "Dokumen").replace(/[^a-zA-Z0-9]/g, "_"),
      };

      const ext = getFileExtension(doc);
      const fileName = `${typeInfo.prefix}_${typeInfo.label}_${sanitizedName}${ext}`;

      let fileBuffer: Buffer | null = null;

      // 1. Ambil dari S3 object buffer
      if (doc.objectKey) {
        try {
          const s3Res = await getS3ObjectBuffer(doc.objectKey);
          if (s3Res?.buffer) {
            fileBuffer = s3Res.buffer;
          }
        } catch (s3Err) {
          console.warn(`[ZIP] Gagal ambil S3 buffer untuk key ${doc.objectKey}:`, s3Err);
        }
      }

      // 2. Fallback jika base64
      if (!fileBuffer && doc.fileUrl?.startsWith("data:")) {
        try {
          const base64Data = doc.fileUrl.split(",")[1];
          if (base64Data) {
            fileBuffer = Buffer.from(base64Data, "base64");
          }
        } catch (baseErr) {
          console.warn(`[ZIP] Gagal parsing base64 untuk doc ${doc.id}:`, baseErr);
        }
      }

      // 3. Fallback jika URL HTTP eksternal
      if (!fileBuffer && doc.fileUrl && (doc.fileUrl.startsWith("http://") || doc.fileUrl.startsWith("https://"))) {
        try {
          const response = await fetch(doc.fileUrl);
          if (response.ok) {
            const arrBuffer = await response.arrayBuffer();
            fileBuffer = Buffer.from(arrBuffer);
          }
        } catch (fetchErr) {
          console.warn(`[ZIP] Gagal fetch fileUrl ${doc.fileUrl}:`, fetchErr);
        }
      }

      if (fileBuffer) {
        zip.file(fileName, fileBuffer);
        validFilesCount++;
        manifestLines.push(`[OK] ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
      } else {
        manifestLines.push(`[GAGAL] ${fileName} - Berkas tidak dapat ditemukan di penyimpanan.`);
      }
    }

    if (validFilesCount === 0) {
      return NextResponse.json(
        { message: "Semua berkas dokumen kandidat tidak dapat ditemukan di server penyimpanan." },
        { status: 500 }
      );
    }

    zip.file("README_MANIFEST.txt", manifestLines.join("\n"));

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFileName}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error generating candidate documents zip:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal saat membuat arsip ZIP dokumen: " + errMessage },
      { status: 500 }
    );
  }
}

