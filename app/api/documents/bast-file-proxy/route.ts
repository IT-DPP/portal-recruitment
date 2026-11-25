import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getS3ObjectBuffer } from "@/lib/s3";
import { decryptField } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const appId = searchParams.get("appId");
  const docType = searchParams.get("docType"); // 'candidate_cert' | 'recruiter_validation'

  if (!appId || !docType) {
    return new NextResponse("Missing appId or docType", { status: 400 });
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        candidateProfile: {
          include: {
            user: true,
            documents: true,
          },
        },
      },
    });

    if (!application) {
      return new NextResponse("Application not found", { status: 404 });
    }

    if (docType === "candidate_cert") {
      const docs = application.candidateProfile?.documents || [];
      // Find certificate or bnsp document
      const certDoc = docs.find((d) => {
        const t = (d.documentType || "").toLowerCase();
        return t.includes("sertifikat") || t.includes("bnsp");
      });

      if (!certDoc) {
        return new NextResponse(
          JSON.stringify({ error: "Sertifikat kandidat belum diunggah" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (certDoc.objectKey) {
        const s3Res = await getS3ObjectBuffer(certDoc.objectKey);
        if (s3Res && s3Res.buffer) {
          const extension = certDoc.mimeType?.includes("pdf") ? "pdf" : "jpg";
          const rawName = certDoc.objectKey.split("/").pop() || `sertifikat.${extension}`;
          return new Response(new Uint8Array(s3Res.buffer), {
            status: 200,
            headers: {
              "Content-Type": s3Res.contentType || certDoc.mimeType || "application/pdf",
              "Content-Disposition": `attachment; filename="${encodeURIComponent(rawName)}"`,
              "X-Original-Filename": encodeURIComponent(rawName),
            },
          });
        }
      }

      // Fallback: If certDoc has fileUrl and it's base64 or accessible via fetch
      if (certDoc.fileUrl) {
        if (certDoc.fileUrl.startsWith("data:")) {
          const parts = certDoc.fileUrl.split(",");
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
          const buffer = Buffer.from(parts[1], "base64");
          const rawNik = application.candidateProfile?.nik ? decryptField(application.candidateProfile.nik) : appId;
          const safeNik = (rawNik || appId).replace(/[^a-zA-Z0-9_\-]/g, "_");
          return new Response(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Content-Disposition": `attachment; filename="sertifikat_${safeNik}.pdf"`,
            },
          });
        }

        try {
          const fetchRes = await fetch(certDoc.fileUrl);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            const cType = fetchRes.headers.get("content-type") || "application/pdf";
            return new Response(new Uint8Array(arrayBuffer), {
              status: 200,
              headers: {
                "Content-Type": cType,
                "Content-Disposition": `attachment; filename="sertifikat.pdf"`,
              },
            });
          }
        } catch (fetchErr) {
          console.warn("Error fetching certDoc fileUrl:", fetchErr);
        }
      }

      return new NextResponse(
        JSON.stringify({ error: "File sertifikat tidak dapat diambil dari storage" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (docType === "recruiter_validation") {
      let stageData: any = {};
      try {
        stageData =
          typeof application.stageData === "string"
            ? JSON.parse(application.stageData)
            : application.stageData || {};
      } catch (e) {
        stageData = {};
      }

      const bnspVal = stageData.bnspValidation;
      const fileObj = bnspVal?.file;

      if (!fileObj) {
        return new NextResponse(
          JSON.stringify({ error: "Bukti validasi sertifikat belum diunggah recruiter" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check base64
      const fileDataStr = fileObj.base64 || fileObj.fileUrl || "";
      if (fileDataStr.startsWith("data:")) {
        const parts = fileDataStr.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : fileObj.type || "application/pdf";
        const buffer = Buffer.from(parts[1], "base64");
        const rawNik = application.candidateProfile?.nik ? decryptField(application.candidateProfile.nik) : appId;
        const safeNik = (rawNik || appId).replace(/[^a-zA-Z0-9_\-]/g, "_");
        const filename = fileObj.name || `validasi_${safeNik}.pdf`;

        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
            "X-Original-Filename": encodeURIComponent(filename),
          },
        });
      }

      // Check if fileObj has objectKey or fileUrl to S3
      if (fileObj.objectKey) {
        const s3Res = await getS3ObjectBuffer(fileObj.objectKey);
        if (s3Res && s3Res.buffer) {
          return new Response(new Uint8Array(s3Res.buffer), {
            status: 200,
            headers: {
              "Content-Type": s3Res.contentType || fileObj.type || "application/pdf",
              "Content-Disposition": `attachment; filename="${encodeURIComponent(fileObj.name || "validasi.pdf")}"`,
            },
          });
        }
      }

      if (fileDataStr.startsWith("http://") || fileDataStr.startsWith("https://")) {
        try {
          const fetchRes = await fetch(fileDataStr);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            const cType = fetchRes.headers.get("content-type") || fileObj.type || "application/pdf";
            return new Response(new Uint8Array(arrayBuffer), {
              status: 200,
              headers: {
                "Content-Type": cType,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(fileObj.name || "validasi.pdf")}"`,
              },
            });
          }
        } catch (fetchErr) {
          console.warn("Error fetching recruiter validation fileUrl:", fetchErr);
        }
      }

      return new NextResponse(
        JSON.stringify({ error: "File bukti validasi tidak dapat dimuat" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new NextResponse("Invalid docType parameter", { status: 400 });
  } catch (err: any) {
    console.error("bast-file-proxy error:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
