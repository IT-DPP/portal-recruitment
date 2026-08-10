"use client";

import React, { useEffect, useState, useMemo } from "react";
import { BarChart2, RefreshCw, Download } from "lucide-react";
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = () => {
    setIsLoading(true);
    try {
      const savedJobs = localStorage.getItem("ugz_jobs");
      const savedApps = localStorage.getItem("ugz_applications");
      const savedSites = localStorage.getItem("ugz_master_sites_operation");

      if (savedJobs) setJobs(JSON.parse(savedJobs));
      if (savedApps) setApplications(JSON.parse(savedApps));
      if (savedSites) setSites(JSON.parse(savedSites));
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

  // ── Summary Stats ──
  const summaryData = useMemo(() => {
    const totalCandidates = applications.length;
    const inPipeline = applications.filter(
      (a) =>
        a.currentStage !== "Rejected" &&
        a.currentStage !== "stage_7"
    ).length;
    const employees = applications.filter(
      (a) => a.currentStage === "stage_7"
    ).length;
    const rejected = applications.filter(
      (a) => a.currentStage === "Rejected"
    ).length;
    return { totalCandidates, inPipeline, employees, rejected };
  }, [applications]);

  // ── Priority Jobs ──
  const priorityJobs = useMemo<PriorityJob[]>(() => {
    const pJobs = jobs.filter((j) => j.priority === true).slice(0, 5);
    return pJobs.map((job) => {
      const jobApps = applications.filter((a) => a.jobId === job.id);
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
  }, [jobs, applications, sites]);

  // ── Selected job name for funnel label ──
  const selectedJobName = useMemo(() => {
    if (!selectedJobId) return undefined;
    return jobs.find((j) => j.id === selectedJobId)?.posisi;
  }, [selectedJobId, jobs]);

  // ── Print / Export ──
  const handleExportPrint = () => {
    window.print();
  };

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
          applications={applications}
          selectedJobId={selectedJobId}
          selectedJobName={selectedJobName}
        />
      </section>

      {/* ── Section 4: Rejection Analysis ── */}
      <section>
        <SectionLabel label="Analisis Penyebab Gugur" />
        <RejectionAnalysisWidget applications={applications} />
      </section>
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
