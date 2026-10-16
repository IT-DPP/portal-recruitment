"use client";

import React, { useMemo } from "react";
import { AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  stage_1: "CV Screening",
  stage_2: "Interview HR",
  stage_3: "Psikotes",
  stage_4: "Technical Test",
  stage_5: "Interview User",
  stage_6: "Offering",
  stage_7: "MCU",
  Rejected: "Unknown",
};

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  stage_1: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  stage_2: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  stage_3: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  stage_4: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  stage_5: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  stage_6: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  stage_7: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

interface Application {
  id: string;
  currentStage: string;
  history: { stageId: string; stageName: string; date: string; note: string }[];
}

interface RejectionItem {
  reason: string;
  count: number;
  stageId: string;
  percentage: number;
}

interface RejectionAnalysisWidgetProps {
  applications: Application[];
}

function extractReason(note: string): string {
  if (note.startsWith("Reason: ")) {
    return note.replace("Reason: ", "").trim();
  }
  return note || "Unknown";
}

function getLastStageId(app: Application): string {
  // Find the stage where candidate was rejected
  const stageHistory = app.history.filter((h) => h.stageId !== "Rejected");
  if (stageHistory.length > 0) {
    return stageHistory[stageHistory.length - 1].stageId;
  }
  return "stage_1";
}

export default function RejectionAnalysisWidget({
  applications,
}: RejectionAnalysisWidgetProps) {
  const rejectionData = useMemo<RejectionItem[]>(() => {
    const rejected = applications.filter(
      (app) => app.currentStage === "Rejected"
    );

    if (rejected.length === 0) return [];

    // Group by rejection reason
    const reasonMap: Record<string, { count: number; stageId: string }> = {};

    rejected.forEach((app) => {
      // Find the rejection entry in history
      const rejectionEntry = app.history.find((h) => h.stageId === "Rejected");
      const reason = rejectionEntry
        ? extractReason(rejectionEntry.note)
        : "Unknown";
      const stageId = getLastStageId(app);

      if (!reasonMap[reason]) {
        reasonMap[reason] = { count: 0, stageId };
      }
      reasonMap[reason].count += 1;
    });

    // Sort by count descending, take top 5
    return Object.entries(reasonMap)
      .map(([reason, { count, stageId }]) => ({
        reason,
        count,
        stageId,
        percentage: (count / rejected.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications]);

  const totalRejected = applications.filter(
    (app) => app.currentStage === "Rejected"
  ).length;

  const maxCount = rejectionData[0]?.count || 1;

  const BAR_COLORS = [
    "bg-red-600",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
  ];

  return (
    <div className="bg-white rounded-2xl border border-table-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-table-border flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-sm">
              Analisis Penyebab Gugur
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Top 5 alasan penolakan kandidat · Total gugur:{" "}
              <strong className="text-red-600">{totalRejected}</strong> kandidat
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {rejectionData.length === 0 ? (
          <div className="py-10 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tingkat Penolakan: 0% (Optimal)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tidak ada kandidat gugur atau data eliminasi pada periode ini. Begitu terdapat penolakan pada tahapan seleksi, analisis akar penyebab dan evaluasi bottleneck akan tersaji otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {rejectionData.map((item, idx) => {
              const stageColor = STAGE_COLORS[item.stageId] || STAGE_COLORS["stage_1"];
              const barColor = BAR_COLORS[idx] || BAR_COLORS[0];
              const barWidth = (item.count / maxCount) * 100;

              return (
                <div key={item.reason} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank + Reason */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${barColor}`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface leading-tight truncate">
                          {item.reason}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${stageColor.bg} ${stageColor.text} ${stageColor.border}`}
                        >
                          {STAGE_LABELS[item.stageId] || item.stageId}
                        </span>
                      </div>
                    </div>

                    {/* Count & Percentage */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-on-surface">
                        {item.count}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Animated Bar */}
                  <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Footer note */}
            <div className="pt-4 border-t border-table-border">
              <p className="text-[11px] text-on-surface-variant text-center">
                Data berdasarkan{" "}
                <strong className="text-on-surface">{totalRejected}</strong>{" "}
                kandidat yang gugur dari total{" "}
                <strong className="text-on-surface">{applications.length}</strong>{" "}
                pelamar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
