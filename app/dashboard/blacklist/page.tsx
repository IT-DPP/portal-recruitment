"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Search, User as UserIcon, UserX, X, Loader2 } from "lucide-react";
import { getPaginatedBlacklistedCandidates } from "@/app/actions/job";
import PaginationBar from "@/components/ui/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";

export default function BlacklistedCandidatesPage() {
  const [blacklistedProfiles, setBlacklistedProfiles] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });
  
  // Search
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getPaginatedBlacklistedCandidates({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
      });

      if (res.success && res.data) {
        setBlacklistedProfiles(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    });
  }, [currentPage, itemsPerPage, debouncedSearch]);

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0 shrink-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserX className="w-6 h-6 text-red-600" /> Blacklisted Candidates
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Daftar kandidat yang telah masuk ke dalam daftar hitam (blacklist).
          </p>
        </div>

        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, NIK, email, no hp..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 border border-outline-variant rounded-xl text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition-shadow bg-white text-slate-900 shadow-2xs"
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
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white border border-table-border rounded-xl shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 text-sm font-semibold text-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Memuat data blacklist...
              </div>
            </div>
          )}

          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Kandidat</th>
                <th className="px-6 py-4 whitespace-nowrap">Kontak</th>
                <th className="px-6 py-4 whitespace-nowrap">Lowongan Terakhir</th>
                <th className="px-6 py-4 whitespace-nowrap">Tahapan Terakhir</th>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal Blacklist</th>
                <th className="px-6 py-4">Catatan (Reason)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border font-medium text-slate-800">
              {blacklistedProfiles.length > 0 ? (
                blacklistedProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                          {profile.filePhoto?.base64 ? (
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
                      <span className="font-semibold text-primary">{profile.lastJobApplied || "-"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                        {profile.lastStage || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono bg-red-50 text-red-700 px-2.5 py-1 rounded-md font-semibold border border-red-200">
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
                  <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant">
                    <UserX className="w-12 h-12 mx-auto mb-3 opacity-20 text-red-500" />
                    <p className="text-base font-semibold text-slate-700">Tidak ada data kandidat yang di-blacklist.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Kandidat yang masuk daftar hitam akan muncul di sini.
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
    </div>
  );
}
