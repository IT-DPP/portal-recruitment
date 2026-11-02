"use client";

import React, { useState } from "react";
import {
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Building,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import OfferingActionCard from "./OfferingActionCard";
import McuActionCard from "./McuActionCard";
import InterviewActionCard from "./InterviewActionCard";
import ApplicationMessageFeed from "./ApplicationMessageFeed";

interface CandidateApplicationItemProps {
  app: any;
}

export default function CandidateApplicationItem({ app }: CandidateApplicationItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "milestones" | "both">("chat");

  const job = app.job;
  if (!job) return null;

  // Safely parse stageData
  let stageData: Record<string, any> = {};
  if (app.stageData) {
    try {
      stageData =
        typeof app.stageData === "string"
          ? JSON.parse(app.stageData)
          : app.stageData;
    } catch {
      stageData = {};
    }
  }

  const currentStageInfo = job.timeline?.find(
    (t: any) => t.id === app.currentStageId || t.stageId === app.currentStageId
  );
  const currentStageName =
    currentStageInfo?.stage?.name ||
    currentStageInfo?.title ||
    app.currentStage?.name ||
    "Administration";

  const stageNameLower = currentStageName.toLowerCase();
  const currentStageId = app.currentStageId || "";

  // Identify stage flags
  const isOfferingStage =
    currentStageId === "stage_6" ||
    stageNameLower.includes("offering") ||
    !!stageData.offeringLetter?.file;

  const isMcuStage =
    currentStageId === "stage_7" ||
    stageNameLower.includes("mcu") ||
    stageNameLower.includes("medical") ||
    !!stageData.mcu?.pengantarFile;

  const isHrInterviewStage =
    currentStageId === "stage_2" ||
    stageNameLower.includes("interview hr") ||
    stageNameLower.includes("hr interview") ||
    !!stageData.hrInterview?.date;

  const isUserInterviewStage =
    currentStageId === "stage_5" ||
    stageNameLower.includes("interview user") ||
    stageNameLower.includes("user interview") ||
    !!stageData.userInterview?.date;

  const hasActionCard =
    isOfferingStage || isMcuStage || isHrInterviewStage || isUserInterviewStage;

  const milestones =
    app.history && app.history.length > 0
      ? app.history
      : [
          {
            stageId: app.currentStageId,
            stageName: "Administration",
            date: app.applicationDate,
          },
        ];

  const latestMilestone = milestones[milestones.length - 1];
  const displayStageName = latestMilestone?.stageName || currentStageName;

  const messages = Array.isArray(stageData.messages) ? stageData.messages : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-table-border overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header: Job Info & Status */}
      <div className="p-6 border-b border-table-border bg-surface-container-lowest">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold uppercase tracking-wider rounded-full">
                {job.department?.name || job.departmentName || "General"}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Dilamar:{" "}
                {new Date(app.applicationDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {job.positionName || job.position?.name || "Posisi Pekerjaan"}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                <span className="font-semibold text-gray-800">
                  {job.site?.name || job.customer?.name || job.areaKerja || "Corporate"}
                  {job.city?.name ? `, ${job.city.name}` : ""}
                  {job.province?.name ? ` - ${job.province.name}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary/70 shrink-0" />
                <span className="uppercase text-xs font-bold font-mono tracking-wider bg-surface-container-low px-2 py-0.5 rounded text-gray-800">
                  Ref: {job.noRegistrasi}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true);
                setActiveRightTab("chat");
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-bold text-blue-700 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Akses langsung chat recruiter"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Recruiter</span>
              {messages.length > 0 && (
                <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {messages.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <span>{isExpanded ? "Tutup Rincian" : "Buka Rincian & Aksi"}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 4 Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-white p-3 rounded-xl border border-outline-variant/60 shadow-xs">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Tahap Berjalan
            </p>
            <p className="font-bold text-primary text-sm flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
              <span className="truncate" title={displayStageName}>
                {displayStageName}
              </span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-outline-variant/60 shadow-xs">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Departemen
            </p>
            <p
              className="font-bold text-gray-900 text-sm truncate"
              title={job.department?.name || job.departmentName || "-"}
            >
              {job.department?.name || job.departmentName || "-"}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-outline-variant/60 shadow-xs">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Lokasi Penempatan
            </p>
            <p
              className="font-bold text-gray-900 text-sm truncate"
              title={job.site?.name || job.customer?.name || "-"}
            >
              {job.site?.name || job.customer?.name || "Corporate"}
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-outline-variant/60 shadow-xs">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
              Status Lamaran
            </p>
            <p
              className={`font-bold text-sm truncate flex items-center gap-1 ${
                app.status === "ACTIVE"
                  ? "text-blue-600"
                  : ["HIRED", "ACCEPTED", "PASSED"].includes(app.status)
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {app.status === "ACTIVE"
                ? "Sedang Diproses"
                : app.status === "HIRED"
                ? "Resmi Diterima (Hired)"
                : app.status}
            </p>
          </div>
        </div>
      </div>

      {/* Body Section: 2-Column Side-by-Side Layout */}
      {isExpanded && (
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Dynamic Stage Action Card OR Stage Status Overview */}
            <div className="lg:col-span-7 space-y-6">
              {isOfferingStage && (
                <OfferingActionCard
                  applicationId={app.id}
                  jobId={job.id}
                  offeringData={stageData.offeringLetter}
                  currentStageName={displayStageName}
                />
              )}

              {isMcuStage && (
                <McuActionCard
                  applicationId={app.id}
                  jobId={job.id}
                  mcuData={stageData.mcu}
                  jobSiteInfo={job}
                />
              )}

              {isHrInterviewStage && (
                <InterviewActionCard
                  stageType="HR"
                  interviewData={stageData.hrInterview}
                />
              )}

              {isUserInterviewStage && (
                <InterviewActionCard
                  stageType="USER"
                  interviewData={stageData.userInterview}
                />
              )}

              {!hasActionCard && (
                <div className="bg-gradient-to-br from-blue-50/50 via-white to-surface-container-lowest rounded-2xl border border-table-border p-6 shadow-sm flex flex-col justify-between h-full min-h-[460px]">
                  <div>
                    <div className="flex items-center gap-3 pb-4 border-b border-table-border">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-base">
                            Tahap Berjalan: {displayStageName}
                          </h4>
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                            {app.status === "ACTIVE" ? "Sedang Diproses" : app.status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Proses seleksi Anda sedang ditinjau dan dievaluasi oleh tim rekrutmen.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="p-4 bg-white rounded-xl border border-table-border/80 shadow-xs">
                        <h5 className="font-bold text-xs uppercase text-gray-400 tracking-wider mb-2">
                          Status & Petunjuk Tahapan
                        </h5>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          Berkas dan profil pendaftaran Anda untuk posisi{" "}
                          <span className="font-semibold text-gray-900">
                            {job.positionName || job.position?.name}
                          </span>{" "}
                          sedang dalam proses peninjauan aktif. Pastikan email dan kontak Anda selalu aktif.
                        </p>
                        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Dokumen pendaftaran terkirim</span>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                            <Clock className="w-4 h-4 text-primary shrink-0" />
                            <span>Menunggu hasil tinjauan recruiter</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
                        <div className="flex items-start gap-2.5">
                          <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-blue-950 mb-0.5">
                              Pusat Komunikasi Recruiter
                            </span>
                            <span className="text-blue-800 leading-relaxed">
                              Jika ada pertanyaan atau konfirmasi, Anda dapat menghubungi tim rekrutmen secara langsung lewat panel{" "}
                              <strong
                                className="underline cursor-pointer font-bold text-primary"
                                onClick={() => setActiveRightTab("chat")}
                              >
                                Chat Recruiter
                              </strong>{" "}
                              di sebelah kanan tanpa harus scroll ke bawah.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-table-border/80 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                      Nomor Registrasi: <strong className="text-gray-700 font-mono">{job.noRegistrasi || "-"}</strong>
                    </span>
                    <span>
                      Lokasi: <strong className="text-gray-700">{job.site?.name || job.customer?.name || "Corporate"}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Chat & Milestone History (col-span-5) */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              {/* Tab Selector */}
              <div className="flex items-center justify-between bg-surface-container-low p-1 rounded-xl border border-table-border">
                <div className="flex items-center gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("chat")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeRightTab === "chat"
                        ? "bg-white text-primary shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Recruiter</span>
                    {messages.length > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          activeRightTab === "chat"
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {messages.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRightTab("milestones")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeRightTab === "milestones"
                        ? "bg-white text-primary shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Riwayat Tahapan</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeRightTab === "milestones"
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {milestones.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRightTab("both")}
                    title="Tampilkan Chat & Riwayat Sekaligus"
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      activeRightTab === "both"
                        ? "bg-white text-primary shadow-xs"
                        : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <span className="text-[11px] font-bold">Keduanya</span>
                  </button>
                </div>
              </div>

              {/* Chat View */}
              {(activeRightTab === "chat" || activeRightTab === "both") && (
                <ApplicationMessageFeed
                  applicationId={app.id}
                  messages={messages}
                  className={activeRightTab === "both" ? "h-[380px]" : "h-[540px]"}
                />
              )}

              {/* Milestone History View */}
              {(activeRightTab === "milestones" || activeRightTab === "both") && (
                <div
                  className={`bg-white rounded-2xl border border-table-border p-5 shadow-sm flex flex-col ${
                    activeRightTab === "both" ? "h-[360px]" : "h-[540px]"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-table-border mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-sm text-gray-900">
                        Riwayat Tahapan (Milestones)
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 bg-surface-container-low px-2.5 py-0.5 rounded-full">
                      {milestones.length} Tahap
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/60 before:to-transparent">
                    {milestones.map((ms: any, idx: number) => {
                      const isLatest = idx === milestones.length - 1;
                      return (
                        <div key={idx} className="relative flex items-start gap-3.5 pl-1">
                          <div
                            className={`w-3 h-3 mt-1.5 rounded-full shrink-0 z-10 shadow-xs border-2 border-white ${
                              isLatest
                                ? "bg-primary ring-2 ring-primary/30"
                                : "bg-gray-400"
                            }`}
                          />
                          <div
                            className={`flex-1 p-3 rounded-xl border transition-all ${
                              isLatest
                                ? "bg-blue-50/50 border-blue-200 shadow-xs"
                                : "bg-surface-container-lowest border-table-border"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-bold text-xs text-gray-900">
                                {ms.stageName}
                              </h5>
                              {isLatest && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded-full">
                                  Saat Ini
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-gray-500 font-semibold mt-1">
                              {new Date(ms.date).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {ms.note && (
                              <p className="text-xs text-blue-900 bg-white/80 p-2 rounded-lg mt-1.5 font-medium border border-blue-100/70 leading-relaxed">
                                <strong className="text-blue-700">Catatan:</strong> {ms.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

