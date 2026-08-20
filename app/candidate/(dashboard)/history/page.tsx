"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  FileText,
  ChevronRight,
  Building2,
  MapPin,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function CandidateHistoryPage() {
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

    const allApps = JSON.parse(
      localStorage.getItem("ugz_applications") || "[]",
    );
    const myApps = allApps.filter(
      (app: any) =>
        app.candidateId === session.id && app.currentStage !== "Rejected",
    );
    setApplications(myApps);

    const allJobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    setJobs(allJobs);

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-on-surface-variant font-medium">
        Loading applications...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">
          My Applications
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Track the detailed status of your job applications.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-table-border p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4 mx-auto">
            <FileText className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">
            No Applications Yet
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            You haven't applied to any positions yet. Browse our job openings
            and find your next opportunity!
          </p>
          <Link
            href="/candidate/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors"
          >
            Browse Jobs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const job = jobs.find((j) => j.id === app.jobId);
            if (!job) return null;

            // Find current stage details
            const currentStageInfo = job.timeline?.find(
              (t: any) => t.id === app.currentStage,
            );
            const currentStageName =
              currentStageInfo?.title || app.currentStage;
            const currentNote =
              app.stageNotes && app.stageNotes[app.currentStage];

            // Setup history array for display
            const milestones = app.history || [
              {
                stageId: "stage_1",
                stageName: "Administration",
                date: app.applicationDate,
              },
            ];

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl shadow-sm border border-table-border overflow-hidden"
              >
                {/* Header: Job Info */}
                <div className="p-6 border-b border-table-border bg-surface-container-lowest">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-on-surface">
                          {job.posisi}
                        </h3>
                        <p className="text-xs font-mono text-on-surface-variant font-semibold mt-1">
                          Ref: {job.noRegistrasi}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                      Applied:{" "}
                      {new Date(app.applicationDate).toLocaleDateString(
                        "id-ID",
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Current Stage
                      </p>
                      <p className="font-bold text-primary text-sm">
                        {currentStageName}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Status Lowongan
                      </p>
                      <p className="font-bold text-black text-sm">
                        {job.statusPermintaan}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Lokasi
                      </p>
                      <p className="font-bold text-black text-sm truncate">
                        {job.areaKerja || job.siteId || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Status Pelamaran
                      </p>
                      <p className="font-bold text-emerald-600 text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Sedang Diproses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body: Timeline & Notes */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Notes & Feedback */}
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-4 border-b border-table-border pb-2">
                      Recruiter Feedback / Notes
                    </h4>
                    {Object.keys(app.stageNotes || {}).length > 0 && (
                      <div className="space-y-3 mb-4">
                        {Object.entries(app.stageNotes).map(
                          ([stageId, note]) => {
                            const stageTitle =
                              job.timeline?.find((t: any) => t.id === stageId)
                                ?.title || stageId;
                            return (
                              <div
                                key={stageId}
                                className="bg-red-50 border border-red-100 rounded-xl p-4"
                              >
                                <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4" /> Note at:{" "}
                                  {stageTitle}
                                </p>
                                <p className="text-sm text-red-900 leading-relaxed font-medium">
                                  "{String(note)}"
                                </p>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}

                    {app.messages && app.messages.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {app.messages.map((msg: any, idx: number) => {
                          const stageTitle = job.timeline?.find((t: any) => t.id === msg.stage)?.title || msg.stage;
                          return (
                            <div key={idx} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                                  <MessageSquare className="w-4 h-4" /> Message at: {stageTitle}
                                </p>
                                {msg.date && <span className="text-[10px] text-blue-700 font-medium opacity-80">{new Date(msg.date).toLocaleDateString("id-ID")}</span>}
                              </div>
                              <p className="text-sm text-blue-900 leading-relaxed font-medium">
                                "{msg.text}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(!app.stageNotes || Object.keys(app.stageNotes).length === 0) && (!app.messages || app.messages.length === 0) && (
                      <div className="text-sm text-on-surface-variant italic bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 text-center">
                        Belum ada catatan khusus dari recruiter untuk Anda.
                      </div>
                    )}
                  </div>

                  {/* Right: Milestone Timeline */}
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-4 border-b border-table-border pb-2">
                      Milestone History
                    </h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                      {milestones.map((ms: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative flex items-start gap-4"
                        >
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 z-10 shadow-sm text-primary">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="pt-1.5 flex-1 bg-surface-container-lowest p-3 rounded-xl border border-table-border shadow-sm">
                            <h5 className="font-bold text-sm text-black">
                              {ms.stageName}
                            </h5>
                            <p className="text-xs font-mono text-on-surface-variant font-semibold mt-1">
                              {new Date(ms.date).toLocaleString("id-ID")}
                            </p>
                            {ms.note && (
                              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded mt-2 font-medium border border-blue-100">
                                <strong>Note:</strong> {ms.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
