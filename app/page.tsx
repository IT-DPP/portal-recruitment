export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  UserPlus,
  Briefcase,
  MapPin,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Building2,
  Award,
  Users,
  HardHat,
  ArrowRight,
  Phone,
  Mail,
  Globe,
  ExternalLink,
} from "lucide-react";
import PublicJobsClient from "@/app/jobs/PublicJobsClient";
import { getPublicJobs } from "@/app/actions/job";
import { getProvinces, getDepartments } from "@/app/actions/master-data";

export default async function Home() {
  const [jobsRes, provincesRes, deptsRes] = await Promise.all([
    getPublicJobs(),
    getProvinces(),
    getDepartments(),
  ]);

  const clients = [
    { name: "PATRIA", subtitle: "PT United Tractors Pandu Engineering", type: "Heavy Equipment Fabrication" },
    { name: "United Tractors", subtitle: "PT United Tractors Tbk", type: "Heavy Equipment & Mining" },
    { name: "PAMA", subtitle: "PT Pamapersada Nusantara", type: "Mining Contractor" },
    { name: "Triatra", subtitle: "PT Triatra Sinergia Madani", type: "Industrial Services" },
    { name: "PMP", subtitle: "PT Patria Maritim Perkasa", type: "Maritime & Shipbuilding" },
    { name: "KPC", subtitle: "PT Kaltim Prima Coal (Sangatta)", type: "Coal Mining Operator" },
    { name: "Berau Coal", subtitle: "PT Berau Coal Energy", type: "Energy & Coal Mining" },
    { name: "TRUST", subtitle: "PT Tambang Raya Usaha Tama (Melak)", type: "Mining Hauling Operations" },
    { name: "IPR", subtitle: "Indonesia Pratama Region (Tabang)", type: "Mining Support Services" },
    { name: "Astra", subtitle: "PT Astra International Tbk", type: "AHEMCE Ecosystem" },
  ];

  const smartValues = [
    {
      letter: "S",
      title: "Satisfaction",
      desc: "Mengutamakan kepuasan pelanggan, mitra kerja, dan kesejahteraan tenaga kerja dengan standar kualitas tinggi.",
      color: "bg-blue-600 text-white",
    },
    {
      letter: "M",
      title: "Morale",
      desc: "Menjunjung integritas moral tinggi, disiplin kerja pantang menyerah, dan etika profesional Astra.",
      color: "bg-emerald-600 text-white",
    },
    {
      letter: "A",
      title: "Adaptability",
      desc: "Tangguh dan cepat beradaptasi dengan dinamika kebutuhan operasional site tambang maupun workshop manufaktur.",
      color: "bg-amber-600 text-white",
    },
    {
      letter: "R",
      title: "Responsibility",
      desc: "Bertanggung jawab penuh atas kualitas pekerjaan serta komitmen keselamatan kerja (K3 Zero Accident).",
      color: "bg-[#D9232A] text-white",
    },
    {
      letter: "T",
      title: "Team Work",
      desc: "Membangun kolaborasi solid dan sinergi harmonis antara kandidat, staf, dan klien di seluruh titik penempatan.",
      color: "bg-indigo-600 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* Top Bar Announcement / Corporate Badge */}
      <div className="bg-[#07192B] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">PT Dian Pandu Pratama (DPP)</span>
            <span className="text-slate-500">•</span>
            <span>Member of YKBUT (Yayasan Karya Bakti United Tractors) — AHEMCE Group</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-300" /> Plant: Jababeka XII Cikarang
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> UU PDP Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
              <Image
                src="/icon.png"
                alt="DPP Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-[#0A2540] tracking-tight group-hover:text-primary transition-colors">
                  DIAN PANDU PRATAMA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D9232A] text-white rounded-full uppercase tracking-wider">
                  DPP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-tight">
                Job & Labour Supply • Heavy Equipment Product Support
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-700">
            <a href="#layanan" className="hover:text-primary transition-colors">
              Layanan Utama
            </a>
            <a href="#budaya-smart" className="hover:text-primary transition-colors">
              Budaya S.M.A.R.T
            </a>
            <a href="#klien-mitra" className="hover:text-primary transition-colors">
              Mitra & Klien
            </a>
            <a href="#jaringan-operasi" className="hover:text-primary transition-colors">
              Jaringan Operasi
            </a>
            <a href="#lowongan" className="hover:text-primary transition-colors">
              Lowongan Kerja
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/candidate/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              <UserPlus className="w-4 h-4 text-primary" />
              Daftar Karir
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A2540] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              Masuk Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with DPP Industrial Theme */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#0A2540] via-[#0D2E4F] to-[#12365C] text-white py-16 lg:py-24">
        {/* Subtle background tech pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#D9232A]" />
                Official E-Recruitment Portal • PT Dian Pandu Pratama
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Penyedia Tenaga Kerja Terampil & Manufaktur Alat Berat Terpercaya
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Menghubungkan talenta profesional dengan proyek-proyek strategis pertambangan,
                manufaktur komponen alat berat, dan operasional maritim di bawah naungan Yayasan Karya
                Bakti United Tractors (YKBUT).
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#lowongan"
                  className="px-6 py-3.5 bg-[#D9232A] hover:bg-[#B91C1C] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/40 flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Jelajahi Lowongan Kerja
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/login"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-bold transition-colors backdrop-blur-xs flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  Masuk ke Akun
                </Link>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">10+</p>
                  <p className="text-xs text-slate-300 font-medium">Site Operation & Representative</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">50+</p>
                  <p className="text-xs text-slate-300 font-medium">Titik Penempatan Lapangan</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
                  <p className="text-xs text-slate-300 font-medium">Kepatuhan K3 & UU PDP</p>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase (Real DPP Plant & Welder Images) */}
            <div className="lg:col-span-5 relative space-y-4">
              {/* Featured Card 1: Welder in Action */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 group">
                <div className="aspect-video sm:aspect-4/3 w-full relative">
                  <Image
                    src="/images/branding/welder-specialist.jpg"
                    alt="Welder Specialist PT DPP"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D9232A] rounded uppercase tracking-wider mb-1 inline-block">
                      Labour Supply Core Skill
                    </span>
                    <h3 className="font-bold text-sm sm:text-base leading-snug">
                      Tenaga Kerja Terampil Berstandar K3 & BNSP
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Welder 6G/4G, Mekanik Alat Berat, Operator, & Staf Lapangan
                    </p>
                  </div>
                </div>
              </div>

              {/* Featured Card 2: Plant DPP Cikarang */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/15 bg-white/5 backdrop-blur-md p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden relative shrink-0 border border-white/20">
                  <Image
                    src="/images/branding/dpp-plant.jpg"
                    alt="Eco Greenplant DPP Cikarang"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-white text-xs">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block">
                    Manufacturing Facility
                  </span>
                  <p className="font-bold text-sm text-white">Eco Greenplant DPP Jababeka</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Kawasan Industri Jababeka XII Cikarang Utara, Bekasi, Jawa Barat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Business Pillars Section */}
      <section id="layanan" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-[#D9232A] uppercase tracking-wider">
            Layanan & Solusi Bisnis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight mt-1">
            Fokus Utama Bisnis PT Dian Pandu Pratama
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Berpengalaman sejak 2012 sebagai mitra strategis dalam penyediaan tenaga kerja terampil dan
            manufaktur komponen alat berat berkualitas tinggi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Labour Supply */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Job & Labour Supply</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penyediaan tenaga kerja terlatih dan bersertifikasi untuk sektor pertambangan dan industri alat berat:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Juru Las / Welder (SMAW, FCAW, GMAW 3G/4G/6G)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Mekanik Alat Berat (Heavy Equipment Mechanic)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Fabrication & Component Assembler
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Surveyor Tambang, Pengawas K3, & Staf Logistik
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 text-xs font-semibold text-primary">
              Standar Kompetensi & MCU Fit to Work
            </div>
          </div>

          {/* Pillar 2: Product Support & Fabrication */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Product Support & Fabrication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dukungan manufaktur, perakitan, dan pemeliharaan alat berat dengan fasilitas pabrik terpadu:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Perakitan Vessel Dump Body & Trailer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Fabrikasi Water Tank, Fuel Tank & Attachments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Industrial Painting & Protective Coating
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Perakitan Komponen Truk HD 785
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 text-xs font-semibold text-primary">
              Fasilitas Eco Greenplant Jababeka
            </div>
          </div>

          {/* Pillar 3: YKBUT Ecosystem */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ekosistem YKBUT & BNSP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Jaminan mutu SDM melalui pelatihan vokasi terpadu dan sertifikasi kompetensi nasional:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Kolaborasi Balai Latihan Kerja (BLK / LPK)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Validasi Sertifikasi BNSP (Badan Nasional Sertifikasi Profesi)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Pelatihan Budaya Kerja K3 Tambang & Disiplin
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Program Onboarding & Induksi Site Komprehensif
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 text-xs font-semibold text-primary">
              Standar Yayasan Karya Bakti United Tractors
            </div>
          </div>
        </div>
      </section>

      {/* S.M.A.R.T Values Section */}
      <section id="budaya-smart" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#D9232A] uppercase tracking-wider">
              Budaya Perusahaan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight mt-1">
              Nilai Utama S.M.A.R.T
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Landasan moral dan etika kerja seluruh insan PT Dian Pandu Pratama dalam melayani mitra bisnis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {smartValues.map((v, i) => (
              <div
                key={i}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl ${v.color} flex items-center justify-center font-extrabold text-lg mb-3 shadow-2xs`}
                  >
                    {v.letter}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{v.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Customers / Clients Showcase */}
      <section id="klien-mitra" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#D9232A] uppercase tracking-wider">
            Mitra & Klien Strategis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight mt-1">
            Dipercaya Oleh Pemimpin Industri Nasional
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            PT Dian Pandu Pratama bangga mendukung operasional perusahaan pertambangan, alat berat, dan energi terkemuka di Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {clients.map((c, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-primary/50 transition-all flex flex-col justify-center text-center group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 mx-auto flex items-center justify-center mb-2 font-extrabold text-[#0A2540] group-hover:bg-[#0A2540] group-hover:text-white transition-colors">
                {c.name.slice(0, 3)}
              </div>
              <h4 className="font-bold text-xs text-slate-900">{c.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{c.subtitle}</p>
              <span className="text-[9px] font-semibold text-primary mt-2 block bg-blue-50 py-0.5 px-1 rounded truncate">
                {c.type}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Operational Network Map Section */}
      <section id="jaringan-operasi" className="py-16 bg-[#07192B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#D9232A] uppercase tracking-wider">
              Jangkauan Layanan Nasional
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Jaringan Site Operation & Representative PT DPP
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Sebaran titik operasional dan perwakilan site penempatan tenaga kerja di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Map Image Showcase */}
            <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-white/10 p-3 overflow-hidden shadow-2xl">
              <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-900">
                <Image
                  src="/images/branding/dpp-operational-map.jpg"
                  alt="Peta Operasional PT Dian Pandu Pratama Indonesia"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Site Operations List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Head Office
                </span>
                <p className="font-bold text-sm text-white">Jababeka Cikarang (Bekasi, Jawa Barat)</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Kawasan Industri Jababeka XII, Harja Mekar, Cikarang Utara
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                  Kalimantan Timur
                </span>
                <p className="font-bold text-xs text-white">
                  Sangatta (KPC HDRS), Melak (PATRIA/TRUST), Tabang (IPR), Balikpapan (Manggar), Batu Kajang, Tanjung Redep (Berau)
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Kalimantan Selatan & Tengah
                </span>
                <p className="font-bold text-xs text-white">
                  Tanjung (Tabalong), Banjarmasin, Sungai Danau (Tanah Bumbu), Muara Teweh (Barito Utara)
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#D9232A] hover:bg-[#B91C1C] px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Lihat Sebaran di Dashboard Geosource
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Vacancies Section */}
      <section id="lowongan" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#D9232A] uppercase tracking-wider">
            Peluang Karir Terbuka
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight mt-1">
            Temukan Karir Impianmu Bersama PT DPP
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Pilih posisi pekerjaan yang sesuai dengan keahlian dan domisili penempatan Anda.
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

      {/* Corporate Footer */}
      <footer className="bg-[#07192B] text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            {/* Col 1: Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                  <Image src="/icon.png" alt="Logo" width={36} height={36} className="object-contain" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">PT DIAN PANDU PRATAMA</h4>
                  <p className="text-[10px] text-slate-400">YKBUT • AHEMCE Ecosystem</p>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Penyedia tenaga kerja terampil (*Job & Labour Supply*) dan pendukung produk manufaktur alat berat
                terpercaya di Indonesia.
              </p>
            </div>

            {/* Col 2: Kantor Pusat */}
            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Kantor Pusat</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Kawasan Industri Jababeka XII Blok W-38A, Kel. Harja Mekar, Kec. Cikarang Utara, Kab. Bekasi,
                Jawa Barat 17530
              </p>
              <div className="pt-1 space-y-1 text-[11px]">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> (021) 893-7800
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> recruitment@dpp.co.id
                </p>
              </div>
            </div>

            {/* Col 3: Navigasi Cepat */}
            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Tautan Pintas</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a href="https://dpp.co.id" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                    Website Perusahaan (dpp.co.id) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a href="#lowongan" className="hover:text-white">Daftar Lowongan Kerja</a>
                </li>
                <li>
                  <Link href="/candidate/register" className="hover:text-white">Registrasi Profil Pelamar</Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">Portal Staf Recruiter</Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Kepatuhan Hukum */}
            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Kepatuhan UU PDP</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Platform ini dilindungi oleh enkripsi AES-256-GCM sesuai Undang-Undang No. 27 Tahun 2022
                tentang Pelindungan Data Pribadi. Seluruh data rekam medis dan identitas NIK/KK diproteksi secara ketat.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} PT Dian Pandu Pratama (DPP). All Rights Reserved.</p>
            <p>Yayasan Karya Bakti United Tractors (YKBUT)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
