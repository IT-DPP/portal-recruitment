"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already authenticated, redirect to the correct dashboard based on role
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const userRole = (session.user as any)?.role;
      if (userRole === "ADMIN" || userRole === "RECRUITER") {
        router.push('/dashboard');
      } else {
        router.push('/candidate/jobs');
      }
    }
  }, [status, session, router]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMsg("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: identifier,
        password: password,
      });

      if (res?.error) {
        setErrorMsg("Invalid email or password");
        setIsAuthenticating(false);
      } else {
        // Fetch fresh session to check role
        const { getSession } = await import("next-auth/react");
        const freshSession = await getSession();
        const role = (freshSession?.user as any)?.role;
        
        if (role === "ADMIN" || role === "RECRUITER") {
          router.push("/dashboard");
        } else {
          router.push("/candidate/jobs");
        }
      }
    } catch (error) {
      setErrorMsg("An error occurred during login");
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    // We use default redirect. We can't conditionally set callbackUrl before login,
    // so we set it to /login. Then the useEffect will catch the authenticated status
    // and redirect correctly.
    await signIn("google", { callbackUrl: "/login" });
  };

  return (
    <div className="bg-surface-bright flex min-h-screen items-center justify-center p-4 md:p-0 relative overflow-hidden font-sans">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#00355f 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="hidden lg:block absolute -left-20 bottom-10 w-96 h-96 rounded-full bg-secondary-container blur-3xl opacity-40 z-0" />
      <div className="hidden lg:block absolute -right-20 top-10 w-80 h-80 rounded-full bg-primary-container blur-3xl opacity-20 z-0" />

      <main className="relative z-10 w-full max-w-[480px]">
        <div className="bg-surface-container-lowest border border-table-border rounded-lg shadow-sm p-8 md:p-12">
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-2xl font-bold text-on-surface">Sign In</h1>
            <p className="text-sm text-on-surface-variant mt-2 text-center">
              Welcome to the Recruitment Portal
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-table-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-container-lowest text-on-surface-variant">
                Or continue with credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleCredentialsLogin} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-on-surface-variant" />
                </div>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-table-border rounded-md text-sm shadow-sm placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-on-surface">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-on-surface-variant" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-table-border rounded-md text-sm shadow-sm placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-surface"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-on-surface-variant">
            Don't have an account?{" "}
            <a href="/candidate/register" className="font-medium text-primary hover:underline">
              Register here
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
