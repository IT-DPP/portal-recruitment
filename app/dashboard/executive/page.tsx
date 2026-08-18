"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, UserX, UserPlus, Briefcase, Filter, X } from 'lucide-react';
import StatWidget from '@/components/dashboard/StatWidget';
import RecentCandidatesTable, { CandidateRow } from '@/components/dashboard/RecentCandidatesTable';
import InterviewCalendar, { InterviewEvent } from '@/components/dashboard/InterviewCalendar';
import { startOfDay } from 'date-fns';

export default function ExecutiveDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSite, setFilterSite] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    site: "",
    position: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    // Load data from localStorage
    const rawApps = localStorage.getItem("ugz_applications");
    const rawCands = localStorage.getItem("ugz_candidate_profiles");
    const rawJobs = localStorage.getItem("ugz_jobs");
    const rawSites = localStorage.getItem("ugz_master_sites_operation");

    if (rawApps) setApplications(JSON.parse(rawApps));
    if (rawCands) setCandidates(JSON.parse(rawCands));
    if (rawJobs) setJobs(JSON.parse(rawJobs));
    if (rawSites) setSites(JSON.parse(rawSites));
  }, []);

  const handleApplyFilter = () => {
    setActiveFilters({
      site: filterSite,
      position: filterPosition,
      startDate: filterStartDate,
      endDate: filterEndDate
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterSite("");
    setFilterPosition("");
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveFilters({
      site: "",
      position: "",
      startDate: "",
      endDate: ""
    });
    setIsFilterModalOpen(false);
  };

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      let match = true;
      const job = jobs.find(j => j.id === app.jobId);
      
      if (activeFilters.site && job?.siteId !== activeFilters.site) {
        match = false;
      }
      
      if (activeFilters.position && job?.posisi !== activeFilters.position) {
        match = false;
      }

      if (activeFilters.startDate || activeFilters.endDate) {
        const jobDateStr = job?.publishedDate || job?.tanggalMasuk;
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
  }, [applications, jobs, activeFilters]);

  const statsData = useMemo(() => {
    let hrCount = 0;
    let userCount = 0;
    let rejectedCount = 0;
    let offeringCount = 0;

    filteredApps.forEach((app: any) => {
      if (app.currentStage === "stage_2") hrCount++;
      if (app.currentStage === "stage_5") userCount++;
      if (app.currentStage === "Rejected") rejectedCount++;
      if (app.currentStage === "stage_6" || app.currentStage === "stage_7") offeringCount++;
    });

    const uniqueCandidates = new Set(filteredApps.map(app => app.candidateId));

    return {
      total: uniqueCandidates.size,
      hr: hrCount,
      user: userCount,
      rejected: rejectedCount,
      onboarding: offeringCount
    };
  }, [filteredApps]);

  const stageBreakdown = useMemo(() => {
    const stageCounts: Record<string, number> = {
      "stage_1": 0, "stage_2": 0, "stage_3": 0, "stage_4": 0,
      "stage_5": 0, "stage_6": 0, "stage_7": 0
    };

    filteredApps.forEach((app: any) => {
      if (stageCounts[app.currentStage] !== undefined) {
        stageCounts[app.currentStage]++;
      }
    });

    return [
      { title: "CV Screening", value: stageCounts["stage_1"], color: "bg-blue-500" },
      { title: "Interview HR", value: stageCounts["stage_2"], color: "bg-yellow-500" },
      { title: "Psikotes", value: stageCounts["stage_3"], color: "bg-purple-500" },
      { title: "Technical Test", value: stageCounts["stage_4"], color: "bg-indigo-500" },
      { title: "Interview User", value: stageCounts["stage_5"], color: "bg-green-500" },
      { title: "Offering", value: stageCounts["stage_6"], color: "bg-teal-500" },
      { title: "MCU", value: stageCounts["stage_7"], color: "bg-rose-500" },
    ];
  }, [filteredApps]);

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

      return {
        id: app.id,
        name: cand?.fullName || 'Unknown',
        position: job?.posisi || 'Unknown',
        stage: stageName,
        site: site?.siteName || 'Unknown',
        candidateId: app.candidateId
      };
    });
  }, [filteredApps, candidates, jobs, sites]);

  const calendarEvents = useMemo(() => {
    const eventsMap: Record<string, { hr: number, user: number, skill: number }> = {};
    
    filteredApps.forEach((app: any) => {
      app.history.forEach((hist: any) => {
        const dateKey = hist.date.split('T')[0];
        if (!eventsMap[dateKey]) eventsMap[dateKey] = { hr: 0, user: 0, skill: 0 };
        
        if (hist.stageId === 'stage_2') eventsMap[dateKey].hr++;
        if (hist.stageId === 'stage_5') eventsMap[dateKey].user++;
        if (hist.stageId === 'stage_4' || hist.stageId === 'stage_3') eventsMap[dateKey].skill++;
      });
    });

    const events: InterviewEvent[] = [];
    Object.keys(eventsMap).forEach(dateKey => {
      const d = startOfDay(new Date(dateKey));
      if (eventsMap[dateKey].hr > 0) {
        events.push({ title: `${eventsMap[dateKey].hr}`, start: d, end: d, type: 'hr', count: eventsMap[dateKey].hr });
      }
      if (eventsMap[dateKey].user > 0) {
        events.push({ title: `${eventsMap[dateKey].user}`, start: d, end: d, type: 'user', count: eventsMap[dateKey].user });
      }
      if (eventsMap[dateKey].skill > 0) {
        events.push({ title: `${eventsMap[dateKey].skill}`, start: d, end: d, type: 'skill', count: eventsMap[dateKey].skill });
      }
    });

    return events;
  }, [filteredApps]);

  const stats = [
    { title: "Total Kandidat", value: statsData.total, icon: Users, trend: "+12%", trendUp: true },
    { title: "HR Interview", value: statsData.hr, icon: UserCheck, trend: "+5%", trendUp: true },
    { title: "User Interview", value: statsData.user, icon: Briefcase, trend: "-2%", trendUp: false },
    { title: "Rejected", value: statsData.rejected, icon: UserX, trend: "+15%", trendUp: false },
    { title: "On Boarding", value: statsData.onboarding, icon: UserPlus, trend: "+8%", trendUp: true },
  ];

  const activePositions = Array.from(
    new Set(jobs.filter((j) => j.globalStatus === "Active" && j.posisi).map((j) => j.posisi))
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Executive Dashboard</h2>
          <p className="text-sm text-on-surface-variant">Overview of recruitment metrics and activities.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" /> 
            Filters
            {(activeFilters.site || activeFilters.position || activeFilters.startDate || activeFilters.endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
        </div>
      </div>

      {/* Top Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <StatWidget key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Recent Candidates & Stage Breakdown */}
        <div className="xl:col-span-2 space-y-6">
          <RecentCandidatesTable candidates={recentCandidates} />
          
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-5">
            <h3 className="font-bold text-on-surface mb-4">Stage Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stageBreakdown.map((stage, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-surface-container-lowest border border-table-border flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <span className="text-xs font-medium text-on-surface-variant line-clamp-1" title={stage.title}>{stage.title}</span>
                  </div>
                  <span className="text-2xl font-bold text-on-surface">{stage.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="xl:col-span-1">
          <InterviewCalendar events={calendarEvents} />
        </div>
      </div>

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
                <label className="block text-sm font-semibold text-black mb-1.5">Site Operations</label>
                <select
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Site</option>
                  {sites.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>

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
