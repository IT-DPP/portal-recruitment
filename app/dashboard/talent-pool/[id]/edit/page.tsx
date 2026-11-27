"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, BookOpen, FileCheck, Save, Loader2, ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import { EDUCATION_TYPES, TRAINING_CENTER_TYPES } from "@/lib/masterData";
import { getProvinces, getCities, getInstitutes } from "@/app/actions/master-data";
import { getTalentPoolCandidateById, updateTalentPoolCandidate } from "@/app/actions/talent-pool";

type TabValue = "pribadi" | "kontak" | "pendidikan" | "dokumen";

export default function EditTalentPoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const candidateId = unwrappedParams.id;

  const [activeTab, setActiveTab] = useState<TabValue>("pribadi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCompleteStatus, setIsCompleteStatus] = useState<boolean>(false);

  // Master Data
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Data Pribadi
    fullName: "",
    birthPlace: "",
    birthDate: "",
    gender: "",
    religion: "",
    maritalStatus: "",
    nik: "",
    kk: "",

    // Kontak
    email: "",
    whatsapp: "",
    emergencyContact: "",
    domicileAddress: "",
    currentAddress: "",
    province: "",
    city: "",

    // Pendidikan
    educationType: "",
    latestEducation: "",
    educationInstitution: "",
    trainingCenterType: "",
    trainingCenter: "",

    // Dokumen
    fileCv: null as any,
    fileIjazah: null as any,
    fileKtp: null as any,
    fileKk: null as any,
    fileSertifikat: null as any,
    filePhoto: null as any,
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [provRes, cityRes, instRes, candRes] = await Promise.all([
          getProvinces(),
          getCities(),
          getInstitutes(),
          getTalentPoolCandidateById(candidateId),
        ]);

        if (provRes.success && provRes.data) setProvinces(provRes.data);
        if (cityRes.success && cityRes.data) setCities(cityRes.data);
        if (instRes.success && instRes.data) setInstitutes(instRes.data);

        if (candRes.success && candRes.data) {
          const c = candRes.data as any;
          setIsCompleteStatus(c.isProfileCompleted ?? false);

          const docs: Record<string, any> = {};
          if (c.documents && Array.isArray(c.documents)) {
            c.documents.forEach((d: any) => {
              const key = `file${d.documentType.charAt(0).toUpperCase() + d.documentType.slice(1)}`;
              docs[key] = {
                url: d.fileUrl,
                name: d.fileUrl.split("/").pop() || "Dokumen",
                type: d.mimeType || "application/pdf",
                objectKey: d.objectKey,
              };
            });
          }

          setFormData({
            fullName: c.user?.name || "",
            birthPlace: c.birthPlace || "",
            birthDate: c.birthDate ? new Date(c.birthDate).toISOString().split("T")[0] : "",
            gender: c.gender || "",
            religion: c.religion || "",
            maritalStatus: c.maritalStatus || "",
            nik: c.nik || "",
            kk: c.kk || "",
            email: c.user?.email && !c.user.email.endsWith("@internal.talentpool") ? c.user.email : "",
            whatsapp: c.whatsapp || "",
            emergencyContact: c.emergencyContact || "",
            domicileAddress: c.domicileAddress || "",
            currentAddress: c.currentAddress || "",
            province: c.province?.name || "",
            city: c.city?.name || "",
            educationType: c.educationType || "",
            latestEducation: c.latestEducation || "",
            educationInstitution: c.educationInstitution || "",
            trainingCenterType: c.trainingCenterType || "",
            trainingCenter: c.trainingCenterName || "",
            fileCv: docs.fileCv || null,
            fileIjazah: docs.fileIjazah || null,
            fileKtp: docs.fileKtp || null,
            fileKk: docs.fileKk || null,
            fileSertifikat: docs.fileSertifikat || null,
            filePhoto: docs.filePhoto || null,
          });
        } else {
          setErrorMessage(candRes.error || "Gagal memuat profil kandidat.");
        }
      } catch (err: any) {
        console.error("Load Candidate Error:", err);
        setErrorMessage("Gagal memuat data kandidat.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [candidateId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.fullName.trim()) {
      setActiveTab("pribadi");
      setErrorMessage("Nama lengkap kandidat wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateTalentPoolCandidate(candidateId, formData);

      if (res.success) {
        setIsCompleteStatus(res.data?.isProfileCompleted ?? false);
        setSuccessMessage(
          res.data?.isProfileCompleted
            ? "Profil kandidat berhasil diperbarui dan kini berstatus LENGKAP. Kandidat siap ditugaskan ke lowongan!"
            : "Profil kandidat berhasil diperbarui (Status: Belum Lengkap). Anda dapat melengkapinya nanti."
        );
        setTimeout(() => {
          router.push("/dashboard/talent-pool");
        }, 1200);
      } else {
        setErrorMessage(res.error || "Gagal memperbarui profil kandidat.");
      }
    } catch (err: any) {
      console.error("Update Error:", err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memperbarui kandidat.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "pribadi", label: "Data Pribadi", icon: User },
    { id: "kontak", label: "Kontak", icon: Mail },
    { id: "pendidikan", label: "Pendidikan", icon: BookOpen },
    { id: "dokumen", label: "Dokumen", icon: FileCheck },
  ] as const;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-slate-600">Memuat profil kandidat...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <Link
          href="/dashboard/talent-pool"
          className="text-primary font-semibold text-sm flex items-center gap-1 mb-4 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Talent Pool
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">Edit / Update Profil Talent</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Perbarui data profil dan dokumen kandidat di dalam Talent Pool.
            </p>
          </div>
          <div>
            {isCompleteStatus ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profil Lengkap (Siap Ditugaskan)
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Profil Belum Lengkap
              </span>
            )}
          </div>
        </div>
      </div>

      {!isCompleteStatus && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Perhatian: Status Profil Belum Lengkap</p>
            <p>
              Kandidat ini belum dapat diapply atau ditugaskan ke lowongan pekerjaan. Untuk melengkapinya, pastikan field berikut terisi: <strong>Nama Lengkap, NIK 16 digit, No WA, Tanggal Lahir, Domisili, dan Pendidikan Terakhir</strong>.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-table-border overflow-hidden">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto border-b border-table-border bg-surface-container-lowest scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors shrink-0
                  ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  }
                `}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-on-surface-variant"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8">
          {/* Tab Content: Data Pribadi */}
          {activeTab === "pribadi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Nama Lengkap (Sesuai KTP) <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tempat Lahir</label>
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => handleInputChange("birthPlace", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Tempat lahir"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Kelamin</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Pria"
                      checked={formData.gender === "Pria"}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-bold text-black">Pria</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Wanita"
                      checked={formData.gender === "Wanita"}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-bold text-black">Wanita</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Agama</label>
                <select
                  value={formData.religion}
                  onChange={(e) => handleInputChange("religion", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Pilih Agama</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Status Pernikahan</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="maritalStatus"
                      value="Single"
                      checked={formData.maritalStatus === "Single"}
                      onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-bold text-black">Single</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="maritalStatus"
                      value="Menikah"
                      checked={formData.maritalStatus === "Menikah"}
                      onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm font-bold text-black">Menikah</span>
                  </label>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nomor NIK (KTP)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => handleInputChange("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="16 Digit NIK"
                  />
                  <p className="text-[11px] text-slate-500">Terenkripsi aman sesuai standar UU PDP No. 27/2022.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={formData.kk}
                    onChange={(e) => handleInputChange("kk", e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="16 Digit No KK"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Kontak */}
          {activeTab === "kontak" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Alamat Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No Telepon (WhatsApp)</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="08..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No Telepon Darurat</label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="08..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Alamat Domisili (Sesuai KTP)</label>
                <textarea
                  value={formData.domicileAddress}
                  onChange={(e) => handleInputChange("domicileAddress", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Alamat lengkap domisili"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Alamat Saat Ini</label>
                <textarea
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Alamat tempat tinggal saat ini"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Provinsi</label>
                <input
                  type="text"
                  list="edit-province-options"
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Pilih atau ketik Provinsi"
                />
                <datalist id="edit-province-options">
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Kota / Kabupaten</label>
                <input
                  type="text"
                  list="edit-city-options"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Pilih atau ketik Kota/Kabupaten"
                />
                <datalist id="edit-city-options">
                  {cities.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {/* Tab Content: Pendidikan */}
          {activeTab === "pendidikan" && (
            <div className="grid grid-cols-1 gap-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Pendidikan Terakhir</label>
                <select
                  value={formData.educationType}
                  onChange={(e) => {
                    handleInputChange("educationType", e.target.value);
                    handleInputChange("latestEducation", "");
                    handleInputChange("educationInstitution", "");
                  }}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Pilih Jenis Pendidikan</option>
                  {EDUCATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tingkat Pendidikan</label>
                <select
                  value={formData.latestEducation}
                  onChange={(e) => handleInputChange("latestEducation", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  disabled={!formData.educationType}
                >
                  <option value="">Pilih Tingkat Pendidikan</option>
                  {formData.educationType === "Perguruan Tinggi" && (
                    <>
                      <option value="D3">Diploma 3 (D3)</option>
                      <option value="D4">Diploma 4 (D4)</option>
                      <option value="S1">Sarjana (S1)</option>
                      <option value="S2">Magister (S2)</option>
                      <option value="S3">Doktor (S3)</option>
                    </>
                  )}
                  {formData.educationType === "SLTA" && <option value="SMA/SMK">SMA/SMK/Sederajat</option>}
                  {formData.educationType === "SLTP" && <option value="SMP">SMP/Sederajat</option>}
                  {formData.educationType === "SD" && <option value="SD">SD/Sederajat</option>}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Institusi Pendidikan</label>
                <input
                  type="text"
                  list="edit-institute-options"
                  value={formData.educationInstitution}
                  onChange={(e) => handleInputChange("educationInstitution", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Ketik atau pilih nama institusi pendidikan..."
                />
                <datalist id="edit-institute-options">
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Training Center (Opsional)</label>
                <select
                  value={formData.trainingCenterType}
                  onChange={(e) => {
                    handleInputChange("trainingCenterType", e.target.value);
                    handleInputChange("trainingCenter", "");
                  }}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Pilih Jenis Training Center</option>
                  {TRAINING_CENTER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Training Center</label>
                <input
                  type="text"
                  value={formData.trainingCenter}
                  onChange={(e) => handleInputChange("trainingCenter", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Isi nama Training Center..."
                />
              </div>
            </div>
          )}

          {/* Tab Content: Dokumen */}
          {activeTab === "dokumen" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FileUpload
                  label="Curriculum Vitae (CV)"
                  value={formData.fileCv}
                  onChange={(file) => handleInputChange("fileCv", file)}
                />
                <FileUpload
                  label="Ijazah Terakhir"
                  value={formData.fileIjazah}
                  onChange={(file) => handleInputChange("fileIjazah", file)}
                />
                <FileUpload
                  label="Kartu Tanda Penduduk (KTP)"
                  value={formData.fileKtp}
                  onChange={(file) => handleInputChange("fileKtp", file)}
                />
                <FileUpload
                  label="Kartu Keluarga (KK)"
                  value={formData.fileKk}
                  onChange={(file) => handleInputChange("fileKk", file)}
                />
                <FileUpload
                  label="Sertifikat / Dokumen Pendukung"
                  value={formData.fileSertifikat}
                  onChange={(file) => handleInputChange("fileSertifikat", file)}
                  helperText="Opsional. Contoh: Sertifikat BNSP, Pelatihan Kerja, Lisensi Keahlian, dan lain-lain."
                />
                <FileUpload
                  label="Pas Photo"
                  value={formData.filePhoto}
                  onChange={(file) => handleInputChange("filePhoto", file)}
                  accept=".png,.jpg,.jpeg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-surface-container-lowest border-t border-table-border flex items-center justify-between">
          <div className="flex gap-2">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:block">
              {activeTab === "pribadi"
                ? "Tahap 1 dari 4"
                : activeTab === "kontak"
                ? "Tahap 2 dari 4"
                : activeTab === "pendidikan"
                ? "Tahap 3 dari 4"
                : "Tahap 4 dari 4"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/talent-pool"
              className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Kembali
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Perubahan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
