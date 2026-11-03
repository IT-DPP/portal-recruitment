"use server";

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { requireRole, MAX_UPLOAD_SIZE_BYTES } from "@/lib/auth-guard";
import { isS3Configured, uploadBufferToS3 } from "@/lib/s3";
import { recordAuditLog } from "@/lib/audit-log";

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
};

export async function uploadBase64File(
  base64Data: string,
  filename: string
): Promise<{ success: boolean; url?: string; objectKey?: string; error?: string }> {
  try {
    const auth = await requireRole(["ADMIN", "RECRUITER", "CANDIDATE"]);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    if (!base64Data || !filename) {
      return { success: false, error: "Data file tidak lengkap" };
    }

    const mimeMatch = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    const detectedMime = mimeMatch?.[1]?.toLowerCase() || "";
    const mappedExt = ALLOWED_MIME_TO_EXT[detectedMime];

    if (!mappedExt) {
      return {
        success: false,
        error: "Tipe file tidak diizinkan. Hanya PDF, PNG, atau JPG yang diperbolehkan.",
      };
    }

    // Clean up base64 string
    const base64Content = base64Data.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    if (buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      return {
        success: false,
        error: "Ukuran file melebihi batas maksimal 5 MB.",
      };
    }

    const uniqueFilename = `${uuidv4()}${mappedExt}`;

    // Primary path (ADR-004): Store directly in Cloudflare R2 / S3 when configured
    if (isS3Configured()) {
      const namespace =
        auth.user.role === "CANDIDATE"
          ? `candidates/${auth.user.id}/uploads`
          : `staff-uploads/${auth.user.id}`;
      const objectKey = `${namespace}/${uniqueFilename}`;

      await uploadBufferToS3(objectKey, buffer, detectedMime);

      await recordAuditLog({
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: "DOCUMENT_UPLOADED",
        entityType: "S3Object",
        entityId: objectKey,
        metadata: {
          originalFilename: filename,
          mimeType: detectedMime,
          sizeBytes: buffer.byteLength,
          storage: "S3_R2",
        },
      });

      const protectedUrl = `/api/file?key=${encodeURIComponent(objectKey)}`;
      return { success: true, url: protectedUrl, objectKey };
    }

    // Local fallback only when S3/R2 env is not configured in local dev
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    return { success: true, url: `/uploads/${uniqueFilename}` };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Gagal mengunggah file" };
  }
}
