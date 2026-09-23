import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;
    
    const role = token?.role as string | undefined;

    // RBAC Logic
    // Dashboard is only for ADMIN or RECRUITER
    if (pathname.startsWith("/dashboard")) {
      if (role !== "ADMIN" && role !== "RECRUITER") {
        // If it's a candidate trying to access dashboard, redirect to candidate portal
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Candidate routes restriction (optional: maybe staff shouldn't access candidate apply pages directly)
    // If you want staff to be redirected from candidate pages to dashboard
    if (pathname.startsWith("/candidate") && pathname !== "/candidate/register") {
       if (role === "ADMIN" || role === "RECRUITER") {
         return NextResponse.redirect(new URL("/dashboard", req.url));
       }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  // Specify which routes are protected by the middleware
  // Adjust this according to what you want to protect.
  matcher: ["/dashboard/:path*", "/candidate/profile", "/candidate/applications"],
};
