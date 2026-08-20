"use client";

import React, { useMemo } from "react";
import { Filter, ArrowDown, ChevronRight } from "lucide-react";

const STAGES = [
  { id: "stage_1", title: "CV Screening", color: "#0f4c81", light: "#e8f0fb" },
  { id: "stage_2", title: "Interview HR", color: "#1565C0", light: "#e3f2fd" },
  { id: "stage_3", title: "Psikotes", color: "#1976D2", light: "#e3f2fd" },
  { id: "stage_4", title: "Technical Test", color: "#0288D1", light: "#e1f5fe" },
  { id: "stage_5", title: "Interview User", color: "#0097A7", light: "#e0f7fa" },
  { id: "stage_6", title: "Offering", color: "#00796B", light: "#e0f2f1" },
  { id: "stage_7", title: "MCU (Selesai)", color: "#2E7D32", light: "#e8f5e9" },
  { id: "stage_8", title: "Training", color: "#388E3C", light: "#e8f5e9" },
  { id: "stage_9", title: "Induction", color: "#4CAF50", light: "#e8f5e9" },
  { id: "stage_10", title: "PKWT (Hired)", color: "#81C784", light: "#e8f5e9" },
];

interface Application {
  id: string;
  jobId: string;
  currentStage: string;
  history: { stageId: string; stageName: string; date: string; note: string }[];
}

interface StageStat {
  stageId: string;
  title: string;
  color: string;
  light: string;
  atStage: number;       // currently at this stage
  passedThrough: number; // started here, passed to next
  rejectedHere: number;  // rejected while at this stage
  total: number;         // ever reached this stage
}

interface PipelineFunnelWidgetProps {
  applications: Application[];
  selectedJobId: string | null;
  selectedJobName?: string;
}

function getStageIndex(stageId: string): number {
  return STAGES.findIndex((s) => s.id === stageId);
}

