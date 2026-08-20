"use client";

import React from "react";
import { MapPin, Users, UserCheck, UserX, Star, TrendingUp } from "lucide-react";

export interface PriorityJob {
  id: string;
  noRegistrasi: string;
  posisi: string;
  siteId: string;
  jumlahPermintaan: number;
  applicants: number;
  accepted: number;
  rejected: number;
  siteName: string;
}

interface PriorityJobsWidgetProps {
  jobs: PriorityJob[];
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
}

export default function PriorityJobsWidget({
  jobs,
  selectedJobId,
  onSelectJob,
}: PriorityJobsWidgetProps) {
  const handleClick = (id: string) => {
    onSelectJob(selectedJobId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-2xl border border-table-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-table-border flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-sm">
              Top 5 Lowongan Priority
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Klik kartu untuk memfilter Pipeline Funnel
            </p>
          </div>
        </div>
        {selectedJobId && (
          <button
            onClick={() => onSelectJob(null)}
            className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Job Cards Grid */}
      <div className="p-5">
        {jobs.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada lowongan priority</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {jobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              const passRate =
                job.applicants > 0
                  ? ((job.accepted / job.applicants) * 100).toFixed(1)
                  : "0.0";
              const fillRate =
                job.jumlahPermintaan > 0
                  ? Math.min(
                      (job.accepted / job.jumlahPermintaan) * 100,
                      100
                    )
                  : 0;

              return (
                <button
                  key={job.id}
                  onClick={() => handleClick(job.id)}
                  className={`text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md focus:outline-none ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-table-border bg-white hover:border-primary/30"
                  }`}
                >
                  {/* Priority Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                      Priority
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        ✓ Dipilih
                      </span>
                    )}
                  </div>

                  {/* Job Title */}
                  <h3 className="font-bold text-sm text-on-surface leading-tight mb-1 line-clamp-2">
                    {job.posisi}
                  </h3>
                  <p className="text-[10px] font-mono text-on-surface-variant mb-3">
                    {job.noRegistrasi}
                  </p>

                  {/* Site */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3 h-3 text-on-surface-variant shrink-0" />
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {job.siteName}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                    <div className="bg-surface-container-low rounded-lg px-1 py-2">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <Users className="w-3 h-3 text-blue-500" />
                      </div>
                      <p className="font-bold text-sm text-blue-700">
                        {job.applicants}
                      </p>
                      <p className="text-[9px] text-on-surface-variant leading-tight">
                        Daftar
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg px-1 py-2">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <UserCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                      <p className="font-bold text-sm text-emerald-700">
                        {job.accepted}
                      </p>
                      <p className="text-[9px] text-on-surface-variant leading-tight">
                        Diterima
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg px-1 py-2">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        <UserX className="w-3 h-3 text-red-500" />
                      </div>
                      <p className="font-bold text-sm text-red-700">
                        {job.rejected}
                      </p>
                      <p className="text-[9px] text-on-surface-variant leading-tight">
                        Ditolak
                      </p>
                    </div>
                  </div>

                  {/* Needed vs Accepted */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-on-surface-variant">
                        Pemenuhan ({job.accepted}/{job.jumlahPermintaan} org)
                      </span>
                      <span className="text-[10px] font-bold text-primary">
                        {fillRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${fillRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Pass Rate & Fail Rate */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-table-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] text-on-surface-variant">Lolos</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${parseFloat(passRate) >= 50 ? "bg-emerald-50 text-emerald-700" : parseFloat(passRate) >= 25 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        {passRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <UserX className="w-3 h-3 text-red-500" />
                        <span className="text-[9px] text-on-surface-variant">Gagal</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-700">
                        {job.applicants > 0 ? ((job.rejected / job.applicants) * 100).toFixed(1) : "0.0"}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
