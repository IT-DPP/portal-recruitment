"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HardHat, Users, CheckCircle2 } from "lucide-react";

export default function ManpowerFormationShowcase() {
  const [activeTab, setActiveTab] = useState<"site" | "office">("site");

  return (
    <div className="w-full relative">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("site")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "site"
                ? "bg-white text-zinc-950 shadow-xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <HardHat className="w-3.5 h-3.5 text-[#C81E25]" />
            Site Technical Crew
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("office")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "office"
                ? "bg-white text-zinc-950 shadow-xs"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-zinc-700" />
            Engineering &amp; Back Office
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] font-semibold text-zinc-500">
          Formasi Berbaris Terstandarisasi
        </span>
      </div>

      {/* Main Photographic Formation Card */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-200 shadow-xl bg-zinc-100 group">
        <div className="aspect-16/10 sm:aspect-16/9 w-full relative">
          {activeTab === "site" ? (
            <Image
              src="/images/branding/manpower-formation.jpg"
              alt="Formasi Tenaga Kerja Site Lapangan PT DPP"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-102"
              priority
            />
          ) : (
            <Image
              src="/images/branding/manpower-backoffice.jpg"
              alt="Tim Engineering dan Back Office PT DPP"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-102"
              priority
            />
          )}

          {/* Bottom Gradient Overlay for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Bottom Information Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#C81E25] text-white text-[10px] font-bold uppercase tracking-wider mb-1.5">
                {activeTab === "site" ? "Site Operations Formation" : "Management & Support Unit"}
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                {activeTab === "site"
                  ? "Tenaga Kerja Teknis Terampil Siap Penempatan"
                  : "Tim Engineering, HSE & Staf Operasional Lapangan"}
              </h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                {activeTab === "site"
                  ? "Juru Las (Welder 3G/4G/6G), Mekanik Alat Berat, Operator & Surveyor Tambang"
                  : "Pengawas K3 / EHS, Planner Maintenance, Logistik & Administrasi Penempatan"}
              </p>
            </div>

            <div className="shrink-0 hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 text-[11px] font-medium text-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Fit to Work &amp; K3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
