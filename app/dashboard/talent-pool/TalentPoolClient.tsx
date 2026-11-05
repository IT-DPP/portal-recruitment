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
  Loader2
} from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { getPaginatedTalentPool } from "@/app/actions/job";

interface TalentPoolClientProps {
  initialCandidates?: any[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export default function TalentPoolClient({
  initialCandidates = [],
  initialPagination = { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 }
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

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
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

          <Link
            href="/dashboard/talent-pool/add"
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Candidate
          </Link>
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
                <th className="px-6 py-4">Pendidikan</th>
                <th className="px-6 py-4">Kontak & Lokasi</th>
                <th className="px-6 py-4">Lamaran Terakhir</th>
                <th className="px-6 py-4 text-center">Status Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border font-medium text-slate-800">
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {candidate.filePhoto?.base64 ? (
                            <img 
                              src={candidate.filePhoto.base64} 
                              alt={candidate.fullName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {candidate.fullName}
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            NIK: {candidate.nik || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {candidate.latestEducation || "Tidak Ditentukan"}
                      </span>
                      {candidate.educationInstitution && (
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]" title={candidate.educationInstitution}>
                          {candidate.educationInstitution}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-700 font-medium">
                        {candidate.email}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        WA: {candidate.whatsapp}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">
                        {candidate.city}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {candidate.lastJobApplied}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {candidate.hasApplied ? "Melalui Portal" : "Ditambahkan Manual"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        candidate.lastStage === "Hired" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : candidate.lastStage?.includes("Ditolak") 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {candidate.lastStage}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-base font-semibold text-slate-700">Tidak ada kandidat ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Coba sesuaikan kata kunci pencarian atau filter pendidikan Anda.
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
