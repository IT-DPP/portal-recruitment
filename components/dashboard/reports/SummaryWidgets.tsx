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
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-table-border bg-white p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow duration-200`}
    >
      {/* Background decorative circle */}
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${accentClass}`}
      />
      <div
        className={`absolute -right-1 -top-1 w-12 h-12 rounded-full opacity-5 ${accentClass}`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className={`text-4xl font-bold ${textClass} leading-none`}>
            {value.toLocaleString("id-ID")}
          </h3>
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-xs text-on-surface-variant">{subtitle}</p>
        {percentage !== undefined && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${bgClass} ${textClass}`}
          >
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Progress bar at bottom */}
      {percentage !== undefined && (
        <div className="relative z-10 w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden -mt-1">
          <div
            className={`h-full rounded-full ${accentClass} transition-all duration-700`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface SummaryWidgetsProps {
  data: SummaryData;
}

export default function SummaryWidgets({ data }: SummaryWidgetsProps) {
  const { totalCandidates, inPipeline, employees, rejected } = data;

  const pipelineRate =
    totalCandidates > 0 ? (inPipeline / totalCandidates) * 100 : 0;
  const employeeRate =
    totalCandidates > 0 ? (employees / totalCandidates) * 100 : 0;
  const rejectedRate =
    totalCandidates > 0 ? (rejected / totalCandidates) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="Total Kandidat"
        value={totalCandidates}
        subtitle="Semua kandidat terdaftar"
        icon={<Users className="w-6 h-6 text-primary" />}
        accentClass="bg-primary"
        bgClass="bg-primary/10"
        textClass="text-primary"
      />
      <StatCard
        title="In Pipeline"
        value={inPipeline}
        subtitle="Sedang dalam proses seleksi"
        icon={<GitBranch className="w-6 h-6 text-blue-600" />}
        accentClass="bg-blue-500"
        bgClass="bg-blue-50"
        textClass="text-blue-700"
        percentage={pipelineRate}
      />
      <StatCard
        title="Diterima (Employee)"
        value={employees}
        subtitle="Lolos seluruh tahap seleksi"
        icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
        accentClass="bg-emerald-500"
        bgClass="bg-emerald-50"
        textClass="text-emerald-700"
        percentage={employeeRate}
      />
      <StatCard
        title="Gugur / Tidak Lolos"
        value={rejected}
        subtitle="Ditolak di salah satu tahap"
        icon={<UserX className="w-6 h-6 text-red-600" />}
        accentClass="bg-red-500"
        bgClass="bg-red-50"
        textClass="text-red-700"
        percentage={rejectedRate}
      />
    </div>
  );
}
