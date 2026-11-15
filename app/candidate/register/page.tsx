"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Kata sandi minimal harus 8 karakter.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Pendaftaran gagal. Periksa kembali email Anda.");
        setIsSubmitting(false);
        return;
      }

      // Auto login after register
      const res = await signIn("credentials", {
        redirect: false,
        email: email,
        password: password,
      });

      if (res?.error) {
        setErrorMsg("Pendaftaran berhasil namun login otomatis gagal. Silakan masuk secara manual.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      router.push("/candidate/jobs");
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat memproses registrasi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen flex items-center justify-center p-4 md:p-8 font-sans">
      <main className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10 space-y-6">
          {/* Top Bar: Navigasi Kembali & Logo DPP Space-Between */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
            </Link>

            <Link href="/" aria-label="Beranda PT Dian Pandu Pratama">
              <Image
                src="/images/branding/dpp-logo-new.png"
                alt="Logo PT Dian Pandu Pratama"
                width={140}
                height={60}
                className="h-8 sm:h-9 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight">
              Pendaftaran Akun Pelamar
            </h1>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1" htmlFor="email">
                Alamat Email Aktif
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama.anda@gmail.com"
                  className="w-full h-10 pl-9 pr-4 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1" htmlFor="password">
                Kata Sandi (Minimal 8 Karakter)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Buat kata sandi aman"
                  className="w-full h-10 pl-9 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1" htmlFor="confirmPassword">
                Ulangi Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Konfirmasi kata sandi"
                  className="w-full h-10 pl-9 pr-10 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C81E25]" /> Pelindungan Data Pribadi:
              </p>
              <p>
                Dengan mendaftar, data diri Anda diproteksi dengan enkripsi AES-256-GCM sesuai Undang-Undang PDP No. 27 Tahun 2022.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#C81E25] hover:bg-[#A8181E] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm focus:outline-hidden transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan Akun...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Sudah memiliki akun pelamar?{" "}
              <Link href="/login" className="font-bold text-[#D9232A] hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
