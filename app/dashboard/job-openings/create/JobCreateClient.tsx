"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { createJobOpening } from "@/app/actions/job";
import { MasterCustomer, MasterProvince, MasterCity, MasterSite, MasterPosition, MasterDepartment } from "@prisma/client";

interface JobCreateClientProps {
  customers: MasterCustomer[];
  provinces: MasterProvince[];
  cities: MasterCity[];
  sites: (MasterSite & {
    customer?: MasterCustomer | null;
    province?: MasterProvince | null;
    city?: MasterCity | null;
  })[];
  positions: MasterPosition[];
  departments: MasterDepartment[];
}

export default function JobCreateClient({
  customers,
  provinces,
  cities,
  sites,
  positions,
  departments,
}: JobCreateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    noRegistrasi: "",
    customerId: "",
    tanggalMasuk: new Date(),
    jumlahPermintaan: "",
    positionId: "",
    positionName: "",
    departmentId: "",
    departmentName: "",
    provinceId: "",
    siteId: "",
    statusPermintaan: "",
    noFormB1: "",
    cityId: "",
    district: "",
    kualifikasi: "",
    benefit: "",
    requiresSkillTest: false,
    requiresBnsp: false,
    isPriority: false,
  });

  const [filteredCities, setFilteredCities] = useState<MasterCity[]>([]);
  const [filteredSites, setFilteredSites] = useState<(MasterSite & { customer?: MasterCustomer | null; province?: MasterProvince | null; city?: MasterCity | null })[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Handlers for bidirectional cascading
  const handleCustomerChange = (newCustomerId: string) => {
    setFormData(prev => {
      const currentSite = sites.find(s => s.id === prev.siteId);
      const isSiteValid = currentSite && currentSite.customerId === newCustomerId;
      return {
        ...prev,
        customerId: newCustomerId,
        siteId: isSiteValid ? prev.siteId : "",
      };
    });
  };

  const handleProvinceChange = (newProvinceId: string) => {
    setFormData(prev => {
      const isCurrentCityInNewProv = cities.some(c => c.id === prev.cityId && c.provinceId === newProvinceId);
      const isCurrentSiteInNewProv = sites.some(s => s.id === prev.siteId && s.provinceId === newProvinceId);
      return {
        ...prev,
        provinceId: newProvinceId,
        cityId: isCurrentCityInNewProv ? prev.cityId : "",
        siteId: isCurrentSiteInNewProv ? prev.siteId : "",
      };
    });
  };

  const handleCityChange = (newCityId: string) => {
    setFormData(prev => {
      const isCurrentSiteInNewCity = sites.some(s => s.id === prev.siteId && s.cityId === newCityId);
      return {
        ...prev,
        cityId: newCityId,
        siteId: isCurrentSiteInNewCity ? prev.siteId : "",
      };
    });
  };

  const handleSiteChange = (selectedSiteId: string) => {
    const selected = sites.find(s => s.id === selectedSiteId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        siteId: selected.id,
        customerId: selected.customerId || prev.customerId,
        provinceId: selected.provinceId || prev.provinceId,
        cityId: selected.cityId || prev.cityId,
      }));
    } else {
      setFormData(prev => ({ ...prev, siteId: "" }));
    }
  };

  // Filter cities by province
  useEffect(() => {
    if (formData.provinceId) {
      setFilteredCities(cities.filter(c => c.provinceId === formData.provinceId));
    } else {
      setFilteredCities([]);
    }
  }, [formData.provinceId, cities]);

  // Filter sites intelligently based on customer, province, and city
  useEffect(() => {
    let result = sites;
    if (formData.customerId) {
      result = result.filter(s => s.customerId === formData.customerId);
    }
    if (formData.provinceId) {
      const inProv = result.filter(s => s.provinceId === formData.provinceId);
      if (inProv.length > 0) {
        result = inProv;
      }
    }
    if (formData.cityId) {
      const inCity = result.filter(s => s.cityId === formData.cityId);
      // Prioritize city matches, but if none exist in this city, keep the province/customer sites
      if (inCity.length > 0) {
        result = inCity;
      }
    }
    setFilteredSites(result);
  }, [formData.customerId, formData.provinceId, formData.cityId, sites]);

  // Select Options
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const provinceOptions = provinces.map(p => ({ value: p.id, label: p.name }));
  
  const cityOptions = filteredCities.map(c => {
    const sitesCount = formData.customerId
      ? sites.filter(s => s.customerId === formData.customerId && s.cityId === c.id).length
      : 0;
    return {
      value: c.id,
      label: sitesCount > 0 ? `${c.name} (${sitesCount} Site)` : c.name,
    };
  });

  const siteOptions = filteredSites.map(s => {
    const cityName = s.city?.name || cities.find(c => c.id === s.cityId)?.name || '';
    const provName = s.province?.name || provinces.find(p => p.id === s.provinceId)?.name || '';
    const locationSuffix = cityName ? ` (${cityName}${provName ? `, ${provName}` : ''})` : '';
    return {
      value: s.id,
      label: `${s.name}${locationSuffix}`,
    };
  });

  const positionOptions = positions.map(p => ({ value: p.id, label: p.name }));
  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));

  // Alternate sites of the same customer in this province if selected city has none
  const sitesInSelectedCity = (formData.customerId && formData.cityId)
    ? sites.filter(s => s.customerId === formData.customerId && s.cityId === formData.cityId)
    : [];
  const otherCustomerSitesInProvince = (formData.customerId && formData.provinceId && formData.cityId && sitesInSelectedCity.length === 0)
    ? sites.filter(s => s.customerId === formData.customerId && s.provinceId === formData.provinceId)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.positionId) {
      setErrorMsg("Position is required.");
      return;
    }
    if (!formData.departmentId) {
      setErrorMsg("Department is required.");
      return;
    }

    const headcount = parseInt(formData.jumlahPermintaan, 10);
    if (isNaN(headcount) || headcount <= 0) {
      setErrorMsg("Jumlah permintaan kandidat harus berupa angka lebih dari 0.");
      return;
    }
    
    startTransition(async () => {
      const isNewPosition = !positionOptions.some(opt => opt.value === formData.positionId);
      const isNewDepartment = !departmentOptions.some(opt => opt.value === formData.departmentId);

      const matchedPos = positionOptions.find(opt => opt.value === formData.positionId);
      const matchedDept = departmentOptions.find(opt => opt.value === formData.departmentId);

      const payload = {
        ...formData,
        jumlahPermintaan: parseInt(formData.jumlahPermintaan) || 0,
        positionName: isNewPosition ? formData.positionId : (matchedPos?.label || undefined),
        positionId: isNewPosition ? null : formData.positionId,
        departmentName: isNewDepartment ? formData.departmentId : (matchedDept?.label || undefined),
        departmentId: isNewDepartment ? null : formData.departmentId,
      };

      const res = await createJobOpening(payload);
      if (res.success) {
        router.push("/dashboard/job-openings");
      } else {
        setErrorMsg(res.error || "Gagal membuat job");
      }
    });
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
          <h2 className="text-2xl font-bold text-primary tracking-tight">Add New Job</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Silakan lengkapi formulir pendaftaran lowongan kerja baru di bawah ini.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-status-error border border-red-200 rounded text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-table-border overflow-hidden">
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
                  onChange={(e) => setFormData({ ...formData, noRegistrasi: e.target.value })}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black disabled:bg-gray-100"
                  placeholder="Cth: REG-2024-001"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Tanggal Form Masuk <span className="text-status-error">*</span>
                </label>
                <DatePicker
                  selected={formData.tanggalMasuk}
                  onChange={(date: Date | null) => setFormData({ ...formData, tanggalMasuk: date || new Date() })}
                  dateFormat="dd/MM/yyyy"
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white disabled:bg-gray-100"
                  wrapperClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nama Posisi <span className="text-status-error">*</span>
                </label>
                <SearchableSelect
                  options={positionOptions}
                  value={formData.positionId}
                  onChange={(val) => {
                    setFormData({ ...formData, positionId: val });
                  }}
                  creatable
                  placeholder="Pilih atau tambah posisi..."
                  disabled={isPending}
                />
                {formData.positionId && !positionOptions.some(opt => opt.value === formData.positionId) && (
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold">
                    Posisi khusus lowongan ini: "{formData.positionId}" (tidak masuk master data)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Departemen <span className="text-status-error">*</span>
                </label>
                <SearchableSelect
                  options={departmentOptions}
                  value={formData.departmentId}
                  onChange={(val) => {
                    setFormData({ ...formData, departmentId: val });
                  }}
                  creatable
                  placeholder="Pilih atau tambah departemen..."
                  disabled={isPending}
                />
                {formData.departmentId && !departmentOptions.some(opt => opt.value === formData.departmentId) && (
                  <p className="text-[10px] text-blue-600 mt-1 font-semibold">
                    Departemen khusus lowongan ini: "{formData.departmentId}" (tidak masuk master data)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Jumlah Permintaan <span className="text-status-error">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={formData.jumlahPermintaan}
                  onKeyDown={(e) => {
                    if (["-", "+", "e", "E", "."].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseInt(val, 10) >= 0) {
                      setFormData({ ...formData, jumlahPermintaan: val });
                    }
                  }}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black disabled:bg-gray-100"
                  placeholder="Minimal 1 kandidat"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Status Permintaan <span className="text-status-error">*</span>
                </label>
                <select
                  required
                  value={formData.statusPermintaan}
                  onChange={(e) => setFormData({ ...formData, statusPermintaan: e.target.value })}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black bg-white disabled:bg-gray-100"
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
                  onChange={(e) => setFormData({ ...formData, noFormB1: e.target.value })}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black disabled:bg-gray-100"
                  placeholder="Nomor referensi form B1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6 border p-4 rounded-lg bg-surface-container-lowest">
              <label className="flex items-center cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  checked={formData.requiresSkillTest}
                  onChange={(e) => setFormData({ ...formData, requiresSkillTest: e.target.checked })}
                  disabled={isPending}
                  className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary bg-white"
                />
                <span className="ml-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                  Membutuhkan Test Skill (Technical Test)
                </span>
              </label>

              <label className="flex items-center cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  checked={formData.requiresBnsp}
                  onChange={(e) => setFormData({ ...formData, requiresBnsp: e.target.checked })}
                  disabled={isPending}
                  className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary bg-white"
                />
                <span className="ml-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                  Mewajibkan Sertifikat BNSP
                </span>
              </label>

              <label className="flex items-center cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  checked={formData.isPriority}
                  onChange={(e) => setFormData({ ...formData, isPriority: e.target.checked })}
                  disabled={isPending}
                  className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary bg-white"
                />
                <span className="ml-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                  Dibutuhkan Segera (Priority Job)
                </span>
              </label>
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
                  Customer <span className="text-status-error">*</span>
                </label>
                <SearchableSelect
                  options={customerOptions}
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  disabled={isPending}
                  placeholder="Pilih Customer"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Provinsi <span className="text-status-error">*</span>
                </label>
                <SearchableSelect
                  options={provinceOptions}
                  value={formData.provinceId}
                  onChange={handleProvinceChange}
                  disabled={isPending}
                  placeholder="Pilih Provinsi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Kota / Kabupaten <span className="text-status-error">*</span>
                </label>
                <SearchableSelect
                  options={cityOptions}
                  value={formData.cityId}
                  onChange={handleCityChange}
                  disabled={isPending || !formData.provinceId}
                  placeholder={formData.provinceId ? "Pilih Kota/Kabupaten" : "Pilih Provinsi terlebih dahulu"}
                />
                {otherCustomerSitesInProvince.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mt-2 space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Tidak ada site operasional langsung di {cities.find(c => c.id === formData.cityId)?.name}.</span>
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Site customer tersedia di kota lain pada provinsi ini (klik untuk otomatis menyesuaikan):
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {otherCustomerSitesInProvince.map(s => {
                        const sCity = cities.find(c => c.id === s.cityId)?.name || s.city?.name;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSiteChange(s.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-medium border border-amber-300 rounded shadow-xs text-[11px] transition-colors cursor-pointer"
                          >
                            <span>📍 {s.name}</span>
                            <span className="text-amber-700 font-normal">({sCity})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  District (Kecamatan)
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black disabled:bg-gray-100"
                  placeholder="Cth: Cilandak"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-on-surface">
                    Area Kerja (Site Operation) <span className="text-status-error">*</span>
                  </label>
                  {formData.siteId && (
                    <span className="text-[11px] text-primary font-medium">
                      ✓ Lokasi & Customer tersinkronisasi otomatis
                    </span>
                  )}
                </div>
                <SearchableSelect
                  options={siteOptions}
                  value={formData.siteId}
                  onChange={handleSiteChange}
                  disabled={isPending}
                  placeholder={
                    formData.customerId
                      ? "Pilih Site Operation..."
                      : "Pilih Site Operation (Customer & Lokasi akan otomatis terisi)..."
                  }
                />
                {filteredSites.length === 0 && (
                  <p className="text-[11px] text-status-warning mt-1">
                    Tidak ada site yang terdaftar untuk filter ini.
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
                  onChange={(e) => setFormData({ ...formData, kualifikasi: e.target.value })}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black leading-relaxed disabled:bg-gray-100"
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
                  onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-black leading-relaxed disabled:bg-gray-100"
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
            disabled={isPending}
            className="px-5 py-2.5 bg-primary text-white rounded text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? "Menyimpan..." : "Submit Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
