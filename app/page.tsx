export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Briefcase,
  CheckCircle2,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Building2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import ClientLogosCarousel from "@/components/landing/ClientLogosCarousel";
import ManpowerFormationShowcase from "@/components/landing/ManpowerFormationShowcase";
import LandingFooter from "@/components/landing/LandingFooter";

export default async function Home() {

  const smartValues = [
    {
      letter: "S",
      word: "Satisfaction",
      desc: "Mengutamakan kepuasan pelanggan, mitra usaha, dan kesejahteraan seluruh tenaga kerja dengan standar keandalan tinggi.",
    },
    {
      letter: "M",
      word: "Morale",
      desc: "Menjunjung integritas moral tanpa kompromi, disiplin kerja pantang menyerah, dan etika profesional insan industri.",
    },
    {
      letter: "A",
      word: "Adaptability",
      desc: "Tangguh dan sigap beradaptasi dengan dinamika kebutuhan operasional site pertambangan maupun workshop manufaktur.",
    },
    {
      letter: "R",
      word: "Responsibility",
      desc: "Bertanggung jawab penuh atas kualitas pekerjaan serta komitmen keselamatan kerja tanpa kompromi (K3 Zero Accident).",
    },
    {
      letter: "T",
      word: "Teamwork",
      desc: "Membangun sinergi harmonis dan kolaborasi erat antara karyawan, staf lapangan, dan klien di seluruh titik penempatan.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-[#C81E25] selection:text-white">
      {/* 0. Transparent Fixed Navbar */}
      <LandingNavbar />

      {/* 1. HERO SECTION — Consolidated 100vh Viewport (Hero Content + Integrated Client Carousel) */}
      <section
        id="hero"
        className="min-h-screen lg:h-screen flex flex-col justify-between bg-gradient-to-b from-white via-zinc-50 to-[#F8FAFC] text-zinc-950 pt-20 sm:pt-24 pb-0 overflow-hidden relative"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 -left-40 w-[450px] h-[450px] bg-slate-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Top/Center Grid: Content & Manpower Formation Component */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 my-auto py-2 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-5">
              {/* Authoritative Solid Headline (No multicolored inline text spans) */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 leading-[1.15]">
                Portal Karir &amp; Rekrutmen Resmi
              </h1>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 leading-[1.15]">
                PT Dian Pandu Pratama
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl font-normal">
                Gerbang resmi pencarian kerja dan penempatan tenaga kerja terampil di sektor pertambangan, fabrikasi komponen alat berat, dan operasional maritim di seluruh site Indonesia.
              </p>

              {/* Interactive Quick Search Box for Job Seekers */}
              <div className="bg-white p-2 rounded-xl border border-zinc-300 shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-xl">
                <div className="flex items-center gap-2.5 px-3 flex-1 w-full">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-500 truncate">
                    Cari posisi: Welder, Mekanik, Surveyor, K3...
                  </span>
                </div>
                <Link
                  href="/jobs"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#C81E25] hover:bg-[#A8181E] text-white rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
                >
                  Cari Lowongan
                </Link>
              </div>

              {/* Popular Job Keywords */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 pt-1">
                <span className="font-semibold text-zinc-800">Posisi Populer:</span>
                <Link href="/jobs?q=Welder" className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md font-medium transition-colors">Welder 6G/4G</Link>
                <Link href="/jobs?q=Mekanik" className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md font-medium transition-colors">Mekanik Alat Berat</Link>
                <Link href="/jobs?q=Surveyor" className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-medium transition-colors">Mine Surveyor</Link>
                <Link href="/jobs?q=HSE" className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-medium transition-colors">K3 / EHS Officer</Link>
              </div>
            </div>

            {/* Right Column: Manpower Formation Showcase Component */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <ManpowerFormationShowcase />
            </div>
          </div>
        </div>

        {/* Hero Bottom: MITRA & KLIEN STRATEGIS — Fit with Hero Section Width */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 pb-2.5 border-t border-zinc-200/80 z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 whitespace-nowrap">
              Mitra &amp; Klien Penempatan Kerja:
            </span>
            <div className="flex-1 w-full min-w-0 overflow-hidden">
              <ClientLogosCarousel compact={true} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. JARINGAN OPERASI NASIONAL — High-Res Operational Map with Section Header Matching Budaya & Fokus Bisnis */}
      <section id="jaringan-operasi" className="py-20 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
              Jangkauan Operasional
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              Jaringan Site Operasional Nasional
            </h2>
            <p className="text-sm text-zinc-600 mt-2 font-normal">
              Sebaran titik operasi kantor pusat, manufaktur fabrikasi terpadu di Cikarang, dan representatif penempatan tenaga kerja di seluruh site pertambangan dan industri Indonesia.
            </p>
          </div>

          {/* High-Resolution Operational Map */}
          <div className="relative w-full aspect-[4251/2391] rounded-2xl overflow-hidden border border-zinc-200/80 bg-zinc-50/50 shadow-xs flex items-center justify-center p-3 sm:p-6 lg:p-8">
            <div className="relative w-full h-full">
              <Image
                src="/images/branding/dpp-operational-map.png"
                alt="Peta Jaringan Site Operasional Nasional PT Dian Pandu Pratama"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. BUDAYA PERUSAHAAN S.M.A.R.T — Clean Cards Only, Refined Typography, Generous Margin */}
      <section id="budaya-smart" className="py-20 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
              Fondasi Karakter &amp; Integritas Kerja
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              Budaya S.M.A.R.T PT Dian Pandu Pratama
            </h2>
            <p className="text-sm text-zinc-600 mt-2 font-normal">
              Nilai yang menjadi pedoman perilaku setiap insan PT DPP dalam melayani klien dan menjalankan operasi di seluruh site.
            </p>
          </div>

          {/* 5 Distinct Value Cards with Generous Spacing for Responsibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {smartValues.map((v, idx) => (
              <div
                key={idx}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 hover:border-zinc-900 transition-all flex flex-col justify-between shadow-xs hover:shadow-md group"
              >
                <div>
                  {/* Square 3D Bevel Tile */}
                  <div className="w-11 h-11 bg-white text-zinc-950 font-black text-xl border-2 border-zinc-300 shadow-[3px_3px_0px_#C81E25] flex items-center justify-center rounded-lg mb-4 group-hover:border-zinc-950 transition-colors">
                    {v.letter}
                  </div>

                  {/* Clean title without overflowing */}
                  <h3 className="text-zinc-950 font-bold text-base tracking-tight mb-2">
                    {v.word}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FOKUS UTAMA BISNIS PT DIAN PANDU PRATAMA — Real Photographic Images (Bright Theme, No Black Background) */}
      <section id="layanan" className="py-20 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">
              Solusi Industri Terpadu
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              Fokus Utama Bisnis PT Dian Pandu Pratama
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Job & Labour Supply with Welder Specialist Photo */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100">
                  <Image
                    src="/images/branding/welder-specialist.jpg"
                    alt="Job & Labour Supply PT DPP"
                    fill
                    className="object-cover scale-110 group-hover:scale-115 transition-transform duration-500 object-center"
                  />
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-bold text-zinc-900 uppercase tracking-wider shadow-xs border border-zinc-200">
                    Core Business
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-3.5">
                  <h3 className="text-lg font-bold text-zinc-950">Job &amp; Labour Supply</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    Penyediaan tenaga kerja terlatih dan bersertifikasi untuk sektor pertambangan dan industri alat berat:
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-800 font-medium pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Juru Las / Welder (SMAW, FCAW, GMAW 3G/4G/6G)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Mekanik Alat Berat (Heavy Equipment Mechanic)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Fabrication &amp; Component Assembler</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Surveyor Tambang, Pengawas K3 &amp; Logistik</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 sm:px-7 py-3.5 bg-zinc-50 border-t border-zinc-100 text-xs font-semibold text-zinc-700">
                Standar Kompetensi &amp; MCU Fit to Work
              </div>
            </div>

            {/* Pillar 2: Product Support & Fabrication with Plant Photo */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100">
                  <Image
                    src="/images/branding/dpp-plant.jpg"
                    alt="Eco Greenplant Fabrikasi PT DPP"
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-bold text-zinc-900 uppercase tracking-wider shadow-xs border border-zinc-200">
                    Manufacturing Facility
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-3.5">
                  <h3 className="text-lg font-bold text-zinc-950">Product Support &amp; Fabrication</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    Dukungan manufaktur, perakitan, dan perbaikan komponen alat berat di fasilitas pabrik modern:
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-800 font-medium pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Perakitan Vessel Dump Body &amp; Trailer</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Fabrikasi Fuel/Water Tank &amp; Attachments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Industrial Painting &amp; Protective Coating</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Perakitan Komponen Truk HD 785</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 sm:px-7 py-3.5 bg-zinc-50 border-t border-zinc-100 text-xs font-semibold text-zinc-700">
                Fasilitas Eco Greenplant Jababeka XII Cikarang
              </div>
            </div>

            {/* Pillar 3: Standar K3 & Sertifikasi BNSP with Backoffice/Engineering Team Photo */}
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-100">
                  <Image
                    src="/images/branding/manpower-backoffice.jpg"
                    alt="Standar Kompetensi dan Sertifikasi BNSP PT DPP"
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-bold text-zinc-900 uppercase tracking-wider shadow-xs border border-zinc-200">
                    Quality &amp; Safety
                  </div>
                </div>

                <div className="p-6 sm:p-7 space-y-3.5">
                  <h3 className="text-lg font-bold text-zinc-950">Standar K3 &amp; Sertifikasi BNSP</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                    Jaminan mutu SDM melalui pelatihan vokasi terpadu dan sertifikasi kompetensi nasional:
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-800 font-medium pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Kemitraan Balai Latihan Kerja (BLK / LPK)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Validasi Sertifikasi BNSP Resmi Nasional</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Budaya K3 Tambang &amp; Disiplin Kerja</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C81E25] shrink-0" />
                      <span>Program Onboarding &amp; Induksi Site Terpadu</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 sm:px-7 py-3.5 bg-zinc-50 border-t border-zinc-100 text-xs font-semibold text-zinc-700">
                Sertifikasi Kompetensi Resmi Nasional
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CORPORATE FOOTER — Bright Theme & Latest Logo */}
      <LandingFooter />
    </div>
  );
}
