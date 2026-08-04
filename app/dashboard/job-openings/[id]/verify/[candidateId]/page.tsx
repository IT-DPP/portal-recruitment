"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Download, Printer, Search, AlertCircle, Save, CheckCircle, Ban, ArrowRight, ArrowLeft } from "lucide-react";
import { MASTER_SKEMA_SERTIFIKASI, MASTER_REJECTION_MESSAGE } from "@/lib/masterData";

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
  const [isApproved, setIsApproved] = useState(false);
  const [masterSkema, setMasterSkema] = useState<any[]>([]);

  // HR Interview Form State
  const [interviewResult, setInterviewResult] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [interviewFile, setInterviewFile] = useState<{name: string, base64: string, type: string} | null>(null);

  const [activeDocTab, setActiveDocTab] = useState("KTP");
  const [failureReason, setFailureReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [masterRejection, setMasterRejection] = useState<any[]>([]);

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
        setIsApproved(foundApp.bnspValidation.isApproved || false);
      }
      if (foundApp.hrInterview) {
        setInterviewResult(foundApp.hrInterview.result || "");
        setInterviewDate(foundApp.hrInterview.date || "");
        setInterviewFeedback(foundApp.hrInterview.feedback || "");
        setInterviewFile(foundApp.hrInterview.file || null);
      }
    }

    // Load Master Skema
    const savedSkema = localStorage.getItem('ugz_master_skema_sertifikasi');
    if (savedSkema) {
      setMasterSkema(JSON.parse(savedSkema));
    } else {
      setMasterSkema(MASTER_SKEMA_SERTIFIKASI);
    }

    // Load Master Rejection
    const savedRejection = localStorage.getItem('ugz_master_rejection_message');
    if (savedRejection) {
      setMasterRejection(JSON.parse(savedRejection));
    } else {
      setMasterRejection(MASTER_REJECTION_MESSAGE);
    }
  }, [unwrappedParams.id, unwrappedParams.candidateId]);

  if (!job || !profile || !application) {
    return <div className="p-8 text-center">Loading verification data...</div>;
  }

  const currentStageName = job.timeline?.find((t: any) => t.id === application.currentStage)?.title || application.currentStage;
  const isAdministration = application.currentStage === "stage_1" || currentStageName.toLowerCase().includes("administration");
  const isHrInterview = application.currentStage === "stage_2" || currentStageName.toLowerCase().includes("hr interview");

  const handleSaveDraftSilent = () => {
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    if (appIndex !== -1) {
      if (isAdministration) {
        allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved };
      } else if (isHrInterview) {
        allApps[appIndex].hrInterview = { result: interviewResult, date: interviewDate, feedback: interviewFeedback, file: interviewFile };
      }
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
    }
  };

  const handleToggleApprove = () => {
    const newIsApproved = !isApproved;
    setIsApproved(newIsApproved);

    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    
    if (appIndex !== -1) {
      if (isAdministration) {
        allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved: newIsApproved };
      }
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
    }
  };

  const handleDraftMark = () => {
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    if (appIndex !== -1) {
      if (isAdministration) {
        allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved };
      } else if (isHrInterview) {
        allApps[appIndex].hrInterview = { result: interviewResult, date: interviewDate, feedback: interviewFeedback, file: interviewFile };
      }
      allApps[appIndex].isDraft = true;
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
      window.alert("Saved as Draft successfully.");
      router.push(`/dashboard/job-openings/${job.id}`);
    }
  };

  const handleApproveNextStage = () => {
    handleSaveDraftSilent();
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    if (appIndex !== -1) {
      const app = allApps[appIndex];
      const currentIndex = job.timeline.findIndex((t: any) => t.id === app.currentStage);
      
      if (currentIndex !== -1 && currentIndex + 1 < job.timeline.length) {
        const nextStage = job.timeline[currentIndex + 1];
        app.currentStage = nextStage.id;
        app.isDraft = false; // Remove draft if approved
        if (!app.history) app.history = [];
        app.history.push({
          stageId: nextStage.id,
          stageName: nextStage.title,
          date: new Date().toISOString(),
          note: "Approved to next stage"
        });
        localStorage.setItem("ugz_applications", JSON.stringify(allApps));
        window.alert(`Candidate approved and moved to ${nextStage.title}.`);
        router.push(`/dashboard/job-openings/${job.id}`);
      } else {
        window.alert("Candidate is already at the last stage.");
      }
    }
  };

  const handleRejectCandidate = () => {
    if (!failureReason) return;
    
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    
    if (appIndex !== -1) {
      const app = allApps[appIndex];
      const stageName = job.timeline.find((t: any) => t.id === app.currentStage)?.title || app.currentStage;
      
      app.currentStage = "Rejected";
      app.isDraft = false;
      if (!app.history) app.history = [];
      app.history.push({
        stageId: "Rejected",
        stageName: `Rejected at ${stageName}`,
        date: new Date().toISOString(),
        note: `Reason: ${failureReason}`
      });
      
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
      window.alert("Kandidat berhasil ditolak (Rejected) dan diarsipkan.");
      router.push(`/dashboard/job-openings/${job.id}`);
    }
  };

  const handleApproveAll = () => {
    handleSaveDraftSilent();
    window.alert("All verification approved. Returning to Pipeline.");
    router.push(`/dashboard/job-openings/${job.id}`);
  };

  const handleInterviewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      window.alert("Format file tidak didukung. Harap unggah PDF, PNG, atau JPG.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setInterviewFile({
        name: file.name,
        base64: event.target?.result as string,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
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
    const isImage = fileData.base64.startsWith("data:image/");

    return (
      <div className="mt-4 border border-table-border rounded-xl bg-surface-container-lowest overflow-hidden h-[500px] flex flex-col relative">
        <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/80 p-1.5 rounded-lg backdrop-blur-sm border border-outline-variant/30 shadow-sm">
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Search className="w-4 h-4 text-black" /></button>
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Download className="w-4 h-4 text-black" /></button>
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Printer className="w-4 h-4 text-black" /></button>
        </div>
        
        {isPdf ? (
          <iframe src={fileData.base64} className="w-full h-full border-none bg-white" title={fileName} />
        ) : isImage ? (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileData.base64} alt={fileName} className="max-w-full max-h-full object-contain shadow-sm border border-outline-variant/30 rounded" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-4">
             <p className="text-sm text-on-surface-variant font-medium">Format file tidak didukung untuk preview langsung.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] -m-8 p-8 font-sans text-black">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 border-b border-table-border pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/dashboard/job-openings/${job.id}`)}
            className="p-2 bg-white border border-table-border rounded-lg hover:bg-surface-container-low transition-colors"
            title="Back to Pipeline"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reviewing Candidate</p>
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              {profile.fullName} <span className="text-on-surface-variant font-normal">—</span> {job.posisi}
            </h2>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <button onClick={() => setShowRejectModal(true)} className="px-5 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5">
            <Ban className="w-4 h-4" /> Reject
          </button>
          <button onClick={handleApproveNextStage} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5">
            Approve <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={handleDraftMark} className="px-5 py-2 border border-outline-variant text-black bg-white hover:bg-surface-container-low font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5">
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button onClick={handleApproveAll} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5">
            Approve All <CheckCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumbs & Title */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-on-surface-variant mb-2">
          <button onClick={() => router.push(`/dashboard/job-openings/${job.id}`)} className="hover:text-primary transition-colors">Verification</button>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-black font-semibold">{currentStageName} Workflow</span>
        </div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          {isAdministration ? "Advanced Document Verification" : `${currentStageName} Verification`}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6 flex flex-col">
          
          {/* Section 1: Dynamic based on Stage */}
          {isAdministration ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Sertifikat BNSP Validation
              </h3>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Certificate Preview Thumbnail */}
                <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/60 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] relative group overflow-hidden">
                  {profile.fileSertifikat?.base64 ? (
                    <>
                      {profile.fileSertifikat.base64.startsWith("data:application/pdf") ? (
                        <iframe src={profile.fileSertifikat.base64} className="w-full h-full border-none opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" title="Sertifikat PDF" />
                      ) : profile.fileSertifikat.base64.startsWith("data:image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.fileSertifikat.base64} alt="Sertifikat" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                         <p className="text-sm text-on-surface-variant text-center">Format tidak didukung<br/><span className="text-xs">Hanya PDF/Image</span></p>
                      )}
                      <div 
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => setActiveDocTab("Sertifikat BNSP")}
                      >
                        <span className="text-white font-semibold text-sm bg-black/50 px-4 py-2 rounded-lg">View in Main Viewer</span>
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
                    <select 
                      value={skema}
                      onChange={(e) => setSkema(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                    >
                      <option value="">Pilih Skema Sertifikasi...</option>
                      {masterSkema.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
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

                  <button
                    type="button"
                    onClick={handleToggleApprove}
                    className={`w-full mt-2 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors border ${
                      isApproved 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    {isApproved && <CheckCircle className="w-5 h-5" />}
                    {isApproved ? 'BNSP Valid (Approved)' : 'Mark as Approved'}
                  </button>
                </div>
              </div>
            </div>
          ) : isHrInterview ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Interview Assessment (HR)
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Result Status</label>
                    <select 
                      value={interviewResult}
                      onChange={(e) => setInterviewResult(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                    >
                      <option value="">Pilih Status...</option>
                      <option value="Competent">Competent</option>
                      <option value="Not Interest">Not Interest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Interview</label>
                    <input 
                      type="date" 
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Interviewer Feedback</label>
                  <textarea 
                    value={interviewFeedback}
                    onChange={(e) => setInterviewFeedback(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan catatan atau feedback dari proses interview..."
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Upload Bukti Interview HR</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer px-4 py-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low rounded-lg text-sm font-semibold text-black transition-colors">
                      Pilih File
                      <input type="file" className="hidden" accept=".pdf, .png, .jpg, .jpeg" onChange={handleInterviewFileUpload} />
                    </label>
                    {interviewFile ? (
                      <span className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{interviewFile.name}</span>
                    ) : (
                      <span className="text-sm text-on-surface-variant">Belum ada file dipilih</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">Format: PDF, PNG, JPG, JPEG (Max 5MB)</p>
                  
                  {interviewFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px]">
                      {interviewFile.type === "application/pdf" ? (
                        <iframe src={interviewFile.base64} className="w-full h-full border-none" title="Bukti Interview" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={interviewFile.base64} alt="Bukti" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1 flex items-center justify-center">
               <p className="text-on-surface-variant text-sm">Widget penilaian untuk tahap <strong>{currentStageName}</strong> belum tersedia.</p>
            </div>
          )}

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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-table-border bg-surface-container-lowest flex items-center justify-between">
              <h3 className="font-bold text-status-error flex items-center gap-2">
                <Ban className="w-5 h-5" /> Reject Candidate
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-black mb-4">
                Pilih alasan penolakan (Rejection Reason) untuk kandidat ini.
              </p>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Rejection Reason</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm text-black bg-white"
              >
                <option value="">-- Pilih Alasan Penolakan --</option>
                {masterRejection
                  .filter((r) => r.stageId === application.currentStage)
                  .map((r) => (
                    <option key={r.id} value={r.message}>
                      {r.message}
                    </option>
                  ))}
                <option value="Lainnya">Lainnya...</option>
              </select>
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setFailureReason("");
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRejectCandidate}
                disabled={!failureReason}
                className="px-4 py-2 bg-status-error text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Reject Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ensure UserIcon is imported since it's used
import { User as UserIcon } from "lucide-react";
