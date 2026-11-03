import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireRole, isObjectKeyOwnedByUser } from "@/lib/auth-guard";
import { isS3Configured, uploadBufferToS3 } from "@/lib/s3";
import { recordAuditLog } from "@/lib/audit-log";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function PUT(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "RECRUITER", "CANDIDATE"]);
  if (!auth.authorized) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key || key.includes("..") || key.startsWith("/")) {
    return new NextResponse("Invalid object key", { status: 400 });
  }

  // Candidates may only upload inside their own namespace or applications folder
  if (
    auth.user.role === "CANDIDATE" &&
    !isObjectKeyOwnedByUser(key, auth.user.id) &&
    !key.startsWith("applications/")
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const contentType =
    request.headers.get("content-type") ||
    request.nextUrl.searchParams.get("type") ||
    "application/octet-stream";

  if (!ALLOWED_TYPES.has(contentType)) {
    return new NextResponse(`Unsupported content type: ${contentType}`, {
      status: 400,
    });
  }

  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return new NextResponse("File size exceeds 10MB limit", { status: 413 });
  }

  const buffer = Buffer.from(arrayBuffer);

  try {
    let storageBackend = "local";

    if (isS3Configured()) {
      await uploadBufferToS3(key, buffer, contentType);
      storageBackend = "s3-r2";
    } else {
      const targetPath = path.resolve(process.cwd(), "public", "uploads", key);
      const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
      if (!targetPath.startsWith(uploadsRoot + path.sep)) {
        return new NextResponse("Invalid file path", { status: 400 });
      }
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, buffer);
    }

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "DOCUMENT_UPLOADED",
      entityType: "StorageObject",
      entityId: key,
      metadata: {
        contentType,
        sizeBytes: buffer.length,
        storage: storageBackend,
      },
    });

    return NextResponse.json({
      success: true,
      objectKey: key,
      storage: storageBackend,
    });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return new NextResponse("Failed to store file", { status: 500 });
  }
}