export default function PipelineFunnelWidget({
  applications,
  selectedJobId,
  selectedJobName,
}: PipelineFunnelWidgetProps) {
  const filtered = useMemo(
    () =>
      selectedJobId
        ? applications.filter((a) => a.jobId === selectedJobId)
        : applications,
    [applications, selectedJobId]
  );

  const stats: StageStat[] = useMemo(() => {
    return STAGES.map((stage, stageIdx) => {
      // Count apps that ever reached this stage (have it in history or currentStage >= this)
      const everReached = filtered.filter((app) => {
        if (app.currentStage === "Rejected") {
          // Rejected: check if they had this stage in history
          return app.history.some((h) => h.stageId === stage.id);
        }
        const currentIdx = getStageIndex(app.currentStage);
        return currentIdx >= stageIdx;
      });

      // Currently at this stage
      const atStage = filtered.filter(
        (app) => app.currentStage === stage.id
      ).length;

      // Rejected while at this stage (rejected, last history entry was this stage or no next stage history)
      const rejectedHere = filtered.filter((app) => {
        if (app.currentStage !== "Rejected") return false;
        // Check if the last non-rejected stage in history is this stage
        const stageHistory = app.history.filter((h) => h.stageId !== "Rejected");
        if (stageHistory.length === 0) return stageIdx === 0;
        const lastStage = stageHistory[stageHistory.length - 1].stageId;
        return lastStage === stage.id;
      }).length;

      // Passed to next stage (reached next stage)
      const passedThrough =
        stageIdx < STAGES.length - 1
          ? filtered.filter((app) => {
              if (app.currentStage === "Rejected") {
                // Check if they have the NEXT stage in history
                return app.history.some(
                  (h) => h.stageId === STAGES[stageIdx + 1].id
                );
              }
              const currentIdx = getStageIndex(app.currentStage);
              return currentIdx > stageIdx;
            }).length
          : filtered.filter((app) => app.currentStage === stage.id).length;

      return {
        stageId: stage.id,
        title: stage.title,
        color: stage.color,
        light: stage.light,
        atStage,
        passedThrough,
        rejectedHere,
        total: everReached.length,
      };
    });
  }, [filtered]);

  const maxTotal = Math.max(...stats.map((s) => s.total), 1);

  return (
    <div className="bg-white rounded-2xl border border-table-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-table-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Filter className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-sm">
              End-to-End Pipeline Funnel
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              {selectedJobId
                ? `Menampilkan: ${selectedJobName || selectedJobId}`
                : "Semua lowongan · Klik priority job untuk filter"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-primary">
            {filtered.length}
          </p>
          <p className="text-[10px] text-on-surface-variant">Total Pelamar</p>
        </div>
      </div>

      {/* Funnel Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Funnel Diagram */}
          <div className="flex-1 space-y-1.5">
            {stats.map((stage, idx) => {
              const widthPercent = maxTotal > 0 ? (stage.total / maxTotal) * 100 : 10;
              const minWidth = 30;
              const displayWidth = Math.max(minWidth, widthPercent);

              return (
                <div key={stage.stageId} className="group">
                  {/* Funnel bar */}
                  <div className="flex items-center gap-3">
                    {/* Stage label */}
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-on-surface leading-tight">
                        {stage.title}
                      </p>
                    </div>

                    {/* Bar container (centered to create funnel effect) */}
                    <div className="flex-1 relative h-10 flex items-center justify-center">
                      <div
                        className="h-full rounded-lg flex items-center justify-center transition-all duration-500 relative overflow-hidden"
                        style={{
                          width: `${displayWidth}%`,
                          backgroundColor: stage.color,
                        }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-white font-bold text-sm relative z-10">
                          {stage.total}
                        </span>
                      </div>
                    </div>

                    {/* Stats column */}
                    <div className="w-36 shrink-0">
                      <div className="flex gap-2 text-[10px]">
                        <span
                          className="px-1.5 py-0.5 rounded font-semibold"
                          style={{ backgroundColor: stage.light, color: stage.color }}
                        >
                          Di sini: {stage.atStage}
                        </span>
                        {stage.rejectedHere > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-semibold">
                            Gugur: {stage.rejectedHere}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow between stages */}
                  {idx < STAGES.length - 1 && (
                    <div className="flex items-center gap-3 my-0.5">
                      <div className="w-28 shrink-0" />
                      <div className="flex-1 flex justify-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <ArrowDown className="w-3.5 h-3.5 text-outline-variant" />
                        </div>
                      </div>
                      <div className="w-36 shrink-0 pl-1">
                        {stage.passedThrough > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                            <ChevronRight className="w-3 h-3 text-emerald-500" />
                            <span className="font-semibold text-emerald-700">
                              {stage.passedThrough} lanjut
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend & Summary */}
          <div className="w-48 shrink-0 space-y-3">
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <h4 className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                Ringkasan
              </h4>
              {stats.map((stage) => (
                <div
                  key={stage.stageId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-[10px] text-on-surface-variant truncate max-w-[80px]">
                      {stage.title}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: stage.color }}
                  >
                    {stage.total}
                  </span>
                </div>
              ))}
            </div>

            {/* Conversion rates */}
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <h4 className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
                Konversi
              </h4>
              {stats.slice(0, -1).map((stage, idx) => {
                const nextTotal = stats[idx + 1]?.total || 0;
                const convRate =
                  stage.total > 0
                    ? ((nextTotal / stage.total) * 100).toFixed(0)
                    : "0";
                const failRate = stage.total > 0 ? (100 - parseFloat(convRate)).toFixed(0) : "0";
                return (
                  <div key={stage.stageId} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-on-surface-variant truncate max-w-[90px]">
                        {stage.title} →
                      </span>
                      <div className="flex gap-2">
                        <span
                          className={`text-[9px] font-bold ${
                            parseInt(convRate) >= 70
                              ? "text-emerald-700"
                              : parseInt(convRate) >= 40
                              ? "text-amber-700"
                              : "text-red-700"
                          }`}
                        >
                          {convRate}% Lolos
                        </span>
                        <span className="text-[9px] font-bold text-red-600">
                          {failRate}% Gagal
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-red-100 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${
                          parseInt(convRate) >= 70
                            ? "bg-emerald-500"
                            : parseInt(convRate) >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${convRate}%` }}
                      />
                      <div className="h-full bg-red-500" style={{ width: `${failRate}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <Filter className="w-10 h-10 mx-auto mb-2 text-on-surface-variant opacity-30" />
              <p className="text-sm font-semibold text-on-surface-variant">
                Tidak ada data untuk lowongan ini
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
