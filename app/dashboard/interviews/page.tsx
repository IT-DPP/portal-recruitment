"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, AlertCircle } from "lucide-react";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local storage data
    const jobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    const applications = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    const sites = JSON.parse(localStorage.getItem("ugz_master_sites_operation") || "[]");
    const customers = JSON.parse(localStorage.getItem("ugz_master_customer") || "[]");

    const getSiteName = (siteId: string) => sites.find((s: any) => s.id === siteId)?.siteName || siteId || "-";
    const getCustomerName = (cId: string) => customers.find((c: any) => c.id === cId)?.name || cId || "-";

    const interviewList: any[] = [];

    applications.forEach((app: any) => {
      // Find the corresponding job
      const job = jobs.find((j: any) => j.id === app.jobId);
      if (!job) return;

      // Find the current stage in the job's timeline
      const currentTimelineStage = job.timeline?.find((t: any) => t.id === app.currentStage);
      if (!currentTimelineStage) return;

      const stageTitle = currentTimelineStage.title || "";
      const isInterviewStage = stageTitle.toLowerCase().includes("interview") || app.currentStage === "stage_2" || app.currentStage === "stage_5";

      if (isInterviewStage) {
        const candidateProfile = profiles[app.candidateId] || {};
        
        // SLA Calculation based on job timeline deadline
        const deadlineDate = new Date(currentTimelineStage.deadlineDate);
        const now = new Date();
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let slaStatus = "";
        if (diffDays < 0) slaStatus = "Overdue";
        else if (diffDays <= 2) slaStatus = "Reminder";
        else slaStatus = "On Track";

        interviewList.push({
          id: `${app.jobId}-${app.candidateId}`,
          jobId: app.jobId,
          candidateId: app.candidateId,
          jobPosition: job.posisi,
          customerName: getCustomerName(job.customerId),
          siteName: getSiteName(job.siteId || job.areaKerja),
          candidateName: candidateProfile.fullName || "Unknown",
          stageTitle: stageTitle,
          deadlineDate: deadlineDate.toISOString(),
          slaStatus: slaStatus,
          diffDays: diffDays
        });
      }
    });

    // Sort by deadline ascending (most urgent first)
    interviewList.sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());

    setInterviews(interviewList);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading interviews...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Interviews Overview</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Daftar kandidat yang saat ini sedang berada pada tahap wawancara (HR / User).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-table-border overflow-hidden">
        {interviews.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant flex flex-col items-center justify-center">
            <Clock className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-semibold text-lg text-black">Tidak Ada Jadwal Interview</p>
            <p className="text-sm mt-1">Saat ini tidak ada kandidat yang sedang berada di tahap interview.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-container-lowest text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
                <tr>
                  <th className="px-6 py-4">Lowongan</th>
                  <th className="px-6 py-4">Kandidat</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">SLA Deadline</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-table-border">
                {interviews.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-black">{item.jobPosition}</p>
                      <p className="text-xs text-on-surface-variant truncate max-w-[200px]">
                        {item.customerName} • {item.siteName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary">{item.candidateName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200 uppercase tracking-wider">
                        {item.stageTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[13px] text-black">
                          {new Date(item.deadlineDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {item.slaStatus === "Overdue" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-wide">
                            <AlertCircle className="w-3 h-3" /> Overdue ({-item.diffDays} Days)
                          </span>
                        )}
                        {item.slaStatus === "Reminder" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                            <Clock className="w-3 h-3" /> Reminder ({item.diffDays} Days Left)
                          </span>
                        )}
                        {item.slaStatus === "On Track" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                            On Track ({item.diffDays} Days Left)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/dashboard/job-openings/${item.jobId}/verify/${item.candidateId}`} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
