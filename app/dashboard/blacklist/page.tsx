"use client";

import React, { useState, useEffect } from "react";
import { Search, User as UserIcon, UserX, ChevronLeft, ChevronRight } from "lucide-react";

export default function BlacklistedCandidatesPage() {
  const [blacklistedProfiles, setBlacklistedProfiles] = useState<any[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    const blacklisted = Object.keys(profiles)
      .map(key => ({ id: key, ...profiles[key] }))
      .filter(profile => profile.isBlacklisted === true);
    
    setBlacklistedProfiles(blacklisted);
  }, []);

  // Apply Search
  const filteredProfiles = blacklistedProfiles.filter(profile => {
    let match = true;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!profile.fullName?.toLowerCase().includes(q) && !profile.nik?.includes(q)) {
        match = false;
      }
    }

    return match;
  });

  // Sorting: Newest blacklisted first
  filteredProfiles.sort((a, b) => {
    const dateA = new Date(a.blacklistedDate || 0).getTime();
    const dateB = new Date(b.blacklistedDate || 0).getTime();
    return dateB - dateA;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage) || 1;
  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserX className="w-6 h-6" /> Blacklisted Candidates
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            Daftar kandidat yang telah masuk ke dalam daftar hitam (blacklist).
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
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-shadow bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-table-border rounded-xl shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Kandidat</th>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal Blacklist</th>
                <th className="px-6 py-4">Catatan (Reason)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border">
              {paginatedProfiles.length > 0 ? (
                paginatedProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 font-semibold border border-slate-200">
                        {profile.blacklistedDate ? new Date(profile.blacklistedDate).toLocaleDateString("id-ID") : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-medium line-clamp-2" title={profile.blacklistNote}>
                        {profile.blacklistNote || "Tidak ada catatan."}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <UserX className="w-10 h-10 opacity-20" />
                      <p>Tidak ada data kandidat yang di-blacklist.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProfiles.length > 0 && (
          <div className="p-4 border-t border-table-border bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-on-surface-variant">
              Menampilkan <span className="font-bold text-black">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, filteredProfiles.length)}</span> dari <span className="font-bold text-black">{filteredProfiles.length}</span> kandidat
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
                  className="px-2 py-1 border border-outline-variant rounded text-sm outline-none focus:border-slate-800"
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
    </div>
  );
}
