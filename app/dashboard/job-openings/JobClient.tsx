"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  MapPin,
  Filter,
  X,
} from "lucide-react";
import { useClientTable } from "@/hooks/useClientTable";

export default function JobClient({ initialData, customers }: { initialData: any[], customers: any[] }) {
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  const getDynamicGlobalStatus = (job: any) => {
    // In future this will check timelines, currently simple
    return job.status === "DRAFT" ? "Draft" : job.status;
  };

  const preFilteredData = useMemo(() => {
    return initialData.filter((job) => {
      let match = true;
      if (activeFilters.status && getDynamicGlobalStatus(job) !== activeFilters.status) {
        match = false;
      }
      if (activeFilters.customer && job.customerId !== activeFilters.customer) {
        match = false;
      }
      if (activeFilters.startDate || activeFilters.endDate) {
        const jobDate = new Date(job.tanggalMasuk);
        jobDate.setHours(0, 0, 0, 0);
        
        if (activeFilters.startDate) {
          const sDate = new Date(activeFilters.startDate);
          sDate.setHours(0, 0, 0, 0);
          if (jobDate < sDate) match = false;
        }
        if (activeFilters.endDate) {
          const eDate = new Date(activeFilters.endDate);
          eDate.setHours(0, 0, 0, 0);
          if (jobDate > eDate) match = false;
        }
      }
      return match;
    });
  }, [initialData, activeFilters]);

  const {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    paginatedData,
    totalItems,
    startIndex,
    endIndex,
  } = useClientTable({
    data: preFilteredData,
    searchKeys: ["noRegistrasi", "positionName", "position.name", "departmentName", "department.name"],
  });

  const handleApplyFilter = () => {
    setActiveFilters({
      status: filterStatus,
      customer: filterCustomer,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
    setPage(1);
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
    setPage(1);
    setIsFilterModalOpen(false);
  };

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
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Cari No Reg atau Posisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black bg-white transition-shadow"
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap"
            >
              <Filter className="w-4 h-4" /> 
              Filters
              {(activeFilters.status || activeFilters.customer || activeFilters.startDate || activeFilters.endDate) && (
                <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
              )}
            </button>
          </div>
          <div className="flex bg-surface-container-low border border-outline-variant rounded p-1 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded transition-colors ${viewMode === "card" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {paginatedData.length === 0 ? (
            <div className="py-20 text-center text-on-surface-variant flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary/50" />
              </div>
              <p className="font-semibold text-black mb-1">Belum ada Job Openings</p>
              <p className="text-xs max-w-sm mb-4">Tidak ada lowongan yang sesuai dengan kriteria pencarian dan filter Anda.</p>
              {!initialData.length && (
                <Link
                  href="/dashboard/job-openings/create"
                  className="text-primary font-semibold hover:underline text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Buat Lowongan Pertama
                </Link>
              )}
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
                    <tbody className="divide-y divide-table-border bg-white">
                      {paginatedData.map((job) => (
                        <tr key={job.id} className="hover:bg-table-row-hover transition-colors">
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
                  {paginatedData.map((job) => (
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

        {totalItems > 0 && (
          <div className="p-4 border-t border-table-border bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="text-sm text-on-surface-variant">
              Menampilkan <span className="font-bold text-black">{startIndex}</span> hingga <span className="font-bold text-black">{endIndex}</span> dari <span className="font-bold text-black">{totalItems}</span> lowongan
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Baris:</span>
                <select 
                  value={rowsPerPage} 
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-outline-variant rounded text-sm outline-none focus:border-primary bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold min-w-[3rem] text-center">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
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
