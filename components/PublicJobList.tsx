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
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);

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

  const [selectedJob, setSelectedJob] = useState<any | null>(null);

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
    const job = jobs.find((j) => j.id === jobId);
    setSelectedJob(job);
  };

  const confirmApply = () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    
    const sessionStr = localStorage.getItem("nexus_candidate_session");
    if (!sessionStr) {
      router.push("/candidate/login");
      return;
    }
    
    const session = JSON.parse(sessionStr);

    // 1. Check if profile is complete (needs NIK)
    const allProfiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    const myProfile = allProfiles[session.id];
    
    if (!myProfile || !myProfile.nik) {
      setErrorModalMessage("Harap lengkapi Profile Anda (terutama NIK) sebelum melamar lowongan.");
      return;
    }

    const candidateNik = myProfile.nik;
    const applications = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const candidateApps = applications.filter((app: any) => app.candidateNik === candidateNik);

    // 2. Check if candidate has an ACTIVE application (not rejected)
    const activeApp = candidateApps.find((app: any) => app.currentStage !== "Rejected");
    if (activeApp) {
      setErrorModalMessage("Anda masih memiliki lamaran aktif yang sedang diproses pada suatu lowongan. Anda hanya dapat melamar ke lowongan baru jika tidak ada proses rekrutmen yang sedang berjalan (atau jika Anda sudah dinyatakan tidak lolos).");
      return;
    }

    // 3. Check if they have EVER applied to this specific job
    const appliedToThisJob = candidateApps.find((app: any) => app.jobId === jobId);
    if (appliedToThisJob) {
      setErrorModalMessage("Anda sudah pernah melamar ke lowongan ini sebelumnya. Kandidat tidak diperkenankan melamar kembali ke lowongan yang sama meskipun lamaran sebelumnya tidak lolos seleksi.");
      return;
    }

    // 4. Check if Job has passed Administration stage
    const adminStage = selectedJob.timeline?.find((t: any) => t.id === "stage_1" || t.title.toLowerCase().includes("administration"));
    if (adminStage) {
      const isPastDeadline = new Date() > new Date(adminStage.deadlineDate);
      if (adminStage.status === "Completed" || isPastDeadline) {
        setErrorModalMessage("Batas waktu pendaftaran (Administration) untuk lowongan ini telah ditutup karena proses rekrutmen sudah berjalan. Anda tidak dapat melamar ke lowongan ini lagi.");
        return;
      }
    }

    // 5. Create application
    const newApp = {
      id: `APP-${Date.now()}`,
      jobId,
      candidateId: session.id,
      candidateNik: candidateNik,
      currentStage: "stage_1", // Default first stage
      applicationDate: new Date().toISOString(),
      stageNotes: {}, // For overdue notes
      history: [
        {
          stageId: "stage_1",
          stageName: "Administration",
          date: new Date().toISOString(),
          note: "Application Submitted"
        }
      ]
    };

    applications.push(newApp);
    localStorage.setItem("ugz_applications", JSON.stringify(applications));

    window.alert("Berhasil melamar lowongan ini! Anda dapat mengecek status di halaman My Applications.");
    setSelectedJob(null);
    router.push("/candidate/history");
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

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-table-border bg-surface-container-lowest flex justify-between items-start">
              <div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wider mb-3 inline-block">
                  {selectedJob.statusPermintaan || "Hiring"}
                </span>
                <h3 className="text-2xl font-bold text-on-surface">{selectedJob.posisi}</h3>
                <div className="flex items-center text-sm text-on-surface-variant mt-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 shrink-0 text-primary/60" />
                    <span className="font-semibold text-black">{getSiteName(selectedJob.siteId || selectedJob.areaKerja)} • {getCityName(selectedJob.cityId)}, {getProvinceName(selectedJob.provinceId)}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1 shrink-0 text-primary/60" />
                    <span className="font-semibold text-black">{selectedJob.jumlahPermintaan} Openings</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-status-error"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <h4 className="font-bold text-lg text-primary mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-primary text-sm">1</span> 
                  Kualifikasi / Requirements
                </h4>
                <p className="text-sm text-black whitespace-pre-wrap leading-relaxed pl-8">
                  {selectedJob.kualifikasi || "Belum ada kualifikasi spesifik."}
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-lg text-primary mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-primary text-sm">2</span> 
                  Benefit
                </h4>
                <p className="text-sm text-black whitespace-pre-wrap leading-relaxed pl-8">
                  {selectedJob.benefit || "Belum ada informasi benefit."}
                </p>
              </div>
            </div>

            <div className="p-6 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApply}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-sm hover:bg-primary-container hover:shadow-md transition-all active:scale-[0.98]"
              >
                Konfirmasi Pelamaran (Apply)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalMessage && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pendaftaran Ditolak</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {errorModalMessage}
              </p>
              <button
                onClick={() => {
                  setErrorModalMessage(null);
                  if (errorModalMessage.includes("Harap lengkapi Profile Anda")) {
                    router.push("/candidate/profile");
                  }
                }}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
