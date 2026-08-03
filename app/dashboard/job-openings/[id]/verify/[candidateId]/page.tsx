"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Download, Printer, Search, AlertCircle, Save, CheckCircle } from "lucide-react";

export default function AdvancedDocumentVerificationPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  
  const [job, setJob] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);

  // BNSP Form State
  const [skema, setSkema] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [certNumber, setCertNumber] = useState("");

  const [activeDocTab, setActiveDocTab] = useState("KTP");
  const [failureReason, setFailureReason] = useState("");

  useEffect(() => {
    // Load Job
    const allJobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    const foundJob = allJobs.find((j: any) => j.id === unwrappedParams.id);
    if (foundJob) setJob(foundJob);

    // Load Profile
    const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    const foundProfile = profiles[unwrappedParams.candidateId];
    if (foundProfile) setProfile(foundProfile);

    // Load Application
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const foundApp = allApps.find(
      (a: any) => a.jobId === unwrappedParams.id && a.candidateId === unwrappedParams.candidateId
    );
    
    if (foundApp) {
      setApplication(foundApp);
      if (foundApp.bnspValidation) {
        setSkema(foundApp.bnspValidation.skema || "");
        setIssueDate(foundApp.bnspValidation.issueDate || "");
        setExpiryDate(foundApp.bnspValidation.expiryDate || "");
        setCertNumber(foundApp.bnspValidation.certNumber || "");
      }
    }
  }, [unwrappedParams.id, unwrappedParams.candidateId]);

  if (!job || !profile || !application) {
    return <div className="p-8 text-center">Loading verification data...</div>;
  }

  const handleSaveDraft = () => {
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    
    if (appIndex !== -1) {
      allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber };
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
      window.alert("Draft saved successfully.");
    }
  };

  const handleFailed = () => {
    if (!failureReason) {
      window.alert("Silakan pilih alasan kegagalan (Reason for Failure) terlebih dahulu.");
      return;
    }
    
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    
    if (appIndex !== -1) {
      // Archive candidate and mark as rejected
      allApps[appIndex].currentStage = "Rejected";
      if (!allApps[appIndex].history) allApps[appIndex].history = [];
      allApps[appIndex].history.push({
        stageId: "Rejected",
        stageName: "Rejected (Failed Verification)",
        date: new Date().toISOString(),
        note: `Reason: ${failureReason}`
      });
      
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
      window.alert("Kandidat berhasil ditolak (Rejected) dan diarsipkan.");
      router.push(`/dashboard/job-openings/${job.id}`);
    }
  };

  const handleApproveAll = () => {
    handleSaveDraft();
    window.alert("All verification approved. Returning to Pipeline.");
    router.push(`/dashboard/job-openings/${job.id}`);
  };

  const renderDocumentPreview = () => {
    let fileData = null;
    let fileName = "";
    
    switch (activeDocTab) {
      case "KTP": fileData = profile.fileKtp; fileName = "KTP"; break;
      case "CV": fileData = profile.fileCv; fileName = "CV"; break;
      case "Ijazah": fileData = profile.fileIjazah; fileName = "Ijazah"; break;
      case "KK": fileData = profile.fileKk; fileName = "Kartu Keluarga"; break;
      case "Pas Foto": fileData = profile.filePhoto; fileName = "Pas Foto"; break;
      case "Sertifikat BNSP": fileData = profile.fileSertifikat; fileName = "Sertifikat"; break;
    }

    if (!fileData || !fileData.base64) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-lowest rounded-xl border-2 border-dashed border-outline-variant mt-4">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">Dokumen {fileName} tidak diunggah oleh kandidat.</p>
        </div>
      );
    }

    const isPdf = fileData.base64.startsWith("data:application/pdf");

    return (
      <div className="mt-4 border border-table-border rounded-xl bg-surface-container-lowest overflow-hidden h-[500px] flex flex-col relative">
        <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/80 p-1.5 rounded-lg backdrop-blur-sm border border-outline-variant/30 shadow-sm">
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Search className="w-4 h-4 text-black" /></button>
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Download className="w-4 h-4 text-black" /></button>
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Printer className="w-4 h-4 text-black" /></button>
        </div>
        
        {isPdf ? (
          <iframe src={fileData.base64} className="w-full h-full border-none bg-white" title={fileName} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileData.base64} alt={fileName} className="max-w-full max-h-full object-contain shadow-sm border border-outline-variant/30 rounded" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] -m-8 p-8 font-sans text-black">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 border-b border-table-border pb-4">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reviewing Candidate</p>
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            {profile.fullName} <span className="text-on-surface-variant font-normal">—</span> {job.posisi}
          </h2>
        </div>
        
        <div className="flex gap-3 items-center">
          <select 
            className="border border-outline-variant rounded-lg px-4 py-2 text-sm bg-white focus:ring-1 focus:ring-primary outline-none"
            value={failureReason}
            onChange={(e) => setFailureReason(e.target.value)}
          >
            <option value="">Reason for Failure</option>
            <option value="Incomplete Documents">Incomplete Documents</option>
            <option value="Fake Documents Detected">Fake Documents Detected</option>
            <option value="Does Not Meet Requirements">Does Not Meet Requirements</option>
          </select>
          
          <button onClick={handleFailed} className="px-5 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-semibold rounded-lg text-sm transition-colors">
            Failed
          </button>
          <button onClick={handleSaveDraft} className="px-5 py-2 border border-outline-variant text-black bg-white hover:bg-surface-container-low font-semibold rounded-lg text-sm transition-colors">
            Save Draft
          </button>
          <button onClick={handleApproveAll} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2">
            Approve All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumbs & Title */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-on-surface-variant mb-2">
          <button onClick={() => router.push(`/dashboard/job-openings/${job.id}`)} className="hover:text-primary transition-colors">Verification</button>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-black font-semibold">Document Validation Workflow</span>
        </div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Advanced Document Verification</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6 flex flex-col">
          
          {/* Section 1: Sertifikat BNSP Validation */}
          <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
            <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Sertifikat BNSP Validation
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Certificate Preview Thumbnail */}
              <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/60 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] relative group overflow-hidden">
                {profile.fileSertifikat?.base64 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.fileSertifikat.base64} alt="Sertifikat" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-semibold text-sm bg-black/50 px-4 py-2 rounded-lg">View Full Size</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-on-surface-variant">No Certificate Uploaded</p>
                )}
              </div>
              
              {/* BNSP Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Skema Sertifikasi (Certification Scheme)</label>
                  <input 
                    type="text" 
                    value={skema}
                    onChange={(e) => setSkema(e.target.value)}
                    placeholder="e.g. Senior Mechanical Engineer..."
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Issue Date (Tanggal Keluar)</label>
                    <input 
                      type="date" 
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Expiry Date (Tanggal Habis)</label>
                    <input 
                      type="date" 
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Certificate Number</label>
                  <input 
                    type="text" 
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    placeholder="e.g. CERT-BNSP-88291-ME"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-600">
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden mr-4">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: skema && issueDate && expiryDate && certNumber ? '100%' : skema || certNumber ? '50%' : '0%' }}></div>
                  </div>
                  {skema && issueDate && expiryDate && certNumber ? '100% Verified' : 'Pending Verification'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Candidate Personal Data */}
          <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600" /> 2. Candidate Personal Data
              </h3>
              <button className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                Edit Data
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Full Name (KTP)</p>
                <p className="text-sm font-semibold text-black">{profile.fullName || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">POB / DOB</p>
                <p className="text-sm font-semibold text-black">{profile.birthPlace || "-"}, {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Domicile Address</p>
                <p className="text-sm font-semibold text-black">{profile.domicileAddress || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-semibold text-black">{profile.email || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">WhatsApp / Phone</p>
                <p className="text-sm font-semibold text-black">{profile.whatsapp || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">NIK (ID Number)</p>
                <p className="text-sm font-semibold font-mono text-black">{profile.nik || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">KK (Family Card)</p>
                <p className="text-sm font-semibold font-mono text-black">{profile.kk || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Gender / Religion</p>
                <p className="text-sm font-semibold text-black">{profile.gender || "-"} / {profile.religion || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status</p>
                <p className="text-sm font-semibold text-black">{profile.maritalStatus || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Last Education</p>
                <p className="text-sm font-semibold text-black">{profile.latestEducation || "-"} - {profile.educationInstitution || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Training Center (BLK/LPK)</p>
                <p className="text-sm font-semibold text-black">{profile.trainingCenter || "-"}</p>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Right Column: Document Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex flex-col h-full min-h-[600px]">
          <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-4 shrink-0">
            <FileText className="w-5 h-5 text-blue-600" /> Document Preview
          </h3>
          
          {/* Custom Tabs */}
          <div className="flex border-b border-table-border overflow-x-auto scrollbar-hide shrink-0">
            {["KTP", "CV", "Ijazah", "KK", "Pas Foto", "Sertifikat BNSP"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDocTab(tab)}
                className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                  activeDocTab === tab 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-on-surface-variant hover:text-black hover:bg-surface-container-lowest"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Viewer */}
          <div className="flex-1 flex flex-col min-h-0">
            {renderDocumentPreview()}
          </div>
        </div>

      </div>
    </div>
  );
}

// Ensure UserIcon is imported since it's used
import { User as UserIcon } from "lucide-react";
