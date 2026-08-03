"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Briefcase, Calendar, ChevronRight, Search, Building2, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicJobList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");

  useEffect(() => {
    const savedJobs = localStorage.getItem("ugz_jobs");
    if (savedJobs) {
      const parsedJobs = JSON.parse(savedJobs);
      const activeJobs = parsedJobs.filter((job: any) => job.globalStatus !== "Closed");
      setJobs(activeJobs);
    }

    const savedProv = localStorage.getItem("ugz_master_province");
    if (savedProv) setProvinces(JSON.parse(savedProv));

    const savedCity = localStorage.getItem("ugz_master_city");
    if (savedCity) setCities(JSON.parse(savedCity));

    const savedSites = localStorage.getItem("ugz_master_sites_operation");
    if (savedSites) setSites(JSON.parse(savedSites));
  }, []);

  const getProvinceName = (id: string) => provinces.find((p) => p.id === id)?.name || "-";
  const getCityName = (id: string) => cities.find((c) => c.id === id)?.name || "-";
  const getSiteName = (id: string) => sites.find((s) => s.id === id)?.siteName || id || "-";

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.posisi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSiteName(job.siteId)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || job.statusPermintaan === statusFilter;
    const matchesProvince = provinceFilter === "" || job.provinceId === provinceFilter;

    return matchesSearch && matchesStatus && matchesProvince;
  });

  const handleApplyClick = (jobId: string) => {
    const session = localStorage.getItem("nexus_candidate_session");
    if (!session) {
      router.push("/candidate/login");
    } else {
      router.push(`/candidate/jobs/${jobId}`);
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-3xl border border-surface-container shadow-sm flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-on-surface-variant" />
          </div>
          <input
            type="text"
            placeholder="Search by role or location..."
            className="block w-full pl-11 pr-4 py-3 bg-surface-bright rounded-2xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none block w-full pl-4 pr-10 py-3 bg-surface-bright rounded-2xl text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="Penambahan">Penambahan</option>
              <option value="Pergantian">Pergantian</option>
            </select>
            <Filter className="w-4 h-4 text-on-surface-variant absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="appearance-none block w-full pl-4 pr-10 py-3 bg-surface-bright rounded-2xl text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="">Semua Provinsi</option>
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
            <MapPin className="w-4 h-4 text-on-surface-variant absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-surface-container shadow-sm">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">No open positions found</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            We couldn't find any job openings matching your filters. Please check back later or try different keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group bg-white rounded-3xl p-6 border border-surface-container shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
            >
              {/* Subtle background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wider">
                    {job.statusPermintaan || "Hiring"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {job.posisi}
                </h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-on-surface-variant">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 text-primary/60" />
                    <span className="truncate">
                      {getSiteName(job.siteId || job.areaKerja)} • {getCityName(job.cityId)}, {getProvinceName(job.provinceId)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-on-surface-variant">
                    <Briefcase className="w-4 h-4 mr-2 shrink-0 text-primary/60" />
                    <span>{job.jumlahPermintaan} Openings</span>
                  </div>
                  <div className="flex items-center text-sm text-on-surface-variant">
                    <Calendar className="w-4 h-4 mr-2 shrink-0 text-primary/60" />
                    <span>Posted {new Date(job.tanggalMasuk).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-surface-container flex items-center justify-between">
                  <span className="text-xs font-mono text-on-surface-variant/60">{job.noRegistrasi}</span>
                  <button 
                    onClick={() => handleApplyClick(job.id)}
                    className="flex items-center text-sm font-bold text-primary group-hover:gap-2 transition-all"
                  >
                    Apply Now <ChevronRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
