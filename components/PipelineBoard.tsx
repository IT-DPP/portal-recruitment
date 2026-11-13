"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  AlertCircle,
  Clock,
  Search,
  User as UserIcon,
  CalendarClock,
  Ban,
  CheckCircle,
  Lock,
  CheckSquare,
  Square,
  ArrowRightCircle,
  Users,
  X,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  updateApplicationStage,
  bulkAdvanceApplicationStage,
  bulkRejectApplications,
  bulkAddToTalentPool,
} from "@/app/actions/job";

interface PipelineBoardProps {
  jobId: string;
  timeline: any[]; // The active stages for this job
  initialApplications?: any[];
  pipelineStages?: any[];
}

export default function PipelineBoard({
  jobId,
  timeline,
  initialApplications = [],
  pipelineStages = [],
}: PipelineBoardProps) {
  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  const [slaConfig, setSlaConfig] = useState<Record<string, { totalDays: number; reminderDays: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Multi-selection state
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());

  // Bulk modals state
  const [showBulkAdvanceModal, setShowBulkAdvanceModal] = useState(false);
  const [selectedTargetStageId, setSelectedTargetStageId] = useState("");
  const [bulkAdvanceNote, setBulkAdvanceNote] = useState("");

  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState("Kualifikasi Belum Sesuai Kebutuhan Klien");
  const [customRejectReason, setCustomRejectReason] = useState("");

  const [isBulkPending, setIsBulkPending] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Single candidate Modals state
  const [showOverdueModal, setShowOverdueModal] = useState<string | null>(null);
  const [overdueNote, setOverdueNote] = useState("");
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    setApplications(initialApplications);

    const profiles: Record<string, any> = {};
    initialApplications.forEach((app: any) => {
      if (app.candidateProfile) {
        const photoDoc = app.candidateProfile.documents?.find((d: any) => {
          const dt = (d.documentType || "").toLowerCase();
          return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
        });

        const photoUrl = photoDoc?.objectKey
          ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
          : photoDoc?.fileUrl || app.candidateProfile.user?.image || null;

        profiles[app.candidateProfileId] = {
          ...app.candidateProfile,
          fullName: app.candidateProfile.user?.name || "Unknown",
          nik: app.candidateProfile.nik,
          filePhoto: photoUrl ? { base64: photoUrl } : null,
        };
      }
    });
    setCandidateProfiles(profiles);
    setSlaConfig({});
  }, [initialApplications]);

  // Multi-selection toggles
  const toggleSelectApp = (appId: string) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const toggleSelectStage = (stageAppIds: string[]) => {
    if (stageAppIds.length === 0) return;
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      const allSelected = stageAppIds.every((id) => next.has(id));
      if (allSelected) {
        stageAppIds.forEach((id) => next.delete(id));
      } else {
        stageAppIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedAppIds(new Set());
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedAppId) return;

    const appIndex = applications.findIndex((a: any) => a.id === draggedAppId);

    if (appIndex !== -1) {
      const app = applications[appIndex];

      if (app.currentStageId === targetStageId) {
        setDraggedAppId(null);
        return;
      }

      // Check offering letter locked
      const stageDataStr = app.stageData;
      const stageData = stageDataStr ? (typeof stageDataStr === "string" ? JSON.parse(stageDataStr) : stageDataStr) : {};
      if (app.currentStageId === "stage_6" && targetStageId !== "stage_6" && targetStageId !== "Rejected") {
        const d = stageData.offeringLetter || {};
        if (d.candidateResponse?.status !== "ACCEPTED") {
          setErrorModal("Kandidat belum menyetujui dan menandatangani Offering Letter. Pemindahan tahap dikunci.");
          setDraggedAppId(null);
          return;
        }
      }

      const res = await updateApplicationStage(draggedAppId, targetStageId, "Dipindahkan via Kanban Board");

      if (res.success) {
        window.location.reload();
      } else {
        setErrorModal(res.error || "Gagal memindahkan kandidat");
      }
    }
    setDraggedAppId(null);
  };

  // Bulk Advance Submit
  const handleConfirmBulkAdvance = async () => {
    if (!selectedTargetStageId) {
      alert("Pilih tahapan tujuan terlebih dahulu.");
      return;
    }

    const appIds = Array.from(selectedAppIds);
    setIsBulkPending(true);

    try {
      const res = await bulkAdvanceApplicationStage(
        appIds,
        selectedTargetStageId,
        bulkAdvanceNote.trim() || undefined
      );

      if (res.success && res.data) {
        setBulkFeedback({
          type: "success",
          message: `Berhasil meloloskan ${res.data.updatedCount} kandidat ke tahap baru.${
            res.data.skippedCount > 0 ? ` (${res.data.skippedCount} dilewati karena belum konfirmasi Offering)` : ""
          }`,
        });
        setShowBulkAdvanceModal(false);
        clearSelection();
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert(res.error || "Gagal memindahkan kandidat secara massal.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat memproses pergerakan massal.");
    } finally {
      setIsBulkPending(false);
    }
  };

  // Bulk Reject Submit
  const handleConfirmBulkReject = async () => {
    const finalReason =
      selectedRejectReason === "Lainnya"
        ? customRejectReason.trim() || "Kualifikasi belum sesuai kebutuhan"
        : selectedRejectReason;

    const appIds = Array.from(selectedAppIds);
    setIsBulkPending(true);

    try {
      const res = await bulkRejectApplications(appIds, finalReason);
      if (res.success) {
        setBulkFeedback({
          type: "success",
          message: `Berhasil menolak ${res.count} kandidat dengan alasan: "${finalReason}".`,
        });
        setShowBulkRejectModal(false);
        clearSelection();
        setTimeout(() => window.location.reload(), 1200);
      } else {
        alert(res.error || "Gagal menolak kandidat massal.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat memproses penolakan massal.");
    } finally {
      setIsBulkPending(false);
    }
  };

  // Bulk Talent Pool Submit
  const handleBulkTalentPool = async () => {
    const selectedApps = applications.filter((a) => selectedAppIds.has(a.id));
    const profileIds = Array.from(new Set(selectedApps.map((a) => a.candidateProfileId).filter(Boolean)));

    if (profileIds.length === 0) {
      alert("Tidak ada profil kandidat yang valid.");
      return;
    }

    if (!confirm(`Pindahkan ${profileIds.length} profil kandidat ke Talent Pool?`)) {
      return;
    }

    setIsBulkPending(true);
    try {
      const res = await bulkAddToTalentPool(profileIds);
      if (res.success) {
        setBulkFeedback({
          type: "success",
          message: `Berhasil memindahkan ${res.count} kandidat ke Talent Pool.`,
        });
        clearSelection();
        setTimeout(() => setBulkFeedback(null), 3000);
      } else {
        alert(res.error || "Gagal memindahkan ke Talent Pool.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsBulkPending(false);
    }
  };

  // Submit Overdue Note
  const submitOverdueNote = async () => {
    if (!showOverdueModal || !overdueNote.trim()) return;

    const appIndex = applications.findIndex((a: any) => a.id === showOverdueModal);
    if (appIndex !== -1) {
      const appToUpdate = { ...applications[appIndex] };
      const currentNotes = appToUpdate.stageNotes || {};
      appToUpdate.stageNotes = {
        ...currentNotes,
        [appToUpdate.currentStageId]: overdueNote,
      };

      const { updateApplicationStageData } = await import("@/app/actions/job");
      await updateApplicationStageData(showOverdueModal, {
        stageNotes: appToUpdate.stageNotes,
      });

      const updatedApps = applications.map((app: any) =>
        app.id === showOverdueModal ? appToUpdate : app
      );
      setApplications(updatedApps);
    }

    setShowOverdueModal(null);
    setOverdueNote("");
  };

  const getStageStatus = (stageId: string) => {
    const stageInfo = timeline.find((t) => t.id === stageId || t.stageId === stageId);
    if (!stageInfo || stageInfo.status === "Completed") return { type: "normal" };

    const stageTitle = (stageInfo.title || stageInfo.stage?.name || "").toLowerCase();
    const isUnlimited =
      stageInfo.slaDays === 0 ||
      stageInfo.stage?.slaDays === 0 ||
      ["stage_8", "stage_9", "stage_10"].includes(stageInfo.stageId || stageInfo.id) ||
      ["training", "induction", "pkwt"].some((n) => stageTitle.includes(n));

    if (isUnlimited) return { type: "normal" };

    const deadline = new Date(stageInfo.deadlineDate);
    const now = new Date();

    if (now > deadline) return { type: "overdue" };

    const sla = slaConfig[stageId];
    if (sla && sla.reminderDays > 0) {
      const reminderDate = new Date(deadline);
      reminderDate.setDate(reminderDate.getDate() - sla.reminderDays);
      if (now >= reminderDate && now <= deadline) {
        return { type: "reminder" };
      }
    }

    return { type: "normal" };
  };

  const filteredApps = applications.filter((app) => {
    const stageInfo = timeline.find((t) => t.id === app.currentStageId || t.stageId === app.currentStageId);
    const stageTitle = (stageInfo?.title || stageInfo?.stage?.name || "").toLowerCase();
    const isPostMcuStage =
      ["stage_8", "stage_9", "stage_10"].includes(app.currentStageId) ||
      ["training", "induction", "pkwt"].some((n) => stageTitle.includes(n));

    if (app.status !== "ACTIVE" && !(app.status === "HIRED" && isPostMcuStage)) return false;
    const profile = candidateProfiles[app.candidateProfileId];
    if (!profile) return false;
    if (!searchQuery) return true;
    return (
      profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.nik?.includes(searchQuery)
    );
  });

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] bg-white rounded-xl border border-dashed border-slate-300 text-center p-8 mt-6">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <Clock className="w-7 h-7 text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Pipeline Belum Dikonfigurasi</h3>
        <p className="text-xs text-slate-500 max-w-md">
          Lowongan ini belum memiliki tahapan (timeline) seleksi aktif. Lengkapi data timeline lowongan untuk mulai mengelola alur kandidat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] relative">
      {/* Search & Bulk Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Candidate Pipeline</h3>
          <p className="text-xs text-slate-500">
            Kelola tahapan kandidat secara drag-and-drop atau gunakan multi-select untuk aksi massal.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kandidat atau NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all bg-white text-slate-900 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Floating Bulk Feedback Alert */}
      {bulkFeedback && (
        <div
          className={`mb-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shrink-0 ${
            bulkFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{bulkFeedback.message}</span>
          </div>
          <button onClick={() => setBulkFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto flex gap-4 pb-20 custom-scrollbar overscroll-x-contain">
        {timeline.map((stage) => {
          const stageApps = filteredApps.filter(
            (a) => a.currentStageId === (stage.stageId || stage.id)
          );
          const stageStatus = getStageStatus(stage.id);
          const stageAppIds = stageApps.map((a: any) => a.id);
          const isAllStageSelected =
            stageAppIds.length > 0 && stageAppIds.every((id) => selectedAppIds.has(id));

          return (
            <div
              key={stage.id}
              className={`w-[320px] shrink-0 bg-slate-50/70 border rounded-xl flex flex-col max-h-full transition-colors ${
                stageStatus.type === "overdue"
                  ? "border-red-300"
                  : stageStatus.type === "reminder"
                  ? "border-amber-300"
                  : "border-slate-200"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b rounded-t-xl shrink-0 ${
                  stageStatus.type === "overdue"
                    ? "bg-red-50 border-red-200"
                    : stageStatus.type === "reminder"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectStage(stageAppIds)}
                      disabled={stageApps.length === 0}
                      title={isAllStageSelected ? "Batalkan pilihan di kolom ini" : "Pilih semua kandidat di kolom ini"}
                      className={`p-1 rounded text-xs transition-colors shrink-0 ${
                        isAllStageSelected
                          ? "bg-primary text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      }`}
                    >
                      {isAllStageSelected ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <h4 className="font-bold text-xs text-slate-800 truncate" title={stage.title}>
                      {stage.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      stageStatus.type === "overdue"
                        ? "bg-red-200 text-red-800"
                        : stageStatus.type === "reminder"
                        ? "bg-amber-200 text-amber-800"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {stageApps.length}
                  </span>
                </div>

                <p className="text-[10px] font-mono font-medium flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3 h-3" />
                  Batas:{" "}
                  {stage.slaDays === 0 ||
                  stage.stage?.slaDays === 0 ||
                  ["stage_8", "stage_9", "stage_10"].includes(stage.stageId || stage.id) ||
                  ["training", "induction", "pkwt"].some((n) =>
                    (stage.title || stage.stage?.name || "").toLowerCase().includes(n)
                  )
                    ? "No Limit (Lifetime SLA)"
                    : new Date(stage.deadlineDate).toLocaleDateString("id-ID")}
                </p>

                {stageStatus.type === "overdue" && (
                  <div className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-100 inline-flex items-center gap-1 px-1.5 py-0.5 rounded">
                    <AlertCircle className="w-3 h-3" /> Overdue
                  </div>
                )}
                {stageStatus.type === "reminder" && (
                  <div className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 inline-flex items-center gap-1 px-1.5 py-0.5 rounded">
                    <CalendarClock className="w-3 h-3" /> Reminder Deadline
                  </div>
                )}
              </div>

              {/* Cards List */}
              <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar bg-slate-50/50">
                {stageApps.map((app) => {
                  const profile = candidateProfiles[app.candidateProfileId] || {};
                  const isAppOverdue = stageStatus.type === "overdue";
                  const hasNote = app.stageNotes && app.stageNotes[app.currentStageId];
                  const isSelected = selectedAppIds.has(app.id);

                  let appStageData: any = {};
                  if (app.stageData) {
                    try {
                      appStageData =
                        typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData;
                    } catch {
                      appStageData = {};
                    }
                  }
                  const isOfferingStage = app.currentStageId === "stage_6";
                  const offeringResponseStatus = appStageData.offeringLetter?.candidateResponse?.status;
                  const isOfferingLocked = isOfferingStage && offeringResponseStatus !== "ACCEPTED";

                  return (
                    <div
                      key={app.id}
                      draggable={!isOfferingLocked}
                      onDragStart={(e) => {
                        if (isOfferingLocked) {
                          e.preventDefault();
                          return;
                        }
                        handleDragStart(e, app.id);
                      }}
                      className={`
                        bg-white p-3.5 rounded-xl border transition-all relative
                        ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/30 shadow-md bg-blue-50/20"
                            : "border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                        }
                        ${
                          isOfferingLocked
                            ? "cursor-default border-amber-200 bg-amber-50/20"
                            : "cursor-grab active:cursor-grabbing"
                        }
                        ${isAppOverdue && !hasNote ? "border-l-4 border-l-red-500" : ""}
                      `}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox for bulk actions */}
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectApp(app.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                            aria-label={`Pilih ${profile.fullName || "kandidat"}`}
                          />
                        </div>

                        {/* Candidate Avatar */}
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 mt-0.5">
                          {profile.filePhoto?.base64 ? (
                            <img
                              src={profile.filePhoto.base64}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Candidate Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">
                            {profile.fullName || "Unknown"}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {profile.nik || "No NIK"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 mb-2">
                            <span className="text-[9px] text-slate-400">
                              Applied: {new Date(app.applicationDate).toLocaleDateString("id-ID")}
                            </span>
                            {app.status === "HIRED" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded uppercase">
                                Hired
                              </span>
                            )}
                          </div>

                          {/* Offering Status */}
                          {isOfferingStage && (
                            <div className="mb-2">
                              {offeringResponseStatus === "ACCEPTED" ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded flex items-center gap-1 justify-center">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Disetujui
                                </span>
                              ) : offeringResponseStatus === "DECLINED" ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded flex items-center gap-1 justify-center">
                                  <Ban className="w-3 h-3 text-red-600" /> Ditolak
                                </span>
                              ) : (
                                <span
                                  className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded flex items-center gap-1 justify-center"
                                  title="Menunggu persetujuan surat penawaran dari kandidat"
                                >
                                  <Lock className="w-3 h-3 text-amber-600" /> Menunggu Konfirmasi
                                </span>
                              )}
                            </div>
                          )}

                          <a
                            href={`/dashboard/job-openings/${jobId}/verify/${app.candidateProfileId}`}
                            className="inline-block w-full text-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold rounded-lg transition-colors border border-slate-200"
                          >
                            Verifikasi Detail
                          </a>
                        </div>
                      </div>

                      {/* Overdue Alert Bar */}
                      {isAppOverdue && (
                        <div className="mt-2 pt-2 border-t border-red-100">
                          {hasNote ? (
                            <div className="text-[10px] text-red-800 bg-red-50 p-1.5 rounded">
                              <span className="font-bold">Overdue Note:</span> {hasNote}
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowOverdueModal(app.id)}
                              className="w-full py-1 flex items-center justify-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                            >
                              <AlertCircle className="w-3 h-3" /> Tambah Catatan Overdue
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {stageApps.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Tidak ada kandidat
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Bottom Bulk Action Bar */}
      {selectedAppIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A2540] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 max-w-3xl w-[92vw] animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-bold text-white">
              {selectedAppIds.size} Kandidat Dipilih
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Default target stage to next stage
                setSelectedTargetStageId(timeline[1]?.id || timeline[0]?.id || "");
                setShowBulkAdvanceModal(true);
              }}
              disabled={isBulkPending}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" /> Loloskan ke Tahap...
            </button>
            <button
              onClick={() => setShowBulkRejectModal(true)}
              disabled={isBulkPending}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" /> Tolak Massal
            </button>
            <button
              onClick={handleBulkTalentPool}
              disabled={isBulkPending}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> Talent Pool
            </button>
          </div>
        </div>
      )}

      {/* Bulk Advance Modal */}
      {showBulkAdvanceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-advance-title"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-[#0A2540] text-white flex items-center justify-between">
              <h3 id="bulk-advance-title" className="text-sm font-bold flex items-center gap-2">
                <ArrowRightCircle className="w-4 h-4 text-emerald-400" />
                Loloskan Massal ({selectedAppIds.size} Kandidat)
              </h3>
              <button
                onClick={() => setShowBulkAdvanceModal(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Tahapan Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTargetStageId}
                  onChange={(e) => setSelectedTargetStageId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {timeline.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                  <option value="Hired">Lulus Rekrutmen (Hired)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kemajuan (Opsional)
                </label>
                <input
                  type="text"
                  value={bulkAdvanceNote}
                  onChange={(e) => setBulkAdvanceNote(e.target.value)}
                  placeholder="Contoh: Lolos verifikasi berkas batch 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => setShowBulkAdvanceModal(false)}
                disabled={isBulkPending}
                className="px-3.5 py-1.5 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBulkAdvance}
                disabled={isBulkPending}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {isBulkPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Loloskan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-reject-title"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-red-700 text-white flex items-center justify-between">
              <h3 id="bulk-reject-title" className="text-sm font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Tolak Massal ({selectedAppIds.size} Kandidat)
              </h3>
              <button
                onClick={() => setShowBulkRejectModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Pilih alasan standar penolakan kandidat. Status kandidat akan diubah menjadi{" "}
                <span className="font-bold text-red-600">REJECTED</span> dan tercatat dalam audit log.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan Standar
                </label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
                >
                  <option value="Kualifikasi Belum Sesuai Kebutuhan Klien">
                    Kualifikasi Belum Sesuai Kebutuhan Klien
                  </option>
                  <option value="Hasil Asesmen / Interview Tidak Memenuhi Standar">
                    Hasil Asesmen / Interview Tidak Memenuhi Standar
                  </option>
                  <option value="Hasil MCU Unfit / Tidak Lolos Standar Medis Klien">
                    Hasil MCU Unfit / Tidak Lolos Standar Medis Klien
                  </option>
                  <option value="Kandidat Mengundurkan Diri / Tidak Hadir">
                    Kandidat Mengundurkan Diri / Tidak Hadir
                  </option>
                  <option value="Ekspektasi Kompensasi Melebihi Budget Klien">
                    Ekspektasi Kompensasi Melebihi Budget Klien
                  </option>
                  <option value="Lainnya">Lainnya (Tulis Manual)</option>
                </select>
              </div>

              {selectedRejectReason === "Lainnya" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detail Alasan Penolakan
                  </label>
                  <textarea
                    rows={2}
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Tuliskan alasan spesifik..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                  />
                </div>
              )}
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => setShowBulkRejectModal(false)}
                disabled={isBulkPending}
                className="px-3.5 py-1.5 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBulkReject}
                disabled={isBulkPending}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {isBulkPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Konfirmasi Tolak Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Skip Modal */}
      {errorModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-red-50 flex items-center justify-between">
              <h3 className="font-bold text-xs text-red-700 flex items-center gap-2">
                <Ban className="w-4 h-4" /> Perpindahan Ditolak
              </h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-700 leading-relaxed">{errorModal}</p>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Feedback Modal */}
      {showOverdueModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-red-50 flex items-center justify-between">
              <h3 className="font-bold text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Catatan Overdue SLA
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tahapan ini telah melewati batas SLA. Harap berikan catatan penyebab keterlambatan untuk kandidat ini.
              </p>
              <textarea
                rows={3}
                value={overdueNote}
                onChange={(e) => setOverdueNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500 text-xs text-slate-900"
                placeholder="Tuliskan penyebab keterlambatan di sini..."
              />
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowOverdueModal(null);
                  setOverdueNote("");
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitOverdueNote}
                disabled={!overdueNote.trim()}
                className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
