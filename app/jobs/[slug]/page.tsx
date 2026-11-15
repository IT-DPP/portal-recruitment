export const dynamic = "force-dynamic";

import React from "react";
import { getPublicJobById } from "@/app/actions/job";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  Briefcase,
  ShieldCheck,
  Award,
  Users,
  LogIn,
  HardHat,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicJobById(slug);
  if (!res.success || !res.data) return { title: "Lowongan Tidak Ditemukan" };

  const title = res.data.positionName || res.data.position?.name || "Lowongan Pekerjaan";
  return {
    title: `${title} | PT Dian Pandu Pratama (DPP)`,
  };
}

export default async function PublicJobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicJobById(slug);

  if (!res.success || !res.data) {
    notFound();
  }

  const job = res.data;

  // Backward compatibility: if accessed via legacy CUID ID, redirect permanently to clean SEO slug
  if (job.slug && slug !== job.slug && slug === job.id) {
    redirect(`/jobs/${job.slug}`);
  }

  const title = job.positionName || job.position?.name || "Lowongan Pekerjaan";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-xl p-1 border border-slate-200 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
              <Image
                src="/icon.png"
                alt="DPP Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#0A2540] tracking-tight group-hover:text-primary transition-colors">
                  DIAN PANDU PRATAMA
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#D9232A] text-white rounded-full uppercase">
                  DPP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Job &amp; Labour Supply</p>
            </div>
          </Link>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Semua Lowongan
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 sm:p-10 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-slate-50">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full">
                {job.department?.name || job.departmentName || "Operasional"}
              </span>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider rounded-full">
                {job.statusPermintaan || "Labor Supply"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] mb-4">{title}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D9232A] shrink-0" />
                <span>
                  {job.city?.name || "Semua Kota"}, {job.province?.name || "Indonesia"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span>Klien: {job.customer?.name || "Mitra Industri DPP"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Tayang: {new Date(job.publishedDate || job.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-10 space-y-8">
            {job.kualifikasi && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#0A2540] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Kualifikasi & Persyaratan
                </h2>
                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {job.kualifikasi}
                </div>
              </section>
            )}

            {job.benefit && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#0A2540] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Award className="w-5 h-5 text-amber-600" /> Fasilitas & Benefit
                </h2>
                <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {job.benefit}
                </div>
              </section>
            )}

            {/* Standard DPP Compliance Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Kebijakan Rekrutmen PT Dian Pandu Pratama:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                <li>Proses rekrutmen PT DPP tidak dipungut biaya apapun (Gratis).</li>
                <li>Tahapan seleksi terstandarisasi mencakup CV Screening, Wawancara, Asesmen Keterampilan, dan MCU Fit-to-Work.</li>
                <li>Seluruh data pelamar dilindungi dan dienkripsi AES-256-GCM sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022).</li>
              </ul>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-8 border-t border-slate-200 bg-slate-50/70 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-900">Tertarik bergabung dengan posisi ini?</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan masuk ke Portal Kandidat atau buat profil karir baru untuk mengirimkan lamaran Anda secara resmi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="px-6 py-2.5 bg-[#0A2540] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                Masuk & Lamar Sekarang
              </Link>
              <Link
                href="/candidate/register"
                className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#07192B] text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} PT Dian Pandu Pratama (DPP). All Rights Reserved.</p>
          <p>Kawasan Industri Jababeka XII Cikarang Utara, Bekasi, Jawa Barat</p>
        </div>
      </footer>
    </div>
  );
}
