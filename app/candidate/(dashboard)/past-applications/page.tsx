export const dynamic = "force-dynamic";

import React from "react";
import { getCandidateProfile } from "@/app/actions/candidate-profile";
import { 
  Building2, 
  Ban, 
  History, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  AlertTriangle,
  Briefcase
} from "lucide-react";
import Link from "next/link";

export default async function CandidateHistoryApplicationPage() {
  const profileRes = await getCandidateProfile();
  const profile = profileRes.success ? (profileRes.data as any) : null;
  const isBlacklisted = !!profile?.isBlacklisted;
  const blacklistReason = profile?.blacklistReason;

  // Filter completed/past applications (REJECTED, HIRED, or job is CLOSED, or if candidate is blacklisted)
  const allApplications = profile?.applications || [];
  const pastApplications = allApplications.filter((app: any) => {
    return (
      app.status === "REJECTED" ||
      app.status === "HIRED" ||
      app.job?.status === "CLOSED" ||
      isBlacklisted
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">History Application</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Daftar riwayat proses lamaran pekerjaan yang telah selesai, ditutup, atau dinyatakan tidak lolos seleksi.
        </p>
      </div>

      {/* Blacklist Global Notice if Candidate is Blacklisted */}
      {isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-900 text-sm">Status Profil: Masuk Daftar Blacklist</h4>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Profil Anda saat ini berstatus blacklist dalam sistem e-recruitment kami. Anda tidak dapat melakukan pendaftaran lowongan baru.
            </p>
            {blacklistReason && (
              <div className="mt-3 p-3 bg-white/80 rounded-xl border border-red-200 text-xs text-red-800 font-medium">
                <span className="font-bold">Alasan:</span> {blacklistReason}
              </div>
            )}
          </div>
        </div>
      )}

      {pastApplications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-table-border p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4 mx-auto">
            <History className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Belum Ada Riwayat Lamaran</h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Anda belum memiliki riwayat lamaran yang telah selesai atau tidak lolos seleksi.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/candidate/history"
              className="px-5 py-2.5 bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-bold rounded-xl transition-colors"
            >
              Lihat Lamaran Aktif
            </Link>
            <Link
              href="/candidate/jobs"
              className="px-5 py-2.5 bg-primary text-white hover:bg-primary-container text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Cari Lowongan
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pastApplications.map((app: any) => {
            const job = app.job;
            if (!job) return null;

            // Determine status type
            const isHired = app.status === "HIRED";
            const isRejected = app.status === "REJECTED";
            const isJobClosed = job.status === "CLOSED" && !isHired && !isRejected;

            // Extract rejection or notes from history
            const rejectedMilestone = app.history?.find((h: any) => h.stageId === "Rejected" || h.stageName === "Rejected");
            const rejectionReason = rejectedMilestone?.note?.replace("Reason: ", "") || "Kualifikasi kandidat belum sesuai dengan kebutuhan posisi ini saat ini.";

            // Non-rejected milestones for last stage
            const nonRejectHistory = app.history?.filter((h: any) => h.stageName !== "Rejected" && h.stageName !== "Hired") || [];
            const lastStage = isHired 
              ? "Hired (Diterima)"
              : nonRejectHistory.length > 0 
                ? nonRejectHistory[nonRejectHistory.length - 1].stageName 
                : (app.currentStage?.name || "Administrasi");

            const positionTitle = job.positionName || job.position?.name || "Posisi Pekerjaan";

            return (
              <div 
                key={app.id} 
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden relative transition-all ${
                  isHired ? 'border-emerald-200 hover:border-emerald-300' :
                  isRejected || isBlacklisted ? 'border-red-200 hover:border-red-300' :
                  'border-table-border'
                }`}
              >
                {/* Header Corner Badge */}
                <div className="absolute top-0 right-0">
                  {isHired ? (
                    <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-bl-xl text-xs font-bold flex items-center gap-1.5 border-b border-l border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Diterima / Hired
                    </div>
                  ) : isBlacklisted ? (
                    <div className="bg-red-100 text-red-800 px-4 py-1.5 rounded-bl-xl text-xs font-bold flex items-center gap-1.5 border-b border-l border-red-200">
                      <Ban className="w-3.5 h-3.5 text-red-600" /> Blacklisted
                    </div>
                  ) : isRejected ? (
                    <div className="bg-red-100 text-red-700 px-4 py-1.5 rounded-bl-xl text-xs font-bold flex items-center gap-1.5 border-b border-l border-red-200">
                      <Ban className="w-3.5 h-3.5" /> Tidak Lolos Seleksi
                    </div>
                  ) : isJobClosed ? (
                    <div className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-bl-xl text-xs font-bold flex items-center gap-1.5 border-b border-l border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Lowongan Ditutup
                    </div>
                  ) : (
                    <div className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-bl-xl text-xs font-bold flex items-center gap-1.5 border-b border-l border-slate-200">
                      Selesai
                    </div>
                  )}
                </div>

                {/* Card Top: Job Info */}
                <div className={`p-6 border-b border-table-border pt-10 ${
                  isHired ? 'bg-emerald-50/20' :
                  isRejected || isBlacklisted ? 'bg-red-50/20' :
                  'bg-surface-container-lowest'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isHired ? 'bg-emerald-100 text-emerald-700' :
                      isRejected || isBlacklisted ? 'bg-red-100 text-red-700' :
                      'bg-surface-container text-on-surface-variant'
                    }`}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-on-surface">{positionTitle}</h3>
                      <p className="text-xs font-mono text-on-surface-variant font-semibold mt-1">Ref: {job.noRegistrasi}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white p-3 rounded-xl border border-table-border/60">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Customer / Site</p>
                      <p className="font-bold text-black text-sm truncate">
                        {job.customer?.name || job.site?.name || "Corporate"}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-table-border/60">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Lokasi Kerja</p>
                      <p className="font-bold text-black text-sm truncate">
                        {job.city?.name ? `${job.city.name}, ` : ''}{job.province?.name || "-"}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-table-border/60">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Tanggal Apply</p>
                      <p className="font-bold text-black text-sm truncate">
                        {new Date(app.applicationDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-table-border/60">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Tahap Terakhir</p>
                      <p className={`font-bold text-sm truncate ${isHired ? 'text-emerald-700' : isRejected ? 'text-red-700' : 'text-on-surface'}`}>
                        {lastStage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Feedback & Status Message */}
                <div className="p-6 bg-white space-y-3">
                  <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isHired ? 'text-emerald-600' : isRejected || isBlacklisted ? 'text-red-600' : 'text-primary'}`} />
                    Keterangan / Status Perekrutan
                  </h4>

                  {isHired ? (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 leading-relaxed font-medium">
                      Selamat! Anda telah resmi diterima (*Hired*) pada lowongan pekerjaan ini. Tim HR akan menghubungi Anda untuk proses *onboarding* dan penandatanganan dokumen perjanjian kerja.
                    </div>
                  ) : isBlacklisted ? (
                    <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-sm text-red-900 leading-relaxed font-medium">
                      {blacklistReason || "Profil Anda telah dimasukkan ke dalam daftar blacklist perekrutan."}
                    </div>
                  ) : isRejected ? (
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 text-sm text-black leading-relaxed font-medium">
                      {rejectionReason}
                    </div>
                  ) : isJobClosed ? (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 leading-relaxed font-medium">
                      Periode pendaftaran untuk lowongan ini telah resmi ditutup oleh perusahaan. Terima kasih atas partisipasi dan minat Anda.
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest border border-table-border rounded-xl p-4 text-sm text-on-surface-variant leading-relaxed">
                      Proses seleksi untuk posisi ini telah selesai.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
