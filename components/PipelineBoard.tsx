"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, Search, User as UserIcon, CalendarClock, Ban } from "lucide-react";

interface PipelineBoardProps {
  jobId: string;
  timeline: any[]; // The active stages for this job
  initialApplications?: any[];
  pipelineStages?: any[];
}

export default function PipelineBoard({ jobId, timeline, initialApplications = [], pipelineStages = [] }: PipelineBoardProps) {
  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  const [slaConfig, setSlaConfig] = useState<Record<string, { totalDays: number; reminderDays: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Modals state
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
           filePhoto: photoUrl ? { base64: photoUrl } : null
         };
       }
    });
    setCandidateProfiles(profiles);

    // Timeline handles SLA internally
    setSlaConfig({});
  }, [initialApplications]);

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
      
      // If dropped in the same stage, do nothing to prevent duplicate history
      if (app.currentStageId === targetStageId) {
        setDraggedAppId(null);
        return;
      }

      // Validation: Prevent skipping stages
      const currentIndex = timeline.findIndex(t => t.stageId === app.currentStageId);
      const targetIndex = timeline.findIndex(t => t.stageId === targetStageId);
      
      if (targetIndex > currentIndex + 1) {
        setErrorModal("Tidak dapat melewati (skip) stage! Harap pindahkan kandidat secara berurutan sesuai timeline.");
        setDraggedAppId(null);
        return;
      }
      
      // Validations
      const stageDataStr = app.stageData;
      const stageData = stageDataStr ? (typeof stageDataStr === 'string' ? JSON.parse(stageDataStr) : stageDataStr) : {};

      if (app.currentStageId === "stage_1") {
         if (!stageData.bnspValidation?.isApproved) {
           setErrorModal("Validasi BNSP (Administration) belum ditandai sebagai 'Approved'. Harap lakukan verifikasi detail pada kandidat ini terlebih dahulu.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_2") {
         const d = stageData.hrInterview || {};
         if (!d.result || !d.date || !d.feedback || !d.file || !d.resultFile) {
           setErrorModal("Anda harus melengkapi seluruh form pada stage Interview HR sebelum melanjutkan ke tahap berikutnya.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_3") {
         const d = stageData.psikotes || {};
         if (!d.result || !d.date || !d.file) {
           setErrorModal("Anda harus melengkapi seluruh form pada stage Psikotes sebelum melanjutkan ke tahap berikutnya.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_4") {
         const d = stageData.testSkill || {};
         if (!d.date || !d.videoLink || !d.proofs || d.proofs.length === 0 || !d.proofs.every((p:any) => p.title && p.file) || !d.resultFile) {
           setErrorModal("Anda harus melengkapi seluruh form pada stage Test Skill (Tanggal, Link Video, Bukti, dan Hasil Penilaian) sebelum melanjutkan ke tahap berikutnya.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_5") {
         const d = stageData.userInterview || {};
         if (!d.result || !d.date || !d.feedback || !d.file) {
           setErrorModal("Anda harus melengkapi seluruh form pada stage Interview User sebelum melanjutkan ke tahap berikutnya.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_6") {
         const d = stageData.offeringLetter || {};
         if (!d.date || !d.file) {
           setErrorModal("Anda harus melengkapi seluruh form pada stage Offering Letter sebelum melanjutkan ke tahap berikutnya.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_7") {
         const d = stageData.mcu || {};
         if (!d.date || !d.pengantarFile || !d.hasilFile) {
           setErrorModal("Anda harus melengkapi seluruh form pada stage MCU sebelum melanjutkan ke tahap berikutnya.");
           setDraggedAppId(null);
           return;
         }
      } else if (app.currentStageId === "stage_8") {
        // Training: Document store stage (recap)
      } else if (app.currentStageId === "stage_9") {
        // Induction: Document store stage (recap)
      } else if (app.currentStageId === "stage_10") {
        // PKWT: Document store stage (recap)
      }

      const { updateApplicationStage } = await import("@/app/actions/job");
      const res = await updateApplicationStage(draggedAppId, targetStageId, "Moved via Kanban Board");
      
      if (res.success) {
        // We need router.refresh() to refetch applications. We will use window.location.reload() temporarily or if router is unavailable.
        window.location.reload();
      } else {
        setErrorModal(res.error || "Gagal memindahkan kandidat.");
      }
    }
    
    setDraggedAppId(null);
  };

  const submitOverdueNote = () => {
    if (!overdueNote.trim() || !showOverdueModal) return;

    const appToUpdate = applications.find((a: any) => a.id === showOverdueModal);
    
    if (appToUpdate) {
      if (!appToUpdate.stageNotes) appToUpdate.stageNotes = {};
      appToUpdate.stageNotes[appToUpdate.currentStageId] = overdueNote;
      
      // Getting current user
      let actor = "System";
      let actorEmail = "";
      const loggedUserStr = localStorage.getItem("nexus_logged_user");
      if (loggedUserStr) {
        try {
          const userObj = JSON.parse(loggedUserStr);
          actor = userObj.fullName || userObj.username || "System";
          actorEmail = userObj.email || "";
        } catch (e) {}
      }

      // Also record this in candidate history
      if (!appToUpdate.history) appToUpdate.history = [];
      const stageName = timeline.find((t: any) => t.stageId === appToUpdate.currentStageId)?.title || appToUpdate.currentStageId;
      appToUpdate.history.push({
        stageId: appToUpdate.currentStageId,
        stageName: `${stageName} (Overdue Note Added)`,
        date: new Date().toISOString(),
        note: overdueNote,
        actor,
        actorEmail
      });
      
      const updatedApps = applications.map((app: any) => 
        app.id === showOverdueModal ? appToUpdate : app
      );
      
      // Temporarily use local state, should be migrated to DB
      setApplications(updatedApps);
    }
    
    setShowOverdueModal(null);
    setOverdueNote("");
  };

  // Determine stage visual state (Normal, Reminder, Overdue)
  const getStageStatus = (stageId: string) => {
    const stageInfo = timeline.find(t => t.id === stageId || t.stageId === stageId);
    if (!stageInfo || stageInfo.status === "Completed") return { type: "normal" };

    const stageTitle = (stageInfo.title || stageInfo.stage?.name || "").toLowerCase();
    const isUnlimited = stageInfo.slaDays === 0 || 
      stageInfo.stage?.slaDays === 0 || 
      ['stage_8', 'stage_9', 'stage_10'].includes(stageInfo.stageId || stageInfo.id) ||
      ['training', 'induction', 'pkwt'].some(n => stageTitle.includes(n));
      
    if (isUnlimited) {
      return { type: "normal" };
    }
    
    const deadline = new Date(stageInfo.deadlineDate);
    const now = new Date();
    
    if (now > deadline) {
      return { type: "overdue" };
    }
    
    // Check reminder
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
    const stageInfo = timeline.find(t => t.id === app.currentStageId || t.stageId === app.currentStageId);
    const stageTitle = (stageInfo?.title || stageInfo?.stage?.name || "").toLowerCase();
    const isPostMcuStage = ['stage_8', 'stage_9', 'stage_10'].includes(app.currentStageId) ||
      ['training', 'induction', 'pkwt'].some(n => stageTitle.includes(n));

    if (app.status !== "ACTIVE" && !(app.status === "HIRED" && isPostMcuStage)) return false;
    const profile = candidateProfiles[app.candidateProfileId];
    if (!profile) return false;
    if (!searchQuery) return true;
    return profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           profile.nik?.includes(searchQuery);
  });

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-xl border-2 border-dashed border-outline-variant text-center p-8 mt-6">
        <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-on-surface-variant" />
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">Pipeline Belum Tersedia</h3>
        <p className="text-sm text-on-surface-variant max-w-md">
          Lowongan ini masih dalam status <strong>Draft</strong> atau belum memiliki tahapan (timeline) seleksi yang dikonfigurasi. Harap lengkapi timeline lowongan terlebih dahulu sebelum mengelola kandidat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {/* Header & Search */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-on-surface">Candidate Pipeline</h3>
          <p className="text-sm text-on-surface-variant">Drag and drop candidates across stages.</p>
        </div>
        <div className="relative w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search candidate by name or NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4">
        {timeline.map((stage) => {
          const stageApps = filteredApps.filter(a => a.currentStageId === (stage.stageId || stage.id));
          const stageStatus = getStageStatus(stage.id);
          
          return (
            <div 
              key={stage.id} 
              className={`w-[320px] shrink-0 bg-surface-container-lowest border rounded-xl flex flex-col max-h-full transition-colors ${
                stageStatus.type === "overdue" ? "border-red-300" :
                stageStatus.type === "reminder" ? "border-yellow-300" : "border-table-border"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`p-4 border-b rounded-t-xl shrink-0 ${
                stageStatus.type === "overdue" ? "bg-red-50 border-red-200" :
                stageStatus.type === "reminder" ? "bg-yellow-50 border-yellow-200" : "bg-surface-bright border-table-border"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-on-surface truncate pr-2">{stage.title}</h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    stageStatus.type === "overdue" ? "bg-red-200 text-red-800" :
                    stageStatus.type === "reminder" ? "bg-yellow-200 text-yellow-800" : "bg-primary/10 text-primary"
                  }`}>
                    {stageApps.length}
                  </span>
                </div>
                <p className="text-[11px] font-mono font-semibold flex items-center gap-1.5 text-on-surface-variant">
                  <Clock className="w-3.5 h-3.5" /> 
                  Batas: {stage.slaDays === 0 || stage.stage?.slaDays === 0 || ['stage_8', 'stage_9', 'stage_10'].includes(stage.stageId || stage.id) || ['training', 'induction', 'pkwt'].some(n => (stage.title || stage.stage?.name || "").toLowerCase().includes(n)) ? "No Limit (Lifetime SLA)" : new Date(stage.deadlineDate).toLocaleDateString("id-ID")}
                </p>
                
                {stageStatus.type === "overdue" && (
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100/50 inline-block px-2 py-1 rounded flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Overdue
                  </div>
                )}
                {stageStatus.type === "reminder" && (
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-yellow-700 bg-yellow-100/50 inline-block px-2 py-1 rounded flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" /> Reminder Deadline
                  </div>
                )}
              </div>
              
              <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-surface-container-lowest">
                {stageApps.map((app) => {
                  const profile = candidateProfiles[app.candidateProfileId] || {};
                  const isAppOverdue = stageStatus.type === "overdue";
                  const hasNote = app.stageNotes && app.stageNotes[app.currentStageId];

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className={`
                        bg-white p-4 rounded-xl border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative
                        ${isAppOverdue && !hasNote ? "border-red-400 border-l-4" : "border-outline-variant hover:border-primary/50"}
                      `}
                    >
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                          {profile.filePhoto?.base64 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.filePhoto.base64} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-on-surface-variant" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-black truncate">{profile.fullName || "Unknown"}</h5>
                          <p className="text-xs text-on-surface-variant font-mono truncate">{profile.nik || "No NIK"}</p>
                          <div className="flex items-center gap-2 mt-1 mb-2">
                            <p className="text-[10px] text-on-surface-variant">Applied: {new Date(app.applicationDate).toLocaleDateString("id-ID")}</p>
                            {app.isDraft && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-sm uppercase">Draft</span>
                            )}
                            {app.status === "HIRED" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded uppercase">Hired</span>
                            )}
                          </div>
                          
                          <a 
                            href={`/dashboard/job-openings/${jobId}/verify/${app.candidateProfileId}`}
                            className="inline-block w-full text-center px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded hover:bg-primary/20 transition-colors"
                          >
                            Detail Verification
                          </a>
                        </div>
                      </div>

                      {/* Overdue Warning */}
                      {isAppOverdue && (
                        <div className="mt-3 pt-3 border-t border-red-100">
                          {hasNote ? (
                            <div className="text-xs text-red-800 bg-red-50 p-2 rounded">
                              <span className="font-bold">Overdue Note:</span> {hasNote}
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowOverdueModal(app.id)}
                              className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Add Overdue Note
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {stageApps.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant text-sm border-2 border-dashed border-outline-variant rounded-xl opacity-50">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Skip Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-table-border bg-surface-container-lowest flex items-center justify-between">
              <h3 className="font-bold text-status-error flex items-center gap-2">
                <Ban className="w-5 h-5" /> Invalid Move
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-black">{errorModal}</p>
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end">
              <button
                onClick={() => setErrorModal(null)}
                className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded hover:bg-primary-container transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Modal */}
      {showOverdueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-table-border bg-surface-container-lowest flex items-center justify-between">
              <h3 className="font-bold text-status-error flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Candidate Overdue
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-black mb-4">
                Tahapan ini telah melewati batas SLA. Harap berikan catatan (feedback) penyebab keterlambatan untuk kandidat ini.
              </p>
              <textarea
                rows={4}
                value={overdueNote}
                onChange={(e) => setOverdueNote(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm text-black"
                placeholder="Write overdue reason here..."
              />
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOverdueModal(null);
                  setOverdueNote("");
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitOverdueNote}
                disabled={!overdueNote.trim()}
                className="px-4 py-2 bg-status-error text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
