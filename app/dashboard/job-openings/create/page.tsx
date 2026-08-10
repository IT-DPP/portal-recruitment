"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateJobPage() {
  const router = useRouter();

  // Master Data States
  const [customers, setCustomers] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Filtered cities based on selected province
  const [filteredCities, setFilteredCities] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    noRegistrasi: "",
    customerId: "",
    tanggalMasuk: new Date(),
    jumlahPermintaan: "",
    posisi: "",
    provinceId: "",
    siteId: "",
    statusPermintaan: "", // Penambahan / Pergantian
    noFormB1: "",
    cityId: "",
    district: "",
    kualifikasi: "",
    benefit: "",
    needTestSkill: false,
    needBnsp: false,
    priority: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load Master Data
    const savedCust = localStorage.getItem("ugz_master_customer");
    if (savedCust) setCustomers(JSON.parse(savedCust));

    const savedProv = localStorage.getItem("ugz_master_province");
    if (savedProv) setProvinces(JSON.parse(savedProv));

    const savedCities = localStorage.getItem("ugz_master_city");
    if (savedCities) setCities(JSON.parse(savedCities));

    const savedSites = localStorage.getItem("ugz_master_sites_operation");
    if (savedSites) setSites(JSON.parse(savedSites));
  }, []);

  // Update filtered cities when province changes
  useEffect(() => {
    if (formData.provinceId) {
      setFilteredCities(
        cities.filter((c) => c.provinceId === formData.provinceId),
      );
      // Reset city if the previously selected city doesn't belong to the new province
      const cityExistsInProv = cities.some(
        (c) => c.id === formData.cityId && c.provinceId === formData.provinceId,
      );
      if (!cityExistsInProv) {
        setFormData((prev) => ({ ...prev, cityId: "" }));
      }
    } else {
      setFilteredCities([]);
      setFormData((prev) => ({ ...prev, cityId: "" }));
    }
  }, [formData.provinceId, cities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const existingJobs = localStorage.getItem("ugz_jobs");
      const jobs = existingJobs ? JSON.parse(existingJobs) : [];

      const newJob = {
        id: Date.now().toString(),
        globalStatus: "Draft",
        ...formData,
      };

      localStorage.setItem("ugz_jobs", JSON.stringify([...jobs, newJob]));
      setIsSubmitting(false);
      router.push("/dashboard/job-openings");
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/job-openings"
          className="p-2 bg-white border border-table-border rounded-lg hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">
            Add New Job
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Silakan lengkapi formulir pendaftaran lowongan kerja baru di bawah
            ini.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-table-border overflow-hidden"
      >
        <div className="p-6 md:p-8 space-y-8">
          {/* Section 1: Data Utama */}
          <div>
            <h3 className="text-base font-bold text-on-surface border-b border-table-border pb-2 mb-4">
              Informasi Utama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  No. Registrasi <span className="text-status-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.noRegistrasi}
                  onChange={(e) =>
                    setFormData({ ...formData, noRegistrasi: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black"
                  placeholder="Cth: REG-2024-001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Customer <span className="text-status-error">*</span>
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white"
                >
                  <option value="">-- Pilih Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[10px] text-status-warning mt-1">
                    Data customer kosong. Tambahkan di Master Data.
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Tanggal Form Masuk{" "}
                  <span className="text-status-error">*</span>
                </label>
                <DatePicker
                  selected={formData.tanggalMasuk}
                  onChange={(date: Date | null) =>
                    setFormData({
                      ...formData,
                      tanggalMasuk: date || new Date(),
                    })
                  }
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Jumlah Permintaan <span className="text-status-error">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.jumlahPermintaan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jumlahPermintaan: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black"
                  placeholder="Jumlah kandidat dibutuhkan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nama Posisi <span className="text-status-error">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.posisi}
                  onChange={(e) =>
                    setFormData({ ...formData, posisi: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black"
                  placeholder="Cth: Software Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Status Permintaan <span className="text-status-error">*</span>
                </label>
                <select
                  required
                  value={formData.statusPermintaan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statusPermintaan: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white"
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="Penambahan">Penambahan</option>
                  <option value="Pergantian">Pergantian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  No. Form B1
                </label>
                <input
                  type="text"
                  value={formData.noFormB1}
                  onChange={(e) =>
                    setFormData({ ...formData, noFormB1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black"
                  placeholder="Nomor referensi form B1"
                />
              </div>

              <div className="flex flex-col justify-center gap-4 mt-6">
                <label className="flex items-center cursor-pointer group w-fit">
                  <input
                    type="checkbox"
                    checked={formData.needTestSkill}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        needTestSkill: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary bg-white"
                  />
                  <span className="ml-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Membutuhkan Test Skill
                  </span>
                </label>

                <label className="flex items-center cursor-pointer group w-fit">
                  <input
                    type="checkbox"
                    checked={formData.needBnsp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        needBnsp: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary bg-white"
                  />
                  <span className="ml-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Mewajibkan Sertifikat BNSP
                  </span>
                </label>

                <label className="flex items-center cursor-pointer group w-fit">
                  <input
                    type="checkbox"
                    checked={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary bg-white"
                  />
                  <span className="ml-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Dibutuhkan Segera (Priority)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan */}
          <div>
            <h3 className="text-base font-bold text-on-surface border-b border-table-border pb-2 mb-4">
              Lokasi Penempatan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Provinsi <span className="text-status-error">*</span>
                </label>
                <select
                  required
                  value={formData.provinceId}
                  onChange={(e) =>
                    setFormData({ ...formData, provinceId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white"
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Kota / Kabupaten <span className="text-status-error">*</span>
                </label>
                <select
                  required
                  disabled={!formData.provinceId}
                  value={formData.cityId}
                  onChange={(e) =>
                    setFormData({ ...formData, cityId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white disabled:bg-surface-container-low disabled:cursor-not-allowed"
                >
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {filteredCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formData.provinceId && filteredCities.length === 0 && (
                  <p className="text-[10px] text-status-warning mt-1">
                    Belum ada kota untuk provinsi ini. Tambahkan di Master Data.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  District (Kecamatan/Daerah)
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black"
                  placeholder="Cth: Cilandak"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Area Kerja (Site) <span className="text-status-error">*</span>
                </label>
                <select
                  required
                  value={formData.siteId}
                  onChange={(e) =>
                    setFormData({ ...formData, siteId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white"
                >
                  <option value="">-- Pilih Area Kerja --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
                {sites.length === 0 && (
                  <p className="text-[10px] text-status-warning mt-1">
                    Data sites kosong. Tambahkan di Master Data.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Deskripsi */}
          <div>
            <h3 className="text-base font-bold text-on-surface border-b border-table-border pb-2 mb-4">
              Persyaratan & Benefit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Kualifikasi (Requirements)
                </label>
                <textarea
                  rows={5}
                  value={formData.kualifikasi}
                  onChange={(e) =>
                    setFormData({ ...formData, kualifikasi: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black leading-relaxed"
                  placeholder="Jelaskan kualifikasi yang dibutuhkan..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Benefit
                </label>
                <textarea
                  rows={5}
                  value={formData.benefit}
                  onChange={(e) =>
                    setFormData({ ...formData, benefit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black leading-relaxed"
                  placeholder="Jelaskan benefit yang didapatkan..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
          <Link
            href="/dashboard/job-openings"
            className="px-5 py-2.5 rounded text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-primary text-white rounded text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? "Menyimpan..." : "Submit Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
