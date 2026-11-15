export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, UserPlus, ArrowLeft, Building2, ShieldCheck, HardHat, Wrench, CheckCircle2 } from "lucide-react";
import { getPublicJobs } from "@/app/actions/job";
import { getProvinces, getDepartments } from "@/app/actions/master-data";
import PublicJobsClient from "./PublicJobsClient";

export const metadata = {
  title: "Lowongan Pekerjaan | PT Dian Pandu Pratama (DPP)",
  description: "Daftar peluang karir resmi PT Dian Pandu Pratama untuk sektor pertambangan dan manufaktur alat berat.",
};

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const province = typeof sp.province === "string" ? sp.province : undefined;
  const department = typeof sp.department === "string" ? sp.department : undefined;

  const [jobsRes, provincesRes, deptsRes] = await Promise.all([
    getPublicJobs(q, province, undefined, department),
    getProvinces(),
    getDepartments(),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center shrink-0"
            aria-label="Beranda PT Dian Pandu Pratama"
          >
            <Image
              src="/images/branding/dpp-logo-new.png"
              alt="Logo PT Dian Pandu Pratama"
              width={200}
              height={86}
              className="h-10 sm:h-11 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </Link>
            <Link
              href="/candidate/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Daftar Karir
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#C81E25] hover:bg-[#A8181E] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-white" />
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner with Full Manpower Background */}
      <section className="relative text-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-zinc-950">
        {/* Full Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/branding/manpower.png"
            alt="DPP Manpower Formation"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Subtle multi-layer gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/75 to-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-zinc-200 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#C81E25]" />
            Labor &amp; Job Supply • Penempatan Nasional
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
            Peluang Karir Terbuka PT Dian Pandu Pratama
          </h1>
          <p className="text-sm sm:text-base text-zinc-200 max-w-2xl leading-relaxed">
            Bergabunglah bersama ribuan tenaga kerja terampil yang ditempatkan di proyek-proyek strategis
            pertambangan, manufaktur alat berat (PATRIA, United Tractors, PAMA, KPC, Berau Coal, TRUST).
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-xs font-medium text-zinc-100 border border-white/15 flex items-center gap-1.5 shadow-2xs">
              <HardHat className="w-3.5 h-3.5 text-amber-400" /> Welder 6G / 4G (SMAW, FCAW)
            </span>
            <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-xs font-medium text-zinc-100 border border-white/15 flex items-center gap-1.5 shadow-2xs">
              <Wrench className="w-3.5 h-3.5 text-blue-400" /> Heavy Equipment Mechanic
            </span>
            <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-xs font-medium text-zinc-100 border border-white/15 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Fabrication Assembler
            </span>
            <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-xs font-medium text-zinc-100 border border-white/15 flex items-center gap-1.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-purple-400" /> Surveyor &amp; Staf Lapangan
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PublicJobsClient
          initialJobs={jobsRes.success ? jobsRes.data || [] : []}
          provinces={provincesRes.success ? provincesRes.data || [] : []}
          departments={deptsRes.success ? deptsRes.data || [] : []}
          initialSearch={q}
          initialProvince={province}
          initialDepartment={department}
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#07192B] text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} PT Dian Pandu Pratama (DPP). All Rights Reserved.</p>
          <p>Kawasan Industri Jababeka XII Cikarang Utara, Bekasi, Jawa Barat</p>
        </div>
      </footer>
    </div>
  );
}
