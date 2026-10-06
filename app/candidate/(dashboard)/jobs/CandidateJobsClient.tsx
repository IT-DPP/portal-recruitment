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
  const [isApplying, setIsApplying] = useState(false);

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

    if (appliedJobIds.includes(selectedJob.id)) {
      setErrorModalMessage("Anda sudah pernah melamar ke lowongan ini.");
      return;
    }

    // Active application check could be added here if needed

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
                  <span className="inline-block px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold uppercase tracking-wider rounded-full">
                    {job.department?.name || job.departmentName || "General"}
                  </span>
                  {hasApplied ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wider">
                      Applied
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                      Hiring
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-black mb-2 group-hover:text-primary transition-colors flex items-center gap-2 line-clamp-2">
                  {job.positionId === "0"
                    ? job.positionName
                    : job.position?.name}
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
                  {selectedJob.positionId === "0"
                    ? selectedJob.positionName
                    : selectedJob.position?.name}
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

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
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
    </div>
  );
}
