"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Clock, AlertCircle, Search, Filter, X, Loader2 } from "lucide-react";
import { getPaginatedInterviewsDashboardData } from "@/app/actions/job";
import PaginationBar from "@/components/ui/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allPositions, setAllPositions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterPosition, setFilterPosition] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    position: "",
    customer: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getPaginatedInterviewsDashboardData({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        position: activeFilters.position,
        customerId: activeFilters.customer,
      });

      if (res.success && res.data) {
        setInterviews(res.data.interviews);
        setCustomers(res.data.customers);
        setAllPositions(res.data.allPositions);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    });
  }, [currentPage, itemsPerPage, debouncedSearch, activeFilters]);

  const handleApplyFilter = () => {
    setActiveFilters({
      position: filterPosition,
      customer: filterCustomer,
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterPosition("");
    setFilterCustomer("");
    setActiveFilters({
      position: "",
      customer: "",
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const hasActiveFilters = Boolean(activeFilters.position || activeFilters.customer);

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Interview Schedule & SLA
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Pantau seluruh kandidat yang sedang dalam tahap interview (HR/User) beserta deadline SLA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 min-w-0 w-full lg:w-auto shrink-0">
          <div className="relative min-w-0 flex-1 w-full sm:w-auto sm:max-w-xs">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kandidat atau NIK..."
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
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data interview...
              </div>
            </div>
          )}

          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 text-xs uppercase font-bold text-on-surface-variant border-b border-table-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Lowongan</th>
                <th className="px-6 py-4 whitespace-nowrap">Kandidat</th>
                <th className="px-6 py-4 whitespace-nowrap">Stage</th>
                <th className="px-6 py-4 whitespace-nowrap">SLA Deadline</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border font-medium text-slate-800">
              {interviews.length > 0 ? (
                interviews.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-black">{item.jobPosition}</p>
                      <p className="text-xs text-on-surface-variant truncate max-w-[200px]">
                        {item.customerName} • {item.siteName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                          {item.filePhoto?.base64 ? (
                            <img 
                              src={item.filePhoto.base64} 
                              alt={item.candidateName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-primary">
                              {item.candidateName?.charAt(0)?.toUpperCase() || "C"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-primary">{item.candidateName}</p>
                          {item.scheduledDate && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              Jadwal: {new Date(item.scheduledDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200 uppercase tracking-wider">
                        {item.stageTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[13px] text-black">
                          {new Date(item.deadlineDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {item.slaStatus === "Overdue" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-wide">
                            <AlertCircle className="w-3 h-3" /> Overdue ({-item.diffDays} Days)
                          </span>
                        )}
                        {item.slaStatus === "Reminder" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                            <Clock className="w-3 h-3" /> Reminder ({item.diffDays} Days Left)
                          </span>
                        )}
                        {item.slaStatus === "On Track" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                            On Track ({item.diffDays} Days Left)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={`/dashboard/job-openings/${item.jobId}/verify/${item.candidateId}`} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Detail <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-base font-semibold text-slate-700">Tidak ada jadwal interview</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Saat ini tidak ada kandidat yang sedang berada di tahap interview atau sesuai dengan filter.
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
                <Filter className="w-5 h-5 text-primary" /> Filter Interview
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
                <label className="block text-sm font-semibold text-black mb-1.5">Posisi Lowongan</label>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Posisi</option>
                  {allPositions.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Customer / Klien</label>
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
