export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  Briefcase,
  MapPin,
  CheckCircle2,
  Wrench,
  Award,
  Users,
  ArrowRight,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import PublicJobsClient from "@/app/jobs/PublicJobsClient";
import LandingNavbar from "@/components/landing/LandingNavbar";
import ClientLogosCarousel from "@/components/landing/ClientLogosCarousel";
import { getPublicJobs } from "@/app/actions/job";
import { getProvinces, getDepartments } from "@/app/actions/master-data";

export default async function Home() {
  const [jobsRes, provincesRes, deptsRes] = await Promise.all([
    getPublicJobs(),
    getProvinces(),
    getDepartments(),
  ]);

  const smartValues = [
    {
      letter: "S",
      word: "ATISFACTION",
      desc: "Mengutamakan kepuasan pelanggan, mitra usaha, dan kesejahteraan seluruh tenaga kerja dengan standar keandalan tinggi.",
    },
    {
      letter: "M",
      word: "ORALE",
      desc: "Menjunjung integritas moral tanpa kompromi, disiplin kerja pantang menyerah, dan etika profesional insan Astra.",
    },
    {
      letter: "A",
      word: "DAPTABILITY",
      desc: "Tangguh dan sigap beradaptasi dengan dinamika kebutuhan operasional site pertambangan maupun workshop manufaktur.",
    },
    {
      letter: "R",
      word: "ESPONSIBILITY",
      desc: "Bertanggung jawab penuh atas kualitas pekerjaan serta komitmen keselamatan kerja tanpa kompromi (K3 Zero Accident).",
    },
    {
      letter: "T",
      word: "EAMWORK",
      desc: "Membangun sinergi harmonis dan kolaborasi erat antara karyawan, staf lapangan, dan klien di seluruh titik penempatan.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#D9232A] selection:text-white">
      {/* Transparent Fixed Navbar */}
      <LandingNavbar />

      {/* Hero Section — 100vh Full Viewport */}
      <section
        id="hero"
        className="h-screen min-h-screen relative flex flex-col justify-center bg-black text-white overflow-hidden px-4 sm:px-6 lg:px-8"
      >
        {/* Subtle Dark Vignette / Backdrop */}
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/95 to-black/75 z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10 pt-20 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black border border-[#D9232A] rounded-full text-xs font-bold text-white">
                <span className="text-[#D9232A] font-black uppercase tracking-wider">
                  PT DIAN PANDU PRATAMA
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-200">E-Recruitment Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Penyedia Tenaga Kerja Terampil &amp; Manufaktur Alat Berat
              </h1>

              <p className="text-base sm:text-lg text-zinc-200 leading-relaxed max-w-2xl font-normal">
                Menghubungkan talenta profesional dengan proyek-proyek strategis pertambangan,
                fabrikasi komponen alat berat, dan operasional maritim di bawah naungan Yayasan Karya
                Bakti United Tractors (YKBUT) — Member of Astra Heavy Equipment, Mining, Construction &amp; Energy (AHEMCE).
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#lowongan"
                  className="px-7 py-4 bg-[#D9232A] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-red-950 flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Jelajahi Lowongan Kerja
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/login"
                  className="px-7 py-4 bg-transparent hover:bg-white hover:text-black text-white border border-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-[#D9232A]" />
                  Masuk Portal
                </Link>
              </div>

              {/* Quick Metrics — Clean Solid Colors */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-800">
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-white">10+</p>
                  <p className="text-xs text-zinc-300 font-bold uppercase tracking-wider mt-1">
                    Site Operasi &amp; Rep
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-white">50+</p>
                  <p className="text-xs text-zinc-300 font-bold uppercase tracking-wider mt-1">
                    Titik Penempatan
                  </p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-[#D9232A]">100%</p>
                  <p className="text-xs text-zinc-300 font-bold uppercase tracking-wider mt-1">
                    Kepatuhan K3 &amp; PDP
                  </p>
                </div>
              </div>
            </div>

            {/* Right Industrial Image Showcase */}
            <div className="lg:col-span-5 relative space-y-4">
              {/* Card 1: Welder in Action */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl group">
                <div className="aspect-16/10 sm:aspect-4/3 w-full relative">
                  <Image
                    src="/images/branding/welder-specialist.jpg"
                    alt="Juru Las Spesialis Fabrikasi PT DPP"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-[#D9232A] text-white rounded uppercase tracking-wider mb-1.5 inline-block">
                      Labour Supply Core Skill
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Tenaga Kerja Terampil Berstandar K3 &amp; BNSP
                    </h3>
                    <p className="text-xs text-zinc-200 mt-0.5">
                      Welder 6G/4G, Mekanik Alat Berat, Operator, &amp; Staf Lapangan
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Plant Cikarang */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-3.5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden relative shrink-0 border border-zinc-700">
                  <Image
                    src="/images/branding/dpp-plant.jpg"
                    alt="Eco Greenplant DPP Cikarang"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-white text-xs">
                  <span className="font-bold text-[#D9232A] uppercase text-[10px] tracking-wider block">
                    Manufacturing Facility
                  </span>
                  <p className="font-bold text-sm text-white">Eco Greenplant DPP Jababeka</p>
                  <p className="text-zinc-300 text-[11px] mt-0.5">
                    Kawasan Industri Jababeka XII Cikarang Utara, Bekasi, Jawa Barat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Vacancies Section — Placed Prominently Right After Hero */}
      <section id="lowongan" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-zinc-200">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-black text-[#D9232A] uppercase tracking-widest">
            Peluang Karir Terbuka
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-2">
            Temukan Karir Impianmu Bersama PT DPP
          </h2>
          <p className="text-sm text-zinc-700 mt-2 font-medium">
            Pilih posisi pekerjaan yang sesuai dengan keahlian dan domisili penempatan Anda di Head Office maupun Site Tambang.
          </p>
        </div>

        <div className="w-full">
          <PublicJobsClient
            initialJobs={jobsRes.success ? jobsRes.data || [] : []}
            provinces={provincesRes.success ? provincesRes.data || [] : []}
            departments={deptsRes.success ? deptsRes.data || [] : []}
          />
        </div>
      </section>

      {/* About Section — Unified Container for SMART, Mitra & Klien, Jaringan Operasi, and Layanan */}
      <div id="about" className="space-y-0">
        {/* Section: Budaya Perusahaan S.M.A.R.T (Matches Uploaded Reference Image) */}
        <section id="budaya-smart" className="py-20 bg-zinc-50 border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-black text-[#D9232A] uppercase tracking-widest">
                Budaya Perusahaan
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-2">
                Nilai Utama S.M.A.R.T
              </h2>
              <p className="text-sm text-zinc-700 mt-2 font-medium">
                Pondasi etika kerja dan karakter profesional seluruh insan PT Dian Pandu Pratama.
              </p>
            </div>

            {/* Official Banner Image from User Upload */}
            <div className="w-full max-w-4xl mx-auto mb-12 px-4 py-6 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-center">
              <Image
                src="/images/branding/smart-culture-banner.png"
                alt="Banner Budaya S.M.A.R.T PT Dian Pandu Pratama"
                width={1024}
                height={80}
                className="w-full h-auto object-contain"
                priority
              />
            </div>

            {/* Structured Value Cards Matching the 3D Tile Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {smartValues.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-black transition-all flex flex-col justify-between shadow-xs hover:shadow-md group"
                >
                  <div>
                    {/* Header: White square tile with black letter + 3D Red Bevel Shadow, followed by red word */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white text-black font-black text-2xl border-2 border-zinc-300 shadow-[3px_3px_0px_#D9232A] flex items-center justify-center rounded-md shrink-0 group-hover:border-black transition-colors">
                        {v.letter}
                      </div>
                      <span className="text-[#D9232A] font-black text-lg tracking-wider">
                        {v.word}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-800 leading-relaxed font-normal">
                      {v.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Mitra & Klien Strategis — Logo Only Scrolling Carousel */}
        <section id="klien-mitra" className="py-16 bg-white border-b border-zinc-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
            <span className="text-xs font-black text-[#D9232A] uppercase tracking-widest">
              Mitra &amp; Klien Strategis
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-2">
              Dipercaya Oleh Pemimpin Industri Nasional
            </h2>
            <p className="text-xs text-zinc-700 mt-1 font-medium">
              Mendukung operasional terdepan di ekosistem AHEMCE, United Tractors, pertambangan, dan energi.
            </p>
          </div>

          {/* Marquee Carousel: LOGO ONLY */}
          <div className="w-full">
            <ClientLogosCarousel />
          </div>
        </section>

        {/* Section: Jaringan Operasi Nasional — Map & Sites */}
        <section id="jaringan-operasi" className="py-20 bg-black text-white border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-black text-[#D9232A] uppercase tracking-widest">
                Jangkauan Operasional Nasional
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
                Jaringan Site Operation &amp; Representative PT DPP
              </h2>
              <p className="text-sm text-zinc-300 mt-2 font-medium">
                Peta sebaran penempatan tenaga kerja dan fasilitas representatif di seluruh Indonesia.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Official Operational Map Image */}
              <div className="lg:col-span-7 bg-zinc-900 rounded-2xl border border-zinc-800 p-3 overflow-hidden shadow-2xl">
                <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-zinc-950">
                  <Image
                    src="/images/branding/dpp-operational-map.jpg"
                    alt="Peta Operasional PT Dian Pandu Pratama Indonesia"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Site Details List — High Contrast Black & White with Red Accents */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-black text-[#D9232A] uppercase tracking-wider block">
                    Head Office &amp; Greenplant
                  </span>
                  <p className="font-black text-base text-white mt-0.5">
                    Jababeka Cikarang (Bekasi, Jawa Barat)
                  </p>
                  <p className="text-xs text-zinc-300 mt-1">
                    Kawasan Industri Jababeka XII Blok W-38A, Cikarang Utara
                  </p>
                </div>

                <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-black text-[#D9232A] uppercase tracking-wider block">
                    Kalimantan Timur
                  </span>
                  <p className="font-bold text-xs text-white leading-relaxed mt-0.5">
                    Sangatta (KPC HDRS Tango Delta), Melak (PATRIA/TRUST), Tabang (IPR), Balikpapan (Manggar), Batu Kajang, Tanjung Redep (Berau)
                  </p>
                </div>

                <div className="p-5 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-black text-[#D9232A] uppercase tracking-wider block">
                    Kalimantan Selatan &amp; Tengah
                  </span>
                  <p className="font-bold text-xs text-white leading-relaxed mt-0.5">
                    Tanjung (Tabalong), Banjarmasin, Sungai Danau (Tanah Bumbu), Muara Teweh (Barito Utara)
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#D9232A] hover:bg-[#B91C1C] px-5 py-3 rounded-xl transition-all shadow-md"
                  >
                    <MapPin className="w-4 h-4" />
                    Lihat Sebaran di Dashboard Geosource
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Layanan Utama & Fokus Bisnis */}
        <section id="layanan" className="py-20 bg-white border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-black text-[#D9232A] uppercase tracking-widest">
                Layanan &amp; Solusi Bisnis
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mt-2">
                Fokus Utama Bisnis PT Dian Pandu Pratama
              </h2>
              <p className="text-sm text-zinc-700 mt-2 font-medium">
                Penyedia tenaga kerja terampil dan manufaktur komponen alat berat berkualitas sejak 2012.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1: Labour Supply */}
              <div className="bg-white p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all flex flex-col justify-between shadow-xs hover:shadow-lg">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#D9232A]" />
                  </div>
                  <h3 className="text-xl font-black text-black">Job &amp; Labour Supply</h3>
                  <p className="text-xs text-zinc-700 leading-relaxed font-normal">
                    Penyediaan tenaga kerja terlatih dan bersertifikasi untuk sektor pertambangan dan alat berat:
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-900 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Juru Las / Welder (SMAW, FCAW, GMAW 3G/4G/6G)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Mekanik Alat Berat (Heavy Equipment Mechanic)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Fabrication &amp; Component Assembler
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Surveyor Tambang, Pengawas K3, &amp; Logistik
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-zinc-200 text-xs font-bold text-[#D9232A]">
                  Standar Kompetensi &amp; MCU Fit to Work
                </div>
              </div>

              {/* Pillar 2: Product Support */}
              <div className="bg-white p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all flex flex-col justify-between shadow-xs hover:shadow-lg">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-[#D9232A]" />
                  </div>
                  <h3 className="text-xl font-black text-black">Product Support &amp; Fabrication</h3>
                  <p className="text-xs text-zinc-700 leading-relaxed font-normal">
                    Dukungan manufaktur, perakitan, dan perbaikan komponen alat berat di pabrik modern:
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-900 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Perakitan Vessel Dump Body &amp; Trailer
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Fabrikasi Fuel/Water Tank &amp; Attachments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Industrial Painting &amp; Protective Coating
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Perakitan Komponen Truk HD 785
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-zinc-200 text-xs font-bold text-[#D9232A]">
                  Fasilitas Eco Greenplant Jababeka
                </div>
              </div>

              {/* Pillar 3: YKBUT & BNSP */}
              <div className="bg-white p-8 rounded-2xl border-2 border-zinc-200 hover:border-black transition-all flex flex-col justify-between shadow-xs hover:shadow-lg">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#D9232A]" />
                  </div>
                  <h3 className="text-xl font-black text-black">Ekosistem YKBUT &amp; BNSP</h3>
                  <p className="text-xs text-zinc-700 leading-relaxed font-normal">
                    Jaminan mutu SDM melalui pelatihan vokasi terpadu dan sertifikasi kompetensi nasional:
                  </p>
                  <ul className="space-y-2 text-xs text-zinc-900 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Kemitraan Balai Latihan Kerja (BLK / LPK)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Validasi Sertifikasi BNSP Resmi
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Budaya K3 Tambang &amp; Disiplin Astra
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#D9232A] shrink-0" />
                      Program Onboarding &amp; Induksi Site Terpadu
                    </li>
                  </ul>
                </div>
                <div className="pt-6 mt-6 border-t border-zinc-200 text-xs font-bold text-[#D9232A]">
                  Standar Yayasan Karya Bakti United Tractors
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Corporate Footer — Updated with Latest DPP Logo */}
      <footer className="bg-black text-white text-xs pt-16 pb-10 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 pb-12 border-b border-zinc-800">
            {/* Col 1: Identity with Latest Logo */}
            <div className="space-y-4">
              <Link href="/" className="inline-block" aria-label="PT Dian Pandu Pratama">
                <Image
                  src="/images/branding/dpp-logo-white-text.png"
                  alt="Logo PT Dian Pandu Pratama"
                  width={200}
                  height={86}
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                Penyedia tenaga kerja terampil (*Job &amp; Labour Supply*) dan pendukung produk manufaktur alat berat
                terpercaya di Indonesia.
              </p>
              <div className="pt-1">
                <span className="inline-block px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-white font-bold text-[10px] rounded uppercase tracking-wider">
                  Member of YKBUT (AHEMCE Group)
                </span>
              </div>
            </div>

            {/* Col 2: Kantor Pusat */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-widest text-[#D9232A]">
                Kantor Pusat &amp; Pabrik
              </h5>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Kawasan Industri Jababeka XII Blok W-38A, Kel. Harja Mekar, Kec. Cikarang Utara, Kab. Bekasi,
                Jawa Barat 17530
              </p>
              <div className="pt-1 space-y-1.5 text-xs text-zinc-300">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#D9232A]" /> (021) 893-7800
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#D9232A]" /> recruitment@dpp.co.id
                </p>
              </div>
            </div>

            {/* Col 3: Navigasi Pintas */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-widest text-[#D9232A]">
                Tautan Pintas
              </h5>
              <ul className="space-y-2 text-xs text-zinc-300 font-medium">
                <li>
                  <a
                    href="https://dpp.co.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#D9232A] flex items-center gap-1 transition-colors"
                  >
                    Website Resmi (dpp.co.id) <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </li>
                <li>
                  <a href="#lowongan" className="hover:text-[#D9232A] transition-colors">
                    Daftar Lowongan Kerja
                  </a>
                </li>
                <li>
                  <a href="#budaya-smart" className="hover:text-[#D9232A] transition-colors">
                    Budaya S.M.A.R.T
                  </a>
                </li>
                <li>
                  <Link href="/candidate/register" className="hover:text-[#D9232A] transition-colors">
                    Registrasi Profil Pelamar
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#D9232A] transition-colors">
                    Portal Staf Recruiter
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Kepatuhan Hukum & UU PDP */}
            <div className="space-y-3">
              <h5 className="font-black text-white text-xs uppercase tracking-widest text-[#D9232A]">
                Kepatuhan UU PDP
              </h5>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Platform ini dilindungi enkripsi AES-256-GCM sesuai Undang-Undang No. 27 Tahun 2022
                tentang Pelindungan Data Pribadi. Seluruh data rekam medis dan nomor identitas (NIK/KK) diproteksi secara ketat.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-medium">
            <p>© {new Date().getFullYear()} PT Dian Pandu Pratama (DPP). All Rights Reserved.</p>
            <p className="text-white font-bold">Yayasan Karya Bakti United Tractors (YKBUT)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
