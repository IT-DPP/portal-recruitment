import React from "react";
import Link from "next/link";
import { getCandidateProfile } from "@/app/actions/candidate-profile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Clock, AlertTriangle, Briefcase } from "lucide-react";
import CandidateApplicationItem from "@/components/candidate/CandidateApplicationItem";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  const profileRes = await getCandidateProfile();
  const profile = profileRes.success ? (profileRes.data as any) : null;
  const isBlacklisted = !!profile?.isBlacklisted;
  const blacklistReason = profile?.blacklistReason;

  // Include active applications (ACTIVE, or HIRED that are still ongoing in Training/Induction/PKWT stages)
  const applications =
    profile?.applications?.filter((app: any) => {
      if (isBlacklisted) return false;
      if (app.job?.status === "CLOSED") return false;
      if (app.status === "REJECTED") return false;
      if (app.status === "ACTIVE") return true;
      if (app.status === "HIRED" && app.currentStageId && app.currentStageId !== "Hired") return true;
      return false;
    }) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">
          My Applications
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Pantau status lamaran, unduh berkas resmi, tanggapi Offering Letter, dan koordinasikan jadwal pemeriksaan Anda.
        </p>
      </div>

      {/* Blacklist Global Notice if Candidate is Blacklisted */}
      {isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-900 text-sm">Status Akun: Masuk Daftar Blacklist</h4>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Profil Anda saat ini berstatus blacklist dalam sistem e-recruitment kami. Anda tidak dapat melakukan pendaftaran lowongan baru atau melanjutkan proses seleksi aktif.
            </p>
            {blacklistReason && (
              <div className="mt-3 p-3 bg-white/80 rounded-xl border border-red-200 text-xs text-red-800 font-medium">
                <span className="font-bold">Alasan:</span> {blacklistReason}
              </div>
            )}
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-table-border p-10 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary mb-4 mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Belum Ada Lamaran Aktif
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Anda belum memiliki lamaran pekerjaan yang sedang aktif saat ini. Jelajahi lowongan yang tersedia dan mulai langkah karir Anda bersama kami!
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-colors shadow-sm"
            >
              Cari Lowongan Pekerjaan
            </Link>
            <Link
              href="/candidate/past-applications"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-low text-gray-700 text-xs font-bold rounded-xl hover:bg-surface-container transition-colors"
            >
              Lihat Riwayat Lamaran Selesai
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app: any) => (
            <CandidateApplicationItem key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
