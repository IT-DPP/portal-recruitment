"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  User as UserIcon
} from "lucide-react";

function formatCandidates(initialList: any[]) {
  const sorted = [...initialList].sort((a, b) => {
    const nameA = a.user?.name || a.fullName || "";
    const nameB = b.user?.name || b.fullName || "";
    return nameA.localeCompare(nameB);
  });

  return sorted.map(c => {
    const photoDoc = c.documents?.find((d: any) => (d.documentType || "").toLowerCase() === "photo" || (d.documentType || "").toLowerCase() === "pas foto");
    const photoUrl = photoDoc?.objectKey 
      ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
      : photoDoc?.fileUrl || c.user?.image || null;

    const lastApp = c.applications?.[0];
    const lastJobApplied = lastApp?.job?.positionName || lastApp?.job?.position?.name || null;
    let lastStage = null;
    if (lastApp) {
      if (lastApp.status === "HIRED") {
        lastStage = "Hired";
      } else if (lastApp.status === "REJECTED") {
        lastStage = `Ditolak (${lastApp.currentStage?.name || "Seleksi"})`;
      } else {
        lastStage = lastApp.currentStage?.name || "Active Screening";
      }
    }

    return {
      ...c,
      fullName: c.user?.name || c.fullName || "Unknown",
      email: c.user?.email || c.email || "-",
      whatsapp: c.whatsapp || "-",
      city: c.domicileAddress || c.city || "-",
      lastJobApplied: lastJobApplied || "Belum Ada Lamaran",
      lastStage: lastStage || "Belum Melamar",
      hasApplied: !!lastApp,
      filePhoto: photoUrl ? { base64: photoUrl } : null
    };
  });
}

export default function TalentPoolClient({ initialCandidates = [] }: { initialCandidates?: any[] }) {
  const [candidates, setCandidates] = useState<any[]>(() => formatCandidates(initialCandidates));
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterEducation, setFilterEducation] = useState("");
  
  const [activeFilters, setActiveFilters] = useState({
    education: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCandidates(formatCandidates(initialCandidates));
  }, [initialCandidates]);

  const handleApplyFilter = () => {
    setActiveFilters({
      education: filterEducation,
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterEducation("");
    setActiveFilters({
      education: "",
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const filteredCandidates = candidates.filter(candidate => {
    let match = true;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (candidate.fullName || "").toLowerCase();
      const nik = candidate.nik || "";
      const email = (candidate.email || "").toLowerCase();
      const phone = candidate.whatsapp || "";
      const job = (candidate.lastJobApplied || "").toLowerCase();
      if (!name.includes(q) && !nik.includes(q) && !email.includes(q) && !phone.includes(q) && !job.includes(q)) {
        match = false;
      }
    }

    if (activeFilters.education && candidate.latestEducation !== activeFilters.education) {
      match = false;
    }

    return match;
  });

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const hasActiveFilters = activeFilters.education !== "";

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0 shrink-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6" /> Talent Pool
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Kumpulan seluruh data profil kandidat yang mendaftar atau ditambahkan secara manual.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 min-w-0 w-full lg:w-auto shrink-0">
          <div className="relative min-w-0 flex-1 w-full sm:w-auto sm:max-w-xs">
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Filter className="w-4 h-4" /> 
              Filters
              {hasActiveFilters && (
                <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
              )}
            </button>
            <Link
              href="/dashboard/talent-pool/add"
              className="flex-1 sm:flex-none bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Talent
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-table-border">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Kandidat</th>
                <th className="px-6 py-4 whitespace-nowrap">Kontak</th>
                <th className="px-6 py-4 whitespace-nowrap">Lowongan Terakhir</th>
                <th className="px-6 py-4 whitespace-nowrap">Tahapan Terakhir</th>
                <th className="px-6 py-4 whitespace-nowrap">Pendidikan</th>
                <th className="px-6 py-4 whitespace-nowrap">Asal Kota</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Status Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border">
              {paginatedCandidates.length > 0 ? (
                paginatedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden border border-outline-variant/30">
                          {candidate.filePhoto?.base64 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={candidate.filePhoto.base64} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-on-surface-variant" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-black text-sm">{candidate.fullName || "Unknown"}</p>
                          <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">{candidate.nik || "No NIK"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-black text-sm">{candidate.email || "-"}</p>
                      <p className="text-xs text-on-surface-variant font-mono mt-0.5">{candidate.whatsapp || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${candidate.hasApplied ? 'text-primary' : 'text-slate-400 italic text-xs'}`}>
                        {candidate.lastJobApplied}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        candidate.lastStage === "Hired" ? "bg-green-50 text-green-700 border-green-200" :
                        candidate.lastStage?.startsWith("Ditolak") ? "bg-red-50 text-red-700 border-red-200" :
                        candidate.hasApplied ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {candidate.lastStage || "Belum Melamar"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {candidate.latestEducation ? (
                        <div>
                          <span className="font-bold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                            {candidate.latestEducation}
                          </span>
                          <p className="text-xs text-on-surface-variant mt-1 max-w-[150px] truncate" title={candidate.educationInstitution}>
                            {candidate.educationInstitution || "-"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {candidate.city ? (
                        <p className="text-sm font-medium">{candidate.city}</p>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {candidate.isTalentPool ? (
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-200">
                          Recruiter Input
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-200">
                          Registered
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="w-12 h-12 opacity-20" />
                      <p className="text-base font-semibold text-black">Tidak Ada Kandidat</p>
                      <p className="text-sm">Tidak ada data kandidat yang ditemukan atau sesuai dengan filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredCandidates.length > 0 && (
          <div className="p-4 border-t border-table-border bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="text-sm text-on-surface-variant">
              Menampilkan <span className="font-bold text-black">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, filteredCandidates.length)}</span> dari <span className="font-bold text-black">{filteredCandidates.length}</span> kandidat
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
                  className="px-2 py-1 border border-outline-variant rounded text-sm outline-none focus:border-primary bg-white"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter Talent Pool
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
                <label className="block text-sm font-semibold text-black mb-1.5">Pendidikan Terakhir</label>
                <select
                  value={filterEducation}
                  onChange={(e) => setFilterEducation(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
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
