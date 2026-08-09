"use client";

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Building2, School, Percent, Activity } from 'lucide-react';
import StatWidget from '@/components/dashboard/StatWidget';
import GeoMap from '@/components/dashboard/GeoMap';
import RegionalDistributionChart, { RegionalData } from '@/components/dashboard/RegionalDistributionChart';
import TopBlkChart, { BlkData } from '@/components/dashboard/TopBlkChart';
import { SiteMarker } from '@/components/dashboard/GeoMapComponent';
import { subDays } from 'date-fns';

export default function GeoSourceDashboard() {
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  const [statsData, setStatsData] = useState({
    totalSites: 0,
    totalBlk: 0,
    passRate: 0,
    activeCandidates: 0
  });

  const [mapMarkers, setMapMarkers] = useState<SiteMarker[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [topBlkData, setTopBlkData] = useState<BlkData[]>([]);

  useEffect(() => {
    // 1. Load data from localStorage
    const rawApps = localStorage.getItem("ugz_applications");
    const rawCands = localStorage.getItem("ugz_candidate_profiles");
    const rawJobs = localStorage.getItem("ugz_jobs");
    const rawSites = localStorage.getItem("ugz_master_sites_operation");
    const rawBlks = localStorage.getItem("ugz_master_blk_lpk");

    if (!rawApps || !rawCands || !rawJobs || !rawSites || !rawBlks) return;

    const apps = JSON.parse(rawApps);
    const cands = JSON.parse(rawCands);
    const jobs = JSON.parse(rawJobs);
    const sites = JSON.parse(rawSites);
    const blks = JSON.parse(rawBlks);

    // 2. Compute Stats
    let accepted = 0;
    let rejected = 0;
    let inProcess = 0;
    
    // Map aggregations
    const siteStats: Record<string, { accepted: number, rejected: number, inProcess: number }> = {};
    const regionalStats: Record<string, number> = {};
    const blkStats: Record<string, number> = {};

    sites.forEach((site: any) => {
      siteStats[site.id] = { accepted: 0, rejected: 0, inProcess: 0 };
    });

    apps.forEach((app: any) => {
      const cand = cands[app.candidateId];
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
        // Regional
        const prov = cand.province || 'Unknown';
        regionalStats[prov] = (regionalStats[prov] || 0) + 1;

        // BLK
        const blkId = cand.blkId;
        if (blkId) {
          blkStats[blkId] = (blkStats[blkId] || 0) + 1;
        }
      }
    });

    const passRate = apps.length > 0 ? Math.round((accepted / apps.length) * 100) : 0;

    setStatsData({
      totalSites: sites.length,
      totalBlk: blks.length,
      passRate: passRate,
      activeCandidates: inProcess
    });

    // 3. Map Markers
    const markers: SiteMarker[] = sites.map((site: any) => ({
      id: site.id,
      name: site.siteName,
      lat: site.latitude,
      lng: site.longitude,
      stats: siteStats[site.id] || { accepted: 0, rejected: 0, inProcess: 0 }
    }));
    setMapMarkers(markers);

    // 4. Regional Distribution
    const regData = Object.keys(regionalStats).map(prov => ({
      province: prov,
      count: regionalStats[prov]
    })).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10 provinces
    setRegionalData(regData);

    // 5. Top BLK
    const topBlk = Object.keys(blkStats).map(blkId => {
      const blk = blks.find((b: any) => b.id === blkId);
      return {
        name: blk?.name || 'Unknown',
        count: blkStats[blkId]
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
    setTopBlkData(topBlk);

  }, []);

  const stats = [
    { title: "Total Site Operations", value: statsData.totalSites, icon: Building2, trend: "Fixed", trendUp: true },
    { title: "BLK/LPK Institution", value: statsData.totalBlk, icon: School, trend: "Active", trendUp: true },
    { title: "Average Pass Rate", value: `${statsData.passRate}%`, icon: Percent, trend: "+2%", trendUp: true },
    { title: "Active Candidates", value: statsData.activeCandidates, icon: Activity, trend: "+12%", trendUp: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">GeoSource Dashboard</h2>
          <p className="text-sm text-on-surface-variant">Geographical distribution and institutional sourcing.</p>
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
              <GeoMap markers={mapMarkers} />
            </div>
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="xl:col-span-1 space-y-6">
          <RegionalDistributionChart data={regionalData} />
          <TopBlkChart data={topBlkData} />
        </div>
      </div>
    </div>
  );
}
