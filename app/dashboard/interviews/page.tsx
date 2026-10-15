"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, AlertCircle, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getInterviewsDashboardData } from "@/app/actions/job";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const [filterPosition, setFilterPosition] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    position: "",
    customer: "",
  });

  const [allPositions, setAllPositions] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getInterviewsDashboardData();
        if (res.success && res.data) {
          setInterviews(res.data.interviews);
          setCustomers(res.data.customers);
          setAllPositions(res.data.allPositions);
        } else {
          // Fallback to localStorage if any
          const jobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
          const applications = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
          const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
          const sites = JSON.parse(localStorage.getItem("ugz_master_sites_operation") || "[]");
          const cust = JSON.parse(localStorage.getItem("ugz_master_customer") || "[]");
          setCustomers(cust);

          const getSiteName = (siteId: string) => sites.find((s: any) => s.id === siteId)?.siteName || siteId || "-";
          const getCustomerName = (cId: string) => cust.find((c: any) => c.id === cId)?.name || cId || "-";

          const interviewList: any[] = [];
          const positionsSet = new Set<string>();

          applications.forEach((app: any) => {
            const job = jobs.find((j: any) => j.id === app.jobId);
            if (!job) return;

            const currentTimelineStage = job.timeline?.find((t: any) => t.id === app.currentStage);
            if (!currentTimelineStage) return;

            const stageTitle = currentTimelineStage.title || "";
            const isInterviewStage = stageTitle.toLowerCase().includes("interview") || app.currentStage === "stage_2" || app.currentStage === "stage_5";

            if (isInterviewStage) {
              const candidateProfile = profiles[app.candidateId] || {};
              const deadlineDate = new Date(currentTimelineStage.deadlineDate);
              const now = new Date();
              const diffTime = deadlineDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let slaStatus = "";
              if (diffDays < 0) slaStatus = "Overdue";
              else if (diffDays <= 2) slaStatus = "Reminder";
              else slaStatus = "On Track";

              interviewList.push({
                id: `${app.jobId}-${app.candidateId}`,
                jobId: app.jobId,
                candidateId: app.candidateId,
                jobPosition: job.posisi,
                customerId: job.customerId,
                customerName: getCustomerName(job.customerId),
                siteName: getSiteName(job.siteId || job.areaKerja),
                candidateName: candidateProfile.fullName || "Unknown",
                stageTitle: stageTitle,
                deadlineDate: deadlineDate.toISOString(),
                slaStatus: slaStatus,
                diffDays: diffDays,
                filePhoto: candidateProfile.filePhoto || null
              });
              
              if (job.posisi) positionsSet.add(job.posisi);
            }
          });

          interviewList.sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());
          setAllPositions(Array.from(positionsSet).sort());
          setInterviews(interviewList);
        }
      } catch (err) {
        console.error("Error loading interviews dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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

  const filteredInterviews = interviews.filter(item => {
    let match = true;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.candidateName.toLowerCase().includes(q) && !item.jobPosition.toLowerCase().includes(q)) {
        match = false;
      }
    }

    if (activeFilters.position && item.jobPosition !== activeFilters.position) {
      match = false;
    }

    if (activeFilters.customer && item.customerId !== activeFilters.customer) {
      match = false;
    }

    return match;
  });

  const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage) || 1;
  const paginatedInterviews = filteredInterviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading interviews...</div>;
  }

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-primary tracking-tight">Interviews Overview</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Daftar kandidat yang saat ini sedang berada pada tahap wawancara.
          </p>
        </div>

        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari kandidat / posisi..."
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
            {(activeFilters.position || activeFilters.customer) && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-table-border">
        <div className="flex-1 overflow-auto custom-scrollbar">
          {paginatedInterviews.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant flex flex-col items-center justify-center h-full">
              <Clock className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-semibold text-lg text-black">Tidak Ada Jadwal Interview</p>
              <p className="text-sm mt-1">Saat ini tidak ada kandidat yang sedang berada di tahap interview atau sesuai dengan filter.</p>
            </div>
          ) : (
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
              <tbody className="divide-y divide-table-border">
                {paginatedInterviews.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-surface-container-lowest transition-colors">
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
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredInterviews.length > 0 && (
          <div className="p-4 border-t border-table-border bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-on-surface-variant">
              Menampilkan <span className="font-bold text-black">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, filteredInterviews.length)}</span> dari <span className="font-bold text-black">{filteredInterviews.length}</span> interview
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Baris:</span>
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
                <Filter className="w-5 h-5 text-primary" /> Filter Interviews
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
