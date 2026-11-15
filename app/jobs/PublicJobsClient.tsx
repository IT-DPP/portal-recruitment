"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Briefcase, Calendar, ChevronRight } from "lucide-react";

export default function PublicJobsClient({ 
  initialJobs, 
  provinces, 
  departments,
  initialSearch = "",
  initialProvince = "",
  initialDepartment = ""
}: { 
  initialJobs: any[], 
  provinces: any[], 
  departments: any[],
  initialSearch?: string,
  initialProvince?: string,
  initialDepartment?: string
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [province, setProvince] = useState(initialProvince);
  const [department, setDepartment] = useState(initialDepartment);
  
  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = params.get("q") || "";
      const currentProv = params.get("province") || "";
      const currentDep = params.get("department") || "";

      if (currentQ !== search || currentProv !== province || currentDep !== department) {
        if (search) params.set("q", search); else params.delete("q");
        if (province) params.set("province", province); else params.delete("province");
        if (department) params.set("department", department); else params.delete("department");

        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, province, department, pathname, router, searchParams]);

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-table-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari posisi pekerjaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-black"
          />
        </div>
        
        <div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-black"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-black"
          >
            <option value="">Semua Lokasi (Provinsi)</option>
            {provinces.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {initialJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-table-border shadow-sm">
          <Briefcase className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-bold text-black mb-2">Tidak ada lowongan</h3>
          <p className="text-on-surface-variant">Maaf, kami tidak menemukan lowongan yang sesuai dengan kriteria pencarian Anda.</p>
          <button 
            onClick={() => { setSearch(""); setProvince(""); setDepartment(""); }}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialJobs.map((job) => (
            <Link 
              key={job.id} 
              href={`/jobs/${job.slug || job.id}`}
              className="bg-white rounded-3xl p-6 border border-table-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col h-full"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-surface-container-low text-on-surface text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                  {job.department?.name || job.departmentName || "General"}
                </span>
                <h3 className="text-xl font-bold text-primary group-hover:text-primary-container transition-colors line-clamp-2">
                  {job.positionName || job.position?.name || "Posisi Umum"}
                </h3>
              </div>
              
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{job.city?.name}, {job.province?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Dibuat: {new Date(job.publishedDate || job.createdAt).toLocaleDateString("id-ID")}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-table-border flex items-center justify-between mt-auto">
                <span className="text-sm font-semibold text-primary">Lihat Detail</span>
                <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
