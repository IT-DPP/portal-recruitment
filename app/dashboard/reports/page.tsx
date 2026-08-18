"use client";

import React, { useEffect, useState, useMemo } from "react";
import { BarChart2, RefreshCw, Download, Filter, X } from "lucide-react";
import SummaryWidgets from "@/components/dashboard/reports/SummaryWidgets";
import PriorityJobsWidget, {
  PriorityJob,
} from "@/components/dashboard/reports/PriorityJobsWidget";
import PipelineFunnelWidget from "@/components/dashboard/reports/PipelineFunnelWidget";
import RejectionAnalysisWidget from "@/components/dashboard/reports/RejectionAnalysisWidget";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Job {
  id: string;
  noRegistrasi: string;
  posisi: string;
  siteId: string;
  jumlahPermintaan: number;
  globalStatus: string;
  priority: boolean;
  customerId?: string;
  publishedDate?: string;
  tanggalMasuk?: string;
}

interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  applicationDate: string;
  currentStage: string;
  history: {
    stageId: string;
    stageName: string;
    date: string;
    note: string;
  }[];
}

interface Site {
  id: string;
  siteName: string;
}

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────
export default function ReportsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterPosition, setFilterPosition] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    position: "",
    customer: "",
    startDate: "",
    endDate: ""
  });

  const loadData = () => {
    setIsLoading(true);
    try {
      const savedJobs = localStorage.getItem("ugz_jobs");
      const savedApps = localStorage.getItem("ugz_applications");
      const savedSites = localStorage.getItem("ugz_master_sites_operation");
      const savedCustomers = localStorage.getItem("ugz_master_customer");

      if (savedJobs) setJobs(JSON.parse(savedJobs));
      if (savedApps) setApplications(JSON.parse(savedApps));
      if (savedSites) setSites(JSON.parse(savedSites));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyFilter = () => {
    setActiveFilters({
      position: filterPosition,
      customer: filterCustomer,
      startDate: filterStartDate,
      endDate: filterEndDate
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterPosition("");
    setFilterCustomer("");
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveFilters({
      position: "",
      customer: "",
      startDate: "",
      endDate: ""
    });
    setIsFilterModalOpen(false);
  };

  // ── Apply Filters ──
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      let match = true;
      if (activeFilters.position && job.posisi !== activeFilters.position) match = false;
      if (activeFilters.customer && job.customerId !== activeFilters.customer) match = false;
      
      if (activeFilters.startDate || activeFilters.endDate) {
        const jobDateStr = job.publishedDate || job.tanggalMasuk;
        if (jobDateStr) {
          const jobDate = new Date(jobDateStr);
          jobDate.setHours(0,0,0,0);
          
          if (activeFilters.startDate) {
            const sDate = new Date(activeFilters.startDate);
            sDate.setHours(0,0,0,0);
            if (jobDate < sDate) match = false;
          }
          if (activeFilters.endDate) {
            const eDate = new Date(activeFilters.endDate);
            eDate.setHours(0,0,0,0);
            if (jobDate > eDate) match = false;
          }
        } else {
          match = false;
        }
      }
      return match;
    });
  }, [jobs, activeFilters]);

  const validJobIds = useMemo(() => new Set(filteredJobs.map(j => j.id)), [filteredJobs]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => validJobIds.has(app.jobId));
  }, [applications, validJobIds]);

  // ── Summary Stats ──
  const summaryData = useMemo(() => {
    const totalCandidates = filteredApps.length;
    const inPipeline = filteredApps.filter(
      (a) =>
        a.currentStage !== "Rejected" &&
        a.currentStage !== "stage_7"
    ).length;
    const employees = filteredApps.filter(
      (a) => a.currentStage === "stage_7"
    ).length;
    const rejected = filteredApps.filter(
      (a) => a.currentStage === "Rejected"
    ).length;
    return { totalCandidates, inPipeline, employees, rejected };
  }, [filteredApps]);

  // ── Priority Jobs ──
  const priorityJobs = useMemo<PriorityJob[]>(() => {
    const pJobs = filteredJobs.filter((j) => j.priority === true).slice(0, 5);
    return pJobs.map((job) => {
      const jobApps = filteredApps.filter((a) => a.jobId === job.id);
      const accepted = jobApps.filter((a) => a.currentStage === "stage_7").length;
      const rejected = jobApps.filter((a) => a.currentStage === "Rejected").length;
      const siteName =
        sites.find((s) => s.id === job.siteId)?.siteName || job.siteId || "-";
      return {
        id: job.id,
        noRegistrasi: job.noRegistrasi,
        posisi: job.posisi,
        siteId: job.siteId,
        jumlahPermintaan: job.jumlahPermintaan,
        applicants: jobApps.length,
        accepted,
        rejected,
        siteName,
      };
    });
  }, [filteredJobs, filteredApps, sites]);

  // ── Selected job name for funnel label ──
  const selectedJobName = useMemo(() => {
    if (!selectedJobId) return undefined;
    return filteredJobs.find((j) => j.id === selectedJobId)?.posisi;
  }, [selectedJobId, filteredJobs]);

  // ── Print / Export ──
  const handleExportPrint = () => {
    window.print();
  };

  const activePositions = Array.from(
    new Set(jobs.filter((j) => j.globalStatus === "Active" && j.posisi).map((j) => j.posisi))
  ).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* ── Page Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant ml-[52px]">
            Laporan komprehensif proses rekrutmen.{" "}
            <span className="text-[11px] font-mono text-on-surface-variant/70">
              Diperbarui:{" "}
              {lastRefreshed.toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors shadow-sm shrink-0 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" /> 
            Filters
            {(activeFilters.position || activeFilters.customer || activeFilters.startDate || activeFilters.endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportPrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-container transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ── No Data Warning ── */}
      {applications.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Data Kosong</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Belum ada data. Silakan jalankan Seeder terlebih dahulu melalui
              halaman Settings → Master Data untuk mengisi data dummy.
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Summary Stats ── */}
      <section>
        <SectionLabel label="Ringkasan Kandidat" />
        <SummaryWidgets data={summaryData} />
      </section>

      {/* ── Section 2: Priority Jobs ── */}
      <section>
        <SectionLabel label="Top 5 Lowongan Priority" />
        <PriorityJobsWidget
          jobs={priorityJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />
      </section>

      {/* ── Section 3: Pipeline Funnel ── */}
      <section>
        <SectionLabel label="End-to-End Pipeline Funnel" />
        <PipelineFunnelWidget
          applications={filteredApps}
          selectedJobId={selectedJobId}
          selectedJobName={selectedJobName}
        />
      </section>

      {/* ── Section 4: Rejection Analysis ── */}
      <section>
        <SectionLabel label="Analisis Penyebab Gugur" />
        <RejectionAnalysisWidget applications={filteredApps} />
      </section>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter Reports
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
                  {activePositions.map((pos: any) => (
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
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">End Date</label>
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

// ─────────────────────────────────────────────
// Helper: Section Label
// ─────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-primary" />
      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">
        {label}
      </h2>
      <div className="flex-1 h-px bg-table-border" />
    </div>
  );
}
