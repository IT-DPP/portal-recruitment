import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getObjectFromS3, isS3Configured } from "@/lib/s3";
import prisma from "@/lib/prisma";
import { requireRole, isObjectKeyOwnedByUser } from "@/lib/auth-guard";
import { recordAuditLog } from "@/lib/audit-log";
import {
  generateDummyAvatarSvg,
  generateDummyPdfBuffer,
} from "@/lib/dummy-file-generator";

function getMimeTypeFromKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "RECRUITER", "CANDIDATE", "USER"]);
  if (!auth.authorized) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");

  if (!key || key.includes("..") || key.startsWith("/")) {
    return new NextResponse("Invalid or missing file key", { status: 400 });
  }

  // Prevent IDOR (R-04): Candidates can only access their own files
  if (auth.user.role === "CANDIDATE" || auth.user.role === "USER") {
    let isOwner = isObjectKeyOwnedByUser(key, auth.user.id);

    if (!isOwner) {
      const docRecord = await prisma.candidateDocument.findFirst({
        where: {
          objectKey: key,
          candidateProfile: {
            userId: auth.user.id,
          },
        },
        select: { id: true },
      });
      isOwner = !!docRecord;
    }

    if (!isOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  try {
    const fileName = path.basename(key);

    // 1. Check remote S3 / Cloudflare R2 if configured
    if (isS3Configured()) {
      const r2Object = await getObjectFromS3(key);
      if (r2Object) {
        const mimeType = r2Object.contentType || getMimeTypeFromKey(key);

        await recordAuditLog({
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          action: "DOCUMENT_ACCESSED",
          entityType: "S3Object",
          entityId: key,
        });

        return new NextResponse(new Uint8Array(r2Object.buffer), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `inline; filename="${fileName}"`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    // 2. Check local disk storage (public/uploads/<key>)
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const localFilePath = path.resolve(uploadsRoot, key);
    if (
      localFilePath.startsWith(uploadsRoot + path.sep) &&
      fs.existsSync(localFilePath)
    ) {
      const buffer = await fs.promises.readFile(localFilePath);
      const mimeType = getMimeTypeFromKey(key);

      await recordAuditLog({
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "DOCUMENT_ACCESSED",
        entityType: "LocalObject",
        entityId: key,
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${fileName}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // 3. Built-in fallback for seeded dummy documents & candidate avatars
    const lowerKey = key.toLowerCase();
    const isImage =
      lowerKey.endsWith(".jpg") ||
      lowerKey.endsWith(".jpeg") ||
      lowerKey.endsWith(".png") ||
      lowerKey.endsWith(".webp");

    if (isImage) {
      const svg = generateDummyAvatarSvg(key);
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const pdfBuffer = generateDummyPdfBuffer(key);
    const pdfName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdfName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Error serving file", { status: 500 });
  }
}
