import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isCandidatePortalEnabled, isPublicJobsEnabled } from "@/lib/feature-flags";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const candidatePortalEnabled = isCandidatePortalEnabled();
  const publicJobsEnabled = isPublicJobsEnabled();

  // 1. Feature Flag Gate: Candidate Portal (/candidate/*)
  if (pathname.startsWith("/candidate")) {
    if (!candidatePortalEnabled) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Public auth pages inside candidate portal when flag is enabled
    if (pathname === "/candidate/login" || pathname === "/candidate/register") {
      return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL("/candidate/login", req.url));
    }

    const role = token.role as string | undefined;
    if (role === "ADMIN" || role === "RECRUITER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // 2. Feature Flag Gate: Public Job Listings (/ and /jobs/*)
  if (pathname === "/" || pathname.startsWith("/jobs")) {
    if (!publicJobsEnabled) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      const role = token?.role as string | undefined;
      if (role === "ADMIN" || role === "RECRUITER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 3. RBAC Gate: Staff Dashboard (/dashboard/*)
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string | undefined;
    if (role !== "ADMIN" && role !== "RECRUITER") {
      const fallbackUrl = candidatePortalEnabled ? "/" : "/login";
      return NextResponse.redirect(new URL(fallbackUrl, req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/jobs/:path*",
    "/dashboard/:path*",
    "/candidate/:path*",
  ],
};
