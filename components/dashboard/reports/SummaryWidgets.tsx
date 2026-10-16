"use client";

import React from "react";
import { Users, GitBranch, UserCheck, UserX } from "lucide-react";

interface SummaryData {
  totalCandidates: number;
  inPipeline: number;
  employees: number;
  rejected: number;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  bgClass: string;
  textClass: string;
  percentage?: number;
  isZeroBaseline?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentClass,
  bgClass,
  textClass,
  percentage,
  isZeroBaseline = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all duration-200`}
    >
      {/* Background decorative accent */}
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${accentClass}`}
      />
      <div
        className={`absolute -right-1 -top-1 w-12 h-12 rounded-full opacity-5 ${accentClass}`}
      />

      <div className="flex items-start justify-between relative z-10 mb-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {title}
          </p>
          <h3 className={`text-4xl font-extrabold ${value === 0 ? "text-slate-800" : textClass} tracking-tight leading-none`}>
            {value.toLocaleString("id-ID")}
          </h3>
        </div>
        <div
          className={`w-12 h-12 rounded-2xl ${bgClass} border border-black/5 flex items-center justify-center shrink-0 shadow-2xs`}
        >
          {icon}
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          {percentage !== undefined && !isZeroBaseline && (
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${bgClass} ${textClass}`}
            >
              {percentage.toFixed(1)}%
            </span>
          )}
          {isZeroBaseline && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              0% Baseline
            </span>
          )}
        </div>

        {/* Progress bar */}
        {percentage !== undefined && !isZeroBaseline ? (
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${accentClass} transition-all duration-700`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        ) : (
          <div className="w-full h-1 bg-slate-100/80 rounded-full" />
        )}
      </div>
    </div>
  );
}

interface SummaryWidgetsProps {
  data: SummaryData;
}

export default function SummaryWidgets({ data }: SummaryWidgetsProps) {
  const { totalCandidates, inPipeline, employees, rejected } = data;
  const isZeroBaseline = totalCandidates === 0;

  const pipelineRate =
    totalCandidates > 0 ? (inPipeline / totalCandidates) * 100 : 0;
  const employeeRate =
    totalCandidates > 0 ? (employees / totalCandidates) * 100 : 0;
  const rejectedRate =
    totalCandidates > 0 ? (rejected / totalCandidates) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <StatCard
        title="Total Kandidat"
        value={totalCandidates}
        subtitle={isZeroBaseline ? "Belum ada pelamar masuk" : "Semua kandidat terdaftar"}
        icon={<Users className="w-6 h-6 text-primary" />}
        accentClass="bg-primary"
        bgClass="bg-primary/10"
        textClass="text-primary"
        isZeroBaseline={isZeroBaseline}
      />
      <StatCard
        title="In Pipeline"
        value={inPipeline}
        subtitle={isZeroBaseline ? "Belum ada proses seleksi aktif" : "Sedang dalam proses seleksi"}
        icon={<GitBranch className="w-6 h-6 text-blue-600" />}
        accentClass="bg-blue-500"
        bgClass="bg-blue-50"
        textClass="text-blue-700"
        percentage={pipelineRate}
        isZeroBaseline={isZeroBaseline}
      />
      <StatCard
        title="Diterima (Employee)"
        value={employees}
        subtitle={isZeroBaseline ? "0 kandidat dipekerjakan" : "Lolos seluruh tahap seleksi"}
        icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
        accentClass="bg-emerald-500"
        bgClass="bg-emerald-50"
        textClass="text-emerald-700"
        percentage={employeeRate}
        isZeroBaseline={isZeroBaseline}
      />
      <StatCard
        title="Gugur / Tidak Lolos"
        value={rejected}
        subtitle={isZeroBaseline ? "0 kandidat ditolak" : "Ditolak di salah satu tahap"}
        icon={<UserX className="w-6 h-6 text-red-600" />}
        accentClass="bg-red-500"
        bgClass="bg-red-50"
        textClass="text-red-700"
        percentage={rejectedRate}
        isZeroBaseline={isZeroBaseline}
      />
    </div>
  );
}
