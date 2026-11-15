"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default function ManpowerFormationShowcase() {
  return (
    <div className="w-full h-full relative flex flex-col justify-center">
      {/* Main Photographic Formation Card with Full Responsive Height */}
      <div className="relative w-full h-[320px] sm:h-[370px] lg:h-[390px] xl:h-[420px] rounded-2xl overflow-hidden border-2 border-zinc-200 shadow-xl bg-zinc-100 group">
        <Image
          src="/images/branding/manpower-formation.jpg"
          alt="Formasi Tenaga Kerja Site Lapangan PT DPP"
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-102"
          priority
        />

        {/* Bottom Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

        {/* Bottom Information Overlay (Tab badge removed as requested) */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
              Tenaga Kerja Teknis Terampil Siap Penempatan
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              Juru Las (Welder 3G/4G/6G), Mekanik Alat Berat, Operator &amp; Surveyor Tambang
            </p>
          </div>

          <div className="shrink-0 hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 text-[11px] font-medium text-zinc-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            100% Fit to Work &amp; K3
          </div>
        </div>
      </div>
    </div>
  );
}
