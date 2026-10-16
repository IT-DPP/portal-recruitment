"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { updateJobOpening } from "@/app/actions/job";
import { MasterCustomer, MasterProvince, MasterCity, MasterSite, MasterPosition, MasterDepartment, JobOpening } from "@prisma/client";
import { useModal } from "@/components/providers/ModalProvider";

interface JobEditClientProps {
  job: JobOpening;
  customers: MasterCustomer[];
  provinces: MasterProvince[];
  cities: MasterCity[];
  sites: MasterSite[];
  positions: MasterPosition[];
  departments: MasterDepartment[];
}

export default function JobEditClient({
  job,
  customers,
  provinces,
  cities,
  sites,
  positions,
  departments,
}: JobEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const modal = useModal();

  const [formData, setFormData] = useState({
    noRegistrasi: job.noRegistrasi || "",
    customerId: job.customerId || "",
    tanggalMasuk: job.tanggalMasuk ? new Date(job.tanggalMasuk) : new Date(),
    jumlahPermintaan: job.jumlahPermintaan ? String(job.jumlahPermintaan) : "",
    positionId: job.positionId || "",
    positionName: job.positionName || "",
    departmentId: job.departmentId || "",
    departmentName: job.departmentName || "",
    provinceId: job.provinceId || "",
    siteId: job.siteId || "",
    statusPermintaan: job.statusPermintaan || "",
    noFormB1: job.noFormB1 || "",
    cityId: job.cityId || "",
    district: job.district || "",
    kualifikasi: job.kualifikasi || "",
    benefit: job.benefit || "",
    requiresSkillTest: job.requiresSkillTest || false,
    requiresBnsp: job.requiresBnsp || false,
    isPriority: job.isPriority || false,
  });

  const [filteredCities, setFilteredCities] = useState<MasterCity[]>([]);
  const [filteredSites, setFilteredSites] = useState<MasterSite[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Select Options
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const provinceOptions = provinces.map(p => ({ value: p.id, label: p.name }));
  const cityOptions = filteredCities.map(c => ({ value: c.id, label: c.name }));
  const siteOptions = filteredSites.map(s => ({ value: s.id, label: s.name }));
  const positionOptions = positions.map(p => ({ value: p.id, label: p.name }));
  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));

  useEffect(() => {
    if (formData.provinceId) {
      setFilteredCities(cities.filter(c => c.provinceId === formData.provinceId));
      if (!cities.some(c => c.id === formData.cityId && c.provinceId === formData.provinceId)) {
        setFormData(prev => ({ ...prev, cityId: "", siteId: "" }));
      }
    } else {
      setFilteredCities([]);
      setFormData(prev => ({ ...prev, cityId: "", siteId: "" }));
    }
  }, [formData.provinceId, cities]);

  useEffect(() => {
    if (formData.cityId && formData.customerId) {
      setFilteredSites(sites.filter(s => s.cityId === formData.cityId && s.customerId === formData.customerId));
      if (!sites.some(s => s.id === formData.siteId && s.cityId === formData.cityId && s.customerId === formData.customerId)) {
        setFormData(prev => ({ ...prev, siteId: "" }));
      }
    } else {
      setFilteredSites([]);
      setFormData(prev => ({ ...prev, siteId: "" }));
    }
  }, [formData.cityId, formData.customerId, sites]);

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

      const res = await updateJobOpening(job.id, payload);
      if (res.success) {
        modal.alert("Berhasil", "Lowongan berhasil diperbarui.");
        router.push(`/dashboard/job-openings/${job.id}`);
      } else {
        setErrorMsg(res.error || "Gagal mengubah job");
      }
    });
  };

  if (job.status !== "DRAFT") {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Lowongan yang sudah aktif atau selesai tidak dapat diedit secara penuh. Anda hanya dapat mengedit nomor B1 dari halaman detail.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/job-openings/${job.id}`}
          className="p-2 bg-white border border-table-border rounded-lg hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Edit Job Opening</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Silakan ubah formulir lowongan kerja di bawah ini.
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
                  onChange={(val) => setFormData({ ...formData, customerId: val, siteId: "" })}
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
                  onChange={(val) => setFormData({ ...formData, provinceId: val, cityId: "", siteId: "" })}
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
                  onChange={(val) => setFormData({ ...formData, cityId: val, siteId: "" })}
                  disabled={isPending || !formData.provinceId}
                  placeholder="Pilih Kota/Kabupaten"
                />
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
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Area Kerja (Site Operation) <span className="text-status-error">*</span>
                </label>
                <SearchableSelect
                  options={siteOptions}
                  value={formData.siteId}
                  onChange={(val) => setFormData({ ...formData, siteId: val })}
                  disabled={isPending || !formData.cityId || !formData.customerId}
                  placeholder="Pilih Site (Pastikan Customer & Kota terisi)"
                />
                {filteredSites.length === 0 && formData.cityId && formData.customerId && (
                  <p className="text-[10px] text-status-warning mt-1">
                    Tidak ada site untuk kombinasi Customer dan Kota ini.
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
            href={`/dashboard/job-openings/${job.id}`}
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
            {isPending ? "Menyimpan..." : "Save Job"}
          </button>
        </div>
      </form>
    </div>
  );
}
