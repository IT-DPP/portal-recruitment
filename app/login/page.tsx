"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Lock, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, Building2, HardHat, CheckCircle2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function mapAuthErrorMessage(errorCode: string | null): string {
  if (!errorCode) return "";
  switch (errorCode) {
    case "OAuthSignin":
    case "OAuthCallback":
    case "Configuration":
      return "Login Google gagal: Pastikan GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET sudah diisi di .env dan Redirect URI sudah terdaftar.";
    case "Callback":
    case "OAuthCreateAccount":
      return "Gagal menyimpan sesi ke database. Pastikan koneksi DATABASE_URL PostgreSQL sudah aktif.";
    case "AccessDenied":
      return "Akses ditolak untuk akun ini.";
    case "CredentialsSignin":
      return "Email atau kata sandi tidak sesuai.";
    default:
      return errorCode;
  }
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const queryError = searchParams.get("error");
    if (queryError) {
      setErrorMsg(mapAuthErrorMessage(queryError));
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      const userRole = (session.user as any)?.role;
      if (userRole === "ADMIN" || userRole === "RECRUITER") {
        router.push("/dashboard");
      } else {
        router.push("/candidate/jobs");
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
        setErrorMsg(mapAuthErrorMessage(res.error));
        setIsAuthenticating(false);
      } else {
        const { getSession } = await import("next-auth/react");
        const freshSession = await getSession();
        const role = (freshSession?.user as any)?.role;

        if (role === "ADMIN" || role === "RECRUITER") {
          router.push("/dashboard");
        } else {
          router.push("/candidate/jobs");
        }
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat menghubungi server autentikasi.");
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    await signIn("google", { callbackUrl: "/login" });
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
      {/* Left Brand Panel (DPP Corporate Navy & Industrial Imagery) */}
      <div className="md:col-span-5 bg-linear-to-b from-[#0A2540] via-[#0D2E4F] to-[#12365C] p-8 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Background Image Accent */}
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay">
          <Image
            src="/images/branding/welder-specialist.jpg"
            alt="Welder Background"
            fill
            className="object-cover"
          />
        </div>

        <div className="relative z-10 space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
          </Link>

          <div>
            <div className="mb-4">
              <Image
                src="/images/branding/dpp-logo-white-text.png"
                alt="Logo PT Dian Pandu Pratama"
                width={190}
                height={82}
                className="h-11 w-auto object-contain"
                unoptimized
                priority
              />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              PT DIAN PANDU PRATAMA
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Job &amp; Labour Supply • Heavy Equipment Product Support
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-amber-400" /> Job & Labour Supply
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Penyedia tenaga kerja terampil tersertifikasi BNSP & K3 untuk sektor tambang dan alat berat.
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-xs space-y-1">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> Mitra Industri Terkemuka
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                PATRIA, United Tractors, PAMA, KPC, Berau Coal, TRUST, Triatra.
              </p>
            </div>
          </div>
        </div>

        {/* Security Tag */}
        <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex items-center gap-2 text-[11px] text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#C81E25] shrink-0" />
          <span>Sistem aman terproteksi enkripsi UU PDP No. 27 Tahun 2022.</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Selamat Datang di Portal Karir DPP
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Masuk untuk mengelola proses rekrutmen staf atau mengecek status lamaran pekerjaan Anda.
          </p>
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 mb-5 transition-colors shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          Masuk dengan Akun Google
        </button>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400">Atau masuk dengan email akun</span>
          </div>
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 bg-white"
                placeholder="nama@perusahaan.com atau email kandidat"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 bg-white"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#C81E25] hover:bg-[#A8181E] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#C81E25] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Memverifikasi...
              </>
            ) : (
              "Masuk ke Portal"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Belum memiliki akun pelamar?{" "}
          <Link href="/candidate/register" className="font-bold text-[#D9232A] hover:underline">
            Daftar Karir Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-slate-100 flex min-h-screen items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <Suspense fallback={<div className="text-primary text-xs">Memuat formulir masuk...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
