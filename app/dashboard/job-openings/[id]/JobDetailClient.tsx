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
import { publishJob } from "@/app/actions/job";

interface JobDetailClientProps {
  initialJob: any;
  sites: any[];
  customers: any[];
  provinces: any[];
  cities: any[];
  pipelineStages: any[];
  siteSlas: any[];
}

export default function JobDetailClient({
  initialJob,
  sites,
  customers,
  provinces,
  cities,
  pipelineStages,
  siteSlas,
}: JobDetailClientProps) {
  const router = useRouter();
  const modal = useModal();
  const [job, setJob] = useState<any>(initialJob);
  const [slaConfig, setSlaConfig] = useState<any>(null);

  // For overdue feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(
    null,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "pipeline" | "hired">("details");
  const [hiredCandidates, setHiredCandidates] = useState<any[]>([]);

  // B1 Form Edit State
  const [isEditingB1, setIsEditingB1] = useState(false);
  const [tempB1, setTempB1] = useState("");

  useEffect(() => {
    // Generate prototype SLA config from db records
    let config: any = {};
    if (initialJob.site?.useSpecificSla && siteSlas.length > 0) {
      siteSlas.forEach((s: any) => {
        const stage = pipelineStages.find(p => p.id === s.stageId);
        if (stage) config[stage.id] = { totalDays: s.slaDays };
      });
    } else {
      pipelineStages.forEach(p => {
        config[p.id] = { totalDays: p.slaDays };
      });
    }
    // Convert DB timeline to prototype shape if they exist
    if (initialJob.timeline && initialJob.timeline.length > 0) {
      const formattedTimeline = initialJob.timeline.map((t: any) => ({
        id: t.stage.id,
        title: t.stage.name,
        status: t.status,
        startDate: t.startDate,
        deadlineDate: t.deadlineDate,
        completionDate: t.completionDate,
        overdueNotes: t.overdueNotes
      }));
      setJob({ ...initialJob, timeline: formattedTimeline, globalStatus: initialJob.status === 'DRAFT' ? 'Draft' : initialJob.status, posisi: initialJob.positionName || initialJob.position?.name || "Posisi Umum" });
    } else {
      setJob({ ...initialJob, globalStatus: initialJob.status === 'DRAFT' ? 'Draft' : initialJob.status, posisi: initialJob.positionName || initialJob.position?.name || "Posisi Umum" });
    }
    setSlaConfig(config);

    const hired = (initialJob.applications || []).filter((a: any) => 
      a.status === "HIRED" || a.currentStageId === "Hired"
    );
    const hiredWithProfiles = hired.map((app: any) => {
      const p = app.candidateProfile || {};
      const u = p.user || {};
      const photoDoc = p.documents?.find((d: any) => {
        const dt = (d.documentType || "").toLowerCase();
        return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
      });
      const photoUrl = photoDoc?.objectKey 
        ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
        : photoDoc?.fileUrl || u.image || null;

      return {
        ...app,
        profile: {
          ...p,
          fullName: u.name || p.fullName || "Unknown",
          email: u.email || p.email || "-",
          whatsapp: p.whatsapp || p.phone || "-",
          domicileAddress: p.domicileAddress || p.address || "-",
          latestEducation: p.latestEducation || "-",
          photoUrl
        },
        candidateId: app.candidateProfileId
      };
    });
    setHiredCandidates(hiredWithProfiles);
  }, [initialJob, siteSlas, pipelineStages]);

  const getSiteName = (siteId: string) =>
    sites.find((s) => s.id === siteId)?.name || siteId || "-";
  const getCustomerName = (cId: string) =>
    customers.find((c) => c.id === cId)?.name || cId || "-";
  const getProvinceName = (pId: string) =>
    provinces.find((p) => p.id === pId)?.name || pId || "-";
  const getCityName = (cId: string) =>
    cities.find((c) => c.id === cId)?.name || cId || "-";

  const saveJobState = (updatedJob: any) => {
    setJob(updatedJob);
    // Note: Since this is stage 2 migration, pipeline updates will be persisted to DB in Stage 3 ATS.
    // For now we maintain the UI state.
  };

  const calculateTimelines = (
    publishDateStr: string,
    needTestSkill: boolean,
  ) => {
    const timelines: any[] = [];
    let currentDate = new Date(publishDateStr);

    pipelineStages.forEach((s) => {
      // Assuming Test Skill verification stage has a specific name or keyword
      if (s.name.includes("Test Skill") && !needTestSkill) return;

      const config = slaConfig[s.id] || { totalDays: 0 };
      const startDate = new Date(currentDate);
      const deadlineDate = new Date(currentDate);
      deadlineDate.setDate(deadlineDate.getDate() + config.totalDays);

      timelines.push({
        id: s.id,
        title: s.name,
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
    try {
      const { publishJobOpening } = await import("@/app/actions/job");
      const res = await publishJobOpening(job.id);
      if (res.success) {
        modal.alert("Berhasil", "Lowongan berhasil dipublish dan aktif dengan SLA yang sesuai.");
        window.location.reload(); // Reload to fetch fresh data from server
      } else {
        modal.alert("Error", res.error || "Gagal mempublish lowongan.");
      }
    } catch (e) {
      modal.alert("Error", "Terjadi kesalahan sistem.");
    }
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
            <>
              <Link
                href={`/dashboard/job-openings/${job.id}/edit`}
                className="px-4 py-2 bg-white text-primary border border-primary rounded text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                Edit Job
              </Link>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Publish Job
              </button>
            </>
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
        <button
          onClick={() => setActiveTab("hired")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === "hired"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          Hired Candidates
          {hiredCandidates.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">
              {hiredCandidates.length}
            </span>
          )}
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
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  No Form B1
                </p>
                {isEditingB1 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="text" 
                      value={tempB1} 
                      onChange={(e) => setTempB1(e.target.value)} 
                      className="px-2 py-1 border border-outline-variant rounded text-sm font-mono text-black w-48 focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Input No Form B1"
                    />
                    <button onClick={async () => {
                      const { updateJobOpening } = await import("@/app/actions/job");
                      const res = await updateJobOpening(job.id, { noFormB1: tempB1 });
                      if (res.success) {
                        saveJobState({ ...job, noFormB1: tempB1 });
                      } else {
                        modal.alert("Error", res.error || "Gagal menyimpan B1");
                      }
                      setIsEditingB1(false);
                    }} className="text-xs font-semibold bg-primary text-white px-2.5 py-1.5 rounded hover:bg-primary-container transition-colors">Save</button>
                    <button onClick={() => setIsEditingB1(false)} className="text-xs font-semibold bg-surface-container-low text-on-surface-variant px-2.5 py-1.5 rounded hover:bg-surface-container transition-colors">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-black font-mono">
                      {job.noFormB1 || "-"}
                    </p>
                    <button onClick={() => { setTempB1(job.noFormB1 || ""); setIsEditingB1(true); }} className="text-[11px] font-bold text-blue-600 hover:underline">Edit</button>
                  </div>
                )}
              </div>
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
                  {job.requiresSkillTest ? "Ya" : "Tidak"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-0.5">
                  Mewajibkan BNSP?
                </p>
                <p className="font-medium text-black flex items-center h-[24px]">
                  {job.requiresBnsp ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-bold uppercase tracking-wider border border-blue-200">
                      BNSP Required
                    </span>
                  ) : (
                    "Tidak"
                  )}
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
                        {/* Tandai Selesai button removed as staging is never manually closed */}
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
      ) : activeTab === "pipeline" ? (
        <PipelineBoard jobId={job.id} timeline={job.timeline} initialApplications={job.applications || []} pipelineStages={pipelineStages} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-table-border overflow-hidden">
          <div className="p-6 border-b border-table-border">
            <h3 className="font-bold text-on-surface">Kandidat Terpilih (Employees)</h3>
            <p className="text-sm text-on-surface-variant">Daftar kandidat yang telah berhasil melewati semua tahapan dan resmi menjadi karyawan.</p>
          </div>
          {hiredCandidates.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              Belum ada kandidat yang terpilih.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-lowest text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
                  <tr>
                    <th className="px-6 py-4">Kandidat</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4">Tahapan Onboarding</th>
                    <th className="px-6 py-4">Tanggal Hired</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-table-border">
                  {hiredCandidates.map((hc, idx) => {
                    const hiredHistory = hc.history?.find((h: any) => 
                      h.stageName?.toLowerCase() === "hired" || 
                      h.note?.toLowerCase().includes("hired") || 
                      h.stageId === "stage_8"
                    );
                    const hiredDate = hiredHistory 
                      ? new Date(hiredHistory.date || hiredHistory.createdAt).toLocaleDateString("id-ID") 
                      : (hc.updatedAt ? new Date(hc.updatedAt).toLocaleDateString("id-ID") : "-");
                    
                    const stageObj = pipelineStages.find((s: any) => s.id === hc.currentStageId);
                    const stageName = stageObj?.name || (hc.currentStageId === "stage_8" ? "Training" : hc.currentStageId === "stage_9" ? "Induction" : hc.currentStageId === "stage_10" ? "PKWT" : null);

                    return (
                      <tr key={idx} className="bg-white hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                              {hc.profile.photoUrl ? (
                                <img 
                                  src={hc.profile.photoUrl} 
                                  alt={hc.profile.fullName} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-primary">
                                  {hc.profile.fullName?.charAt(0)?.toUpperCase() || "C"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-black">{hc.profile.fullName || "Unknown"}</p>
                              <p className="text-xs text-on-surface-variant">{hc.profile.latestEducation || "-"} • {hc.profile.domicileAddress || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{hc.profile.email || "-"}</p>
                          <p className="text-xs text-on-surface-variant">{hc.profile.whatsapp || "-"}</p>
                        </td>
                        <td className="px-6 py-4">
                          {stageName ? (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                              {stageName} (Onboarding)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                              Active Employee
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold tracking-wide">
                            {hiredDate}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/job-openings/${job.id}/verify/${hc.candidateId}`} className="text-primary font-bold hover:underline">
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
