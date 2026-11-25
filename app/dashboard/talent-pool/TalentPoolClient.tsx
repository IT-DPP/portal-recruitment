"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  X,
  Plus,
  User as UserIcon,
  Loader2,
  CheckSquare,
  Square,
  ArrowRightCircle,
  CheckCircle,
} from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { getPaginatedTalentPool, bulkAssignCandidatesToJob } from "@/app/actions/job";

interface TalentPoolClientProps {
  initialCandidates?: any[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  activeJobs?: any[];
}

export default function TalentPoolClient({
  initialCandidates = [],
  initialPagination = { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 },
  activeJobs = [],
}: TalentPoolClientProps) {
  const [candidates, setCandidates] = useState<any[]>(initialCandidates);
  const [pagination, setPagination] = useState(initialPagination);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterEducation, setFilterEducation] = useState("");
  const [activeEducation, setActiveEducation] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPagination.limit || 10);
  const [isPending, startTransition] = useTransition();

  const [hasMounted, setHasMounted] = useState(false);

  // Multi-selection state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  // Bulk Assign to Job modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(activeJobs[0]?.id || "");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch data on search, filter, or page change
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    startTransition(async () => {
      const res = await getPaginatedTalentPool({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        education: activeEducation,
      });

      if (res.success && res.data) {
        setCandidates(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    });
  }, [currentPage, itemsPerPage, debouncedSearch, activeEducation, hasMounted]);

  const handleApplyFilter = () => {
    setActiveEducation(filterEducation);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterEducation("");
    setActiveEducation("");
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const hasActiveFilters = activeEducation !== "";

  // Selection helpers
  const toggleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  const candidateIdsOnPage = candidates.map((c) => c.id);
  const isAllOnPageSelected =
    candidateIdsOnPage.length > 0 &&
    candidateIdsOnPage.every((id) => selectedCandidateIds.has(id));

  const toggleSelectAllOnPage = () => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (isAllOnPageSelected) {
        candidateIdsOnPage.forEach((id) => next.delete(id));
      } else {
        candidateIdsOnPage.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCandidateIds(new Set());
  };

  // Bulk Assign to Job Submit
  const handleConfirmAssign = async () => {
    if (!selectedJobId) {
      alert("Pilih lowongan pekerjaan tujuan.");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await bulkAssignCandidatesToJob(
        Array.from(selectedCandidateIds),
        selectedJobId
      );

      if (res.success) {
        setAssignFeedback({
          type: "success",
          message: `Berhasil menugaskan ${res.assignedCount} kandidat ke lowongan kerja.${
            res.skippedCount && res.skippedCount > 0
              ? ` (${res.skippedCount} kandidat sudah terdaftar sebelumnya)`
              : ""
          }`,
        });
        setShowAssignModal(false);
        clearSelection();
      } else {
        alert(res.error || "Gagal menugaskan kandidat ke lowongan.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 pb-12 flex flex-col h-[calc(100vh-100px)] relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0 shrink-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Talent Pool
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Database profil tenaga kerja DPP siap kerja untuk pemenuhan kebutuhan klien.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 min-w-0 w-full lg:w-auto shrink-0">
          <div className="relative min-w-0 flex-1 w-full sm:w-auto sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, NIK, kontak..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all bg-white text-slate-900 shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-2 border rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              hasActiveFilters
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <Link
            href="/dashboard/talent-pool/add"
            className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kandidat</span>
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {assignFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shrink-0 ${
            assignFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{assignFeedback.message}</span>
          </div>
          <button onClick={() => setAssignFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table Container (Modern Web Guidance responsive-table compliant) */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div
          tabIndex={0}
          role="region"
          aria-label="Tabel Talent Pool Kandidat"
          className="flex-1 overflow-auto custom-scrollbar relative focus:outline-hidden overscroll-x-contain"
        >
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-primary">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
              </div>
            </div>
          )}

          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 text-[11px] uppercase font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllOnPage}
                    disabled={candidates.length === 0}
                    title={isAllOnPageSelected ? "Batalkan semua di halaman ini" : "Pilih semua di halaman ini"}
                    className="p-1 rounded text-slate-500 hover:text-primary transition-colors cursor-pointer"
                  >
                    {isAllOnPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Kandidat</th>
                <th className="px-4 py-3.5">Pendidikan</th>
                <th className="px-4 py-3.5">Kontak & Lokasi</th>
                <th className="px-4 py-3.5">Lamaran Terakhir</th>
                <th className="px-4 py-3.5 text-center">Status Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {candidates.length > 0 ? (
                candidates.map((candidate) => {
                  const isSelected = selectedCandidateIds.has(candidate.id);

                  return (
                    <tr
                      key={candidate.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCandidate(candidate.id)}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          aria-label={`Pilih ${candidate.fullName}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {candidate.filePhoto?.base64 ? (
                              <img
                                src={candidate.filePhoto.base64}
                                alt={candidate.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {candidate.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              NIK: {candidate.nik || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {candidate.latestEducation || "Tidak Ditentukan"}
                        </span>
                        {candidate.educationInstitution && (
                          <div
                            className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]"
                            title={candidate.educationInstitution}
                          >
                            {candidate.educationInstitution}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{candidate.email}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          WA: {candidate.whatsapp || "-"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {candidate.city || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{candidate.lastJobApplied}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {candidate.hasApplied ? "Melalui Portal" : "Ditambahkan Manual"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            candidate.lastStage === "Hired"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : candidate.lastStage?.includes("Ditolak")
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {candidate.lastStage}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-slate-700">Tidak ada kandidat ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Sesuaikan kata kunci pencarian atau filter pendidikan Anda.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Standard Pagination Bar */}
        <PaginationBar
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          isLoading={isPending}
        />
      </div>

      {/* Floating Sticky Bottom Bulk Bar */}
      {selectedCandidateIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A2540] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 max-w-xl w-[92vw] animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-bold text-white">
              {selectedCandidateIds.size} Kandidat Dipilih
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={isAssigning}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" /> Tugaskan ke Lowongan...
            </button>
          </div>
        </div>
      )}

      {/* Modal Bulk Assign to Job */}
      {showAssignModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-job-title"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-[#0A2540] text-white flex items-center justify-between">
              <h3 id="assign-job-title" className="text-sm font-bold flex items-center gap-2">
                <ArrowRightCircle className="w-4 h-4 text-emerald-400" />
                Tugaskan ke Lowongan ({selectedCandidateIds.size} Kandidat)
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Kandidat yang dipilih akan didaftarkan ke lowongan kerja aktif pada{" "}
                <span className="font-semibold text-slate-900">Stage 1 (CV Screening)</span>.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Lowongan Pekerjaan Aktif <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {activeJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.noRegistrasi} — {j.positionName || "Posisi Umum"}
                    </option>
                  ))}
                  {activeJobs.length === 0 && (
                    <option value="" disabled>
                      Tidak ada lowongan aktif saat ini
                    </option>
                  )}
                </select>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={isAssigning}
                className="px-3.5 py-1.5 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={isAssigning || !selectedJobId}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Tugaskan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filter Talent Pool
              </h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                <select
                  value={filterEducation}
                  onChange={(e) => setFilterEducation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden bg-white text-slate-900"
                >
                  <option value="">Semua Pendidikan</option>
                  <option value="SMA/SMK">SMA/SMK/Sederajat</option>
                  <option value="D3">Diploma 3 (D3)</option>
                  <option value="D4">Diploma 4 (D4)</option>
                  <option value="S1">Sarjana (S1)</option>
                  <option value="S2">Magister (S2)</option>
                  <option value="S3">Doktor (S3)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Reset Filter
              </button>
              <button
                onClick={handleApplyFilter}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-colors shadow-2xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
