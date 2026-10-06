import React from "react";
import Link from "next/link";
import { getCandidateProfile } from "@/app/actions/candidate-profile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MapPin, Briefcase, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  
  const profileRes = await getCandidateProfile();
  const profile = profileRes.success ? profileRes.data as any : null;
  const applications = profile?.applications?.filter((app: any) => app.status !== "REJECTED") || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">
          My Applications
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Lacak status lamaran pekerjaan Anda di sini.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-table-border p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
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
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app: any) => {
            const job = app.job;
            if (!job) return null;

            const currentStageInfo = job.timeline?.find(
              (t: any) => t.id === app.currentStageId,
            );
            const currentStageName =
              currentStageInfo?.stage?.name || currentStageInfo?.title || "Administration";

            const milestones = app.history && app.history.length > 0 ? app.history : [
              {
                stageId: app.currentStageId,
                stageName: "Administration",
                date: app.applicationDate,
              },
            ];
            
            const latestMilestone = milestones[milestones.length - 1];
            const displayStageName = latestMilestone.stageName;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl shadow-sm border border-table-border overflow-hidden"
              >
                {/* Header: Job Info */}
                <div className="p-6 border-b border-table-border bg-surface-container-lowest">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold uppercase tracking-wider rounded-full">
                          {job.department?.name || job.departmentName || "General"}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Applied: {new Date(app.applicationDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-on-surface mb-2">
                        {job.positionId === "0" ? job.positionName : job.position?.name || "Posisi Pekerjaan"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary/60" />
                          <span className="font-medium text-black">
                            {job.site?.name || job.customer?.name || job.areaKerja || "Corporate"}
                            {job.city?.name ? `, ${job.city.name}` : ''}
                            {job.province?.name ? ` - ${job.province.name}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-primary/60" />
                          <span className="uppercase text-xs font-bold font-mono tracking-wider bg-surface-container-low px-2 py-0.5 rounded text-black">
                            Ref: {job.noRegistrasi}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50 hover:border-primary/30 transition-colors">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Current Stage
                      </p>
                      <p className="font-bold text-primary text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate" title={displayStageName}>{displayStageName}</span>
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50 hover:border-primary/30 transition-colors">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Departemen
                      </p>
                      <p className="font-bold text-black text-sm truncate" title={job.department?.name || job.departmentName || "-"}>
                        {job.department?.name || job.departmentName || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50 hover:border-primary/30 transition-colors">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Lokasi Penempatan
                      </p>
                      <p className="font-bold text-black text-sm truncate" title={`${job.site?.name || job.customer?.name || job.areaKerja || "Corporate"} ${job.city?.name ? `, ${job.city.name}` : ''}`}>
                        {job.city?.name ? job.city.name : (job.site?.name || job.customer?.name || job.areaKerja || "Corporate")}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-outline-variant/50 hover:border-primary/30 transition-colors">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">
                        Status Pelamaran
                      </p>
                      <p className={`font-bold text-sm truncate flex items-center gap-1 ${app.status === 'ACTIVE' ? 'text-blue-600' : (['HIRED', 'ACCEPTED', 'PASSED'].includes(app.status) ? 'text-emerald-600' : 'text-amber-600')}`}>
                        {app.status === "ACTIVE" ? "Sedang Diproses" : app.status}
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

                    {(!app.messages || app.messages.length === 0) && (
                      <div className="text-sm text-on-surface-variant italic bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 text-center">
                        Belum ada pesan / catatan khusus dari recruiter untuk Anda.
                      </div>
                    )}
                  </div>

                  {/* Right: Milestone Timeline */}
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-4 border-b border-table-border pb-2">
                      Milestone History
                    </h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-1 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                      {milestones.map((ms: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative flex items-start gap-4"
                        >
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0 z-10 shadow-sm" />
                          <div className="flex-1 bg-surface-container-lowest p-3 rounded-xl border border-table-border shadow-sm">
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
