"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { RefreshCw, Download, Filter, X, LayoutDashboard, Sparkles, ChevronRight } from "lucide-react";
import SummaryWidgets from "@/components/dashboard/reports/SummaryWidgets";
import PriorityJobsWidget, {
  PriorityJob,
} from "@/components/dashboard/reports/PriorityJobsWidget";
import PipelineFunnelWidget from "@/components/dashboard/reports/PipelineFunnelWidget";
import RejectionAnalysisWidget from "@/components/dashboard/reports/RejectionAnalysisWidget";
import RecentCandidatesTable from "@/components/dashboard/RecentCandidatesTable";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  getExecutiveDashboardData,
  DashboardJob,
  DashboardApplication,
  DashboardSite,
  DashboardCustomer,
  DashboardCandidate,
} from "@/app/actions/dashboard";

type Job = DashboardJob;
type Application = DashboardApplication;
type Site = DashboardSite;

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────
export default function ExecutiveDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any>({});
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getExecutiveDashboardData();
      if (res.success && res.data) {
        setJobs(res.data.jobs);
        setApplications(res.data.applications);
        setSites(res.data.sites);
        setCustomers(res.data.customers);
        setCandidates(res.data.candidates);
        setLastRefreshed(new Date());
      } else {
        console.error("Dashboard error:", res.error);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
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

  // ── Recent Candidates (5 items) ──
  const recentCandidates = useMemo(() => {
    const sortedApps = [...filteredApps].sort((a, b) => {
      const dateA = new Date(a.history[a.history.length - 1]?.date || 0).getTime();
      const dateB = new Date(b.history[b.history.length - 1]?.date || 0).getTime();
      return dateB - dateA;
    }).slice(0, 5);

    return sortedApps.map((app: any) => {
      const cand = candidates[app.candidateId];
      const job = jobs.find((j: any) => j.id === app.jobId);
      const site = sites.find((s: any) => s.id === job?.siteId);
      
      let stageName = "Applied";
      const lastHistory = app.history[app.history.length - 1];
      if (lastHistory) {
        stageName = lastHistory.stageName;
      }

      let status = "On Schedule";
      let message = "";
      const currentTimeline = job?.timeline?.find((t: any) => t.id === app.currentStage);
      if (currentTimeline) {
        if (currentTimeline.status === "Completed") {
          status = "Completed";
        } else if (new Date() > new Date(currentTimeline.deadlineDate) || currentTimeline.overdueNotes) {
          status = "Overdue";
          message = currentTimeline.overdueNotes || "";
        }
      }

      return {
        id: app.id,
        name: cand?.fullName || 'Unknown',
        position: job?.posisi || 'Unknown',
        stage: stageName,
        site: site?.siteName || 'Unknown',
        candidateId: app.candidateId,
        status,
        message
      };
    });
  }, [filteredApps, candidates, jobs, sites]);

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
          <p className="text-sm font-medium">Memuat data dashboard...</p>
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-2xs">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-600 ml-[52px]">
            Laporan komprehensif dan ringkasan aktivitas rekrutmen.{" "}
            <span className="text-[11px] font-mono text-slate-500">
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

      {/* ── Executive Onboarding Card (When 0 Applications) ── */}
      {applications.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-7 sm:p-8 shadow-xl border border-blue-900/50">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Command Center • Siap Beroperasi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Selamat Datang di Portal Rekrutmen Terpadu
              </h2>
              <p className="text-sm text-blue-100/80 leading-relaxed">
                Database dan sistem pelacakan pipeline rekrutmen telah aktif terhubung. Saat ini belum ada data lamaran yang masuk. Begitu Anda mempublikasikan lowongan kerja atau kandidat melamar, analitik funnel, passing rate, dan SLA akan otomatis dihitung secara real-time.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">End-to-End Funnel</p>
                  <p className="text-xs text-blue-100/70">Otomasi konversi 7 tahapan seleksi</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-0.5">SLA Monitoring</p>
                  <p className="text-xs text-blue-100/70">Deteksi bottleneck & overdue otomatis</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-0.5">Rejection Insight</p>
                  <p className="text-xs text-blue-100/70">Analisis penyebab gugur kandidat</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/dashboard/job-openings/create"
                className="px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-blue-50 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>+ Buat Lowongan Baru</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/dashboard/pipeline"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Pipeline Pelamar</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 1: Summary Stats ── */}
      <section>
        <SectionLabel label="Ringkasan Kandidat" />
        <SummaryWidgets data={summaryData} />
      </section>
      
      {/* ── Section: Recent Activities ── */}
      <section>
        <SectionLabel label="5 Aktivitas Terbaru (Recent Candidates)" />
        <RecentCandidatesTable candidates={recentCandidates} />
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
                <Filter className="w-5 h-5 text-primary" /> Filter Dashboard
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
                <SearchableSelect
                  options={[
                    { value: "", label: "Semua Posisi" },
                    ...activePositions.map((pos: any) => ({ value: pos, label: pos }))
                  ]}
                  value={filterPosition}
                  onChange={(val) => setFilterPosition(val)}
                  placeholder="Semua Posisi"
                  searchPlaceholder="Cari nama posisi job..."
                  debounceMs={250}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Customer</label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Semua Customer" },
                    ...customers.map((c: any) => ({
                      value: c.id,
                      label: c.name,
                      subLabel: c.code || undefined
                    }))
                  ]}
                  value={filterCustomer}
                  onChange={(val) => setFilterCustomer(val)}
                  placeholder="Semua Customer"
                  searchPlaceholder="Cari nama customer / klien..."
                  debounceMs={250}
                />
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
      <div className="w-1.5 h-5 rounded-full bg-primary shadow-2xs" />
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
        {label}
      </h2>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

