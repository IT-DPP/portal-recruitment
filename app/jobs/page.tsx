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
  description: "Daftar peluang karir resmi PT Dian Pandu Pratama (Member of YKBUT) untuk sektor pertambangan dan manufaktur alat berat.",
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
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-white rounded-xl p-1 border border-slate-200 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
              <Image
                src="/icon.png"
                alt="DPP Logo"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-[#0A2540] tracking-tight group-hover:text-primary transition-colors">
                  DIAN PANDU PRATAMA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D9232A] text-white rounded-full uppercase tracking-wider">
                  DPP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Portal Karir & Rekrutmen Resmi • YKBUT
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </Link>
            <Link
              href="/candidate/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-primary" />
              Daftar Karir
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A2540] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              Masuk
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-linear-to-r from-[#0A2540] via-[#0D2E4F] to-[#12365C] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#D9232A]" />
            Labor & Job Supply • Penempatan Nasional
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Peluang Karir Terbuka PT Dian Pandu Pratama
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Bergabunglah bersama ribuan tenaga kerja terampil yang ditempatkan di proyek-proyek strategis
            pertambangan, manufaktur alat berat (PATRIA, United Tractors, PAMA, KPC, Berau Coal, TRUST).
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-400" /> Welder 6G / 4G (SMAW, FCAW)
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-400" /> Heavy Equipment Mechanic
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Fabrication Assembler
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" /> Surveyor & Staf Lapangan
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
          <p>© {new Date().getFullYear()} PT Dian Pandu Pratama (DPP) • Yayasan Karya Bakti United Tractors</p>
          <p>Kawasan Industri Jababeka XII Cikarang Utara, Bekasi, Jawa Barat</p>
        </div>
      </footer>
    </div>
  );
}
