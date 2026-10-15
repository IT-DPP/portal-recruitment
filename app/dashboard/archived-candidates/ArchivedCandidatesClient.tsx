"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, X, User as UserIcon, Archive, ChevronLeft, ChevronRight } from "lucide-react";

export default function ArchivedCandidatesClient({ initialApplications = [], initialJobs = [] }: { initialApplications?: any[], initialJobs?: any[] }) {
  const [jobs, setJobs] = useState<any[]>(initialJobs);
  const [applications, setApplications] = useState<any[]>(initialApplications);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setJobs(initialJobs);
    setApplications(initialApplications);

    const profiles: Record<string, any> = {};
    initialApplications.forEach((app: any) => {
      if (app.candidateProfile) {
        const photoDoc = app.candidateProfile.documents?.find((d: any) => (d.documentType || "").toLowerCase() === "photo" || (d.documentType || "").toLowerCase() === "pas foto");
        const photoUrl = photoDoc?.objectKey 
          ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
          : photoDoc?.fileUrl || app.candidateProfile.user?.image || null;

        profiles[app.candidateProfileId] = {
          ...app.candidateProfile,
          fullName: app.candidateProfile.user?.name || "Unknown",
          email: app.candidateProfile.user?.email || "-",
          phone: app.candidateProfile.whatsapp || app.candidateProfile.phone || "-",
          nik: app.candidateProfile.nik,
          filePhoto: photoUrl ? { base64: photoUrl } : null
        };
      }
    });
    setCandidateProfiles(profiles);
  }, [initialApplications, initialJobs]);

  const handleApplyFilter = () => {
    setActiveFilters({
      position: filterPosition,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
    setCurrentPage(1); // Reset to first page when filtering
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

  const getJobName = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.posisi : jobId;
  };

  const allPositions = Array.from(
    new Set(jobs.filter((j) => j.posisi).map((j) => j.posisi))
  ).sort();

  // Apply Filters & Search
  const filteredApps = applications.filter(app => {
    let match = true;
    
    // Search query
    const profile = candidateProfiles[app.candidateProfileId];
    if (searchQuery) {
      if (!profile) return false;
      const q = searchQuery.toLowerCase();
      const name = (profile.fullName || "").toLowerCase();
      const nik = profile.nik || "";
      const email = (profile.email || "").toLowerCase();
      const phone = profile.phone || "";
      if (!name.includes(q) && !nik.includes(q) && !email.includes(q) && !phone.includes(q)) {
        match = false;
      }
    }

    // Position Filter
    if (activeFilters.position) {
      const job = jobs.find(j => j.id === app.jobId);
      if (!job || job.posisi !== activeFilters.position) {
        match = false;
      }
    }

    // Date Filters
    if (activeFilters.startDate || activeFilters.endDate) {
      const { date } = getRejectionDetails(app);
      if (date) {
        const rejectDate = new Date(date);
        rejectDate.setHours(0,0,0,0);
        
        if (activeFilters.startDate) {
          const sDate = new Date(activeFilters.startDate);
          sDate.setHours(0,0,0,0);
          if (rejectDate < sDate) match = false;
        }
        
        if (activeFilters.endDate) {
          const eDate = new Date(activeFilters.endDate);
          eDate.setHours(0,0,0,0);
          if (rejectDate > eDate) match = false;
        }
      } else {
        match = false;
      }
    }

    return match;
  });

  // Sorting: Newest rejected first
  filteredApps.sort((a, b) => {
    const dateA = new Date(getRejectionDetails(a).date || 0).getTime();
    const dateB = new Date(getRejectionDetails(b).date || 0).getTime();
    return dateB - dateA;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage) || 1;
  const paginatedApps = filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <Archive className="w-6 h-6" /> Archived Candidates
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            Monitor dan tinjau ulang kandidat yang tidak lolos seleksi.
          </p>
        </div>

        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari nama / NIK..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow bg-white"
            />
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" /> 
            Filters
            {(activeFilters.position || activeFilters.startDate || activeFilters.endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-table-border rounded-xl shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Kandidat</th>
                <th className="px-6 py-4 whitespace-nowrap">Kontak</th>
                <th className="px-6 py-4 whitespace-nowrap">Posisi Job</th>
                <th className="px-6 py-4 whitespace-nowrap">Tahapan Terakhir</th>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal Ditolak</th>
                <th className="px-6 py-4">Alasan Penolakan</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border">
              {paginatedApps.length > 0 ? (
                paginatedApps.map((app) => {
                  const profile = candidateProfiles[app.candidateProfileId] || {};
                  const { date, reason, lastStage } = getRejectionDetails(app);
                  
                  return (
                    <tr key={app.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                            {profile.filePhoto?.base64 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={profile.filePhoto.base64} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-on-surface-variant" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-black">{profile.fullName || "Unknown"}</p>
                            <p className="text-xs text-on-surface-variant font-mono">{profile.nik || "No NIK"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-black text-sm">{profile.email || "-"}</p>
                        <p className="text-xs text-on-surface-variant font-mono mt-0.5">{profile.phone || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-primary">{getJobName(app.jobId)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                          {lastStage || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono bg-surface-container px-2 py-1 rounded text-on-surface">
                          {date ? new Date(date).toLocaleDateString("id-ID") : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-status-error font-medium line-clamp-2" title={reason}>
                          {reason}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link 
                          href={`/dashboard/job-openings/${app.jobId}/verify/${app.candidateProfileId}`}
                          className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          Detail Riwayat
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Archive className="w-10 h-10 opacity-20" />
                      <p>Tidak ada data kandidat yang diarsipkan atau ditolak.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredApps.length > 0 && (
          <div className="p-4 border-t border-table-border bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-on-surface-variant">
              Menampilkan <span className="font-bold text-black">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, filteredApps.length)}</span> dari <span className="font-bold text-black">{filteredApps.length}</span> kandidat
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Baris per halaman:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-outline-variant rounded text-sm outline-none focus:border-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
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
                  {allPositions.map((pos: any) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Mulai Tanggal Ditolak</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Sampai Tanggal Ditolak</label>
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
