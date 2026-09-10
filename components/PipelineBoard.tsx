"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, Search, User as UserIcon, CalendarClock, Ban } from "lucide-react";

interface PipelineBoardProps {
  jobId: string;
  timeline: any[]; // The active stages for this job
}

export default function PipelineBoard({ jobId, timeline }: PipelineBoardProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  const [slaConfig, setSlaConfig] = useState<Record<string, { totalDays: number; reminderDays: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Modals state
  const [showOverdueModal, setShowOverdueModal] = useState<string | null>(null);
  const [overdueNote, setOverdueNote] = useState("");
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const loadData = () => {
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    setApplications(allApps.filter((a: any) => a.jobId === jobId));

    const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    setCandidateProfiles(profiles);

    const sla = JSON.parse(localStorage.getItem("ugz_master_sla") || "{}");
    setSlaConfig(sla);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (!draggedAppId) return;

    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === draggedAppId);
    
    if (appIndex !== -1) {
      const app = allApps[appIndex];
      
      // If dropped in the same stage, do nothing to prevent duplicate history
      if (app.currentStage === targetStageId) {
        setDraggedAppId(null);
        return;
      }

      // Validation: Prevent skipping stages
      const currentIndex = timeline.findIndex(t => t.id === app.currentStage);
      const targetIndex = timeline.findIndex(t => t.id === targetStageId);
      
      if (targetIndex > currentIndex + 1) {
        setErrorModal("Tidak dapat melewati (skip) stage! Harap pindahkan kandidat secara berurutan sesuai timeline.");
        setDraggedAppId(null);
        return;
      }

      // Allow move
      app.currentStage = targetStageId;
      app.isDraft = false; // Remove draft status when moved to another stage
      
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

      // Update history milestone
      if (!app.history) app.history = [];
      const stageName = timeline.find(t => t.id === targetStageId)?.title || targetStageId;
      app.history.push({
        stageId: targetStageId,
        stageName,
        date: new Date().toISOString(),
        actor,
        actorEmail
      });

      allApps[appIndex] = app;
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
      loadData();
    }
    
    setDraggedAppId(null);
  };

  const submitOverdueNote = () => {
    if (!overdueNote.trim() || !showOverdueModal) return;

    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appToUpdate = allApps.find((a: any) => a.id === showOverdueModal);
    
    if (appToUpdate) {
      if (!appToUpdate.stageNotes) appToUpdate.stageNotes = {};
      appToUpdate.stageNotes[appToUpdate.currentStage] = overdueNote;
      
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
      const stageName = timeline.find((t: any) => t.id === appToUpdate.currentStage)?.title || appToUpdate.currentStage;
      appToUpdate.history.push({
        stageId: appToUpdate.currentStage,
        stageName: `${stageName} (Overdue Note Added)`,
        date: new Date().toISOString(),
        note: overdueNote,
        actor,
        actorEmail
      });
      
      const updatedApps = allApps.map((app: any) => 
        app.id === showOverdueModal ? appToUpdate : app
      );
      localStorage.setItem("ugz_applications", JSON.stringify(updatedApps));
      loadData();
    }
    
    setShowOverdueModal(null);
    setOverdueNote("");
  };

  // Determine stage visual state (Normal, Reminder, Overdue)
  const getStageStatus = (stageId: string) => {
    const stageInfo = timeline.find(t => t.id === stageId);
    if (!stageInfo || stageInfo.status === "Completed") return { type: "normal" };
    
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
    const profile = candidateProfiles[app.candidateId];
    if (!profile) return false;
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
          const stageApps = filteredApps.filter(a => a.currentStage === stage.id);
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
                  Batas: {new Date(stage.deadlineDate).toLocaleDateString("id-ID")}
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
                  const profile = candidateProfiles[app.candidateId] || {};
                  const isAppOverdue = stageStatus.type === "overdue";
                  const hasNote = app.stageNotes && app.stageNotes[app.currentStage];

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
                          </div>
                          
                          <a 
                            href={`/dashboard/job-openings/${jobId}/verify/${app.candidateId}`}
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
