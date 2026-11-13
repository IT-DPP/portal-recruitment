"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  X, 
  User as UserIcon, 
  Archive, 
  Loader2 
} from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { getPaginatedArchivedCandidates } from "@/app/actions/job";

interface ArchivedCandidatesClientProps {
  initialApplications?: any[];
  initialPositions?: string[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export default function ArchivedCandidatesClient({ 
  initialApplications = [], 
  initialPositions = [],
  initialPagination = { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
}: ArchivedCandidatesClientProps) {
  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [positions, setPositions] = useState<string[]>(initialPositions);
  const [pagination, setPagination] = useState(initialPagination);
  
  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    position: "",
    startDate: "",
    endDate: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPagination.limit || 10);
  const [isPending, startTransition] = useTransition();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    startTransition(async () => {
      const res = await getPaginatedArchivedCandidates({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        position: activeFilters.position,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
      });

      if (res.success && res.data) {
        setApplications(res.data);
        if (res.allPositions) {
          setPositions(res.allPositions);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    });
  }, [currentPage, itemsPerPage, debouncedSearch, activeFilters, hasMounted]);

  const handleApplyFilter = () => {
    setActiveFilters({
      position: filterPosition,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterPosition("");
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveFilters({
      position: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  // Helper to extract rejection details from history
  const getRejectionDetails = (app: any) => {
    const nonRejectHistory = app.history?.find((h: any) => h.stageName !== "Rejected");
    const lastStage = app.currentStage?.name || nonRejectHistory?.stageName || "Tahap Awal";

    if (!app.history) return { date: null, reason: "Tidak ada data", lastStage };
    const rejectHistory = app.history.find((h: any) => h.stageId === "Rejected" || h.stageName === "Rejected");
    if (rejectHistory) {
      let reason = rejectHistory.note || "-";
      if (reason.startsWith("Reason: ")) {
        reason = reason.substring(8);
      }
      return { date: rejectHistory.date, reason, lastStage };
    }
    return { date: app.applicationDate, reason: "Ditolak (Tanpa Catatan)", lastStage };
  };

  const hasActiveFilters = Boolean(
    activeFilters.position || activeFilters.startDate || activeFilters.endDate
  );

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0 shrink-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Archive className="w-6 h-6 text-primary" /> Archived Candidates
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Daftar seluruh kandidat yang lamarannya berstatus ditolak (rejected).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 min-w-0 w-full lg:w-auto shrink-0">
          <div className="relative min-w-0 flex-1 w-full sm:w-auto sm:max-w-xs">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, NIK, kontak, posisi..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow bg-white text-slate-900 shadow-2xs"
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
            className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${
              hasActiveFilters
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-white border-outline-variant text-on-surface hover:bg-surface-container-low shadow-2xs"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-table-border rounded-xl shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 text-sm font-semibold text-primary">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
              </div>
            </div>
          )}

          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
              <tr>
                <th className="px-6 py-4">Kandidat</th>
                <th className="px-6 py-4">Posisi Dilamar</th>
                <th className="px-6 py-4">Tahapan Terakhir</th>
                <th className="px-6 py-4">Tanggal Ditolak</th>
                <th className="px-6 py-4">Alasan Penolakan</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border font-medium text-slate-800">
              {applications.length > 0 ? (
                applications.map((app) => {
                  const profile = app.candidateProfile;
                  const photoDoc = profile?.documents?.find(
                    (d: any) =>
                      (d.documentType || "").toLowerCase() === "photo" ||
                      (d.documentType || "").toLowerCase() === "pas foto"
                  );
                  const photoUrl = photoDoc?.objectKey
                    ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
                    : photoDoc?.fileUrl || profile?.user?.image || null;

                  const { date, reason, lastStage } = getRejectionDetails(app);
                  const jobName = app.job?.positionName || app.job?.position?.name || "General";

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={profile?.user?.name || "User"} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {profile?.user?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-on-surface-variant mt-0.5">
                              NIK: {profile?.nik || "-"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {profile?.user?.email || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">{jobName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {lastStage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {date ? new Date(date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        }) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 line-clamp-2 max-w-xs font-normal" title={reason}>
                          {reason}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/dashboard/job-openings/${app.jobId}/verify/${app.candidateProfileId}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
                        >
                          Lihat Profil
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant">
                    <Archive className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-base font-semibold text-slate-700">Tidak ada kandidat terarsip</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Belum ada kandidat yang ditolak atau sesuai dengan kriteria filter saat ini.
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

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter Archived Candidates
              </h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-black rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Posisi Job</label>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Posisi</option>
                  {positions.map((pos: any) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-table-border bg-surface-container-lowest flex justify-end gap-3">
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={handleApplyFilter}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
