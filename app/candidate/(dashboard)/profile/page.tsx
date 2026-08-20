"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, BookOpen, FileCheck, Save, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { MASTER_INSTITUTE, EDUCATION_TYPES, TRAINING_CENTER_TYPES, type Institute } from "@/lib/masterData";

type TabValue = "pribadi" | "kontak" | "pendidikan" | "dokumen";

export default function CandidateProfilePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("pribadi");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedBlk, setSelectedBlk] = useState("");
  const [masterInstitute, setMasterInstitute] = useState<Institute[]>([]);
  

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
    // Load Master Data
    let currentMasterInst = MASTER_INSTITUTE;
    const savedInst = localStorage.getItem('ugz_master_institute');
    if (savedInst) {
      currentMasterInst = JSON.parse(savedInst);
    }
    setMasterInstitute(currentMasterInst);

    // Load existing profile and email on mount
    const sessionStr = localStorage.getItem("nexus_candidate_session");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setFormData((prev) => ({ ...prev, email: session.email }));
      
      const allProfilesStr = localStorage.getItem("ugz_candidate_profiles");
      if (allProfilesStr) {
        const allProfiles = JSON.parse(allProfilesStr);
        const myProfile = allProfiles[session.id];
        if (myProfile) {
          setFormData((prev) => ({ ...prev, ...myProfile }));
          if (myProfile.trainingCenter) {
            const isMaster = currentMasterInst.some((b: any) => b.name === myProfile.trainingCenter);
            if (isMaster) {
              setSelectedBlk(myProfile.trainingCenter);
            } else {
              setSelectedBlk("Other");
            }
          }
        }
      }
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSave(e as unknown as React.FormEvent);
  };

  const handleSave = (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    setTimeout(() => {
      const sessionStr = localStorage.getItem("nexus_candidate_session");
      if (!sessionStr) return;
      const session = JSON.parse(sessionStr);
      
      const allProfilesStr = localStorage.getItem("ugz_candidate_profiles");
      const allProfiles = allProfilesStr ? JSON.parse(allProfilesStr) : {};
      
      allProfiles[session.id] = formData;
      localStorage.setItem("ugz_candidate_profiles", JSON.stringify(allProfiles));
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const tabs = [
    { id: "pribadi", label: "Data Pribadi", icon: User },
    { id: "kontak", label: "Kontak", icon: Mail },
    { id: "pendidikan", label: "Pendidikan", icon: BookOpen },
    { id: "dokumen", label: "Dokumen", icon: FileCheck },
  ] as const;

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
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Provinsi (Ketik manual)"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Kota / Kabupaten <span className="text-status-error">*</span></label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Kota / Kabupaten (Ketik manual)"
                  required
                />
              </div>
            </div>
          )}

          {/* Tab Content: Pendidikan */}
          {activeTab === "pendidikan" && (
            <div className="grid grid-cols-1 gap-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Pendidikan Terakhir <span className="text-status-error">*</span></label>
                <select
                  value={formData.educationType}
                  onChange={(e) => {
                    handleInputChange("educationType", e.target.value);
                    handleInputChange("latestEducation", "");
                    handleInputChange("educationInstitution", "");
                  }}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Pilih Jenis Pendidikan</option>
                  {EDUCATION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Tingkat Pendidikan <span className="text-status-error">*</span></label>
                <select
                  value={formData.latestEducation}
                  onChange={(e) => handleInputChange("latestEducation", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
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
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Institusi Pendidikan <span className="text-status-error">*</span></label>
                <select
                  value={
                    formData.educationInstitution && masterInstitute.some(i => i.name === formData.educationInstitution && i.type === formData.educationType) 
                      ? formData.educationInstitution 
                      : (formData.educationInstitution ? "Other" : "")
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== "Other") {
                      handleInputChange("educationInstitution", val);
                    } else {
                      handleInputChange("educationInstitution", "");
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                  disabled={!formData.educationType}
                >
                  <option value="">Pilih Nama Institusi</option>
                  {masterInstitute.filter(i => i.type === formData.educationType).map((inst) => (
                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                  ))}
                  <option value="Other">Lainnya (Ketik Manual)</option>
                </select>
                
                {formData.educationInstitution && !masterInstitute.some(i => i.name === formData.educationInstitution && i.type === formData.educationType) && (
                  <input
                    type="text"
                    value={formData.educationInstitution}
                    onChange={(e) => handleInputChange("educationInstitution", e.target.value)}
                    className="w-full px-4 py-2.5 mt-2 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Isi nama institusi pendidikan..."
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Jenis Training Center (Opsional)</label>
                <select
                  value={formData.trainingCenterType}
                  onChange={(e) => {
                    handleInputChange("trainingCenterType", e.target.value);
                    handleInputChange("trainingCenter", "");
                    setSelectedBlk("");
                  }}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Pilih Jenis Training Center</option>
                  {TRAINING_CENTER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Training Center</label>
                <select
                  value={selectedBlk}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBlk(val);
                    if (val !== "Other") {
                      handleInputChange("trainingCenter", val);
                    } else {
                      handleInputChange("trainingCenter", "");
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  disabled={!formData.trainingCenterType}
                >
                  <option value="">Pilih Training Center</option>
                  {masterInstitute.filter(i => i.type === formData.trainingCenterType).map((inst) => (
                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                  ))}
                  <option value="Other">Lainnya (Ketik Manual)</option>
                </select>
                
                {selectedBlk === "Other" && (
                  <input
                    type="text"
                    value={formData.trainingCenter}
                    onChange={(e) => handleInputChange("trainingCenter", e.target.value)}
                    className="w-full px-4 py-2.5 mt-2 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Isi nama Training Center..."
                  />
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Dokumen */}
          {activeTab === "dokumen" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-3">
                <div className="w-5 h-5 shrink-0 bg-blue-200 text-blue-600 rounded-full flex items-center justify-center font-bold font-mono">i</div>
                <p>
                  <strong>Development Mode:</strong> File size is strictly limited to <strong>500KB per file</strong> to prevent browser storage overload. In production, this will be increased to 5MB. 
                  Supported formats: PDF, PNG, JPG, JPEG.
                </p>
              </div>

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
