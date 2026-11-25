"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  X,
  User as UserIcon,
  AlertCircle,
  ChevronDown,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getFilteredPipelineData,
} from "@/app/actions/job";

interface PipelineClientProps {
  initialJobs: any[];
  initialApplications: any[];
  customers: any[];
  stages: any[];
  errorMessage?: string;
}

export default function PipelineClient({
  initialJobs,
  initialApplications,
  customers,
  stages,
  errorMessage,
}: PipelineClientProps) {
  const modal = useModal();

  const [jobs, setJobs] = useState<any[]>(initialJobs || []);
  const [applications, setApplications] = useState<any[]>(initialApplications || []);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  const [serverError, setServerError] = useState<string | null>(errorMessage || null);

  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    position: "",
    startDate: "",
    endDate: "",
    customer: "",
  });

  // Stage-level pagination limits
  const [stageLimits, setStageLimits] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setJobs(initialJobs || []);
  }, [initialJobs]);

  useEffect(() => {
    setApplications(initialApplications || []);
  }, [initialApplications]);

  // Map profiles helper
  const mapProfiles = (apps: any[]) => {
    const profiles: Record<string, any> = {};
    apps.forEach((app: any) => {
      if (app.candidateProfile) {
        const photoDoc = app.candidateProfile.documents?.find((d: any) => {
          const dt = (d.documentType || "").toLowerCase();
          return dt === "photo" || dt === "pas foto" || dt.includes("photo") || dt.includes("pas foto");
        });

        const photoUrl = photoDoc?.objectKey
          ? `/api/file?key=${encodeURIComponent(photoDoc.objectKey)}`
          : photoDoc?.fileUrl || app.candidateProfile.user?.image || null;

        profiles[app.candidateProfileId] = {
          ...app.candidateProfile,
          fullName: app.candidateProfile.user?.name || "Unknown",
          nik: app.candidateProfile.nik,
          filePhoto: photoUrl ? { base64: photoUrl } : null,
        };
      }
    });
    return profiles;
  };

  useEffect(() => {
    setCandidateProfiles(mapProfiles(applications));
  }, [applications]);

  // Server-side filter effect
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    startTransition(async () => {
      const res = await getFilteredPipelineData({
        search: debouncedSearch,
        position: activeFilters.position,
        customerId: activeFilters.customer,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
      });

      if (res.success && res.data) {
        setJobs(res.data.jobs);
        setApplications(res.data.applications);
        setCandidateProfiles(mapProfiles(res.data.applications));
      }
    });
  }, [debouncedSearch, activeFilters, hasMounted]);

  const handleApplyFilter = () => {
    setActiveFilters({
      position: filterPosition,
      startDate: filterStartDate,
      endDate: filterEndDate,
      customer: filterCustomer,
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterPosition("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCustomer("");
    setActiveFilters({
      position: "",
      startDate: "",
      endDate: "",
      customer: "",
    });
    setIsFilterModalOpen(false);
  };

  // Helper to expand cards in a specific stage column
  const handleLoadMoreInStage = (stageId: string) => {
    setStageLimits((prev) => ({
      ...prev,
      [stageId]: (prev[stageId] || 15) + 15,
    }));
  };

  // Filter application cards by active status
  const filteredApps = applications.filter((app) => {
    if (app.status === "REJECTED") return false;
    const stageObj = stages.find((s) => s.id === app.currentStageId);
    const stageName = (stageObj?.name || "").toLowerCase();
    const isPostMcuStage =
      ["stage_8", "stage_9", "stage_10"].includes(app.currentStageId) ||
      ["training", "induction", "pkwt"].some((n) => stageName.includes(n));

    if (app.status === "HIRED" && !isPostMcuStage) return false;
    return true;
  });

  const getAppStatus = (app: any) => {
    const job = jobs.find((j) => j.id === app.jobId);
    if (!job || !job.timeline) return "normal";

    const stageTimeline = job.timeline.find((t: any) => t.stageId === app.currentStageId);
    if (!stageTimeline || stageTimeline.status === "Completed") return "normal";

    const isUnlimited =
      stageTimeline.stage?.slaDays === 0 ||
      ["stage_8", "stage_9", "stage_10"].includes(app.currentStageId) ||
      ["training", "induction", "pkwt"].some((n) => (stageTimeline.stage?.name || "").toLowerCase().includes(n));
    if (isUnlimited) return "normal";

    const deadline = new Date(stageTimeline.deadlineDate);
    const now = new Date();

    if (now > deadline) {
      return "overdue";
    }
    return "normal";
  };

  const getJobName = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    return job ? job.positionName || job.position?.name || "Posisi Umum" : jobId;
  };

  const activePositions = Array.from(
    new Set(
      jobs
        .filter((j) => j.status === "ACTIVE" && (j.positionName || j.position?.name))
        .map((j) => j.positionName || j.position?.name)
    )
  ).sort();

  const hasActiveFilters = Boolean(
    activeFilters.position || activeFilters.startDate || activeFilters.endDate || activeFilters.customer
  );

  return (
    <div className="w-full min-w-0 space-y-4 pb-12 flex flex-col h-[calc(100vh-100px)] relative">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0 shrink-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-[#0A2540] tracking-tight">Pipeline Dashboard</h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor dan loloskan kandidat di seluruh tahapan rekrutmen aktif secara perorangan maupun massal.
          </p>
        </div>

        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kandidat atau NIK..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all bg-white text-slate-900 shadow-2xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-4 py-2 border font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-2xs shrink-0 whitespace-nowrap ${
              hasActiveFilters
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Server Error Banner */}
      {serverError && (
        <div className="p-3.5 rounded-xl border bg-red-50 text-red-800 border-red-200 text-xs font-semibold flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{serverError}</span>
          </div>
          <button onClick={() => setServerError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-20 px-1 custom-scrollbar relative overscroll-x-contain">
        {isPending && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-semibold text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memperbarui pipeline...
          </div>
        )}

        {stages.map((stage) => {
          const allStageApps = filteredApps.filter((a) => a.currentStageId === stage.id);
          const currentLimit = stageLimits[stage.id] || 15;
          const visibleStageApps = allStageApps.slice(0, currentLimit);
          const hasMore = allStageApps.length > currentLimit;
          const remainingCount = allStageApps.length - currentLimit;

          return (
            <div
              key={stage.id}
              className="w-[320px] shrink-0 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 rounded-t-xl shrink-0 bg-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate" title={stage.name}>
                      {stage.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {allStageApps.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
                {visibleStageApps.map((app) => {
                  const profile = candidateProfiles[app.candidateProfileId] || {};
                  const status = getAppStatus(app);
                  const isAppOverdue = status === "overdue";
                  const hasNote = app.stageNotes && app.stageNotes[app.currentStageId];

                  return (
                    <div
                      key={app.id}
                      className={`
                        bg-white p-3.5 rounded-xl border transition-all relative border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs
                        ${isAppOverdue && !hasNote ? "border-l-4 border-l-red-500" : ""}
                      `}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 mt-0.5">
                          {profile.filePhoto?.base64 ? (
                            <img
                              src={profile.filePhoto.base64}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">
                            {profile.fullName || "Unknown"}
                          </h5>
                          <p
                            className="text-[10px] text-primary font-semibold truncate mb-1"
                            title={getJobName(app.jobId)}
                          >
                            {getJobName(app.jobId)}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-[9px] text-slate-400 font-mono">
                              Applied: {new Date(app.applicationDate).toLocaleDateString("id-ID")}
                            </p>
                          </div>

                          <Link
                            href={`/dashboard/job-openings/${app.jobId}/verify/${app.candidateProfileId}`}
                            className="inline-block w-full text-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold rounded-lg transition-colors border border-slate-200"
                          >
                            Verifikasi Detail
                          </Link>
                        </div>
                      </div>

                      {/* Overdue Warning */}
                      {isAppOverdue && (
                        <div className="mt-2 pt-2 border-t border-red-100">
                          {hasNote ? (
                            <div
                              className="text-[10px] text-red-800 bg-red-50 p-1.5 rounded line-clamp-2"
                              title={hasNote}
                            >
                              <span className="font-bold">Note:</span> {hasNote}
                            </div>
                          ) : (
                            <div className="w-full py-1 flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded px-1.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              Overdue Deadline
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Stage Pagination button */}
                {hasMore && (
                  <button
                    onClick={() => handleLoadMoreInStage(stage.id)}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-primary flex items-center justify-center gap-1 transition-colors shadow-2xs"
                  >
                    <span>Muat 15 lainnya (sisa {remainingCount})</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}

                {allStageApps.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    Tidak ada kandidat
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filter Pipeline
              </h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Posisi Lowongan</label>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden bg-white text-slate-900"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Klien</label>
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden bg-white text-slate-900"
                >
                  <option value="">Semua Customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mulai Tanggal</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-hidden text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Reset Filter
              </button>
              <button
                onClick={handleApplyFilter}
                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-colors shadow-2xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
