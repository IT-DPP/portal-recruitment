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

  // 4. API Gate: Global authentication & RBAC for API endpoints
  if (pathname.startsWith("/api")) {
    // Whitelisted public API endpoints
    if (
      pathname.startsWith("/api/auth") ||
      pathname === "/api/health"
    ) {
      return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Sesi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const role = token.role as string | undefined;

    // Super Admin only endpoints
    if (pathname.startsWith("/api/users") || pathname.startsWith("/api/audit-logs")) {
      if (role !== "ADMIN") {
        return NextResponse.json(
          { message: "Forbidden: Operasi ini memerlukan hak akses Administrator." },
          { status: 403 }
        );
      }
    }

    // Staff only endpoints (batch zip archives, bast file proxy)
    if (
      pathname.startsWith("/api/candidates") ||
      pathname.startsWith("/api/documents")
    ) {
      if (role !== "ADMIN" && role !== "RECRUITER") {
        return NextResponse.json(
          { message: "Forbidden: Hanya staf rekrutmen yang dapat mengakses rute ini." },
          { status: 403 }
        );
      }
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
    "/api/:path*",
  ],
};
