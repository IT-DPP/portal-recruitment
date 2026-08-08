"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, BookOpen, FileCheck, Save, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import { MASTER_BLK_LPK } from "@/lib/masterData";

type TabValue = "pribadi" | "kontak" | "pendidikan" | "dokumen";

export default function AddTalentPoolPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("pribadi");
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedBlk, setSelectedBlk] = useState("");
  const [masterBlkLpk, setMasterBlkLpk] = useState<any[]>([]);

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
    latestEducation: "",
    educationInstitution: "",
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
    let currentMasterBlk = MASTER_BLK_LPK;
    const savedBlk = localStorage.getItem('ugz_master_blk_lpk');
    if (savedBlk) {
      currentMasterBlk = JSON.parse(savedBlk);
    }
    setMasterBlkLpk(currentMasterBlk);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      const allProfilesStr = localStorage.getItem("ugz_candidate_profiles");
      const allProfiles = allProfilesStr ? JSON.parse(allProfilesStr) : {};
      
      const generateId = () => {
        return 'tp-' + Math.random().toString(36).substr(2, 9);
      };
      
      const newCandidateId = generateId();
      
      allProfiles[newCandidateId] = {
        ...formData,
        isTalentPool: true, // Flag special untuk membedakan recruiter input vs self-registration
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem("ugz_candidate_profiles", JSON.stringify(allProfiles));
      setIsSaving(false);
      
      router.push("/dashboard/talent-pool");
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
        <Link href="/dashboard/talent-pool" className="text-primary font-semibold text-sm flex items-center gap-1 mb-4 hover:underline">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Talent Pool
        </Link>
        <h2 className="text-2xl font-bold text-primary tracking-tight">Add Talent Pool Candidate</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Tambahkan profil kandidat ke dalam sistem secara manual.
        </p>
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
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Gender</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="Pria" checked={formData.gender === "Pria"} onChange={(e) => handleInputChange("gender", e.target.value)} className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-black">Pria</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="Wanita" checked={formData.gender === "Wanita"} onChange={(e) => handleInputChange("gender", e.target.value)} className="w-4 h-4 text-primary" />
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Status Pernikahan</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="maritalStatus" value="Single" checked={formData.maritalStatus === "Single"} onChange={(e) => handleInputChange("maritalStatus", e.target.value)} className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-black">Single</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="maritalStatus" value="Menikah" checked={formData.maritalStatus === "Menikah"} onChange={(e) => handleInputChange("maritalStatus", e.target.value)} className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-black">Menikah</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="maritalStatus" value="Lainnya" checked={!["Single", "Menikah", ""].includes(formData.maritalStatus)} onChange={() => handleInputChange("maritalStatus", "Lainnya")} className="w-4 h-4 text-primary" />
                    <input 
                      type="text"
                      placeholder="Lainnya..."
                      value={!["Single", "Menikah", ""].includes(formData.maritalStatus) ? formData.maritalStatus : ""}
                      onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                      className="px-3 py-1 bg-surface-bright border border-outline-variant rounded text-sm font-bold text-black focus:border-primary outline-none"
                    />
                  </div>
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
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">No KK</label>
                  <input
                    type="number"
                    value={formData.kk}
                    onChange={(e) => handleInputChange("kk", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Email <span className="text-status-error">*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="email@example.com"
                  required
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
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Alamat lengkap sesuai KTP"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Alamat Saat Ini</label>
                <textarea
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Alamat tempat tinggal saat ini"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Provinsi</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Provinsi (Ketik manual)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Kota / Kabupaten (Ketik manual)"
                />
              </div>
            </div>
          )}

          {/* Tab Content: Pendidikan */}
          {activeTab === "pendidikan" && (
            <div className="grid grid-cols-1 gap-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Pendidikan Terakhir</label>
                <select
                  value={formData.latestEducation}
                  onChange={(e) => handleInputChange("latestEducation", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">Pilih Pendidikan Terakhir</option>
                  <option value="SMA/SMK">SMA/SMK/Sederajat</option>
                  <option value="D3">Diploma 3 (D3)</option>
                  <option value="D4">Diploma 4 (D4)</option>
                  <option value="S1">Sarjana (S1)</option>
                  <option value="S2">Magister (S2)</option>
                  <option value="S3">Doktor (S3)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Nama Institusi Pendidikan</label>
                <input
                  type="text"
                  value={formData.educationInstitution}
                  onChange={(e) => handleInputChange("educationInstitution", e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Contoh: Universitas Indonesia / SMKN 1 Jakarta"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Training Center (BLK/LPK)</label>
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
                >
                  <option value="">Pilih Training Center (Opsional)</option>
                  {masterBlkLpk.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                  <option value="Other">Lainnya (Ketik Manual)</option>
                </select>
                
                {selectedBlk === "Other" && (
                  <input
                    type="text"
                    value={formData.trainingCenter}
                    onChange={(e) => handleInputChange("trainingCenter", e.target.value)}
                    className="w-full px-4 py-2.5 mt-2 bg-surface-bright border border-outline-variant rounded-xl text-sm font-bold text-black focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Isi nama BLK/LPK..."
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
             <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:block">
               {activeTab === "pribadi" ? "Step 1 of 4" : activeTab === "kontak" ? "Step 2 of 4" : activeTab === "pendidikan" ? "Step 3 of 4" : "Step 4 of 4"}
             </span>
          </div>
          
          <div className="flex items-center gap-4">
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
                  <Save className="w-4 h-4" /> Save Candidate to Pool
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
