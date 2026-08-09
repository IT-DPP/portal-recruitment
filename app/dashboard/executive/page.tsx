"use client";

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Users, UserCheck, UserX, UserPlus, Briefcase } from 'lucide-react';
import StatWidget from '@/components/dashboard/StatWidget';
import RecentCandidatesTable, { CandidateRow } from '@/components/dashboard/RecentCandidatesTable';
import InterviewCalendar, { InterviewEvent } from '@/components/dashboard/InterviewCalendar';
import { subDays, startOfDay } from 'date-fns';

export default function ExecutiveDashboard() {
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  const [statsData, setStatsData] = useState({
    total: 0,
    hr: 0,
    user: 0,
    rejected: 0,
    onboarding: 0
  });

  const [stageBreakdown, setStageBreakdown] = useState([
    { title: "CV Screening", value: 0, color: "bg-blue-500" },
    { title: "Interview HR", value: 0, color: "bg-yellow-500" },
    { title: "Psikotes", value: 0, color: "bg-purple-500" },
    { title: "Technical Test", value: 0, color: "bg-indigo-500" },
    { title: "Interview User", value: 0, color: "bg-green-500" },
    { title: "Offering", value: 0, color: "bg-teal-500" },
    { title: "MCU", value: 0, color: "bg-rose-500" },
  ]);

  const [recentCandidates, setRecentCandidates] = useState<CandidateRow[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<InterviewEvent[]>([]);

  useEffect(() => {
    // 1. Load data from localStorage
    const rawApps = localStorage.getItem("ugz_applications");
    const rawCands = localStorage.getItem("ugz_candidate_profiles");
    const rawJobs = localStorage.getItem("ugz_jobs");
    const rawSites = localStorage.getItem("ugz_master_sites_operation");

    if (!rawApps || !rawCands || !rawJobs || !rawSites) return;

    const apps = JSON.parse(rawApps);
    const cands = JSON.parse(rawCands);
    const jobs = JSON.parse(rawJobs);
    const sites = JSON.parse(rawSites);

    // 2. Compute Stats
    let hrCount = 0;
    let userCount = 0;
    let rejectedCount = 0;
    let offeringCount = 0;
    
    const stageCounts: Record<string, number> = {
      "stage_1": 0, "stage_2": 0, "stage_3": 0, "stage_4": 0,
      "stage_5": 0, "stage_6": 0, "stage_7": 0, "Rejected": 0
    };

    apps.forEach((app: any) => {
      if (app.currentStage === "stage_2") hrCount++;
      if (app.currentStage === "stage_5") userCount++;
      if (app.currentStage === "Rejected") rejectedCount++;
      if (app.currentStage === "stage_6" || app.currentStage === "stage_7") offeringCount++;
      
      if (stageCounts[app.currentStage] !== undefined) {
        stageCounts[app.currentStage]++;
      }
    });

    setStatsData({
      total: Object.keys(cands).length,
      hr: hrCount,
      user: userCount,
      rejected: rejectedCount,
      onboarding: offeringCount
    });

    setStageBreakdown([
      { title: "CV Screening", value: stageCounts["stage_1"], color: "bg-blue-500" },
      { title: "Interview HR", value: stageCounts["stage_2"], color: "bg-yellow-500" },
      { title: "Psikotes", value: stageCounts["stage_3"], color: "bg-purple-500" },
      { title: "Technical Test", value: stageCounts["stage_4"], color: "bg-indigo-500" },
      { title: "Interview User", value: stageCounts["stage_5"], color: "bg-green-500" },
      { title: "Offering", value: stageCounts["stage_6"], color: "bg-teal-500" },
      { title: "MCU", value: stageCounts["stage_7"], color: "bg-rose-500" },
    ]);

    // 3. Recent Candidates
    const sortedApps = [...apps].sort((a, b) => {
      const dateA = new Date(a.history[a.history.length - 1]?.date || 0).getTime();
      const dateB = new Date(b.history[b.history.length - 1]?.date || 0).getTime();
      return dateB - dateA;
    }).slice(0, 5);

    const recent = sortedApps.map((app: any) => {
      const cand = cands[app.candidateId];
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
    setRecentCandidates(recent);

    // 4. Aggregated Calendar Events
    const eventsMap: Record<string, { hr: number, user: number, skill: number }> = {};
    
    apps.forEach((app: any) => {
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

    setCalendarEvents(events);
  }, []);

  const stats = [
    { title: "Total Kandidat", value: statsData.total, icon: Users, trend: "+12%", trendUp: true },
    { title: "HR Interview", value: statsData.hr, icon: UserCheck, trend: "+5%", trendUp: true },
    { title: "User Interview", value: statsData.user, icon: Briefcase, trend: "-2%", trendUp: false },
    { title: "Rejected", value: statsData.rejected, icon: UserX, trend: "+15%", trendUp: false },
    { title: "On Boarding", value: statsData.onboarding, icon: UserPlus, trend: "+8%", trendUp: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Executive Dashboard</h2>
          <p className="text-sm text-on-surface-variant">Overview of recruitment metrics and activities.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-table-border shadow-sm">
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="w-28 text-sm outline-none px-2 py-1 cursor-pointer bg-transparent text-on-surface font-medium"
            dateFormat="dd MMM yyyy"
          />
          <span className="text-on-surface-variant">-</span>
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
            className="w-28 text-sm outline-none px-2 py-1 cursor-pointer bg-transparent text-on-surface font-medium"
            dateFormat="dd MMM yyyy"
          />
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
    </div>
  );
}

