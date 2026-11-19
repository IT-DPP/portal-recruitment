"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, School, Percent, Activity, Filter, X, RefreshCw } from 'lucide-react';
import StatWidget from '@/components/dashboard/StatWidget';
import GeoMap from '@/components/dashboard/GeoMap';
import RegionalDistributionChart, { RegionalData } from '@/components/dashboard/RegionalDistributionChart';
import TopBlkChart, { BlkData } from '@/components/dashboard/TopBlkChart';
import { SiteMarker } from '@/components/dashboard/GeoMapComponent';
import InstitutionRankingTable from '@/components/dashboard/InstitutionRankingTable';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { getGeoSourceDashboardData } from '@/app/actions/dashboard';

// Helper to intelligently classify institution types
const determineInstitutionType = (name: string, educationLevel?: string, givenType?: string): string => {
  if (givenType && givenType.trim()) {
    const gt = givenType.toUpperCase();
    if (gt === 'BLK') return 'BLK';
    if (gt === 'LPK') return 'LPK';
    if (gt.includes('UNIV') || gt === 'UNIVERSITY' || gt === 'PERGURUAN TINGGI') return 'UNIVERSITY';
    if (gt.includes('SMK') || gt.includes('VOCATIONAL')) return 'SMK';
    if (gt.includes('SMA') || gt.includes('SLTA')) return 'SMA';
  }

  const nameUpper = (name || "").toUpperCase();
  const eduUpper = (educationLevel || "").toUpperCase();

  // 1. BLK / LPK check
  if (nameUpper.includes("BLK") || nameUpper.includes("BALAI LATIHAN")) return "BLK";
  if (nameUpper.includes("LPK") || nameUpper.includes("LEMBAGA PELATIHAN")) return "LPK";

  // 2. University / Higher Education
  if (
    nameUpper.includes("UNIV") ||
    nameUpper.includes("INSTITUT") ||
    nameUpper.includes("POLITEKNIK") ||
    nameUpper.includes("SEKOLAH TINGGI") ||
    nameUpper.includes("AKADEMI") ||
    nameUpper.includes("COLLEGE") ||
    ["S1", "S2", "S3", "D4", "D3", "D2", "D1", "SARJANA", "MAGISTER", "DIPLOMA"].some(lvl => eduUpper.includes(lvl))
  ) {
    return "UNIVERSITY";
  }

  // 3. SMK / Kejuruan
  if (nameUpper.includes("SMK") || eduUpper.includes("SMK") || nameUpper.includes("KEJURUAN")) {
    return "SMK";
  }

  // 4. SMA / Sederajat
  if (
    nameUpper.includes("SMA") ||
    nameUpper.includes("MAN ") ||
    nameUpper.startsWith("MA ") ||
    eduUpper.includes("SMA") ||
    eduUpper.includes("SLTA")
  ) {
    return "SMA";
  }

  return "EDUCATIONAL";
};

