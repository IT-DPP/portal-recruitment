import { NextRequest, NextResponse } from "next/server";
import { getPresignedDownloadUrl } from "@/lib/s3";
import prisma from "@/lib/prisma";
import { requireRole, isObjectKeyOwnedByUser } from "@/lib/auth-guard";
import { recordAuditLog } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "RECRUITER", "CANDIDATE"]);
  if (!auth.authorized) {
    return new NextResponse(auth.error, { status: auth.status });
  }

  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");

  if (!key || key.includes("..")) {
    return new NextResponse("Invalid or missing file key", { status: 400 });
  }

  // Prevent IDOR (R-04): Candidates can only access their own files
  if (auth.user.role === "CANDIDATE") {
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
    const url = await getPresignedDownloadUrl(key);

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "DOCUMENT_ACCESSED",
      entityType: "S3Object",
      entityId: key,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new NextResponse("Error generating URL", { status: 500 });
  }
}
