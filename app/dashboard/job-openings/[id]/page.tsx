"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import PipelineBoard from "@/components/PipelineBoard";

const STAGES = [
  { id: "stage_1", title: "Administration" },
  { id: "stage_2", title: "HR Interview" },
  { id: "stage_3", title: "Psychological Test" },
  { id: "stage_4", title: "Test Skill Verification" },
  { id: "stage_5", title: "User Interview" },
  { id: "stage_6", title: "Offering Letter" },
  { id: "stage_7", title: "MCU" },
  { id: "stage_8", title: "Training User" },
  { id: "stage_9", title: "Induction" },
  { id: "stage_10", title: "PWKT" },
];

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const modal = useModal();
  const [job, setJob] = useState<any>(null);
  const [slaConfig, setSlaConfig] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // For overdue feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(
    null,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "pipeline">("details");

  useEffect(() => {
    const jobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    const found = jobs.find((j: any) => j.id === id);
    if (found) {
      setJob(found);
    }

    const sla = JSON.parse(localStorage.getItem("ugz_master_sla") || "{}");
    setSlaConfig(sla);

    const savedSites = JSON.parse(
      localStorage.getItem("ugz_master_sites_operation") || "[]",
    );
    setSites(savedSites);

    setCustomers(
      JSON.parse(localStorage.getItem("ugz_master_customer") || "[]"),
    );
    setProvinces(
      JSON.parse(localStorage.getItem("ugz_master_province") || "[]"),
    );
    setCities(JSON.parse(localStorage.getItem("ugz_master_city") || "[]"));
  }, [id]);

  const getSiteName = (siteId: string) =>
    sites.find((s) => s.id === siteId)?.siteName || siteId || "-";
  const getCustomerName = (cId: string) =>
    customers.find((c) => c.id === cId)?.name || cId || "-";
  const getProvinceName = (pId: string) =>
    provinces.find((p) => p.id === pId)?.name || pId || "-";
  const getCityName = (cId: string) =>
    cities.find((c) => c.id === cId)?.name || cId || "-";

  const saveJobState = (updatedJob: any) => {
    setJob(updatedJob);
    const jobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    const newJobs = jobs.map((j: any) =>
      j.id === updatedJob.id ? updatedJob : j,
    );
    localStorage.setItem("ugz_jobs", JSON.stringify(newJobs));
  };

  const calculateTimelines = (
    publishDateStr: string,
    needTestSkill: boolean,
  ) => {
    const timelines: any[] = [];
    let currentDate = new Date(publishDateStr);

    STAGES.forEach((s) => {
      if (s.id === "stage_4" && !needTestSkill) return; // Skip stage 4 if not needed

      const config = slaConfig[s.id] || { totalDays: 0 };
      const startDate = new Date(currentDate);
      const deadlineDate = new Date(currentDate);
      deadlineDate.setDate(deadlineDate.getDate() + config.totalDays);

      timelines.push({
        id: s.id,
        title: s.title,
        status: "Pending", // Pending, In Progress, Completed, Overdue
        startDate: startDate.toISOString(),
        deadlineDate: deadlineDate.toISOString(),
        completionDate: null,
        overdueNotes: null,
      });

      // Advance the counter for next stage
      currentDate = new Date(deadlineDate);
    });

    // Make the first stage "In Progress"
    if (timelines.length > 0) {
      timelines[0].status = "In Progress";
    }

    return timelines;
  };

  const handlePublish = async () => {
    if (!slaConfig || Object.keys(slaConfig).length === 0) {
      await modal.alert(
        "SLA Belum Diatur",
        "SLA Configuration belum diatur! Harap atur SLA di menu Settings terlebih dahulu.",
      );
      return;
    }

    const now = new Date().toISOString();
    const generatedTimelines = calculateTimelines(now, job.needTestSkill);

    const updatedJob = {
      ...job,
      globalStatus: "Active",
      publishedDate: now,
      timeline: generatedTimelines,
    };

    saveJobState(updatedJob);
  };

  const handleCloseJob = async () => {
    if (
      await modal.confirm(
        "Tutup Lowongan",
        "Apakah Anda yakin ingin menutup lowongan ini secara permanen?",
        false,
      )
    ) {
      saveJobState({ ...job, globalStatus: "Closed" });
    }
  };

  const handleDeleteJob = async () => {
    if (
      await modal.confirm(
        "Hapus Lowongan",
        "PERINGATAN: Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus lowongan ini dari sistem?",
        true,
      )
    ) {
      const jobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
      const filtered = jobs.filter((j: any) => j.id !== job.id);
      localStorage.setItem("ugz_jobs", JSON.stringify(filtered));
      router.push("/dashboard/job-openings");
    }
  };

  const markStageCompleted = (stageId: string) => {
    const stage = job.timeline.find((t: any) => t.id === stageId);

    // Evaluate if overdue dynamically based on current date
    const now = new Date();
    const deadline = new Date(stage.deadlineDate);
    if (now > deadline && !stage.overdueNotes) {
      // Must provide notes
      setShowFeedbackModal(stageId);
      return;
    }

    // Complete the stage
    const updatedTimeline = job.timeline.map((t: any, index: number) => {
      if (t.id === stageId) {
        return {
          ...t,
          status: "Completed",
          completionDate: new Date().toISOString(),
        };
      }
      return t;
    });

    // Activate next stage if exists
    const currentIndex = updatedTimeline.findIndex(
      (t: any) => t.id === stageId,
    );
    if (currentIndex + 1 < updatedTimeline.length) {
      updatedTimeline[currentIndex + 1].status = "In Progress";
    }

    saveJobState({ ...job, timeline: updatedTimeline });
  };

  const submitOverdueFeedback = () => {
    if (!feedbackText.trim()) return;

    const updatedTimeline = job.timeline.map((t: any) => {
      if (t.id === showFeedbackModal) {
        return { ...t, overdueNotes: feedbackText };
      }
      return t;
    });

    saveJobState({
      ...job,
      timeline: updatedTimeline,
      globalStatus: "Overdue", // Permanently mark global status as overdue
    });

    setShowFeedbackModal(null);
    setFeedbackText("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase border border-gray-300">
            Draft
          </span>
        );
      case "Active":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase border border-emerald-300">
            Active
          </span>
        );
      case "Overdue":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase border border-red-300">
            Overdue
          </span>
        );
      case "Closed":
        return (
          <span className="px-3 py-1 bg-slate-800 text-white rounded-full text-xs font-bold uppercase border border-slate-900">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getStageStatusColor = (t: any) => {
    if (t.status === "Completed")
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (t.overdueNotes) return "text-red-700 bg-red-50 border-red-200"; // Permanently overdue marked

    // Dynamic overdue check
    if (t.status !== "Completed" && new Date() > new Date(t.deadlineDate)) {
      return "text-red-700 bg-red-50 border-red-200 animate-pulse";
    }

    if (t.status === "In Progress")
      return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-gray-500 bg-gray-50 border-gray-200 opacity-50";
  };

  if (!job) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/job-openings"
            className="p-2 bg-white border border-table-border rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                {job.posisi}
              </h2>
              {getStatusBadge(job.globalStatus)}
            </div>
            <p className="text-sm font-mono text-on-surface-variant font-semibold">
              {job.noRegistrasi} • {getSiteName(job.siteId || job.areaKerja)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {job.globalStatus === "Draft" && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Publish Job
            </button>
          )}
          {(job.globalStatus === "Active" ||
            job.globalStatus === "Overdue") && (
            <button
              onClick={handleCloseJob}
              className="px-4 py-2 bg-slate-800 text-white rounded text-sm font-semibold hover:bg-slate-900 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Close Job
            </button>
          )}
          {(job.globalStatus === "Draft" || job.globalStatus === "Closed") && (
            <button
              onClick={handleDeleteJob}
              className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded text-sm font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Job
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-table-border scrollbar-hide -mx-2 px-2">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          Job Details & SLA
        </button>
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === "pipeline"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          Candidate Pipeline
        </button>
      </div>

      {activeTab === "details" ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="font-bold text-on-surface border-b border-table-border pb-3 mb-4">
              Informasi Lowongan
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  No Registrasi
                </p>
                <p className="font-medium text-black">{job.noRegistrasi}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Customer
                </p>
                <p className="font-medium text-black">
                  {getCustomerName(job.customerId)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Status Permintaan
                </p>
                <p className="font-medium text-black">{job.statusPermintaan}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Jumlah Kebutuhan
                </p>
                <p className="font-medium text-black">
                  {job.jumlahPermintaan} Kandidat
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Tanggal Form Masuk
                </p>
                <p className="font-medium text-black">
                  {new Date(job.tanggalMasuk).toLocaleDateString("id-ID")}
                </p>
              </div>
              {job.noFormB1 && (
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                    No Form B1
                  </p>
                  <p className="font-medium text-black font-mono">
                    {job.noFormB1}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Lokasi Penempatan
                </p>
                <p className="font-medium text-black">
                  {getCityName(job.cityId)}, {getProvinceName(job.provinceId)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Sites Operation (Area Kerja)
                </p>
                <p className="font-medium text-black">
                  {getSiteName(job.siteId || job.areaKerja)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Membutuhkan Test Skill?
                </p>
                <p className="font-medium text-black">
                  {job.needTestSkill ? "Ya" : "Tidak"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="font-bold text-on-surface border-b border-table-border pb-3 mb-4">
              Persyaratan
            </h3>
            <div className="text-sm">
              <p className="whitespace-pre-wrap text-black">
                {job.kualifikasi || "-"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6">
            <h3 className="font-bold text-on-surface border-b border-table-border pb-3 mb-4">
              Benefit Pekerjaan
            </h3>
            <div className="text-sm">
              <p className="whitespace-pre-wrap text-black">
                {job.benefit || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-6 min-h-[500px]">
            <h3 className="font-bold text-on-surface border-b border-table-border pb-3 mb-6">
              SLA Recruitment Timeline
            </h3>

            {job.globalStatus === "Draft" ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-50" />
                <p className="text-black font-semibold">Lowongan Masih Draft</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Publish lowongan ini untuk memulai perhitungan argo SLA dan
                  Timeline.
                </p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant before:to-transparent">
                {job.timeline?.map((t: any, index: number) => {
                  const isOverdueNow =
                    t.status !== "Completed" &&
                    new Date() > new Date(t.deadlineDate);

                  return (
                    <div
                      key={t.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      {/* Timeline Icon */}
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                          t.status === "Completed"
                            ? "text-emerald-500"
                            : t.overdueNotes || isOverdueNow
                              ? "text-red-500"
                              : t.status === "In Progress"
                                ? "text-blue-500"
                                : "text-gray-300"
                        }`}
                      >
                        {t.status === "Completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : t.overdueNotes || isOverdueNow ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      {/* Timeline Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-sm transition-colors bg-white hover:border-primary/30 relative">
                        <div
                          className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg border-l border-b text-[10px] font-bold uppercase tracking-wider ${getStageStatusColor(t)}`}
                        >
                          {t.overdueNotes
                            ? "Overdue (Noted)"
                            : isOverdueNow
                              ? "OVERDUE!"
                              : t.status}
                        </div>

                        <h4 className="font-bold text-black text-sm mb-2 pt-1">
                          {t.title}
                        </h4>
                        <div className="space-y-1 mb-4">
                          <p className="text-[11px] text-on-surface-variant font-mono">
                            Start:{" "}
                            {new Date(t.startDate).toLocaleDateString("id-ID")}
                          </p>
                          <p className="text-[11px] text-on-surface-variant font-mono">
                            Batas:{" "}
                            <span className="font-bold text-black">
                              {new Date(t.deadlineDate).toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </p>
                          {t.completionDate && (
                            <p className="text-[11px] text-emerald-700 font-mono font-semibold">
                              Selesai:{" "}
                              {new Date(t.completionDate).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          )}
                        </div>

                        {t.overdueNotes && (
                          <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-800">
                            <strong>Overdue Feedback:</strong> {t.overdueNotes}
                          </div>
                        )}

                        {/* Actions */}
                        {t.status === "In Progress" &&
                          job.globalStatus !== "Closed" && (
                            <button
                              onClick={() => markStageCompleted(t.id)}
                              className="w-full py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container transition-colors"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        {/* If it's a past stage but somehow they want to provide overdue notes manually */}
                        {isOverdueNow &&
                          !t.overdueNotes &&
                          job.globalStatus !== "Closed" && (
                            <button
                              onClick={() => setShowFeedbackModal(t.id)}
                              className="w-full py-2 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors mt-2 border border-red-200"
                            >
                              Beri Catatan Overdue
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <PipelineBoard jobId={job.id} timeline={job.timeline} />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-table-border bg-surface-container-lowest flex items-center justify-between">
              <h3 className="font-bold text-status-error flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Mandatory Feedback
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-black mb-4">
                Stage ini telah melewati batas waktu SLA. Harap berikan
                penjelasan / alasan mengapa keterlambatan ini terjadi untuk
                proses dokumentasi.
              </p>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm text-black"
                placeholder="Tuliskan alasan spesifik..."
              />
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(null);
                  setFeedbackText("");
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitOverdueFeedback}
                disabled={!feedbackText.trim()}
                className="px-4 py-2 bg-status-error text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Submit Feedback & Permanently Mark Overdue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
