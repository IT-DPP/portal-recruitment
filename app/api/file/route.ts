import { NextRequest, NextResponse } from "next/server";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("Missing file key", { status: 400 });
  }

  try {
    const url = await getPresignedDownloadUrl(key);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new NextResponse("Error generating URL", { status: 500 });
  }
}