export default function GeoSourceDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [blks, setBlks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSite, setFilterSite] = useState("");
  const [filterBlk, setFilterBlk] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    site: "",
    blk: "",
    province: "",
    startDate: "",
    endDate: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getGeoSourceDashboardData();
      if (res.success && res.data) {
        setApplications(res.data.applications);
        setCandidates(res.data.candidates);
        setJobs(res.data.jobs);
        setSites(res.data.sites);
        setBlks(res.data.institutes);
      } else {
        console.error("GeoSource error:", res.error);
      }
    } catch (err) {
      console.error("Failed to load geosource data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyFilter = () => {
    setActiveFilters({
      site: filterSite,
      blk: filterBlk,
      province: filterProvince,
      startDate: filterStartDate,
      endDate: filterEndDate
    });
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilterSite("");
    setFilterBlk("");
    setFilterProvince("");
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveFilters({
      site: "",
      blk: "",
      province: "",
      startDate: "",
      endDate: ""
    });
    setIsFilterModalOpen(false);
  };

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      let match = true;
      const job = jobs.find(j => j.id === app.jobId);
      const cand = candidates[app.candidateId];
      
      if (activeFilters.site && job?.siteId !== activeFilters.site) {
        match = false;
      }
      
      if (activeFilters.blk && cand?.trainingCenter !== activeFilters.blk) {
        match = false;
      }

      if (activeFilters.province && cand?.province !== activeFilters.province) {
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
  }, [applications, jobs, candidates, activeFilters]);

  // Derive comprehensive institution ranking data (Universitas, SMK, SMA, BLK, LPK)
  const institutionRankingData = useMemo(() => {
    const stats: Record<string, { total: number, accepted: number, active: number, type: string, name: string }> = {};

    const registerCandidateAt = (instName: string, instType: string, appStage: string) => {
      const cleanName = instName.trim();
      if (!cleanName) return;

      if (!stats[cleanName]) {
        stats[cleanName] = { 
          total: 0, 
          accepted: 0, 
          active: 0, 
          type: instType,
          name: cleanName 
        };
      }

      stats[cleanName].total++;
      if (appStage === "stage_6" || appStage === "stage_7" || appStage === "HIRED") {
        stats[cleanName].accepted++;
      } else if (appStage !== "Rejected" && appStage !== "REJECTED") {
        stats[cleanName].active++;
      }
    };

    // Pre-populate MasterInstitutes (so known partners have correct initial types)
    blks.forEach(b => {
      if (b.name) {
        const cleanName = b.name.trim();
        const type = determineInstitutionType(b.name, undefined, b.type);
        if (!stats[cleanName]) {
          stats[cleanName] = { 
            total: 0, 
            accepted: 0, 
            active: 0, 
            type,
            name: cleanName 
          };
        }
      }
    });

    // Process all candidates in filtered applications
    filteredApps.forEach(app => {
      const cand = candidates[app.candidateId];
      if (!cand) return;

      let recordedAny = false;

      // 1. Formal Education Institution (Universitas, Institut, Politeknik, SMK, SMA)
      if (cand.educationInstitution && cand.educationInstitution.trim()) {
        const formalType = determineInstitutionType(cand.educationInstitution, cand.latestEducation);
        registerCandidateAt(cand.educationInstitution, formalType, app.currentStage);
        recordedAny = true;
      }

      // 2. Training Center (BLK, LPK)
      if (cand.trainingCenter && cand.trainingCenter.trim()) {
        const tcName = cand.trainingCenter.trim();
        const eduName = (cand.educationInstitution || "").trim();
        // Avoid duplicating if candidate entered the same name in both fields
        if (tcName.toLowerCase() !== eduName.toLowerCase()) {
          const tcType = determineInstitutionType(cand.trainingCenter, undefined, cand.trainingCenterType || "BLK");
          registerCandidateAt(cand.trainingCenter, tcType, app.currentStage);
          recordedAny = true;
        }
      }

      // 3. Fallback: if only latestEducation is provided without specific institution name
      if (!recordedAny && cand.latestEducation && cand.latestEducation.trim()) {
        const fallbackName = `Lulusan ${cand.latestEducation.trim()}`;
        const fallbackType = determineInstitutionType(fallbackName, cand.latestEducation);
        registerCandidateAt(fallbackName, fallbackType, app.currentStage);
      }
    });

    return Object.keys(stats).map(id => {
       const s = stats[id];
       const passRate = s.total > 0 ? Math.round((s.accepted / s.total) * 100) : 0;
       
       let status = 'Standard';
       if (s.total > 0) {
         if (passRate >= 70) status = 'High Priority';
         else if (passRate < 50) status = 'Underperforming';
       }
       
       return {
         id,
         name: s.name,
         type: s.type,
         totalApplicants: s.total,
         passRate,
         activeCandidates: s.active,
         status
       };
    }).filter(s => s.totalApplicants > 0).sort((a, b) => b.totalApplicants - a.totalApplicants);
  }, [filteredApps, candidates, blks]);

  // Derive metrics
  const metrics = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    let inProcess = 0;
    
    const siteStats: Record<string, { accepted: number, rejected: number, inProcess: number }> = {};
    const regionalStats: Record<string, number> = {};
    const blkStats: Record<string, number> = {};

    sites.forEach((site: any) => {
      siteStats[site.id] = { accepted: 0, rejected: 0, inProcess: 0 };
    });

    filteredApps.forEach((app: any) => {
      const cand = candidates[app.candidateId];
      const job = jobs.find((j: any) => j.id === app.jobId);
      const siteId = job?.siteId;

      let status = 'inProcess';
      if (app.currentStage === "stage_6" || app.currentStage === "stage_7") {
        accepted++;
        status = 'accepted';
      } else if (app.currentStage === "Rejected") {
        rejected++;
        status = 'rejected';
      } else {
        inProcess++;
      }

      if (siteId && siteStats[siteId]) {
        if (status === 'accepted') siteStats[siteId].accepted++;
        if (status === 'rejected') siteStats[siteId].rejected++;
        if (status === 'inProcess') siteStats[siteId].inProcess++;
      }

      if (cand) {
        const prov = cand.province || 'Unknown';
        regionalStats[prov] = (regionalStats[prov] || 0) + 1;

        const trainingCenter = cand.trainingCenter;
        if (trainingCenter) {
          blkStats[trainingCenter] = (blkStats[trainingCenter] || 0) + 1;
        }
      }
    });

    const passRate = filteredApps.length > 0 ? Math.round((accepted / filteredApps.length) * 100) : 0;

    const markers: SiteMarker[] = sites.map((site: any) => ({
      id: site.id,
      name: site.siteName,
      lat: site.latitude,
      lng: site.longitude,
      stats: siteStats[site.id] || { accepted: 0, rejected: 0, inProcess: 0 }
    })).filter(marker => {
      if (activeFilters.site && marker.id !== activeFilters.site) return false;
      return true;
    });

    const regData = Object.keys(regionalStats).map(prov => ({
      province: prov,
      count: regionalStats[prov]
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    const topBlk = Object.keys(blkStats).map(tcName => {
      const blk = blks.find((b: any) => b.name === tcName);
      return {
        name: blk?.name || tcName,
        count: blkStats[tcName]
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      statsData: {
        totalSites: markers.length,
        totalBlk: blks.length,
        passRate: passRate,
        activeCandidates: inProcess
      },
      mapMarkers: markers,
      regionalData: regData,
      topBlkData: topBlk
    };
  }, [filteredApps, candidates, jobs, sites, blks, activeFilters]);

  const stats = [
    { title: "Total Site Operations", value: metrics.statsData.totalSites, icon: Building2, trend: "Fixed", trendUp: true },
    { title: "Sourcing Institutions", value: institutionRankingData.length || metrics.statsData.totalBlk, icon: School, trend: "Active", trendUp: true },
    { title: "Average Pass Rate", value: `${metrics.statsData.passRate}%`, icon: Percent, trend: "+2%", trendUp: true },
    { title: "Active Candidates", value: metrics.statsData.activeCandidates, icon: Activity, trend: "+12%", trendUp: true },
  ];

  const allProvinces = Array.from(
    new Set(Object.values(candidates).map((c: any) => c.province).filter(Boolean))
  ).sort() as string[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium">Memuat data GeoSource Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-[#D9232A]">
              DPP NATIONWIDE SITES &amp; INSTITUTION SOURCING
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">DPP Labor Supply Network</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">GeoSource &amp; Talent Distribution</h2>
          <p className="text-sm text-slate-500">
            Pemetaan sebaran talenta dan jejaring institusi vokasi (BLK/LPK/SMK) di Head Office Cikarang serta 10+ site operasional klien (Sangatta, Melak, Tabang, Balikpapan, Tanjung, Berau).
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" /> 
            Filters
            {(activeFilters.site || activeFilters.blk || activeFilters.province || activeFilters.startDate || activeFilters.endDate) && (
              <span className="flex h-2 w-2 rounded-full bg-primary relative -top-1 -right-1"></span>
            )}
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm shrink-0 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatWidget key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Map */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="bg-white rounded-md shadow-sm border border-table-border p-5 flex-1 flex flex-col min-h-[520px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-on-surface text-base">Site Operations Candidate Distribution</h3>
                <p className="text-xs text-on-surface-variant">Sebaran kandidat dan site operasional di seluruh wilayah Indonesia</p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-md border border-table-border">
                {metrics.mapMarkers.length} Sites Active
              </span>
            </div>
            <div className="flex-1 w-full min-h-[440px] relative z-0 rounded-md overflow-hidden border border-table-border">
              <GeoMap markers={metrics.mapMarkers} />
            </div>
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <RegionalDistributionChart data={metrics.regionalData} />
          <TopBlkChart data={metrics.topBlkData} />
        </div>
      </div>

      <div className="w-full">
        <InstitutionRankingTable data={institutionRankingData} />
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> Filter GeoSource
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
                <SearchableSelect
                  options={[
                    { value: "", label: "Semua Site" },
                    ...sites.map((s: any) => ({
                      value: s.id,
                      label: s.siteName,
                      subLabel: s.province || undefined
                    }))
                  ]}
                  value={filterSite}
                  onChange={(val) => setFilterSite(val)}
                  placeholder="Semua Site"
                  searchPlaceholder="Cari nama site operasional..."
                  debounceMs={250}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">BLK/LPK / School Institute</label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Semua Institusi" },
                    ...blks.map((b: any) => ({
                      value: b.name,
                      label: b.name,
                      badge: b.type || undefined
                    }))
                  ]}
                  value={filterBlk}
                  onChange={(val) => setFilterBlk(val)}
                  placeholder="Semua Institusi"
                  searchPlaceholder="Cari nama institusi / BLK..."
                  debounceMs={250}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Province</label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Semua Provinsi" },
                    ...allProvinces.map((prov) => ({
                      value: prov,
                      label: prov
                    }))
                  ]}
                  value={filterProvince}
                  onChange={(val) => setFilterProvince(val)}
                  placeholder="Semua Provinsi"
                  searchPlaceholder="Cari nama provinsi..."
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
