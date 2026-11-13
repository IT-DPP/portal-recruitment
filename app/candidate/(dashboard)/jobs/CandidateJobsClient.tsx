"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Briefcase,
  Calendar,
  ChevronRight,
  Building2,
  AlertCircle,
  Award,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { applyToJob } from "@/app/actions/job";

export default function CandidateJobsClient({
  initialJobs,
  provinces,
  departments,
  initialSearch = "",
  initialProvince = "",
  initialDepartment = "",
  candidateProfile,
  appliedJobIds,
}: {
  initialJobs: any[];
  provinces: any[];
  departments: any[];
  initialSearch?: string;
  initialProvince?: string;
  initialDepartment?: string;
  candidateProfile: any;
  appliedJobIds: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [province, setProvince] = useState(initialProvince);
  const [department, setDepartment] = useState(initialDepartment);

  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(
    null,
  );
  const [bnspWarningModalOpen, setBnspWarningModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Helper check for candidate certificate
  const hasCandidateBnsp = Boolean(
    candidateProfile?.documents?.some((doc: any) => {
      const type = (doc.documentType || "").toLowerCase();
      const hasValidFile = Boolean(doc.fileUrl || doc.objectKey);
      return (type.includes("bnsp") || type.includes("sertifikat")) && hasValidFile;
    })
  );

  // Company Rule: 1 candidate cannot apply to more than 1 job opening (restricted by NIK)
  const activeApplication = candidateProfile?.applications?.find(
    (app: any) => app.status === "ACTIVE" || (app.status === "HIRED" && app.currentStageId && app.currentStageId !== "Hired")
  );
  const hasActiveApplication = Boolean(activeApplication);

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = params.get("q") || "";
      const currentProv = params.get("province") || "";
      const currentDep = params.get("department") || "";

      if (
        currentQ !== search ||
        currentProv !== province ||
        currentDep !== department
      ) {
        if (search) params.set("q", search);
        else params.delete("q");
        if (province) params.set("province", province);
        else params.delete("province");
        if (department) params.set("department", department);
        else params.delete("department");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, province, department, pathname, router, searchParams]);

  const confirmApply = async () => {
    if (!selectedJob) return;

    if (!candidateProfile || !candidateProfile.isProfileCompleted) {
      setErrorModalMessage(
        "Harap lengkapi Profil dan unggah Dokumen wajib Anda terlebih dahulu sebelum melamar.",
      );
      return;
    }

    if (!candidateProfile?.nik || !candidateProfile?.nik.trim()) {
      setErrorModalMessage(
        "Nomor Induk Kependudukan (NIK) belum terdaftar pada profil Anda. Harap lengkapi data NIK Anda di menu My Profile terlebih dahulu.",
      );
      return;
    }

    if (appliedJobIds.includes(selectedJob.id)) {
      setErrorModalMessage("Anda sudah pernah melamar ke lowongan ini.");
      return;
    }

    // Company Policy: 1 candidate cannot apply to more than 1 job opening
    if (hasActiveApplication) {
      const activeJobTitle =
        activeApplication.job?.positionName ||
        activeApplication.job?.position?.name ||
        "Lowongan Lain";
      const activeJobRef = activeApplication.job?.noRegistrasi || "-";
      setErrorModalMessage(
        `Sesuai aturan rekrutmen perusahaan, 1 kandidat (NIK: ${candidateProfile.nik}) hanya diperbolehkan melamar ke 1 lowongan pekerjaan. Anda saat ini masih memiliki proses lamaran aktif untuk posisi "${activeJobTitle}" (Ref: ${activeJobRef}).`,
      );
      return;
    }

    // Intercept if job requires BNSP and candidate does not have it uploaded
    if (selectedJob.requiresBnsp && !hasCandidateBnsp) {
      setBnspWarningModalOpen(true);
      return;
    }

    setIsApplying(true);
    const res = await applyToJob(selectedJob.id);
    setIsApplying(false);

    if (res.success) {
      window.alert(
        "Berhasil melamar lowongan ini! Anda dapat mengecek status di halaman My Applications.",
      );
      setSelectedJob(null);
      // Wait for router refresh to pick up new appliedJobIds
    } else {
      setErrorModalMessage(
        res.error || "Gagal mengirim lamaran. Silakan coba lagi.",
      );
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-table-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari posisi pekerjaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-black"
          />
        </div>

        <div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-black"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-black"
          >
            <option value="">Semua Lokasi (Provinsi)</option>
            {provinces.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1 Job Limit Rule Alert Banner */}
      {hasActiveApplication && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5 border border-amber-200">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-950 text-sm">
              Aturan Rekrutmen Perusahaan: Pembatasan 1 Lowongan per NIK
            </h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Berdasarkan regulasi rekrutmen perusahaan, setiap kandidat (NIK: <strong>{candidateProfile?.nik || "-"}</strong>) hanya diperbolehkan memiliki 1 proses lamaran aktif. Saat ini Anda sedang mengikuti proses seleksi untuk posisi{" "}
              <strong className="text-amber-950 font-bold">
                {activeApplication?.job?.positionName || activeApplication?.job?.position?.name || "Lowongan Pekerjaan"}
              </strong>{" "}
              (Ref: {activeApplication?.job?.noRegistrasi || "-"}). Anda tidak dapat melamar ke lowongan lain selama proses ini masih berjalan.
            </p>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {initialJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-table-border shadow-sm">
          <Briefcase className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-bold text-black mb-2">
            Tidak ada lowongan
          </h3>
          <p className="text-on-surface-variant">
            Maaf, kami tidak menemukan lowongan yang sesuai dengan kriteria
            pencarian Anda.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setProvince("");
              setDepartment("");
            }}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {initialJobs.map((job) => {
            const hasApplied = appliedJobIds.includes(job.id);
            return (
              <div
                key={job.id}
                className="group bg-white rounded-3xl p-6 border border-table-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 relative flex flex-col h-full transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold uppercase tracking-wider rounded-full">
                      {job.department?.name || job.departmentName || "General"}
                    </span>
                    {job.requiresBnsp && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        Wajib BNSP
                      </span>
                    )}
                  </div>
                  {hasApplied ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wider">
                      Applied
                    </span>
                  ) : hasActiveApplication ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200 uppercase tracking-wider">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Locked
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                      Hiring
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-black mb-2 group-hover:text-primary transition-colors flex items-center gap-2 line-clamp-2">
                  {job.positionName || job.position?.name || "Posisi Umum"}
                </h3>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center text-sm text-on-surface-variant">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 text-primary/60" />
                    <span className="truncate">
                      {job.site?.name || job.customer?.name || "Corporate"} •{" "}
                      {job.city?.name}, {job.province?.name}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-on-surface-variant">
                    <Briefcase className="w-4 h-4 mr-2 shrink-0 text-primary/60" />
                    <span>{job.jumlahPermintaan} Openings</span>
                  </div>
                  <div className="flex items-center text-sm text-on-surface-variant">
                    <Calendar className="w-4 h-4 mr-2 shrink-0 text-primary/60" />
                    <span>
                      Posted{" "}
                      {new Date(
                        job.publishedDate || job.createdAt,
                      ).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-table-border flex items-center justify-between">
                  <span className="text-xs font-mono text-on-surface-variant/60">
                    {job.noRegistrasi}
                  </span>
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="flex items-center text-sm font-bold text-primary hover:text-primary-container transition-colors"
                  >
                    Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-table-border bg-surface-container-lowest flex justify-between items-start">
              <div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider inline-block mb-3">
                  {selectedJob.department?.name ||
                    selectedJob.departmentName ||
                    "General"}
                </span>
                <h3 className="text-2xl font-bold text-black flex items-center gap-2">
                  {selectedJob.positionName || selectedJob.position?.name || "Posisi Umum"}
                </h3>
                <div className="flex items-center text-sm text-on-surface-variant mt-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 shrink-0" />
                    <span className="font-semibold text-black">
                      {selectedJob.city?.name}, {selectedJob.province?.name}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {selectedJob.requiresBnsp && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    hasCandidateBnsp
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                      : "bg-amber-50/80 border-amber-200 text-amber-950"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      hasCandidateBnsp
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {hasCandidateBnsp ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-sm">
                      {hasCandidateBnsp
                        ? "Syarat Sertifikasi BNSP Terpenuhi"
                        : "Lowongan Ini Mewajibkan Sertifikat BNSP"}
                    </h5>
                    <p className="text-xs mt-1 leading-relaxed text-on-surface-variant">
                      {hasCandidateBnsp
                        ? "Dokumen sertifikat kompetensi Anda sudah terunggah di profil. Anda siap melamar posisi ini."
                        : "Posisi ini mensyaratkan Sertifikat Kompetensi BNSP resmi. Dokumen sertifikat Anda belum terunggah di menu My Profile. Anda wajib melengkapinya sebelum melamar."}
                    </p>
                  </div>
                </div>
              )}

              {selectedJob.kualifikasi && (
                <div>
                  <h4 className="font-bold text-lg text-primary mb-3">
                    Persyaratan
                  </h4>
                  <div className="text-sm text-black whitespace-pre-wrap leading-relaxed">
                    {selectedJob.kualifikasi}
                  </div>
                </div>
              )}

              {selectedJob.benefit && (
                <div>
                  <h4 className="font-bold text-lg text-primary mb-3">
                    Benefit
                  </h4>
                  <div className="text-sm text-black whitespace-pre-wrap leading-relaxed">
                    {selectedJob.benefit}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
                disabled={isApplying}
              >
                Batal
              </button>
              {appliedJobIds.includes(selectedJob.id) ? (
                <button
                  disabled
                  className="px-6 py-2.5 bg-surface-container text-on-surface-variant text-sm font-bold rounded-xl shadow-sm cursor-not-allowed"
                >
                  Sudah Melamar
                </button>
              ) : hasActiveApplication ? (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className="text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Terkunci: Maksimal 1 lowongan per NIK
                  </span>
                  <button
                    disabled
                    className="px-6 py-2.5 bg-gray-200 text-gray-500 text-sm font-bold rounded-xl shadow-sm cursor-not-allowed"
                  >
                    Batasan 1 Lowongan
                  </button>
                </div>
              ) : (
                <button
                  onClick={confirmApply}
                  disabled={isApplying}
                  className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  {isApplying ? "Memproses..." : "Konfirmasi & Melamar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalMessage && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Pendaftaran Ditolak
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                {errorModalMessage}
              </p>
              <button
                onClick={() => {
                  setErrorModalMessage(null);
                  if (errorModalMessage.includes("Harap lengkapi Profil")) {
                    router.push("/candidate/profile");
                  }
                }}
                className="w-full px-4 py-3 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated BNSP Requirement Warning Modal */}
      {bnspWarningModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-table-border">
            <div className="p-7 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">
                Sertifikat BNSP Diperlukan
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Lowongan ini mewajibkan sertifikasi kompetensi BNSP resmi. Karena Anda belum mengunggah sertifikat pada dokumen profil Anda, proses pelamaran <strong>tidak dapat dilanjutkan</strong>.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setBnspWarningModalOpen(false);
                    setSelectedJob(null);
                    router.push("/candidate/profile");
                  }}
                  className="w-full px-5 py-3 bg-primary hover:bg-primary-container text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" /> Unggah Sertifikat di Profil
                </button>
                <button
                  onClick={() => setBnspWarningModalOpen(false)}
                  className="w-full px-5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold rounded-xl transition-colors text-sm"
                >
                  Tutup & Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
