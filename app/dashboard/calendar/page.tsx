"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Filter,
  X,
  Search,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from "lucide-react";
import AdvancedCalendar, { AdvancedCalendarEvent } from "@/components/dashboard/AdvancedCalendar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { startOfDay, format, addMonths, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { useDebounce } from "@/hooks/useDebounce";

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

interface ApplicationHistoryItem {
  stageId?: string | null;
  stageName: string;
  date: string;
  note?: string | null;
  orderIndex?: number;
}

interface CurrentSchedule {
  stageId: string;
  stageName: string;
  type: 'hr' | 'user' | 'skill' | 'psikotes' | 'mcu' | 'offering' | 'administration' | 'other';
  date: string;
  note?: string;
}

interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  applicationDate: string;
  status: string;
  currentStageId?: string | null;
  currentStage?: {
    id: string;
    name: string;
    orderIndex: number;
  } | null;
  currentSchedule?: CurrentSchedule | null;
  history: ApplicationHistoryItem[];
}

interface Candidate {
  id: string;
  nik: string;
  fullName: string;
  email: string;
  whatsapp: string;
  latestEducation: string;
  city: string;
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Controlled calendar date navigation
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Search & Single Candidate selection state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Modal Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterJob, setFilterJob] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    job: "",
    startDate: "",
    endDate: ""
  });

  // Event Modal states
  const [selectedEvent, setSelectedEvent] = useState<AdvancedCalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { getCalendarData } = await import("@/app/actions/job");
      const res = await getCalendarData();
      if (res.success) {
        const loadedJobs = res.jobs || [];
        const loadedApps = res.applications || [];
        const loadedCands = res.candidates || {};

        setJobs(loadedJobs);
        setApplications(loadedApps);
        setCandidates(loadedCands);

        // Smart initial date: Find the month with the most schedule events
        const schedules = loadedApps
          .filter((a: Application) => a.currentSchedule && a.currentSchedule.date)
          .map((a: Application) => new Date(a.currentSchedule!.date));

        if (schedules.length > 0) {
          // Sort descending and pick the latest active schedule date
          schedules.sort((a: Date, b: Date) => b.getTime() - a.getTime());
          setCalendarDate(schedules[0]);
        }
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

  // Filter lowongan & tanggal untuk applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      let match = true;
      const job = jobs.find((j) => j.id === app.jobId);

      // Filter by specific job
      if (activeFilters.job && job?.id !== activeFilters.job) {
        match = false;
      }

      // Filter by job open dates
      if (activeFilters.startDate || activeFilters.endDate) {
        const jobDateStr = job?.publishedDate || job?.tanggalMasuk;
        if (jobDateStr) {
          const jobDate = new Date(jobDateStr);
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
        } else {
          match = false;
        }
      }

      return match;
    });
  }, [applications, jobs, activeFilters]);

  // Autocomplete candidate search matches (by NIK or Name)
  const candidateSearchResults = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [];

    const matches: { app: Application; candidate: Candidate; job?: Job }[] = [];
    const seenCandidateIds = new Set<string>();

    applications.forEach((app) => {
      const cand = candidates[app.candidateId];
      if (!cand) return;

      const nameMatch = cand.fullName?.toLowerCase().includes(q);
      const nikMatch = cand.nik && cand.nik.toLowerCase().includes(q);

      if (nameMatch || nikMatch) {
        if (!seenCandidateIds.has(cand.id)) {
          seenCandidateIds.add(cand.id);
          matches.push({
            app,
            candidate: cand,
            job: jobs.find((j) => j.id === app.jobId)
          });
        }
      }
    });

    return matches.slice(0, 8);
  }, [debouncedSearch, applications, candidates, jobs]);

  // Select a single candidate for focused pipeline trace
  const handleSelectCandidate = (candidateId: string, appId?: string) => {
    setSelectedCandidateId(candidateId);
    setSelectedAppId(appId || null);
    setIsSearchDropdownOpen(false);

    // Auto navigate calendar to the candidate's latest event date
    const targetApp = appId 
      ? applications.find(a => a.id === appId)
      : applications.find(a => a.candidateId === candidateId);

    if (targetApp) {
      if (targetApp.currentSchedule?.date) {
        setCalendarDate(new Date(targetApp.currentSchedule.date));
      } else if (targetApp.history.length > 0) {
        setCalendarDate(new Date(targetApp.history[targetApp.history.length - 1].date));
      } else {
        setCalendarDate(new Date(targetApp.applicationDate));
      }
    }
  };

  const handleClearCandidateSelection = () => {
    setSelectedCandidateId(null);
    setSelectedAppId(null);
    setSearchQuery("");

    // Jump back to the latest schedule among active applications
    const activeDates = applications
      .filter(a => a.currentSchedule?.date)
      .map(a => new Date(a.currentSchedule!.date));
    if (activeDates.length > 0) {
      activeDates.sort((a, b) => b.getTime() - a.getTime());
      setCalendarDate(activeDates[0]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateSearchResults.length > 0) {
      handleSelectCandidate(candidateSearchResults[0].candidate.id, candidateSearchResults[0].app.id);
    }
  };

  const handleApplyFilter = () => {
    setActiveFilters({
      job: filterJob,
      startDate: filterStartDate,
      endDate: filterEndDate
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterJob("");
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveFilters({
      job: "",
      startDate: "",
      endDate: ""
    });
    setSelectedCandidateId(null);
    setSelectedAppId(null);
    setIsFilterModalOpen(false);
  };

  const handleEventClick = (event: AdvancedCalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // ── Selected Candidate Data & Funnel History (from Administration to Current Stage) ──
  const selectedCandidateData = useMemo(() => {
    if (!selectedCandidateId) return null;

    const selectedApp = selectedAppId
      ? applications.find((a) => a.id === selectedAppId)
      : applications.find((a) => a.candidateId === selectedCandidateId);

    const cand = candidates[selectedCandidateId];
    if (!selectedApp || !cand) return null;

    const job = jobs.find((j) => j.id === selectedApp.jobId);
    const currentOrderIndex = selectedApp.currentStage?.orderIndex ?? 1;

    // Filter histories: HANYA dari Administrasi (orderIndex: 1) hingga Current Stage
    const funnelHistories: ApplicationHistoryItem[] = [];

    // Pastikan tahap Administrasi / CV Screening awal ada
    const hasAdminHistory = selectedApp.history.some(
      (h) => (h.orderIndex ?? 999) === 1 || h.stageId === "stage_1"
    );
    if (!hasAdminHistory) {
      funnelHistories.push({
        stageId: "stage_1",
        stageName: "Administrasi (CV Screening)",
        date: selectedApp.applicationDate,
        note: "Pengajuan Berkas Lamaran Awal",
        orderIndex: 1
      });
    }

    selectedApp.history.forEach((hist) => {
      const histOrder = hist.orderIndex ?? 999;
      if (histOrder <= currentOrderIndex) {
        funnelHistories.push(hist);
      }
    });

    // Jika kandidat saat ini memiliki jadwal aktif di current stage dan belum tercatat
    if (selectedApp.currentSchedule && selectedApp.currentSchedule.date) {
      const alreadyExists = funnelHistories.some(
        (h) => h.stageId === selectedApp.currentSchedule?.stageId
      );
      if (!alreadyExists) {
        funnelHistories.push({
          stageId: selectedApp.currentSchedule.stageId,
          stageName: selectedApp.currentSchedule.stageName,
          date: selectedApp.currentSchedule.date,
          note: selectedApp.currentSchedule.note || "Jadwal Aktif",
          orderIndex: currentOrderIndex
        });
      }
    }

    // Urutkan kronologis
    funnelHistories.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      candidate: cand,
      application: selectedApp,
      job,
      currentOrderIndex,
      funnelHistories
    };
  }, [selectedCandidateId, selectedAppId, applications, candidates, jobs]);

  // ── Process Events for Calendar ──
  const calendarEvents = useMemo(() => {
    const events: AdvancedCalendarEvent[] = [];

    // ─────────────────────────────────────────────────────────────
    // 1. CANDIDATE MODE: 1 kandidat terpilih via NIK / Nama
    //    Tampilkan riwayat HANYA dari Administrasi sampai Current Stage
    // ─────────────────────────────────────────────────────────────
    if (selectedCandidateData) {
      const { candidate: cand, application: selectedApp, job, currentOrderIndex, funnelHistories } = selectedCandidateData;

      funnelHistories.forEach((hist) => {
        const dStart = startOfDay(new Date(hist.date));
        const dEnd = new Date(dStart);
        dEnd.setHours(23, 59, 59, 999);

        const isCurrent =
          hist.stageId === selectedApp.currentStageId ||
          (hist.orderIndex ?? 0) === currentOrderIndex;

        events.push({
          title: `${cand.fullName} - ${hist.stageName}${isCurrent ? " (Tahap Berjalan)" : ""}`,
          start: dStart,
          end: dEnd,
          type: "pipeline",
          isCandidateMode: true,
          stageName: hist.stageName,
          candidateName: cand.fullName,
          singleDetailData: {
            candidate: cand,
            job,
            history: hist,
            isCurrent,
            currentStageName: selectedApp.currentStage?.name || "Administrasi"
          },
          allDay: true
        });
      });

      return events;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. INITIAL CONDITION (GENERAL MODE):
    //    HANYA tampilkan current active schedule dari setiap kandidat
    // ─────────────────────────────────────────────────────────────
    const eventsMap: Record<
      string,
      {
        hr: any[];
        user: any[];
        skill: any[];
        psikotes: any[];
        mcu: any[];
        offering: any[];
        administration: any[];
        other: any[];
      }
    > = {};

    filteredApps.forEach((app) => {
      // Hanya kandidat yang memiliki jadwal aktif untuk tahapan berjalannya saat ini
      if (!app.currentSchedule || !app.currentSchedule.date) return;

      const cand = candidates[app.candidateId];
      if (!cand) return;
      const job = jobs.find((j) => j.id === app.jobId);

      const dateKey = app.currentSchedule.date.split("T")[0];
      if (!eventsMap[dateKey]) {
        eventsMap[dateKey] = {
          hr: [],
          user: [],
          skill: [],
          psikotes: [],
          mcu: [],
          offering: [],
          administration: [],
          other: []
        };
      }

      const entry = {
        candidate: cand,
        job,
        schedule: app.currentSchedule,
        application: app
      };

      const schedType = app.currentSchedule.type;
      if (schedType === "hr") eventsMap[dateKey].hr.push(entry);
      else if (schedType === "user") eventsMap[dateKey].user.push(entry);
      else if (schedType === "skill") eventsMap[dateKey].skill.push(entry);
      else if (schedType === "psikotes") eventsMap[dateKey].psikotes.push(entry);
      else if (schedType === "mcu") eventsMap[dateKey].mcu.push(entry);
      else if (schedType === "offering") eventsMap[dateKey].offering.push(entry);
      else if (schedType === "administration") eventsMap[dateKey].administration.push(entry);
      else eventsMap[dateKey].other.push(entry);
    });

    Object.keys(eventsMap).forEach((dateKey) => {
      const dStart = startOfDay(new Date(dateKey));
      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);

      const map = eventsMap[dateKey];
      if (map.hr.length > 0) {
        events.push({
          title: `${map.hr.length} HR Intv`,
          start: dStart,
          end: dEnd,
          type: "hr",
          count: map.hr.length,
          applicationsData: map.hr,
          allDay: true
        });
      }
      if (map.user.length > 0) {
        events.push({
          title: `${map.user.length} User Intv`,
          start: dStart,
          end: dEnd,
          type: "user",
          count: map.user.length,
          applicationsData: map.user,
          allDay: true
        });
      }
      if (map.skill.length > 0) {
        events.push({
          title: `${map.skill.length} Skill/Tech`,
          start: dStart,
          end: dEnd,
          type: "skill",
          count: map.skill.length,
          applicationsData: map.skill,
          allDay: true
        });
      }
      if (map.psikotes.length > 0) {
        events.push({
          title: `${map.psikotes.length} Psikotes`,
          start: dStart,
          end: dEnd,
          type: "psikotes",
          count: map.psikotes.length,
          applicationsData: map.psikotes,
          allDay: true
        });
      }
      if (map.mcu.length > 0) {
        events.push({
          title: `${map.mcu.length} MCU`,
          start: dStart,
          end: dEnd,
          type: "mcu",
          count: map.mcu.length,
          applicationsData: map.mcu,
          allDay: true
        });
      }
      if (map.offering.length > 0) {
        events.push({
          title: `${map.offering.length} Offering`,
          start: dStart,
          end: dEnd,
          type: "offering",
          count: map.offering.length,
          applicationsData: map.offering,
          allDay: true
        });
      }
      if (map.administration.length > 0) {
        events.push({
          title: `${map.administration.length} Administrasi`,
          start: dStart,
          end: dEnd,
          type: "administration",
          count: map.administration.length,
          applicationsData: map.administration,
          allDay: true
        });
      }
      if (map.other.length > 0) {
        events.push({
          title: `${map.other.length} Jadwal Lain`,
          start: dStart,
          end: dEnd,
          type: "other",
          count: map.other.length,
          applicationsData: map.other,
          allDay: true
        });
      }
    });

    return events;
  }, [filteredApps, candidates, jobs, selectedCandidateData]);

  const activeJobs = jobs.filter((j) => j.globalStatus === "Active");
  const isFilterActive = activeFilters.job || activeFilters.startDate || activeFilters.endDate || selectedCandidateId;

  const candidateSelectOptions = useMemo(() => {
    const opts: { value: string; label: string; subLabel?: string; badge?: string }[] = [
      { value: "", label: "Semua Kandidat (Mode Jadwal Umum)" }
    ];
    const seen = new Set<string>();
    applications.forEach((app) => {
      const cand = candidates[app.candidateId];
      if (cand && !seen.has(cand.id)) {
        seen.add(cand.id);
        const job = jobs.find((j) => j.id === app.jobId);
        opts.push({
          value: `${cand.id}|${app.id}`,
          label: cand.fullName,
          subLabel: `NIK: ${cand.nik || "-"} • ${job?.posisi || ""}`,
          badge: app.currentStage?.name || undefined
        });
      }
    });
    return opts;
  }, [applications, candidates, jobs]);

  const jobSelectOptions = useMemo(() => {
    return [
      { value: "", label: "Semua Lowongan Aktif" },
      ...activeJobs.map((j) => ({
        value: j.id,
        label: j.posisi,
        subLabel: `Ref: ${j.noRegistrasi}`,
        badge: j.globalStatus || undefined
      }))
    ];
  }, [activeJobs]);

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

  return (
    <div className="space-y-6 pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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
            {selectedCandidateData
              ? `Menampilkan riwayat tahapan seleksi untuk kandidat ${selectedCandidateData.candidate.fullName}`
              : "Menampilkan jadwal aktif terkini (Current Schedule) dari setiap kandidat."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search by NIK or Name */}
          <div className="relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="Cari NIK / Nama Kandidat..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setIsSearchDropdownOpen(true);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                className="pl-9 pr-8 py-2 text-sm border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-[250px] md:w-[290px] bg-white shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Suggestions Autocomplete Dropdown */}
            {isSearchDropdownOpen && candidateSearchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-outline-variant py-2 z-50 max-h-[340px] overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-semibold text-on-surface-variant border-b border-table-border uppercase tracking-wider">
                  Kandidat Ditemukan ({candidateSearchResults.length})
                </div>
                {candidateSearchResults.map(({ app, candidate: cand, job }) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectCandidate(cand.id, app.id)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-primary/5 transition-colors flex flex-col gap-0.5 border-b border-table-border/50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {cand.fullName}
                      </span>
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {app.currentStage?.name || "Administrasi"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="font-mono text-slate-600 font-medium">
                        NIK: {cand.nik || "-"}
                      </span>
                      <span>•</span>
                      <span className="truncate">{job?.posisi || "Posisi Umum"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSearchDropdownOpen && debouncedSearch.trim() !== "" && candidateSearchResults.length === 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-outline-variant p-4 z-50 text-center text-xs text-on-surface-variant">
                Tidak ada kandidat dengan NIK atau Nama yang cocok.
              </div>
            )}
          </div>

          {/* Quick Month Navigator Bar */}
          <div className="flex items-center bg-white border border-outline-variant rounded-xl shadow-sm p-1">
            <button
              type="button"
              onClick={() => setCalendarDate((prev) => subMonths(prev, 1))}
              className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-100 rounded-lg transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3 min-w-[110px] text-center">
              {format(calendarDate, "MMMM yyyy", { locale: localeId })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarDate((prev) => addMonths(prev, 1))}
              className="p-1.5 text-slate-600 hover:text-black hover:bg-slate-100 rounded-lg transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 border font-semibold rounded-xl transition-colors shadow-sm shrink-0 whitespace-nowrap ${
              isFilterActive
                ? "bg-primary/5 border-primary text-primary"
                : "bg-white border-outline-variant text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {isFilterActive && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1" />
            )}
          </button>
        </div>
      </div>

      {/* ── Active Single Candidate Mode Banner & Track History Stepper ── */}
      {selectedCandidateData && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-primary">
                    {selectedCandidateData.candidate.fullName}
                  </span>
                  <span className="text-xs bg-white px-2.5 py-0.5 rounded-md border border-primary/20 text-slate-700 font-mono font-medium">
                    NIK: {selectedCandidateData.candidate.nik || "-"}
                  </span>
                  <span className="text-xs bg-primary text-white px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                    Tahap Berjalan: {selectedCandidateData.application.currentStage?.name || "Administrasi"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Posisi: <span className="font-medium text-slate-900">{selectedCandidateData.job?.posisi || "-"}</span> ({selectedCandidateData.job?.noRegistrasi || "-"}) • Pendidikan: {selectedCandidateData.candidate.latestEducation} • Domisili: {selectedCandidateData.candidate.city}
                </p>
              </div>
            </div>

            <button
              onClick={handleClearCandidateSelection}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-outline-variant hover:bg-slate-50 text-xs font-semibold rounded-xl text-slate-700 transition-colors shadow-sm self-start sm:self-auto shrink-0"
            >
              <X className="w-4 h-4" />
              Kembali ke Jadwal Umum
            </button>
          </div>

          {/* Visual Track History Stepper: Administrasi -> Current Stage */}
          <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-table-border pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Track History Seleksi: Administrasi hingga Tahap Berjalan ({selectedCandidateData.funnelHistories.length} Tahapan)
              </h3>
              <span className="text-xs text-on-surface-variant">
                Klik milestone pada kalender untuk melihat detail catatan & berkas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
              {selectedCandidateData.funnelHistories.map((hist, index) => {
                const isCurrent =
                  hist.stageId === selectedCandidateData.application.currentStageId ||
                  (hist.orderIndex ?? 0) === selectedCandidateData.currentOrderIndex;

                return (
                  <div
                    key={index}
                    onClick={() => {
                      const dStart = startOfDay(new Date(hist.date));
                      const dEnd = new Date(dStart);
                      dEnd.setHours(23, 59, 59, 999);
                      setSelectedEvent({
                        title: `${selectedCandidateData.candidate.fullName} - ${hist.stageName}`,
                        start: dStart,
                        end: dEnd,
                        type: "pipeline",
                        isCandidateMode: true,
                        stageName: hist.stageName,
                        candidateName: selectedCandidateData.candidate.fullName,
                        singleDetailData: {
                          candidate: selectedCandidateData.candidate,
                          job: selectedCandidateData.job,
                          history: hist,
                          isCurrent,
                          currentStageName: selectedCandidateData.application.currentStage?.name || "Administrasi"
                        }
                      });
                      setIsEventModalOpen(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer hover:shadow-md ${
                      isCurrent
                        ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                        : "bg-surface-container-lowest border-outline-variant hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Tahap {index + 1}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                          <Clock className="w-2.5 h-2.5" /> Berjalan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Selesai
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">
                      {hist.stageName}
                    </h4>

                    <p className="text-xs text-primary font-medium mt-1">
                      {new Date(hist.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>

                    {hist.note && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2" title={hist.note}>
                        {hist.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar View ── */}
      <AdvancedCalendar
        events={calendarEvents}
        onEventClick={handleEventClick}
        currentDate={calendarDate}
        onNavigate={(newDate) => setCalendarDate(newDate)}
      />

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
                <label className="block text-sm font-semibold text-black mb-1.5">
                  Fokus Kandidat (NIK / Nama)
                </label>
                <SearchableSelect
                  options={candidateSelectOptions}
                  value={selectedCandidateId && selectedAppId ? `${selectedCandidateId}|${selectedAppId}` : ""}
                  onChange={(val) => {
                    if (!val) {
                      handleClearCandidateSelection();
                    } else {
                      const [candId, appId] = val.split("|");
                      handleSelectCandidate(candId, appId);
                    }
                  }}
                  placeholder="Semua Kandidat (Mode Jadwal Umum)"
                  searchPlaceholder="Cari berdasarkan NIK atau Nama..."
                  debounceMs={250}
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  Jika kandidat dipilih, kalender akan menampilkan riwayat khusus dari tahap Administrasi sampai tahap berjalan.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Lowongan (Job)</label>
                <SearchableSelect
                  options={jobSelectOptions}
                  value={filterJob}
                  onChange={(val) => setFilterJob(val)}
                  placeholder="Semua Lowongan Aktif"
                  searchPlaceholder="Cari posisi atau no registrasi job..."
                  debounceMs={250}
                />
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                {selectedEvent.isCandidateMode ? "Detail Milestone Riwayat Kandidat" : "Daftar Jadwal Aktif Kandidat"}
                <span className="text-sm font-normal text-on-surface-variant ml-2 bg-surface-container-low px-2.5 py-0.5 rounded-md truncate max-w-[240px]">
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
                    <h4 className="font-semibold text-primary mb-3">Informasi Pelamar</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div className="text-on-surface-variant">Nama Lengkap:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.candidate.fullName}</div>
                      <div className="text-on-surface-variant">NIK:</div>
                      <div className="font-medium text-black font-mono">{selectedEvent.singleDetailData.candidate.nik || "-"}</div>
                      <div className="text-on-surface-variant">Pendidikan:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.candidate.latestEducation}</div>
                      <div className="text-on-surface-variant">Domisili / Kota:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.candidate.city}</div>
                      <div className="text-on-surface-variant">Posisi Dilamar:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.job?.posisi || "-"}</div>
                      <div className="text-on-surface-variant">No. Registrasi:</div>
                      <div className="font-medium text-black">{selectedEvent.singleDetailData.job?.noRegistrasi || "-"}</div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    selectedEvent.singleDetailData.isCurrent
                      ? "bg-primary/5 border-primary/20"
                      : "bg-surface-container-lowest border-outline-variant"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-primary">Detail Tahapan Ini</h4>
                      {selectedEvent.singleDetailData.isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white">
                          <Clock className="w-3 h-3" /> Tahap Berjalan Saat Ini
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Tahap Telah Dilalui
                        </span>
                      )}
                    </div>
                    <div className="text-sm space-y-2 mt-3">
                      <div>
                        <span className="font-medium text-on-surface-variant inline-block w-28">Nama Tahap:</span>
                        <span className="font-semibold text-slate-900">{selectedEvent.singleDetailData.history.stageName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-on-surface-variant inline-block w-28">Tanggal:</span>
                        <span className="text-slate-800">
                          {new Date(selectedEvent.singleDetailData.history.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-on-surface-variant inline-block w-28">Catatan / Status:</span>
                        <span className="text-slate-800">{selectedEvent.singleDetailData.history.note || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedEvent.applicationsData && selectedEvent.applicationsData.length > 0 ? (
                // General Mode List (Current Schedules on that date)
                <div className="space-y-3">
                  <p className="text-sm text-on-surface-variant mb-4">
                    Terdapat <span className="font-bold text-slate-900">{selectedEvent.applicationsData.length}</span> kandidat yang memiliki jadwal aktif untuk tahapan berjalannya saat ini pada tanggal ini:
                  </p>
                  {selectedEvent.applicationsData.map((data, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-outline-variant rounded-xl flex flex-col gap-2 hover:border-primary/50 transition-colors bg-white shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">{data.candidate.fullName}</h4>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600 border border-slate-200">
                              NIK: {data.candidate.nik || "-"}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {data.candidate.latestEducation} • {data.candidate.city}
                          </p>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold border border-primary/20">
                          {data.schedule?.stageName || data.application.currentStage?.name || "Tahap Aktif"}
                        </span>
                      </div>

                      <div className="pt-3 mt-1 border-t border-table-border text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-on-surface-variant font-medium text-xs">
                          Posisi: <span className="text-primary font-semibold">{data.job?.posisi || "-"}</span> ({data.job?.noRegistrasi || "-"})
                        </span>

                        <div className="flex items-center gap-3">
                          {data.schedule?.note && (
                            <span className="text-xs text-on-surface-variant max-w-[200px] truncate" title={data.schedule.note}>
                              {data.schedule.note}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsEventModalOpen(false);
                              handleSelectCandidate(data.candidate.id, data.application.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-container hover:underline ml-auto"
                          >
                            Fokus Riwayat <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
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
