"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, BookOpen, FileCheck, Save, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { EDUCATION_TYPES, TRAINING_CENTER_TYPES } from "@/lib/masterData";
import { getProvinces, getCities, getInstitutes } from "@/app/actions/master-data";
import { getCandidateProfile, saveCandidateProfile, getUploadUrl, deleteCandidateDocument, getPreviewUrl } from "@/app/actions/candidate-profile";
import SearchableSelect from "@/components/ui/SearchableSelect";

type TabValue = "pribadi" | "kontak" | "pendidikan" | "dokumen";

export default function CandidateProfilePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("pribadi");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Master Data States
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
    
    // Dokumen (store the FileUpload value object here)
    fileCv: null as any,
    fileIjazah: null as any,
    fileKtp: null as any,
    fileKk: null as any,
    fileSertifikat: null as any,
    filePhoto: null as any,
  });

  useEffect(() => {
    async function loadInitialData() {
      // 1. Fetch Master Data concurrently
      const [provRes, cityRes, instRes] = await Promise.all([
        getProvinces(),
        getCities(),
        getInstitutes(),
      ]);

      if (provRes.success) setProvinces(provRes.data || []);
      if (cityRes.success) setCities(cityRes.data || []);
      if (instRes.success) setInstitutes(instRes.data || []);

      // 2. Fetch User Profile
      const profRes = await getCandidateProfile();
      if (profRes.success && profRes.data) {
        const p = profRes.data as any;
        const u = p.user || {};
        
        const docs: any = {};
        if (p.documents) {
           p.documents.forEach((d: any) => {
             const key = `file${d.documentType.charAt(0).toUpperCase() + d.documentType.slice(1)}`;
             // Ensure public URL is formed correctly or we can just pass the S3 URL. We'll pass the generic url to FileUpload
             docs[key] = {
               url: d.fileUrl,
               name: d.fileUrl.split("/").pop() || "Document",
               type: d.mimeType || "application/pdf",
               objectKey: d.objectKey,
             }
           });
        }

        setFormData(prev => ({
          ...prev,
          email: u.email || "",
          fullName: u.name || "",
          nik: p.nik || "",
          kk: p.kk || "",
          birthPlace: p.birthPlace || "",
          birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : "",
          gender: p.gender || "",
          religion: p.religion || "",
          maritalStatus: p.maritalStatus || "",
          whatsapp: p.whatsapp || "",
          emergencyContact: p.emergencyContact || "",
          domicileAddress: p.domicileAddress || "",
          currentAddress: p.currentAddress || "",
          province: p.province?.name || p.provinceId || "",
          city: p.city?.name || p.cityId || "",
          educationType: p.educationType || "",
          latestEducation: p.latestEducation || "",
          educationInstitution: p.educationInstitution || "",
          trainingCenterType: p.trainingCenterType || "",
          trainingCenter: p.trainingCenterName || "",
          ...docs
        }));
      }
      setIsLoadingData(false);
    }

    loadInitialData();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const uploadFileToS3 = async (fileObj: any) => {
    if (!fileObj || !fileObj.file) return fileObj; // Already uploaded or empty
    
    try {
      const res = await getUploadUrl(fileObj.name, fileObj.type);
      if (!res.success || !res.uploadUrl) throw new Error("Failed to get upload URL");
      
      const uploadRes = await fetch(res.uploadUrl, {
        method: "PUT",
        body: fileObj.file,
        headers: {
          "Content-Type": fileObj.type,
        }
      });
      
      if (!uploadRes.ok) throw new Error("S3 Upload failed");

      return {
        url: res.publicUrl,
        objectKey: res.objectKey,
        name: fileObj.name,
        type: fileObj.type,
        sizeBytes: fileObj.file.size
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  const handleDeleteDocument = async (field: string, type: string) => {
    // Optimistically update UI
    setFormData(prev => ({ ...prev, [field]: null }));
    // Call server action to delete from DB and S3
    await deleteCandidateDocument(type);
  };

  const handlePreviewDocument = async (field: string) => {
    const docData = (formData as any)[field];
    if (!docData) return;
    
    // If it's a local unsaved file, let the component handle it natively via fallback
    if (docData.file) {
      const url = URL.createObjectURL(docData.file);
      window.open(url, '_blank');
      return;
    }
    
    // If it's stored in S3, get a fresh presigned URL
    if (docData.objectKey) {
      const res = await getPreviewUrl(docData.objectKey);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        alert("Gagal memuat pratinjau dokumen.");
      }
    }
  };

  const handleSaveAction = async (isDraft: boolean) => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Upload new files if any
      const updatedFormData = { ...formData };
      const fileFields = ["fileCv", "fileIjazah", "fileKtp", "fileKk", "fileSertifikat", "filePhoto"];
      
      for (const field of fileFields) {
        const fileData = (updatedFormData as any)[field];
        if (fileData && fileData.file) {
           (updatedFormData as any)[field] = await uploadFileToS3(fileData);
        }
      }

      // 2. Save profile
      const res = await saveCandidateProfile(updatedFormData, isDraft);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.error || "Failed to save profile");
      }
    } catch (e: any) {
      alert("Error saving profile: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSaveAction(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveAction(false);
  };

  const tabs = [
    { id: "pribadi", label: "Data Pribadi", icon: User },
    { id: "kontak", label: "Kontak", icon: Mail },
    { id: "pendidikan", label: "Pendidikan", icon: BookOpen },
    { id: "dokumen", label: "Dokumen", icon: FileCheck },
  ] as const;

  if (isLoadingData) {
    return <div className="flex justify-center py-20 text-primary"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">My Profile</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Complete your profile to apply for jobs.
        </p>
      </div>

      {/* Privacy Banner Widget */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 md:p-5 flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-blue-900 mb-1 tracking-tight">Komitmen Keamanan Data</h3>
          <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
            Seluruh informasi dan dokumen yang Anda lengkapi pada profil ini dijamin kerahasiaannya. Data Anda dilindungi oleh standar keamanan kami dan <strong>hanya digunakan secara eksklusif untuk keperluan proses rekrutmen</strong>.
          </p>
        </div>
      </div>

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
                  ${isActive 
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
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Lengkap (Sesuai KTP) <span className="text-status-error">*</span></label>
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
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tempat Lahir <span className="text-status-error">*</span></label>
                <input
                  type="text"
                  value={formData.birthPlace}
                  onChange={(e) => handleInputChange("birthPlace", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Tempat lahir"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tanggal Lahir <span className="text-status-error">*</span></label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Gender <span className="text-status-error">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="Pria" checked={formData.gender === "Pria"} onChange={(e) => handleInputChange("gender", e.target.value)} className="w-4 h-4 text-primary" required />
                    <span className="text-sm font-bold text-black">Pria</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="Wanita" checked={formData.gender === "Wanita"} onChange={(e) => handleInputChange("gender", e.target.value)} className="w-4 h-4 text-primary" required />
                    <span className="text-sm font-bold text-black">Wanita</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Agama <span className="text-status-error">*</span></label>
                <select
                  value={formData.religion}
                  onChange={(e) => handleInputChange("religion", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Status Pernikahan <span className="text-status-error">*</span></label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="maritalStatus" value="Lajang" checked={formData.maritalStatus === "Lajang"} onChange={(e) => handleInputChange("maritalStatus", e.target.value)} className="w-4 h-4 text-primary" required />
                    <span className="text-sm font-bold text-black">Lajang</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="maritalStatus" value="Menikah" checked={formData.maritalStatus === "Menikah"} onChange={(e) => handleInputChange("maritalStatus", e.target.value)} className="w-4 h-4 text-primary" required />
                    <span className="text-sm font-bold text-black">Menikah</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="maritalStatus" value="Cerai" checked={formData.maritalStatus === "Cerai"} onChange={(e) => handleInputChange("maritalStatus", e.target.value)} className="w-4 h-4 text-primary" required />
                    <span className="text-sm font-bold text-black">Cerai</span>
                  </label>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No NIK <span className="text-status-error">*</span></label>
                  <input
                    type="number"
                    value={formData.nik}
                    onChange={(e) => handleInputChange("nik", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="16 Digit NIK"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No KK <span className="text-status-error">*</span></label>
                  <input
                    type="number"
                    value={formData.kk}
                    onChange={(e) => handleInputChange("kk", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="16 Digit No KK"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Kontak */}
          {activeTab === "kontak" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Email (Read-only) <span className="text-status-error">*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-table-border rounded-xl text-sm font-bold text-on-surface outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No Telepon (WhatsApp) <span className="text-status-error">*</span></label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="08..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No Telepon Darurat <span className="text-status-error">*</span></label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="08..."
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Alamat Domisili (Sesuai KTP) <span className="text-status-error">*</span></label>
                <textarea
                  value={formData.domicileAddress}
                  onChange={(e) => handleInputChange("domicileAddress", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Alamat lengkap sesuai KTP"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Alamat Saat Ini <span className="text-status-error">*</span></label>
                <textarea
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Alamat tempat tinggal saat ini"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Provinsi <span className="text-status-error">*</span></label>
                <SearchableSelect
                  options={provinces.map(p => ({ label: p.name, value: p.name }))}
                  value={formData.province}
                  onChange={(val) => {
                    handleInputChange("province", val)
                    // Reset city when province changes to ensure consistency
                    handleInputChange("city", "")
                  }}
                  placeholder="Pilih Provinsi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Kota / Kabupaten <span className="text-status-error">*</span></label>
                <SearchableSelect
                  // If province is selected, we can filter cities, but here cities have provinceId so we map accordingly
                  options={cities
                    .filter(c => !formData.province || c.province?.name === formData.province)
                    .map(c => ({ label: c.name, value: c.name }))}
                  value={formData.city}
                  onChange={(val) => handleInputChange("city", val)}
                  placeholder="Pilih Kota / Kabupaten"
                />
              </div>
            </div>
          )}

          {/* Tab Content: Pendidikan */}
          {activeTab === "pendidikan" && (
            <div className="grid grid-cols-1 gap-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Pendidikan Terakhir <span className="text-status-error">*</span></label>
                <SearchableSelect
                  options={EDUCATION_TYPES.map(type => ({ label: type, value: type }))}
                  value={formData.educationType}
                  onChange={(val) => {
                    handleInputChange("educationType", val);
                    handleInputChange("latestEducation", "");
                    handleInputChange("educationInstitution", "");
                  }}
                  placeholder="Pilih Jenis Pendidikan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tingkat Pendidikan <span className="text-status-error">*</span></label>
                <SearchableSelect
                  disabled={!formData.educationType}
                  options={[
                    ...(formData.educationType === "Perguruan Tinggi" ? [
                      { label: "Diploma 3 (D3)", value: "D3" },
                      { label: "Diploma 4 (D4)", value: "D4" },
                      { label: "Sarjana (S1)", value: "S1" },
                      { label: "Magister (S2)", value: "S2" },
                      { label: "Doktor (S3)", value: "S3" },
                    ] : []),
                    ...(formData.educationType === "SLTA" ? [{ label: "SMA/SMK/Sederajat", value: "SMA/SMK" }] : []),
                    ...(formData.educationType === "SLTP" ? [{ label: "SMP/Sederajat", value: "SMP" }] : []),
                    ...(formData.educationType === "SD" ? [{ label: "SD/Sederajat", value: "SD" }] : []),
                  ]}
                  value={formData.latestEducation}
                  onChange={(val) => handleInputChange("latestEducation", val)}
                  placeholder="Pilih Tingkat Pendidikan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Institusi Pendidikan <span className="text-status-error">*</span></label>
                <SearchableSelect
                  disabled={!formData.educationType}
                  creatable={true}
                  options={institutes
                    .filter(i => i.type === formData.educationType)
                    .map(i => ({ label: i.name, value: i.name }))}
                  value={formData.educationInstitution}
                  onChange={(val) => handleInputChange("educationInstitution", val)}
                  placeholder="Pilih Nama Institusi (Atau ketik dan tekan Enter untuk Add Baru)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Training Center (Opsional)</label>
                <SearchableSelect
                  options={TRAINING_CENTER_TYPES.map(type => ({ label: type, value: type }))}
                  value={formData.trainingCenterType}
                  onChange={(val) => {
                    handleInputChange("trainingCenterType", val);
                    handleInputChange("trainingCenter", "");
                  }}
                  placeholder="Pilih Jenis Training Center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Training Center</label>
                <SearchableSelect
                  disabled={!formData.trainingCenterType}
                  creatable={true}
                  options={institutes
                    .filter(i => i.type === formData.trainingCenterType)
                    .map(i => ({ label: i.name, value: i.name }))}
                  value={formData.trainingCenter}
                  onChange={(val) => handleInputChange("trainingCenter", val)}
                  placeholder="Pilih Training Center (Atau ketik dan tekan Enter untuk Add Baru)"
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
                  onDelete={() => handleDeleteDocument("fileCv", "cv")}
                  onPreview={() => handlePreviewDocument("fileCv")}
                />
                <FileUpload
                  label="Ijazah Terakhir"
                  value={formData.fileIjazah}
                  onChange={(file) => handleInputChange("fileIjazah", file)}
                  onDelete={() => handleDeleteDocument("fileIjazah", "ijazah")}
                  onPreview={() => handlePreviewDocument("fileIjazah")}
                />
                <FileUpload
                  label="Kartu Tanda Penduduk (KTP)"
                  value={formData.fileKtp}
                  onChange={(file) => handleInputChange("fileKtp", file)}
                  onDelete={() => handleDeleteDocument("fileKtp", "ktp")}
                  onPreview={() => handlePreviewDocument("fileKtp")}
                />
                <FileUpload
                  label="Kartu Keluarga (KK)"
                  value={formData.fileKk}
                  onChange={(file) => handleInputChange("fileKk", file)}
                  onDelete={() => handleDeleteDocument("fileKk", "kk")}
                  onPreview={() => handlePreviewDocument("fileKk")}
                />
                <FileUpload
                  label="Sertifikat / Dokumen Pendukung"
                  value={formData.fileSertifikat}
                  onChange={(file) => handleInputChange("fileSertifikat", file)}
                  onDelete={() => handleDeleteDocument("fileSertifikat", "sertifikat")}
                  onPreview={() => handlePreviewDocument("fileSertifikat")}
                />
                <FileUpload
                  label="Pas Photo"
                  value={formData.filePhoto}
                  onChange={(file) => handleInputChange("filePhoto", file)}
                  onDelete={() => handleDeleteDocument("filePhoto", "photo")}
                  onPreview={() => handlePreviewDocument("filePhoto")}
                  accept=".png,.jpg,.jpeg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-surface-container-lowest border-t border-table-border flex items-center justify-between">
          <div className="flex gap-2">
             {/* Progress Indicator Dots could go here, but simple text is fine */}
             <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:block">
               {activeTab === "pribadi" ? "Step 1 of 4" : activeTab === "kontak" ? "Step 2 of 4" : activeTab === "pendidikan" ? "Step 3 of 4" : "Step 4 of 4"}
             </span>
          </div>
          
          <div className="flex items-center gap-4">
            {saveSuccess && (
              <span className="text-sm font-bold text-status-success flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Saved successfully
              </span>
            )}
            
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-2.5 bg-surface-container-high text-on-surface border border-outline-variant rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container-highest transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
