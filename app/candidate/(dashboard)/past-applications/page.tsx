"use client";

import React, { useEffect, useState } from "react";
import { Clock, FileText, ChevronRight, Building2, Ban, History } from "lucide-react";
import Link from "next/link";

export default function CandidateHistoryApplicationPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionStr = localStorage.getItem("nexus_candidate_session");
    if (!sessionStr) {
      setIsLoading(false);
      return;
    }
    const session = JSON.parse(sessionStr);

    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    // Filter only rejected applications
    const myApps = allApps.filter((app: any) => app.candidateId === session.id && app.currentStage === "Rejected");
    setApplications(myApps);

    const allJobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    setJobs(allJobs);
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-on-surface-variant font-medium">Loading applications...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">History Application</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Lihat riwayat lamaran yang telah selesai atau tidak lolos seleksi.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-table-border p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4 mx-auto">
            <History className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">No Past Applications</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Anda belum memiliki riwayat lamaran yang tidak lolos atau selesai.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const job = jobs.find((j) => j.id === app.jobId);
            if (!job) return null;

            // Extract the rejection note from history
            const rejectedMilestone = app.history?.find((h: any) => h.stageId === "Rejected");
            const rejectionReason = rejectedMilestone?.note?.replace("Reason: ", "") || "Tidak ada keterangan";
            const rejectedStageName = rejectedMilestone?.stageName || "Rejected";
            
            // Get the stage before rejection
            const historyWithoutReject = app.history?.filter((h: any) => h.stageId !== "Rejected") || [];
            const lastStage = historyWithoutReject.length > 0 
              ? historyWithoutReject[historyWithoutReject.length - 1].stageName 
              : "Administration";

            return (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden relative">
                <div className="absolute top-0 right-0 bg-red-100 text-red-700 px-4 py-1.5 rounded-bl-xl text-xs font-bold flex items-center gap-1.5 border-b border-l border-red-200">
                  <Ban className="w-3.5 h-3.5" /> Tidak Lolos Seleksi
                </div>
                
                {/* Header: Job Info */}
                <div className="p-6 border-b border-table-border bg-red-50/30 pt-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-on-surface">{job.posisi}</h3>
                      <p className="text-xs font-mono text-on-surface-variant font-semibold mt-1">Ref: {job.noRegistrasi}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white p-3 rounded-xl border border-red-100">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Status Lowongan</p>
                      <p className="font-bold text-black text-sm">{job.statusPermintaan}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-red-100">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Lokasi</p>
                      <p className="font-bold text-black text-sm truncate">{job.areaKerja || job.siteId || "-"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-red-100">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Tanggal Apply</p>
                      <p className="font-bold text-black text-sm truncate">{new Date(app.applicationDate).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-red-100">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Tahap Terakhir</p>
                      <p className="font-bold text-red-700 text-sm truncate">{lastStage}</p>
                    </div>
                  </div>
                </div>

                {/* Body: Rejection Details */}
                <div className="p-6 bg-white">
                  <h4 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" /> Alasan Penolakan / Feedback
                  </h4>
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 text-sm text-black leading-relaxed font-medium">
                    {rejectionReason}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
