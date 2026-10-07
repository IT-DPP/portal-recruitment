"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar as CalendarIcon, Filter, X, Search } from "lucide-react";
import AdvancedCalendar, { AdvancedCalendarEvent } from "@/components/dashboard/AdvancedCalendar";
import { startOfDay } from "date-fns";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Job {
  id: string;
  noRegistrasi: string;
  posisi: string;
  siteId?: string;
  globalStatus: string;
  publishedDate?: string;
  tanggalMasuk?: string;
}

interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  applicationDate: string;
  currentStage?: string | null;
  history: {
    stageId?: string | null;
    stageName: string;
    date: string;
    note?: string | null;
  }[];
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterJob, setFilterJob] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCandidate, setFilterCandidate] = useState("");

  // Event Modal states
  const [selectedEvent, setSelectedEvent] = useState<AdvancedCalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    job: "",
    startDate: "",
    endDate: "",
    candidateName: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { getCalendarData } = await import("@/app/actions/job");
      const res = await getCalendarData();
      if (res.success) {
        setJobs(res.jobs || []);
        setApplications(res.applications || []);
        setCandidates(res.candidates || {});
      } else {
        console.error("Failed to fetch calendar data:", res.error);
      }
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyFilter = () => {
    setActiveFilters({
      job: filterJob,
      startDate: filterStartDate,
      endDate: filterEndDate,
      candidateName: filterCandidate
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterJob("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCandidate("");
    setActiveFilters({
      job: "",
      startDate: "",
      endDate: "",
      candidateName: ""
    });
    setIsFilterModalOpen(false);
  };

  const handleEventClick = (event: AdvancedCalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // ── Apply Filters for Applications ──
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      let match = true;
      const job = jobs.find(j => j.id === app.jobId);
      
      // Filter by specific job
      if (activeFilters.job && job?.id !== activeFilters.job) {
        match = false;
      }
      
      // Filter by job open dates
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

  // ── Process Events for Calendar ──
  const calendarEvents = useMemo(() => {
    const events: AdvancedCalendarEvent[] = [];
    
    if (activeFilters.candidateName && activeFilters.candidateName.trim() !== "") {
      // ── CANDIDATE MODE ──
      // Plot all stages for matching candidate(s)
      const searchName = activeFilters.candidateName.toLowerCase().trim();
      
      filteredApps.forEach(app => {
        const cand = candidates[app.candidateId];
        if (cand && cand.fullName && cand.fullName.toLowerCase().includes(searchName)) {
          app.history.forEach((hist: any) => {
            const dStart = startOfDay(new Date(hist.date));
            const dEnd = new Date(dStart);
            dEnd.setHours(23, 59, 59, 999);
            
            events.push({
              title: `${cand.fullName} - ${hist.stageName}`,
              start: dStart,
              end: dEnd,
              type: 'pipeline',
              isCandidateMode: true,
              stageName: hist.stageName,
              candidateName: cand.fullName,
              singleDetailData: {
                candidate: cand,
                job: jobs.find(j => j.id === app.jobId),
                history: hist
              },
              allDay: true
            });
          });
        }
      });
    } else {
      // ── GENERAL MODE ──
      // Aggregate HR and User interviews by day
      const eventsMap: Record<string, { hr: any[], user: any[], skill: any[] }> = {};
      
      filteredApps.forEach((app: any) => {
        const cand = candidates[app.candidateId];
        const job = jobs.find(j => j.id === app.jobId);
        
        app.history.forEach((hist: any) => {
          const dateKey = hist.date.split('T')[0];
          if (!eventsMap[dateKey]) eventsMap[dateKey] = { hr: [], user: [], skill: [] };
          
          const entry = { candidate: cand, job, history: hist };

          if (hist.stageId === 'stage_2') eventsMap[dateKey].hr.push(entry);
          if (hist.stageId === 'stage_5') eventsMap[dateKey].user.push(entry);
          if (hist.stageId === 'stage_4' || hist.stageId === 'stage_3') eventsMap[dateKey].skill.push(entry);
        });
      });

      Object.keys(eventsMap).forEach(dateKey => {
        const dStart = startOfDay(new Date(dateKey));
        const dEnd = new Date(dStart);
        dEnd.setHours(23, 59, 59, 999);
        
        if (eventsMap[dateKey].hr.length > 0) {
          events.push({ title: `${eventsMap[dateKey].hr.length} HR Intv`, start: dStart, end: dEnd, type: 'hr', count: eventsMap[dateKey].hr.length, applicationsData: eventsMap[dateKey].hr, allDay: true });
        }
        if (eventsMap[dateKey].user.length > 0) {
          events.push({ title: `${eventsMap[dateKey].user.length} User Intv`, start: dStart, end: dEnd, type: 'user', count: eventsMap[dateKey].user.length, applicationsData: eventsMap[dateKey].user, allDay: true });
        }
        if (eventsMap[dateKey].skill.length > 0) {
          events.push({ title: `${eventsMap[dateKey].skill.length} Skill Test`, start: dStart, end: dEnd, type: 'skill', count: eventsMap[dateKey].skill.length, applicationsData: eventsMap[dateKey].skill, allDay: true });
        }
      });
    }
    
    return events;
  }, [filteredApps, candidates, activeFilters.candidateName]);

  const activeJobs = jobs.filter((j) => j.globalStatus === "Active");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Memuat data kalender...</p>
        </div>
      </div>
    );
  }

  const isFilterActive = activeFilters.job || activeFilters.startDate || activeFilters.endDate || activeFilters.candidateName;

  return (
    <div className="space-y-7 pb-10">
      {/* ── Page Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Recruitment Calendar
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant ml-[52px]">
            {activeFilters.candidateName 
              ? `Menampilkan pipeline detail untuk kandidat "${activeFilters.candidateName}"`
              : "Jadwal dan sebaran aktivitas rekrutmen secara umum."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Cari Kandidat..." 
              value={filterCandidate}
              onChange={(e) => setFilterCandidate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="pl-9 pr-4 py-2 text-sm border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-[200px]"
            />
          </div>
          
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 border font-semibold rounded-xl transition-colors shadow-sm shrink-0 whitespace-nowrap ${
              isFilterActive 
                ? 'bg-primary/5 border-primary text-primary' 
                : 'bg-white border-outline-variant text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <Filter className="w-4 h-4" /> 
            Filters
            {isFilterActive && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
        </div>
      </div>

      {/* ── Calendar View ── */}
      <AdvancedCalendar events={calendarEvents} onEventClick={handleEventClick} />

      {/* ── Filter Modal ── */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter Kalender
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
                <label className="block text-sm font-semibold text-black mb-1.5">Nama Kandidat</label>
                <input
                  type="text"
                  placeholder="Masukkan nama kandidat (Mode Pipeline)"
                  value={filterCandidate}
                  onChange={(e) => setFilterCandidate(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  Jika diisi, kalender akan mengubah mode menjadi pelacakan pipeline khusus untuk kandidat tersebut.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Lowongan (Job)</label>
                <select
                  value={filterJob}
                  onChange={(e) => setFilterJob(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Lowongan Aktif</option>
                  {activeJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.posisi} ({j.noRegistrasi})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Job Open Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1.5">Job Open End Date</label>
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
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {isEventModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                {selectedEvent.isCandidateMode ? 'Detail Pipeline Kandidat' : 'Daftar Kandidat'} 
                <span className="text-sm font-normal text-on-surface-variant ml-2 bg-surface-container-low px-2 py-0.5 rounded-md truncate max-w-[200px]">
                  {selectedEvent.title}
                </span>
              </h3>
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-black rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedEvent.isCandidateMode && selectedEvent.singleDetailData ? (
                // Single Candidate Mode Display
                <div className="space-y-4">
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <h4 className="font-semibold text-primary mb-3">Informasi Kandidat</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="text-on-surface-variant">Nama:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.candidate.fullName}</div>
                      <div className="text-on-surface-variant">Pendidikan:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.candidate.latestEducation}</div>
                      <div className="text-on-surface-variant">Posisi Dilamar:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.job?.posisi || '-'}</div>
                      <div className="text-on-surface-variant">No. Registrasi:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.job?.noRegistrasi || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">Status Saat Ini</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium text-on-surface-variant inline-block w-20">Tahap:</span> {selectedEvent.singleDetailData.history.stageName}</div>
                      <div><span className="font-medium text-on-surface-variant inline-block w-20">Catatan:</span> {selectedEvent.singleDetailData.history.note || '-'}</div>
                    </div>
                  </div>
                </div>
              ) : selectedEvent.applicationsData && selectedEvent.applicationsData.length > 0 ? (
                // General Mode List
                <div className="space-y-3">
                  <p className="text-sm text-on-surface-variant mb-4">
                    Terdapat <span className="font-bold">{selectedEvent.applicationsData.length}</span> kandidat yang dijadwalkan pada tahap ini.
                  </p>
                  {selectedEvent.applicationsData.map((data, idx) => (
                    <div key={idx} className="p-4 border border-outline-variant rounded-xl flex flex-col gap-2 hover:border-primary/50 transition-colors bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-on-surface">{data.candidate.fullName}</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {data.candidate.latestEducation} • {data.candidate.city}
                          </p>
                        </div>
                        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2 py-1 rounded-md font-medium border border-outline-variant">
                          {data.job?.noRegistrasi || '-'}
                        </span>
                      </div>
                      <div className="pt-3 mt-1 border-t border-table-border text-sm flex justify-between items-center">
                        <span className="text-on-surface-variant font-medium text-xs">Posisi: <span className="text-primary">{data.job?.posisi || '-'}</span></span>
                        <span className="text-xs text-on-surface-variant max-w-[50%] truncate">{data.history.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-on-surface-variant">
                  Tidak ada detail tambahan untuk jadwal ini.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-table-border bg-surface-container-lowest flex justify-end">
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="px-5 py-2 bg-surface-container-low text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
