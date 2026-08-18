"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, School, Percent, Activity, Filter, X } from 'lucide-react';
import StatWidget from '@/components/dashboard/StatWidget';
import GeoMap from '@/components/dashboard/GeoMap';
import RegionalDistributionChart, { RegionalData } from '@/components/dashboard/RegionalDistributionChart';
import TopBlkChart, { BlkData } from '@/components/dashboard/TopBlkChart';
import { SiteMarker } from '@/components/dashboard/GeoMapComponent';

export default function GeoSourceDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [blks, setBlks] = useState<any[]>([]);

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

  useEffect(() => {
    // Load data from localStorage
    const rawApps = localStorage.getItem("ugz_applications");
    const rawCands = localStorage.getItem("ugz_candidate_profiles");
    const rawJobs = localStorage.getItem("ugz_jobs");
    const rawSites = localStorage.getItem("ugz_master_sites_operation");
    const rawBlks = localStorage.getItem("ugz_master_blk_lpk");

    if (rawApps) setApplications(JSON.parse(rawApps));
    if (rawCands) setCandidates(JSON.parse(rawCands));
    if (rawJobs) setJobs(JSON.parse(rawJobs));
    if (rawSites) setSites(JSON.parse(rawSites));
    if (rawBlks) setBlks(JSON.parse(rawBlks));
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
      
      if (activeFilters.blk && cand?.blkId !== activeFilters.blk) {
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

        const blkId = cand.blkId;
        if (blkId) {
          blkStats[blkId] = (blkStats[blkId] || 0) + 1;
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

    const topBlk = Object.keys(blkStats).map(blkId => {
      const blk = blks.find((b: any) => b.id === blkId);
      return {
        name: blk?.name || 'Unknown',
        count: blkStats[blkId]
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
    { title: "BLK/LPK Institution", value: metrics.statsData.totalBlk, icon: School, trend: "Active", trendUp: true },
    { title: "Average Pass Rate", value: `${metrics.statsData.passRate}%`, icon: Percent, trend: "+2%", trendUp: true },
    { title: "Active Candidates", value: metrics.statsData.activeCandidates, icon: Activity, trend: "+12%", trendUp: true },
  ];

  const allProvinces = Array.from(
    new Set(Object.values(candidates).map((c: any) => c.province).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">GeoSource Dashboard</h2>
          <p className="text-sm text-on-surface-variant">Geographical distribution and institutional sourcing.</p>
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
        </div>
      </div>

      {/* Top Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatWidget key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Map */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-5 h-[600px] flex flex-col">
            <h3 className="font-bold text-on-surface mb-4">Site Operations Candidate Distribution</h3>
            <div className="flex-1 w-full relative z-0">
              <GeoMap markers={metrics.mapMarkers} />
            </div>
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="xl:col-span-1 space-y-6">
          <RegionalDistributionChart data={metrics.regionalData} />
          <TopBlkChart data={metrics.topBlkData} />
        </div>
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
                <label className="block text-sm font-semibold text-black mb-1.5">BLK/LPK Institution</label>
                <select
                  value={filterBlk}
                  onChange={(e) => setFilterBlk(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Institusi</option>
                  {blks.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1.5">Province</label>
                <select
                  value={filterProvince}
                  onChange={(e) => setFilterProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                >
                  <option value="">Semua Provinsi</option>
                  {allProvinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
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
