"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  LayoutGrid,
  List,
  MapPin,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import PaginationBar from "@/components/ui/PaginationBar";
import { useDebounce } from "@/hooks/useDebounce";
import { getPaginatedJobOpenings } from "@/app/actions/job";

interface JobClientProps {
  initialData?: any[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  customers?: any[];
}

export default function JobClient({
  initialData = [],
  initialPagination = { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 },
  customers = []
}: JobClientProps) {
  const [jobs, setJobs] = useState<any[]>(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Search input & debounce
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  // Advanced Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    status: "",
    customer: "",
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
      const res = await getPaginatedJobOpenings({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        status: activeFilters.status,
        customerId: activeFilters.customer,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
      });

      if (res.success && res.data) {
        setJobs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    });
  }, [currentPage, itemsPerPage, debouncedSearch, activeFilters, hasMounted]);

  const getDynamicGlobalStatus = (job: any) => {
    const s = (job.status || "").toUpperCase();
    if (s === "DRAFT") return "Draft";
    if (s === "ACTIVE") return "Active";
    if (s === "OVERDUE") return "Overdue";
    if (s === "CLOSED") return "Closed";
    return job.status || "";
  };

  const handleApplyFilter = () => {
    setActiveFilters({
      status: filterStatus,
      customer: filterCustomer,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterCustomer("");
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveFilters({
      status: "",
      customer: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const hasActiveFilters = Boolean(
    activeFilters.status ||
    activeFilters.customer ||
    activeFilters.startDate ||
    activeFilters.endDate
  );

  return (
    <div className="space-y-6 w-full min-w-0 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Job Openings</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Kelola daftar lowongan pekerjaan dan permintaannya.
          </p>
        </div>
        <Link
          href="/dashboard/job-openings/create"
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Job
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-table-border flex flex-col flex-1 overflow-hidden min-h-0">
        <div className="p-4 border-b border-table-border bg-surface-container-lowest flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="Cari No Reg atau Posisi..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black bg-white transition-shadow shadow-2xs"
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
              className={`px-4 py-2 border font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap ${
                hasActiveFilters
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-white border-outline-variant text-on-surface hover:bg-surface-container-low shadow-2xs"
              }`}
            >
              <Filter className="w-4 h-4" /> 
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
          <div className="flex bg-surface-container-low border border-outline-variant rounded p-1 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded transition-colors ${viewMode === "card" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 text-sm font-semibold text-primary">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data lowongan...
              </div>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary/50" />
              </div>
              <p className="font-semibold text-black mb-1">Belum ada Job Openings</p>
              <p className="text-xs max-w-sm mb-4">Tidak ada lowongan yang sesuai dengan kriteria pencarian dan filter Anda.</p>
              <Link
                href="/dashboard/job-openings/create"
                className="text-primary font-semibold hover:underline text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Buat Lowongan Baru
              </Link>
            </div>
          ) : (
            <div className="p-4 md:p-6">
              {viewMode === "table" ? (
                <div className="overflow-x-auto rounded-xl border border-table-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-table-header text-on-surface text-xs uppercase font-bold border-b border-table-border">
                      <tr>
                        <th className="px-6 py-4">No. Registrasi</th>
                        <th className="px-6 py-4">Posisi</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Lokasi</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-table-border bg-white font-medium text-slate-800">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-primary">
                            {job.noRegistrasi}
                          </td>
                          <td className="px-6 py-4 font-semibold text-black">
                            {job.positionName || job.position?.name || "Posisi Umum"}
                            {job.isPriority && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">Priority</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {job.customer?.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-black font-semibold">{job.site?.name || "Unknown"}</div>
                            <div className="text-[11px] text-on-surface-variant">{job.city?.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                              {getDynamicGlobalStatus(job)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              href={`/dashboard/job-openings/${job.id}`}
                              className="text-primary font-semibold hover:underline"
                            >
                              Detail
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="bg-white border border-table-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
                      <div className="absolute top-0 right-0">
                        <div className="text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm bg-gray-500">
                          {getDynamicGlobalStatus(job)}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-[10px] font-mono text-on-surface-variant font-semibold mb-1">
                          {job.noRegistrasi}
                        </p>
                        <h3 className="text-lg font-bold text-primary leading-tight flex items-center gap-2">
                          {job.positionName || job.position?.name || "Posisi Umum"}
                          {job.isPriority && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">Priority</span>
                          )}
                        </h3>
                      </div>

                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-black">
                              {job.site?.name || "Unknown"}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {job.city?.name}, {job.province?.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${job.statusPermintaan === "Penambahan" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {job.statusPermintaan}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-outline-variant bg-surface-container-lowest text-on-surface uppercase tracking-wider">
                            {job.jumlahPermintaan} Kebutuhan
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-table-border flex justify-between items-center mt-auto">
                        <p className="text-[10px] text-on-surface-variant">
                          Dibuat: {new Date(job.tanggalMasuk).toLocaleDateString("id-ID")}
                        </p>
                        <Link
                          href={`/dashboard/job-openings/${job.id}`}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Detail Lowongan
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter Job Openings
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
                <label className="block text-sm font-semibold text-black mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Customer</label>
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Mulai (Dibuat)</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Sampai (Dibuat)</label>
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
