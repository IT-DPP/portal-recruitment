"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
} from "lucide-react";

export default function JobOpeningsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("card");

  useEffect(() => {
    const savedJobs = localStorage.getItem("ugz_jobs");
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    }
    const savedProv = localStorage.getItem("ugz_master_province");
    if (savedProv) setProvinces(JSON.parse(savedProv));

    const savedCity = localStorage.getItem("ugz_master_city");
    if (savedCity) setCities(JSON.parse(savedCity));

    const savedSites = localStorage.getItem("ugz_master_sites_operation");
    if (savedSites) setSites(JSON.parse(savedSites));
  }, []);

  const getProvinceName = (id: string) =>
    provinces.find((p) => p.id === id)?.name || "-";
  const getCityName = (id: string) =>
    cities.find((c) => c.id === id)?.name || "-";
  const getSiteName = (id: string) =>
    sites.find((s) => s.id === id)?.siteName || id || "-";

  // Calculate dynamic overdue logic to display on list
  const getDynamicGlobalStatus = (job: any) => {
    if (
      job.globalStatus === "Closed" ||
      job.globalStatus === "Draft" ||
      job.globalStatus === "Overdue"
    )
      return job.globalStatus;

    // If Active, check timelines to see if any stage is past deadline
    if (job.timeline) {
      const now = new Date();
      const hasOverdueStage = job.timeline.some(
        (t: any) => t.status !== "Completed" && now > new Date(t.deadlineDate),
      );
      if (hasOverdueStage) return "Overdue";
    }
    return job.globalStatus;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">
            Job Openings
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Kelola daftar lowongan pekerjaan dan permintaannya.
          </p>
        </div>
        <Link
          href="/dashboard/job-openings/create"
          className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Job
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-4 border-b border-table-border bg-surface-container-lowest flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari No Reg atau Posisi..."
              className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black bg-white"
            />
          </div>
          <div className="flex bg-surface-container-low border border-outline-variant rounded p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded transition-colors ${viewMode === "card" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant bg-surface-bright">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary/50" />
              </div>
              <p className="font-semibold text-black mb-1">
                Belum ada Job Openings
              </p>
              <p className="text-xs max-w-sm mb-4">
                Buat lowongan baru untuk mulai merekrut kandidat yang sesuai
                dengan kebutuhan perusahaan.
              </p>
              <Link
                href="/dashboard/job-openings/create"
                className="text-primary font-semibold hover:underline text-xs flex items-center gap-1"
              >
                Buat Job Baru <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-on-surface bg-table-header-bg uppercase border-b border-table-border font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">No. Registrasi</th>
                  <th className="px-6 py-4">Posisi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Kebutuhan</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => {
                  const displayStatus = getDynamicGlobalStatus(job);
                  return (
                    <tr
                      key={idx}
                      className="bg-white border-b border-table-border hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                        <div className="flex items-center gap-2">
                          {job.noRegistrasi}
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white ${
                              displayStatus === "Draft"
                                ? "bg-gray-500"
                                : displayStatus === "Overdue"
                                  ? "bg-red-600"
                                  : displayStatus === "Closed"
                                    ? "bg-slate-800"
                                    : "bg-emerald-500"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-black">
                        {job.posisi}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            job.statusPermintaan === "Penambahan"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {job.statusPermintaan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-black text-center font-bold">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low">
                          {job.jumlahPermintaan}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-black font-semibold">
                          {getCityName(job.cityId)}
                        </p>
                        <p className="text-xs text-black font-semibold">
                          {getCityName(job.cityId)}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {getSiteName(job.siteId || job.areaKerja)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/job-openings/${job.id}`}
                          className="inline-block bg-surface-container-low px-3 py-1.5 rounded border border-outline-variant text-primary hover:text-white hover:bg-primary text-xs font-bold transition-colors shadow-sm"
                        >
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-surface-bright min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, idx) => {
                const displayStatus = getDynamicGlobalStatus(job);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-sm border border-table-border p-5 hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full relative overflow-hidden"
                  >
                    {/* Global Status Badge */}
                    <div className="absolute top-0 right-0">
                      <div
                        className={`text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm ${
                          displayStatus === "Draft"
                            ? "bg-gray-500"
                            : displayStatus === "Overdue"
                              ? "bg-red-600"
                              : displayStatus === "Closed"
                                ? "bg-slate-800"
                                : "bg-emerald-500"
                        }`}
                      >
                        {displayStatus}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-[10px] font-mono text-on-surface-variant font-semibold mb-1">
                        {job.noRegistrasi}
                      </p>
                      <h3 className="text-lg font-bold text-primary leading-tight">
                        {job.posisi}
                      </h3>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-on-surface-variant shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-black">
                            {getSiteName(job.siteId || job.areaKerja)}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {getCityName(job.cityId)},{" "}
                            {getProvinceName(job.provinceId)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            job.statusPermintaan === "Penambahan"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {job.statusPermintaan}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-outline-variant bg-surface-container-lowest text-on-surface uppercase tracking-wider">
                          {job.jumlahPermintaan} Kebutuhan
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-table-border flex justify-between items-center mt-auto">
                      <p className="text-[10px] text-on-surface-variant">
                        Dibuat:{" "}
                        {new Date(job.tanggalMasuk).toLocaleDateString("id-ID")}
                      </p>
                      <Link
                        href={`/dashboard/job-openings/${job.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Detail Lowongan
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
