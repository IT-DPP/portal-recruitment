"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, X, User as UserIcon, Clock, AlertCircle } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

export default function PipelineClient({ initialJobs, initialApplications, customers, stages }: { initialJobs: any[], initialApplications: any[], customers: any[], stages: any[] }) {
  const modal = useModal();
  
  const [jobs, setJobs] = useState<any[]>(initialJobs || []);
  const [applications, setApplications] = useState<any[]>(initialApplications || []);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, any>>({});
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    position: "",
    startDate: "",
    endDate: "",
    customer: ""
  });

  useEffect(() => {
    setJobs(initialJobs || []);
  }, [initialJobs]);

  useEffect(() => {
    setApplications(initialApplications || []);
  }, [initialApplications]);

  useEffect(() => {
    // Map profiles
    const profiles: Record<string, any> = {};
    initialApplications.forEach((app: any) => {
       if (app.candidateProfile) {
         profiles[app.candidateProfileId] = {
           ...app.candidateProfile,
           fullName: app.candidateProfile.user?.name || "Unknown",
           nik: app.candidateProfile.nik
         };
       }
    });
    setCandidateProfiles(profiles);
  }, [initialApplications]);

  const handleApplyFilter = () => {
    setActiveFilters({
      position: filterPosition,
      startDate: filterStartDate,
      endDate: filterEndDate,
      customer: filterCustomer
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
      customer: ""
    });
    setIsFilterModalOpen(false);
  };

  // 1. Filter Jobs based on job criteria (position, date, customer)
  const filteredJobs = jobs.filter(job => {
    let match = true;
    
    // Only active jobs? User said: "lowongan yang sedang aktif"
    if (job.status !== "ACTIVE") {
      match = false;
    }

    if (activeFilters.position && !job.positionName?.toLowerCase().includes(activeFilters.position.toLowerCase())) {
      match = false;
    }

    if (activeFilters.customer && job.customerId !== activeFilters.customer) {
      match = false;
    }

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
        // If it doesn't have a date and we filter by date, maybe exclude it?
        match = false;
      }
    }

    return match;
  });

  const validJobIds = new Set(filteredJobs.map(j => j.id));

  // 2. Filter applications based on valid jobs AND candidate name search
  const filteredApps = applications.filter(app => {
    if (!validJobIds.has(app.jobId)) return false;

    const profile = candidateProfiles[app.candidateProfileId];
    if (searchQuery) {
      if (!profile) return false;
      const q = searchQuery.toLowerCase();
      if (!profile.fullName?.toLowerCase().includes(q) && !profile.nik?.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Calculate overdue/status manually based on job timeline
  const getAppStatus = (app: any) => {
    const job = jobs.find(j => j.id === app.jobId);
    if (!job || !job.timeline) return "normal";
    
    const stageTimeline = job.timeline.find((t: any) => t.stageId === app.currentStageId);
    if (!stageTimeline || stageTimeline.status === "Completed") return "normal";

    const deadline = new Date(stageTimeline.deadlineDate);
    const now = new Date();
    
    if (now > deadline) {
      return "overdue";
    }
    return "normal";
  };

  const getJobName = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.positionName : jobId;
  };

  const activePositions = Array.from(
    new Set(jobs.filter((j) => j.status === "ACTIVE" && j.positionName).map((j) => j.positionName))
  ).sort();

  return (
    <div className="w-full min-w-0 space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold text-primary tracking-tight">Pipeline Dashboard</h2>
          <p className="text-sm text-on-surface-variant font-medium">Filter and monitor candidate pipelines across active jobs.</p>
        </div>

        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search candidate by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow bg-white"
            />
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" /> 
            Filters
            {(activeFilters.position || activeFilters.startDate || activeFilters.endDate || activeFilters.customer) && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4 px-1 custom-scrollbar">
        {stages.map((stage) => {
          const stageApps = filteredApps.filter(a => a.currentStageId === stage.id);
          
          return (
            <div 
              key={stage.id} 
              className="w-[320px] shrink-0 bg-surface-container-lowest border border-table-border rounded-xl flex flex-col max-h-full"
            >
              <div className="p-4 border-b border-table-border rounded-t-xl shrink-0 bg-surface-bright">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm text-on-surface truncate pr-2">{stage.name}</h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {stageApps.length}
                  </span>
                </div>
              </div>
              
              <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {stageApps.map((app) => {
                  const profile = candidateProfiles[app.candidateProfileId] || {};
                  const status = getAppStatus(app);
                  const isAppOverdue = status === "overdue";
                  const hasNote = app.stageNotes && app.stageNotes[app.currentStageId];

                  return (
                    <div
                      key={app.id}
                      className={`
                        bg-white p-4 rounded-xl border shadow-sm transition-shadow relative
                        ${isAppOverdue && !hasNote ? "border-red-400 border-l-4" : "border-outline-variant hover:border-primary/50"}
                      `}
                    >
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 overflow-hidden">
                          {profile.filePhoto?.base64 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.filePhoto.base64} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-on-surface-variant" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-black truncate">{profile.fullName || "Unknown"}</h5>
                          <p className="text-[10px] text-primary font-bold truncate mb-1" title={getJobName(app.jobId)}>
                            {getJobName(app.jobId)}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-[10px] text-on-surface-variant font-mono">
                              Applied: {new Date(app.applicationDate).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                          
                          <Link 
                            href={`/dashboard/job-openings/${app.jobId}/verify/${app.candidateProfileId}`}
                            className="inline-block w-full text-center px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded hover:bg-primary/20 transition-colors"
                          >
                            Detail Verification
                          </Link>
                        </div>
                      </div>

                      {/* Overdue Warning */}
                      {isAppOverdue && (
                        <div className="mt-3 pt-2 border-t border-red-100">
                          {hasNote ? (
                            <div className="text-[11px] text-red-800 bg-red-50 p-1.5 rounded line-clamp-2" title={hasNote}>
                              <span className="font-bold">Note:</span> {hasNote}
                            </div>
                          ) : (
                            <div className="w-full py-1 flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 rounded">
                              <AlertCircle className="w-3.5 h-3.5 ml-1.5" />
                              Overdue Deadline
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {stageApps.length === 0 && (
                  <div className="text-center py-8 text-on-surface-variant text-sm border-2 border-dashed border-outline-variant rounded-xl opacity-50">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter Pipeline
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Start Date (Active)</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">End Date (Active)</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
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
