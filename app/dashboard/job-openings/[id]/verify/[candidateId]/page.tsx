"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Download, Printer, Search, AlertCircle, Save, CheckCircle, Ban, ArrowRight, ArrowLeft, XCircle, UploadCloud, MessageSquare, Send, ChevronDown, UserX, Clock } from "lucide-react";
import { MASTER_SKEMA_SERTIFIKASI, MASTER_REJECTION_MESSAGE } from "@/lib/masterData";
import HiredCandidateStageAccordions from "@/components/dashboard/HiredCandidateStageAccordions";

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
  const [bnspFile, setBnspFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // HR Interview Form State
  const [interviewResult, setInterviewResult] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [interviewFile, setInterviewFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [interviewResultFile, setInterviewResultFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // Psikotes Form State
  const [psikotesResult, setPsikotesResult] = useState("");
  const [psikotesDate, setPsikotesDate] = useState("");
  const [psikotesFile, setPsikotesFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // Test Skill Form State
  const [testSkillDate, setTestSkillDate] = useState("");
  const [testSkillVideoLink, setTestSkillVideoLink] = useState("");
  const [testSkillProofs, setTestSkillProofs] = useState<{title: string, file: {name: string, base64: string, type: string} | null}[]>([{ title: "", file: null }]);
  const [testSkillResultFile, setTestSkillResultFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // User Interview Form State
  const [userInterviewResult, setUserInterviewResult] = useState("");
  const [userInterviewDate, setUserInterviewDate] = useState("");
  const [userInterviewFeedback, setUserInterviewFeedback] = useState("");
  const [userInterviewFile, setUserInterviewFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // Offering Letter Form State
  const [offeringDate, setOfferingDate] = useState("");
  const [offeringFile, setOfferingFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // MCU Form State
  const [mcuDate, setMcuDate] = useState("");
  const [mcuPengantarFile, setMcuPengantarFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [mcuHasilFile, setMcuHasilFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [mcuFollowUpFile, setMcuFollowUpFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // Training User Form State
  const [trainingDate, setTrainingDate] = useState("");
  const [trainingFile, setTrainingFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<{originalDate: string, revisedDate: string, status: string, reason: string}[]>([]);
  const [trainingReason, setTrainingReason] = useState("");

  // Induction Form State
  const [inductionDate, setInductionDate] = useState("");
  const [inductionFile, setInductionFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [inductionHistory, setInductionHistory] = useState<{originalDate: string, revisedDate: string, status: string, reason: string}[]>([]);
  const [inductionReason, setInductionReason] = useState("");

  // PKWT Form State
  const [pkwtStartDate, setPkwtStartDate] = useState("");
  const [pkwtEndDate, setPkwtEndDate] = useState("");
  const [pkwtFile, setPkwtFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [pkwtSafetyFile, setPkwtSafetyFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [pkwtNeopFile, setPkwtNeopFile] = useState<{name: string, base64: string, type: string} | null>(null);
  const [pkwtMcuFile, setPkwtMcuFile] = useState<{name: string, base64: string, type: string} | null>(null);

  // Post-MCU Document Stores (Training, Induction, PKWT)
  const [trainingDocs, setTrainingDocs] = useState<any[]>([]);
  const [inductionDocs, setInductionDocs] = useState<any[]>([]);
  const [pkwtDocs, setPkwtDocs] = useState<any[]>([]);
  const [customPreviewFile, setCustomPreviewFile] = useState<{ name: string; url?: string; base64?: string; type?: string } | null>(null);

  const [activeDocTab, setActiveDocTab] = useState("KTP");
  const [failureReason, setFailureReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [masterRejection, setMasterRejection] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistNote, setBlacklistNote] = useState("");
  const [showMoveJobModal, setShowMoveJobModal] = useState(false);
  const [selectedMoveJobId, setSelectedMoveJobId] = useState("");
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    // Load Job
    const allJobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    const foundJob = allJobs.find((j: any) => j.id === unwrappedParams.id);
    if (foundJob) setJob(foundJob);

    // Set active jobs for move
    const otherActiveJobs = allJobs.filter((j: any) => j.globalStatus === "Active" && j.id !== unwrappedParams.id);
    setActiveJobs(otherActiveJobs);

    // Load Profile
    const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    const foundProfile = profiles[unwrappedParams.candidateId];
    if (foundProfile) setProfile(foundProfile);

    // Load Application
    let foundApp: any = null;
    
    const fetchDbApp = async () => {
      const { getApplicationForVerify } = await import("@/app/actions/job");
      const res = await getApplicationForVerify(unwrappedParams.id, unwrappedParams.candidateId);
      if (res.success && res.data) {
        foundApp = res.data;
        if (res.data.stageData) {
          foundApp = { ...foundApp, ...(res.data.stageData as any) };
        }
        // Use real DB data instead of local storage
        if (res.data.job) setJob(res.data.job);
        if (res.data.candidateProfile) {
          const dbProfile: any = { ...res.data.candidateProfile };
          if (dbProfile.user) {
            dbProfile.fullName = dbProfile.user.name;
            dbProfile.email = dbProfile.user.email;
          }
          if (dbProfile.trainingCenterName) {
            dbProfile.trainingCenter = `${dbProfile.trainingCenterType ? dbProfile.trainingCenterType + ' - ' : ''}${dbProfile.trainingCenterName}`;
          }
          if (dbProfile.documents && Array.isArray(dbProfile.documents)) {
            dbProfile.documents.forEach((doc: any) => {
              const fileObj = { base64: `/api/file?key=${encodeURIComponent(doc.objectKey)}`, name: doc.documentType, type: doc.mimeType || "application/pdf", objectKey: doc.objectKey };
              const t = (doc.documentType || "").toLowerCase();
              if (t === "ktp") dbProfile.fileKtp = fileObj;
              else if (t === "cv") dbProfile.fileCv = fileObj;
              else if (t === "ijazah") dbProfile.fileIjazah = fileObj;
              else if (t === "kk" || t === "kartu keluarga") dbProfile.fileKk = fileObj;
              else if (t === "pas foto" || t === "photo") dbProfile.filePhoto = fileObj;
              else if (t === "sertifikat bnsp" || t === "sertifikat" || t === "bnsp") dbProfile.fileSertifikat = fileObj;
            });
          }
          setProfile(dbProfile);
        }
      }
      
      if (foundApp) {
        setApplication(foundApp);
        const getSecureUrl = (fileObj: any) => {
          if (!fileObj) return null;
          if (fileObj.base64?.includes(process.env.NEXT_PUBLIC_S3_ENDPOINT || '9000')) {
             if (fileObj.objectKey) return { ...fileObj, base64: `/api/file?key=${encodeURIComponent(fileObj.objectKey)}` };
          }
          return fileObj;
        };

        if (foundApp.bnspValidation) {
          setSkema(foundApp.bnspValidation.skema || "");
          setIssueDate(foundApp.bnspValidation.issueDate || "");
          setExpiryDate(foundApp.bnspValidation.expiryDate || "");
          setCertNumber(foundApp.bnspValidation.certNumber || "");
          setIsApproved(foundApp.bnspValidation.isApproved || false);
          setBnspFile(getSecureUrl(foundApp.bnspValidation.file) || null);
        }
        if (foundApp.hrInterview) {
          setInterviewResult(foundApp.hrInterview.result || "");
          setInterviewDate(foundApp.hrInterview.date || "");
          setInterviewFeedback(foundApp.hrInterview.feedback || "");
          setInterviewFile(getSecureUrl(foundApp.hrInterview.file) || null);
          setInterviewResultFile(getSecureUrl(foundApp.hrInterview.resultFile) || null);
        }
        if (foundApp.psikotes) {
          setPsikotesResult(foundApp.psikotes.result || "");
          setPsikotesDate(foundApp.psikotes.date || "");
          setPsikotesFile(getSecureUrl(foundApp.psikotes.file) || null);
        }
        if (foundApp.testSkill) {
          setTestSkillDate(foundApp.testSkill.date || "");
          setTestSkillVideoLink(foundApp.testSkill.videoLink || "");
          setTestSkillProofs((foundApp.testSkill.proofs || [{ title: "", file: null }]).map((p: any) => ({ ...p, file: getSecureUrl(p.file) })));
          setTestSkillResultFile(getSecureUrl(foundApp.testSkill.resultFile) || null);
        }
        if (foundApp.userInterview) {
          setUserInterviewResult(foundApp.userInterview.result || "");
          setUserInterviewDate(foundApp.userInterview.date || "");
          setUserInterviewFeedback(foundApp.userInterview.feedback || "");
          setUserInterviewFile(getSecureUrl(foundApp.userInterview.file) || null);
        }
        if (foundApp.offeringLetter) {
          setOfferingDate(foundApp.offeringLetter.date || "");
          setOfferingFile(getSecureUrl(foundApp.offeringLetter.file) || null);
        }
        if (foundApp.mcu) {
          setMcuDate(foundApp.mcu.date || "");
          setMcuPengantarFile(getSecureUrl(foundApp.mcu.pengantarFile) || null);
          setMcuHasilFile(getSecureUrl(foundApp.mcu.hasilFile) || null);
          setMcuFollowUpFile(getSecureUrl(foundApp.mcu.followUpFile) || null);
        }
        // Training Docs
        if (foundApp.trainingDocs && Array.isArray(foundApp.trainingDocs)) {
          setTrainingDocs(foundApp.trainingDocs.map((d: any) => ({ ...d, file: getSecureUrl(d.file) || d.file, base64: getSecureUrl(d.base64 || d.file) || d.base64 })));
        } else if (foundApp.trainingUser?.file) {
          setTrainingDocs([{ id: "legacy-train", title: "Bukti Training", name: foundApp.trainingUser.file.name || "Berkas Training", base64: getSecureUrl(foundApp.trainingUser.file), type: foundApp.trainingUser.file.type || "application/pdf", createdAt: foundApp.trainingUser.date || new Date().toISOString() }]);
        }

        // Induction Docs
        if (foundApp.inductionDocs && Array.isArray(foundApp.inductionDocs)) {
          setInductionDocs(foundApp.inductionDocs.map((d: any) => ({ ...d, file: getSecureUrl(d.file) || d.file, base64: getSecureUrl(d.base64 || d.file) || d.base64 })));
        } else if (foundApp.induction?.file) {
          setInductionDocs([{ id: "legacy-ind", title: "Bukti Induksi", name: foundApp.induction.file.name || "Berkas Induksi", base64: getSecureUrl(foundApp.induction.file), type: foundApp.induction.file.type || "application/pdf", createdAt: foundApp.induction.date || new Date().toISOString() }]);
        }

        // PKWT Docs
        if (foundApp.pkwtDocs && Array.isArray(foundApp.pkwtDocs)) {
          setPkwtDocs(foundApp.pkwtDocs.map((d: any) => ({ ...d, file: getSecureUrl(d.file) || d.file, base64: getSecureUrl(d.base64 || d.file) || d.base64 })));
        } else if (foundApp.pkwt?.file) {
          const legacyDocs = [
            { id: "legacy-pkwt-1", title: "Berkas PKWT Signed", name: foundApp.pkwt.file.name || "PKWT Signed", base64: getSecureUrl(foundApp.pkwt.file), type: foundApp.pkwt.file.type || "application/pdf", createdAt: foundApp.pkwt.startDate || new Date().toISOString() },
            ...(foundApp.pkwt.safetyFile ? [{ id: "legacy-pkwt-2", title: "Safety Induction", name: foundApp.pkwt.safetyFile.name || "Safety File", base64: getSecureUrl(foundApp.pkwt.safetyFile), type: foundApp.pkwt.safetyFile.type || "application/pdf", createdAt: new Date().toISOString() }] : []),
            ...(foundApp.pkwt.neopFile ? [{ id: "legacy-pkwt-3", title: "Berkas NEOP", name: foundApp.pkwt.neopFile.name || "NEOP File", base64: getSecureUrl(foundApp.pkwt.neopFile), type: foundApp.pkwt.neopFile.type || "application/pdf", createdAt: new Date().toISOString() }] : []),
            ...(foundApp.pkwt.mcuFile ? [{ id: "legacy-pkwt-4", title: "Berkas MCU Akhir", name: foundApp.pkwt.mcuFile.name || "MCU Akhir", base64: getSecureUrl(foundApp.pkwt.mcuFile), type: foundApp.pkwt.mcuFile.type || "application/pdf", createdAt: new Date().toISOString() }] : []),
          ];
          setPkwtDocs(legacyDocs);
        }
      }
    };
    
    fetchDbApp();

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

  useEffect(() => {
    if (!profile) return;
    let fileData = null;
    switch (activeDocTab) {
      case "KTP": fileData = profile.fileKtp; break;
      case "CV": fileData = profile.fileCv; break;
      case "Ijazah": fileData = profile.fileIjazah; break;
      case "KK": fileData = profile.fileKk; break;
      case "Pas Foto": fileData = profile.filePhoto; break;
      case "Sertifikat BNSP": fileData = profile.fileSertifikat; break;
    }

    if (fileData?.objectKey) {
      setIsPreviewLoading(true);
      setActivePreviewUrl(null);
      import("@/app/actions/candidate-profile").then(({ getPreviewUrl }) => {
        getPreviewUrl(fileData.objectKey).then(res => {
          if (res.success && res.url) {
            setActivePreviewUrl(res.url);
          } else {
            setActivePreviewUrl(fileData.base64);
          }
          setIsPreviewLoading(false);
        }).catch(() => {
          setActivePreviewUrl(fileData.base64);
          setIsPreviewLoading(false);
        });
      });
    } else if (fileData?.base64) {
      setActivePreviewUrl(fileData.base64);
    } else {
      setActivePreviewUrl(null);
    }
  }, [activeDocTab, profile]);

  if (!job || !profile || !application) {
    return <div className="p-8 text-center">Loading verification data...</div>;
  }

  const currentStageName = job.timeline?.find((t: any) => t.stageId === application.currentStageId)?.stage?.name || (application.status === "HIRED" && !application.currentStageId ? "Hired (Active Employee)" : application.currentStageId || "");
  const isCandidateHired = application.status === "HIRED" || application.currentStageId === "Hired" || ["stage_8", "stage_9", "stage_10"].includes(application.currentStageId) || ["training", "induction", "pkwt"].some(n => currentStageName.toLowerCase().includes(n));
  const isAdministration = application.currentStageId === "stage_1" || currentStageName.toLowerCase().includes("administration") || currentStageName.toLowerCase().includes("cv screener");
  const isHrInterview = application.currentStageId === "stage_2" || currentStageName.toLowerCase().includes("hr interview") || currentStageName.toLowerCase().includes("interview hr");
  const isPsikotes = application.currentStageId === "stage_3" || currentStageName.toLowerCase().includes("psikotes") || currentStageName.toLowerCase().includes("psychotest") || currentStageName.toLowerCase().includes("psychological");
  const isTestSkill = application.currentStageId === "stage_4" || currentStageName.toLowerCase().includes("test skill") || currentStageName.toLowerCase().includes("technical");
  const isUserInterview = application.currentStageId === "stage_5" || currentStageName.toLowerCase().includes("user interview") || currentStageName.toLowerCase().includes("interview user");
  const isOfferingLetter = application.currentStageId === "stage_6" || currentStageName.toLowerCase().includes("offering");
  const isMcu = application.currentStageId === "stage_7" || currentStageName.toLowerCase().includes("mcu") || currentStageName.toLowerCase().includes("medical");
  const isTrainingUser = application.currentStageId === "stage_8" || currentStageName.toLowerCase().includes("training");
  const isInduction = application.currentStageId === "stage_9" || currentStageName.toLowerCase().includes("induction");
  const isPkwt = application.currentStageId === "stage_10" || currentStageName.toLowerCase().includes("pkwt") || application.currentStageId === "Hired";

  const currentIndex = job.timeline?.findIndex((t: any) => t.stageId === application.currentStageId) ?? -1;
  const isLastStage = currentIndex !== -1 && currentIndex + 1 >= (job.timeline?.length || 0);

  const uploadPendingFile = async (fileObj: any) => {
    if (fileObj && fileObj.file instanceof File && !fileObj.objectKey) {
      try {
        const file = fileObj.file;
        const { getUploadUrl } = await import("@/app/actions/candidate-profile");
        const folderPath = `applications/${job.id}/${profile.id}/${application.currentStageId}`;
        const { uploadUrl, objectKey, publicUrl } = await getUploadUrl(file.name, file.type, folderPath);
        if (uploadUrl) {
          const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
          if (res.ok) {
            return {
              name: file.name,
              base64: publicUrl,
              type: file.type,
              objectKey: objectKey,
            };
          }
        }
      } catch (err) {
        console.error("Upload error", err);
      }
      
      // Fallback if S3 fails, convert to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ name: fileObj.name, base64: e.target?.result, type: fileObj.type });
        reader.readAsDataURL(fileObj.file);
      });
    }
    return fileObj;
  };

  const uploadAllPendingFiles = async (obj: any): Promise<any> => {
    if (!obj) return obj;
    if (obj instanceof File) return obj; // do not traverse raw File objects
    
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => uploadAllPendingFiles(item)));
    }
    
    if (typeof obj === 'object') {
      if (obj.file instanceof File) {
        return await uploadPendingFile(obj);
      }
      const newObj: any = {};
      for (const key in obj) {
        if (obj[key] && obj[key].file instanceof File) {
           newObj[key] = await uploadPendingFile(obj[key]);
        } else {
           newObj[key] = await uploadAllPendingFiles(obj[key]);
        }
      }
      return newObj;
    }
    
    return obj;
  };

  const safeSaveApplications = async (appData: any, silent = false) => {
    try {
      // 1. Process all pending uploads in appData before saving to database
      const uploadedAppData = await uploadAllPendingFiles(appData);

      // Sync to Database for fullstack integration
      const { updateApplicationStageData } = await import("@/app/actions/job");
      // Extract stage data to save, wrapping in JSON.parse/stringify to strip raw File objects and their prototypes
      const stageDataToSave = JSON.parse(JSON.stringify({
        bnspValidation: uploadedAppData.bnspValidation,
        hrInterview: uploadedAppData.hrInterview,
        psikotes: uploadedAppData.psikotes,
        testSkill: uploadedAppData.testSkill,
        userInterview: uploadedAppData.userInterview,
        offeringLetter: uploadedAppData.offeringLetter,
        mcu: uploadedAppData.mcu,
        trainingDocs: uploadedAppData.trainingDocs,
        inductionDocs: uploadedAppData.inductionDocs,
        pkwtDocs: uploadedAppData.pkwtDocs,
        trainingUser: uploadedAppData.trainingUser,
        induction: uploadedAppData.induction,
        pkwt: uploadedAppData.pkwt,
        messages: uploadedAppData.messages,
        moveProposal: uploadedAppData.moveProposal
      }));
      
      const res = await updateApplicationStageData(uploadedAppData.id, stageDataToSave);
      
      if (res.success) {
        setApplication(uploadedAppData);
      } else {
        throw new Error(res.error || "Gagal menyimpan ke database");
      }
      
      return true;
    } catch (e: any) {
      console.error("Save Error:", e);
      if (!silent) {
        window.alert(e.message || "Gagal menyimpan perubahan. Harap coba lagi.");
      }
      return false;
    }
  };

  const handleSaveDraftSilent = async () => {
    let updatedApp = { ...application };
    updatedApp.trainingDocs = trainingDocs;
    updatedApp.inductionDocs = inductionDocs;
    updatedApp.pkwtDocs = pkwtDocs;

    if (isAdministration) {
      let finalBnspFile = bnspFile;
      // File is already uploaded via processUploadedFile
      updatedApp.bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved, file: finalBnspFile };
    } else if (isHrInterview) {
      updatedApp.hrInterview = { result: interviewResult, date: interviewDate, feedback: interviewFeedback, file: interviewFile, resultFile: interviewResultFile };
    } else if (isPsikotes) {
      updatedApp.psikotes = { result: psikotesResult, date: psikotesDate, file: psikotesFile };
    } else if (isTestSkill) {
      updatedApp.testSkill = { date: testSkillDate, videoLink: testSkillVideoLink, proofs: testSkillProofs, resultFile: testSkillResultFile };
    } else if (isUserInterview) {
      updatedApp.userInterview = { result: userInterviewResult, date: userInterviewDate, feedback: userInterviewFeedback, file: userInterviewFile };
    } else if (isOfferingLetter) {
      updatedApp.offeringLetter = { ...(application?.offeringLetter || {}), date: offeringDate, file: offeringFile };
    } else if (isMcu) {
      updatedApp.mcu = { date: mcuDate, pengantarFile: mcuPengantarFile, hasilFile: mcuHasilFile, followUpFile: mcuFollowUpFile };
    } else if (isTrainingUser) {
      updatedApp.trainingDocs = trainingDocs;
    } else if (isInduction) {
      updatedApp.inductionDocs = inductionDocs;
    } else if (isPkwt) {
      updatedApp.pkwtDocs = pkwtDocs;
    }
    
    await safeSaveApplications(updatedApp, true);
  };

  const handleToggleApprove = async () => {
    const newIsApproved = !isApproved;
    setIsApproved(newIsApproved);

    let updatedApp = { ...application };
    if (isAdministration) {
      updatedApp.bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved: newIsApproved, file: bnspFile };
    }
    await safeSaveApplications(updatedApp);
  };

  const handleDraftMark = async () => {
    let updatedApp = { ...application };
    if (isAdministration) {
      updatedApp.bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved, file: bnspFile };
    } else if (isHrInterview) {
      updatedApp.hrInterview = { result: interviewResult, date: interviewDate, feedback: interviewFeedback, file: interviewFile, resultFile: interviewResultFile };
    } else if (isPsikotes) {
      updatedApp.psikotes = { result: psikotesResult, date: psikotesDate, file: psikotesFile };
    } else if (isTestSkill) {
      updatedApp.testSkill = { date: testSkillDate, videoLink: testSkillVideoLink, proofs: testSkillProofs, resultFile: testSkillResultFile };
    } else if (isUserInterview) {
      updatedApp.userInterview = { result: userInterviewResult, date: userInterviewDate, feedback: userInterviewFeedback, file: userInterviewFile };
    } else if (isOfferingLetter) {
      updatedApp.offeringLetter = { ...(application?.offeringLetter || {}), date: offeringDate, file: offeringFile };
    } else if (isMcu) {
      updatedApp.mcu = { date: mcuDate, pengantarFile: mcuPengantarFile, hasilFile: mcuHasilFile, followUpFile: mcuFollowUpFile };
    } else if (isTrainingUser) {
      updatedApp.trainingDocs = trainingDocs;
    } else if (isInduction) {
      updatedApp.inductionDocs = inductionDocs;
    } else if (isPkwt) {
      updatedApp.pkwtDocs = pkwtDocs;
    }
    updatedApp.isDraft = true;
    
    const success = await safeSaveApplications(updatedApp);
    if (success) {
      window.alert("Saved as Draft successfully.");
      router.push(`/dashboard/job-openings/${job.id}`);
    }
  };

  const getActorInfo = () => {
    let actor = "System";
    let actorEmail = "";
    try {
      const str = localStorage.getItem("nexus_logged_user");
      if (str) {
        const userObj = JSON.parse(str);
        actor = userObj.fullName || userObj.username || "System";
        actorEmail = userObj.email || "";
      }
    } catch (e) {}
    return { actor, actorEmail };
  };

  const handleApproveNextStage = async () => {
    if (isAdministration && !isApproved) {
      window.alert("Anda harus menandai validasi sertifikat BNSP sebagai 'Approved' sebelum melanjutkan ke tahap berikutnya.");
      return;
    }
    
    if (isHrInterview) {
      if (!interviewResult || !interviewDate || !interviewFeedback || !interviewFile || !interviewResultFile) {
        window.alert("Anda harus melengkapi seluruh form pada stage Interview HR (Hasil, Tanggal, Feedback, Bukti Wawancara, dan Hasil Wawancara) sebelum melanjutkan ke tahap berikutnya.");
        return;
      }
    }

    if (isPsikotes) {
      if (!psikotesResult || !psikotesDate || !psikotesFile) {
        window.alert("Anda harus melengkapi seluruh form pada stage Psikotes (Hasil, Tanggal, dan Bukti Psikotes) sebelum melanjutkan ke tahap berikutnya.");
        return;
      }
    }

    if (isTestSkill) {
      if (!testSkillDate || !testSkillVideoLink || testSkillProofs.length === 0 || !testSkillProofs.every(p => p.title && p.file) || !testSkillResultFile) {
        window.alert("Anda harus melengkapi seluruh form pada stage Test Skill (Tanggal, Link Video, Bukti, dan Hasil Penilaian) sebelum melanjutkan ke tahap berikutnya.");
        return;
      }
    }

    if (isUserInterview) {
      if (!userInterviewResult || !userInterviewDate || !userInterviewFeedback || !userInterviewFile) {
        window.alert("Anda harus melengkapi seluruh form pada stage Interview User (Hasil, Tanggal, Feedback, dan Bukti Wawancara) sebelum melanjutkan ke tahap berikutnya.");
        return;
      }
    }

    if (isOfferingLetter) {
      if (!offeringDate || !offeringFile) {
        window.alert("Anda harus melengkapi seluruh form pada stage Offering Letter (Tanggal dan File Offering) sebelum melanjutkan ke tahap berikutnya.");
        return;
      }
    }

    if (isMcu) {
      if (!mcuDate || !mcuPengantarFile || !mcuHasilFile) {
        window.alert("Anda harus melengkapi seluruh form pada stage MCU (Tanggal, Surat Pengantar, dan Hasil MCU) sebelum melanjutkan ke tahap berikutnya.");
        return;
      }
    }

    await handleSaveDraftSilent();
    const currentIndex = job.timeline?.findIndex((t: any) => t.stageId === application.currentStageId);
    if (currentIndex !== -1 && currentIndex + 1 < job.timeline.length) {
       const nextStage = job.timeline[currentIndex + 1];
       const { updateApplicationStage } = await import("@/app/actions/job");
       const res = await updateApplicationStage(application.id, nextStage.stageId, isMcu ? "Lolos MCU - Status Hired. Masuk Training." : "Approved to next stage");
       if (res.success) {
         if (isMcu) {
           window.alert("Kandidat dinyatakan FIT TO WORK dan resmi HIRED! Melanjutkan ke tahapan Training.");
         } else {
           window.alert(`Candidate approved and moved to ${(nextStage.stage?.name || nextStage.stageId)}.`);
         }
         router.push(`/dashboard/job-openings/${job.id}`);
       } else {
         window.alert("Gagal menyetujui kandidat.");
       }
    } else {
       const { updateApplicationStage } = await import("@/app/actions/job");
       const res = await updateApplicationStage(application.id, "Hired", "Seluruh tahapan seleksi & onboarding selesai. Resmi Active Employee.");
       if (res.success) {
          window.alert("Seluruh tahapan seleksi dan onboarding selesai! Kandidat resmi menjadi Active Employee.");
          router.push(`/dashboard/job-openings/${job.id}`);
       } else {
          window.alert("Gagal menyetujui kandidat.");
       }
    }
  };

  const handleRejectCandidate = async () => {
    if (!failureReason) return;
    
    const { updateApplicationStage } = await import("@/app/actions/job");
    const res = await updateApplicationStage(application.id, "Rejected", `Reason: ${failureReason}`);
    if (res.success) {
      window.alert("Kandidat berhasil ditolak (Rejected) dan diarsipkan.");
      setShowRejectModal(false);
      router.push(`/dashboard/job-openings/${job.id}`);
    } else {
      window.alert("Gagal menolak kandidat.");
    }
  };

  const handleBlacklistCandidate = async () => {
    if (!blacklistNote.trim()) {
      window.alert("Please provide a note for blacklisting.");
      return;
    }
    
    const { blacklistCandidate, updateApplicationStage } = await import("@/app/actions/job");
    const res = await blacklistCandidate(profile.id, blacklistNote);
    
    if (res.success) {
      await updateApplicationStage(application.id, "Rejected", `Blacklisted: ${blacklistNote}`);
      setShowBlacklistModal(false);
      window.alert("Candidate has been blacklisted.");
      router.push(`/dashboard/job-openings/${job.id}`);
    } else {
      window.alert("Gagal mem-blacklist kandidat.");
    }
  };

  const handleMoveCandidateRequest = async () => {
    if (!selectedMoveJobId) {
      window.alert("Please select a target job opening.");
      return;
    }

    if (application.moveProposal?.status === "Pending") {
      window.alert("There is already a pending job move proposal for this candidate.");
      return;
    }

    const updatedApp = {
      ...application,
      moveProposal: {
        toJobId: selectedMoveJobId,
        status: "Pending",
        createdAt: new Date().toISOString()
      }
    };

    const success = await safeSaveApplications(updatedApp);
    if (success) {
      window.alert("Move request sent successfully. Waiting for candidate approval.");
      setShowMoveJobModal(false);
      setSelectedMoveJobId("");
      setShowActionModal(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const newMessage = {
      stage: application.currentStageId,
      text: messageText,
      date: new Date().toISOString()
    };
    
    const updatedApp = {
      ...application,
      messages: [...(application.messages || []), newMessage]
    };

    const success = await safeSaveApplications(updatedApp);
    if (success) {
      window.alert("Pesan berhasil dikirim ke kandidat.");
      setShowMessageModal(false);
      setMessageText("");
    }
  };

  const handleApproveAll = async () => {
    await handleSaveDraftSilent();
    const { updateApplicationStage } = await import("@/app/actions/job");
    const res = await updateApplicationStage(application.id, "Hired", "All verification approved by recruiter.");
    if (res.success) {
      window.alert("All verification approved. Returning to Pipeline.");
      router.push(`/dashboard/job-openings/${job.id}`);
    } else {
      window.alert("Gagal menyetujui semua tahap.");
    }
  };

  const handleAcceptDecline = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menerima penolakan penawaran ini? Status lamaran kandidat akan diubah menjadi REJECTED.")) {
      return;
    }
    const { resolveOfferDeclined } = await import("@/app/actions/candidate-application");
    const res = await resolveOfferDeclined(application.id, "ACCEPT_DECLINE");
    if (res.success) {
      window.alert("Penolakan kandidat telah diterima. Lamaran berstatus REJECTED.");
      router.push(`/dashboard/job-openings/${job.id}`);
    } else {
      window.alert(res.error || "Gagal memproses penolakan.");
    }
  };

  const handleInterviewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setInterviewFile(data));
    }
  };

  const handleInterviewFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setInterviewFile(data));
    }
  };

  const handleInterviewResultFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setInterviewResultFile(data));
    }
  };

  const handleInterviewResultFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setInterviewResultFile(data));
    }
  };

  const handleBnspFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setBnspFile(data));
    }
  };

  const handleBnspFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setBnspFile(data));
    }
  };

  const handlePsikotesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setPsikotesFile(data));
    }
  };

  const handlePsikotesFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setPsikotesFile(data));
    }
  };

  const processUploadedFile = (file: File, callback: (data: {name: string, base64: string, type: string, file?: any, objectKey?: string}) => void) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      window.alert("Format file tidak didukung. Harap unggah PDF, PNG, atau JPG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Ukuran file melebihi batas 5MB.");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    callback({
      name: file.name,
      base64: localPreviewUrl,
      type: file.type,
      file: file
    });
  };

  const handleTestSkillResultFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setTestSkillResultFile(data));
    }
  };

  const handleTestSkillResultFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setTestSkillResultFile(data));
    }
  };

  const handleTestSkillProofUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => {
        const newProofs = [...testSkillProofs];
        newProofs[index].file = data;
        setTestSkillProofs(newProofs);
      });
    }
  };

  const handleTestSkillProofDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => {
        const newProofs = [...testSkillProofs];
        newProofs[index].file = data;
        setTestSkillProofs(newProofs);
      });
    }
  };

  const handleUserInterviewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setUserInterviewFile(data));
    }
  };

  const handleUserInterviewFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setUserInterviewFile(data));
    }
  };

  const handleOfferingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setOfferingFile(data));
    }
  };

  const handleOfferingFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setOfferingFile(data));
    }
  };

  const handleMcuPengantarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setMcuPengantarFile(data));
    }
  };

  const handleMcuPengantarFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setMcuPengantarFile(data));
    }
  };

  const handleMcuHasilFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setMcuHasilFile(data));
    }
  };

  const handleMcuHasilFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setMcuHasilFile(data));
    }
  };

  const handleMcuFollowUpFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setMcuFollowUpFile(data));
    }
  };

  const handleMcuFollowUpFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setMcuFollowUpFile(data));
    }
  };

  const handleTrainingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setTrainingFile(data));
    }
  };

  const handleTrainingFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setTrainingFile(data));
    }
  };

  const handleUpdateTrainingSchedule = () => {
    if (!trainingDate) {
      window.alert("Silakan pilih tanggal training terlebih dahulu.");
      return;
    }
    if (trainingHistory.length === 0) {
      setTrainingHistory([{ originalDate: trainingDate, revisedDate: "-", status: "Scheduled", reason: "-" }]);
    } else {
      if (!trainingReason) {
        window.alert("Please provide a reason for changing the schedule.");
        return;
      }
      const newHistory = [...trainingHistory];
      const lastHistory = newHistory[newHistory.length - 1];
      newHistory[newHistory.length - 1] = { ...lastHistory, revisedDate: trainingDate, status: "Rescheduled" };
      newHistory.push({ originalDate: trainingDate, revisedDate: "-", status: "Scheduled", reason: trainingReason });
      setTrainingHistory(newHistory);
      setTrainingReason("");
    }
  };

  const handleInductionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setInductionFile(data));
    }
  };

  const handleInductionFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file, (data) => setInductionFile(data));
    }
  };

  const handleUpdateInductionSchedule = () => {
    if (!inductionDate) {
      window.alert("Silakan pilih tanggal induksi terlebih dahulu.");
      return;
    }
    if (inductionHistory.length === 0) {
      setInductionHistory([{ originalDate: inductionDate, revisedDate: "-", status: "Scheduled", reason: "-" }]);
    } else {
      if (!inductionReason) {
        window.alert("Please provide a reason for changing the schedule.");
        return;
      }
      const newHistory = [...inductionHistory];
      const lastHistory = newHistory[newHistory.length - 1];
      newHistory[newHistory.length - 1] = { ...lastHistory, revisedDate: inductionDate, status: "Rescheduled" };
      newHistory.push({ originalDate: inductionDate, revisedDate: "-", status: "Scheduled", reason: inductionReason });
      setInductionHistory(newHistory);
      setInductionReason("");
    }
  };

  const handlePkwtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtFile(data));
  };
  const handlePkwtFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtFile(data));
  };

  const handlePkwtSafetyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtSafetyFile(data));
  };
  const handlePkwtSafetyFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtSafetyFile(data));
  };

  const handlePkwtNeopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtNeopFile(data));
  };
  const handlePkwtNeopFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtNeopFile(data));
  };

  const handlePkwtMcuFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtMcuFile(data));
  };
  const handlePkwtMcuFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file, (data) => setPkwtMcuFile(data));
  };

  const handleTestSkillTitleChange = (index: number, title: string) => {
    const newProofs = [...testSkillProofs];
    newProofs[index].title = title;
    setTestSkillProofs(newProofs);
  };

  const addTestSkillProof = () => {
    setTestSkillProofs([...testSkillProofs, { title: "", file: null }]);
  };

  const removeTestSkillProof = (index: number) => {
    const newProofs = [...testSkillProofs];
    newProofs.splice(index, 1);
    if (newProofs.length === 0) {
      newProofs.push({ title: "", file: null });
    }
    setTestSkillProofs(newProofs);
  };

  const renderDocumentPreview = () => {
    if (customPreviewFile) {
      const previewSrc = customPreviewFile.url || customPreviewFile.base64;
      const fileName = customPreviewFile.name;
      const isPdf = previewSrc?.startsWith("data:application/pdf") || customPreviewFile.type === "application/pdf" || previewSrc?.toLowerCase().includes(".pdf");
      const isImage = previewSrc?.startsWith("data:image/") || customPreviewFile.type?.startsWith("image/") || previewSrc?.match(/\.(jpeg|jpg|gif|png)/i) != null;

      return (
        <div className="mt-4 border border-table-border rounded-xl bg-surface-container-lowest overflow-hidden h-[500px] flex flex-col relative">
          <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm flex items-center gap-2">
            <span>Berkas Stage: {fileName}</span>
            <button
              onClick={() => setCustomPreviewFile(null)}
              className="ml-2 hover:bg-white/20 rounded px-1 font-bold text-white"
              title="Kembali ke profil kandidat"
            >
              ×
            </button>
          </div>
          <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/80 p-1.5 rounded-lg backdrop-blur-sm border border-outline-variant/30 shadow-sm">
            {previewSrc && (
              <a href={previewSrc} download={fileName} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-surface-container-low rounded inline-block" title="Download">
                <Download className="w-4 h-4 text-black" />
              </a>
            )}
          </div>
          
          {isPdf && previewSrc ? (
            <iframe src={previewSrc} className="w-full h-full border-none bg-white pt-10" title={fileName} />
          ) : isImage && previewSrc ? (
            <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-4 pt-10">
              <img src={previewSrc} alt={fileName} className="max-w-full max-h-full object-contain shadow-sm border border-outline-variant/30 rounded" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-4">
              <p className="text-sm text-on-surface-variant font-medium">Format file tidak didukung untuk pratinjau langsung.</p>
            </div>
          )}
        </div>
      );
    }

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

    if (!fileData || (!fileData.base64 && !fileData.objectKey)) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-lowest rounded-xl border-2 border-dashed border-outline-variant mt-4">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">Dokumen {fileName} tidak diunggah oleh kandidat.</p>
        </div>
      );
    }

    if (isPreviewLoading) {
      return (
        <div className="mt-4 border border-table-border rounded-xl bg-surface-container-lowest overflow-hidden h-[500px] flex items-center justify-center">
          <p className="text-sm font-medium text-on-surface-variant animate-pulse">Memuat pratinjau dokumen...</p>
        </div>
      );
    }

    const previewSrc = activePreviewUrl || fileData.base64;
    const isPdf = previewSrc.startsWith("data:application/pdf") || fileData.type === "application/pdf" || previewSrc.toLowerCase().includes(".pdf");
    const isImage = previewSrc.startsWith("data:image/") || fileData.type?.startsWith("image/") || previewSrc.match(/\.(jpeg|jpg|gif|png)/i) != null;

    return (
      <div className="mt-4 border border-table-border rounded-xl bg-surface-container-lowest overflow-hidden h-[500px] flex flex-col relative">
        <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/80 p-1.5 rounded-lg backdrop-blur-sm border border-outline-variant/30 shadow-sm">
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Search className="w-4 h-4 text-black" /></button>
          <a href={previewSrc} download={fileName} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-surface-container-low rounded inline-block"><Download className="w-4 h-4 text-black" /></a>
          <button className="p-1.5 hover:bg-surface-container-low rounded"><Printer className="w-4 h-4 text-black" /></button>
        </div>
        
        {isPdf ? (
          <iframe src={previewSrc} className="w-full h-full border-none bg-white" title={fileName} />
        ) : isImage ? (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={fileName} className="max-w-full max-h-full object-contain shadow-sm border border-outline-variant/30 rounded" />
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
              {profile.fullName} <span className="text-on-surface-variant font-normal">—</span> {job.positionName || job.position?.name}
              {(application.currentStageId === "Hired" || (application.status === "HIRED" && !application.currentStageId)) ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">Active Employee</span>
              ) : application.status === "HIRED" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">Hired (Onboarding)</span>
              ) : null}
              {profile?.isBlacklisted && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white uppercase tracking-wide">Blacklisted</span>
              )}
            </h2>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <button onClick={handleDraftMark} className="px-5 py-2 border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5 shadow-sm">
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          
          <button onClick={() => setShowActionModal(true)} className="px-5 py-2 bg-primary hover:bg-primary-container text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5 shadow-sm">
            Action <ChevronDown className="w-4 h-4" />
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
          
          {/* Section 1: Full Accordion for Hired Candidates OR Dynamic based on Stage */}
          {isCandidateHired ? (
            <HiredCandidateStageAccordions
              application={application}
              currentStageId={application.currentStageId}
              bnspData={{
                skema,
                certNumber,
                issueDate,
                expiryDate,
                isApproved,
                file: bnspFile,
              }}
              hrInterviewData={{
                result: interviewResult,
                date: interviewDate,
                feedback: interviewFeedback,
                file: interviewFile,
                resultFile: interviewResultFile,
              }}
              psikotesData={{
                result: psikotesResult,
                date: psikotesDate,
                file: psikotesFile,
              }}
              testSkillData={{
                date: testSkillDate,
                videoLink: testSkillVideoLink,
                proofs: testSkillProofs,
                resultFile: testSkillResultFile,
              }}
              userInterviewData={{
                result: userInterviewResult,
                date: userInterviewDate,
                feedback: userInterviewFeedback,
                file: userInterviewFile,
              }}
              offeringData={{
                date: offeringDate,
                file: offeringFile,
              }}
              mcuData={{
                date: mcuDate,
                pengantarFile: mcuPengantarFile,
                hasilFile: mcuHasilFile,
                followUpFile: mcuFollowUpFile,
              }}
              trainingDocs={trainingDocs}
              onTrainingDocsChange={(newDocs) => {
                setTrainingDocs(newDocs);
                safeSaveApplications({ ...application, trainingDocs: newDocs }, true);
              }}
              inductionDocs={inductionDocs}
              onInductionDocsChange={(newDocs) => {
                setInductionDocs(newDocs);
                safeSaveApplications({ ...application, inductionDocs: newDocs }, true);
              }}
              pkwtDocs={pkwtDocs}
              onPkwtDocsChange={(newDocs) => {
                setPkwtDocs(newDocs);
                safeSaveApplications({ ...application, pkwtDocs: newDocs }, true);
              }}
              onPreviewFile={(fileObj) => {
                setCustomPreviewFile(fileObj);
              }}
            />
          ) : isAdministration ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Sertifikat BNSP Validation
              </h3>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Upload Bukti File Validasi BNSP */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti File Validasi BNSP <span className="text-red-500">*</span></label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleBnspFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleBnspFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop file bukti validasi BNSP</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  
                  {bnspFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {bnspFile.type === "application/pdf" ? (
                        <iframe src={bnspFile.base64} className="w-full h-full border-none bg-white" title="Bukti BNSP" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bnspFile.base64} alt="Bukti BNSP" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {bnspFile.name}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* BNSP Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Skema Sertifikasi (Certification Scheme) <span className="text-red-500">*</span></label>
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
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Issue Date (Tanggal Keluar) <span className="text-red-500">*</span></label>
                      <input 
                        type="date" 
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Expiry Date (Tanggal Habis) <span className="text-red-500">*</span></label>
                      <input 
                        type="date" 
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Certificate Number <span className="text-red-500">*</span></label>
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Result Status <span className="text-red-500">*</span></label>
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Interview <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Interviewer Feedback <span className="text-red-500">*</span></label>
                  <textarea 
                    value={interviewFeedback}
                    onChange={(e) => setInterviewFeedback(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan catatan atau feedback dari proses interview..."
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti Interview HR <span className="text-red-500">*</span></label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleInterviewFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleInterviewFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop file bukti interview</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  
                  {interviewFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {interviewFile.type === "application/pdf" ? (
                        <iframe src={interviewFile.base64} className="w-full h-full border-none bg-white" title="Bukti Interview" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={interviewFile.base64} alt="Bukti" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {interviewFile.name}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Hasil Penilaian Interview <span className="text-red-500">*</span></label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleInterviewResultFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleInterviewResultFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop dokumen hasil penilaian interview</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  
                  {interviewResultFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {interviewResultFile.type === "application/pdf" ? (
                        <iframe src={interviewResultFile.base64} className="w-full h-full border-none bg-white" title="Hasil Penilaian Interview" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={interviewResultFile.base64} alt="Hasil Penilaian" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {interviewResultFile.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isPsikotes ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Psikotes Detail
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Hasil Psikotes <span className="text-red-500">*</span></label>
                    <select 
                      value={psikotesResult}
                      onChange={(e) => setPsikotesResult(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                    >
                      <option value="">Pilih Hasil...</option>
                      <option value="Approve">Approve</option>
                      <option value="Not Interest">Not Interest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Psikotes <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={psikotesDate}
                      onChange={(e) => setPsikotesDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti Hasil Psikotes <span className="text-red-500">*</span></label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handlePsikotesFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handlePsikotesFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop dokumen hasil psikotes</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  
                  {psikotesFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {psikotesFile.type === "application/pdf" ? (
                        <iframe src={psikotesFile.base64} className="w-full h-full border-none bg-white" title="Bukti Psikotes" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={psikotesFile.base64} alt="Bukti" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {psikotesFile.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isTestSkill ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Technical Assessment Data
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Test Skill <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={testSkillDate}
                      onChange={(e) => setTestSkillDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Link Video Test Skill</label>
                    <input 
                      type="text" 
                      value={testSkillVideoLink}
                      onChange={(e) => setTestSkillVideoLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div className="border-t border-table-border pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-black">Bukti Test Skill</label>
                    <button onClick={addTestSkillProof} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                      + Tambah Bukti
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {testSkillProofs.map((proof, index) => (
                      <div key={index} className="flex flex-col gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl relative">
                        {testSkillProofs.length > 1 && (
                          <button onClick={() => removeTestSkillProof(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Title (Nama Bukti)</label>
                          <input 
                            type="text" 
                            value={proof.title}
                            onChange={(e) => handleTestSkillTitleChange(index, e.target.value)}
                            placeholder="e.g., Hasil Koding, Screenshot Desain..."
                            className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">File Bukti</label>
                          <div 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => handleTestSkillProofDrop(index, e)}
                            className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white"
                          >
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={(e) => handleTestSkillProofUpload(index, e)} />
                            <UploadCloud className="w-8 h-8 text-on-surface-variant mb-2" />
                            <p className="text-sm font-semibold text-black mb-1">Drag & Drop file di sini</p>
                            <p className="text-xs text-on-surface-variant">atau klik untuk memilih file (PDF, PNG, JPG)</p>
                          </div>
                          
                          {proof.file && (
                            <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[250px] relative group">
                              {proof.file.type === "application/pdf" ? (
                                <iframe src={proof.file.base64} className="w-full h-full border-none bg-white" title={proof.title || "Bukti"} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={proof.file.base64} alt={proof.title || "Bukti"} className="max-w-full max-h-full object-contain" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                                {proof.file.name}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-table-border pt-6">
                  <label className="block text-sm font-bold text-black mb-3">Upload File Hasil Penilaian Test Skill</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleTestSkillResultFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleTestSkillResultFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop dokumen hasil penilaian</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG (Max 5MB)</p>
                  </div>
                  
                  {testSkillResultFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px]">
                      {testSkillResultFile.type === "application/pdf" ? (
                        <iframe src={testSkillResultFile.base64} className="w-full h-full border-none" title="Bukti Hasil Penilaian" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={testSkillResultFile.base64} alt="Bukti Hasil Penilaian" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isUserInterview ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Interview Assessment (User)
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Result Status <span className="text-red-500">*</span></label>
                    <select 
                      value={userInterviewResult}
                      onChange={(e) => setUserInterviewResult(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                    >
                      <option value="">Pilih Status...</option>
                      <option value="Approve">Approve</option>
                      <option value="Not Interest">Not Interest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Interview <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={userInterviewDate}
                      onChange={(e) => setUserInterviewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Interviewer Notes <span className="text-red-500">*</span></label>
                  <textarea 
                    value={userInterviewFeedback}
                    onChange={(e) => setUserInterviewFeedback(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan catatan atau feedback dari proses interview user..."
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload File Hasil Penilaian Interview <span className="text-red-500">*</span></label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleUserInterviewFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleUserInterviewFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop file penilaian user</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 5MB)</p>
                  </div>
                  
                  {userInterviewFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {userInterviewFile.type === "application/pdf" ? (
                        <iframe src={userInterviewFile.base64} className="w-full h-full border-none bg-white" title="Bukti Interview User" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={userInterviewFile.base64} alt="Bukti" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {userInterviewFile.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isOfferingLetter ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Offering Letter Assessment
              </h3>

              {/* Candidate Response Status Banner */}
              {application?.offeringLetter?.candidateResponse && (
                <div className="mb-4">
                  {application.offeringLetter.candidateResponse.status === "ACCEPTED" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span>Kandidat Menyetujui Offering Letter (Signed OL Telah Diunggah)</span>
                        </div>
                        <span className="text-xs text-emerald-600 font-mono">
                          {new Date(application.offeringLetter.candidateResponse.signedAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                      {application.offeringLetter.candidateResponse.note && (
                        <p className="text-xs text-emerald-700 mt-2 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                          <strong>Catatan Kandidat:</strong> {application.offeringLetter.candidateResponse.note}
                        </p>
                      )}
                      {application.offeringLetter.candidateResponse.signedFile && (
                        <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {application.offeringLetter.candidateResponse.signedFile.name}
                            </span>
                          </div>
                          <a
                            href={application.offeringLetter.candidateResponse.signedFile.base64 || `/api/file?key=${encodeURIComponent(application.offeringLetter.candidateResponse.signedFile.objectKey || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh Signed OL
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {application.offeringLetter.candidateResponse.status === "DECLINED_REVIEW_REQUIRED" && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                          <span>PERHATIAN: Kandidat Menolak Penawaran Kerja (Offer Declined)</span>
                        </div>
                        <span className="text-xs text-red-600 font-mono">
                          {new Date(application.offeringLetter.candidateResponse.declinedAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="mt-2.5 bg-white p-3 rounded-lg border border-red-200 text-xs">
                        <span className="font-bold text-red-800">Alasan Penolakan dari Kandidat:</span>
                        <p className="mt-1 text-sm text-gray-900 font-medium whitespace-pre-wrap">
                          "{application.offeringLetter.candidateResponse.note}"
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAcceptDecline}
                          className="px-3.5 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Ban className="w-3.5 h-3.5" /> Terima Penolakan (Tolak Kandidat)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMoveJobModal(true)}
                          className="px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <ArrowRight className="w-3.5 h-3.5" /> Pindahkan ke Lowongan Lain
                        </button>
                      </div>
                    </div>
                  )}

                  {application.offeringLetter.candidateResponse.status === "REJECTED_FINAL" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
                      <span className="font-bold">Status Penolakan:</span> Telah disetujui recruiter. {application.offeringLetter.candidateResponse.resolutionNote || ''}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Offering Letter <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={offeringDate}
                    onChange={(e) => setOfferingDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Dokumen Offering Letter <span className="text-red-500">*</span></label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleOfferingFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleOfferingFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop file offering letter</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 2MB)</p>
                  </div>
                  
                  {offeringFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {offeringFile.type === "application/pdf" ? (
                        <iframe src={offeringFile.base64} className="w-full h-full border-none bg-white" title="Dokumen Offering Letter" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={offeringFile.base64} alt="Offering Letter" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {offeringFile.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isMcu ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. MCU Verification Details
              </h3>

              {/* Candidate MCU Proof Banner */}
              {application?.mcu?.candidateProof?.file && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span>Kandidat Mengunggah Bukti Kehadiran / Kwitansi MCU</span>
                    </div>
                    <span className="text-xs text-blue-600 font-mono">
                      {new Date(application.mcu.candidateProof.uploadedAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {application.mcu.candidateProof.notes && (
                    <p className="text-xs text-blue-800 mt-2 bg-white/70 p-2.5 rounded-lg border border-blue-100">
                      <strong>Catatan Kandidat:</strong> {application.mcu.candidateProof.notes}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {application.mcu.candidateProof.file.name}
                      </span>
                    </div>
                    <a
                      href={application.mcu.candidateProof.file.base64 || `/api/file?key=${encodeURIComponent(application.mcu.candidateProof.file.objectKey || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Bukti MCU
                    </a>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan MCU <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={mcuDate}
                    onChange={(e) => setMcuDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div className="border-t border-table-border pt-4 mt-4 flex flex-col gap-6">
                  {/* Pengantar MCU */}
                  <div>
                    <label className="block text-xs font-bold text-black mb-3">Surat Pengantar MCU <span className="text-red-500">*</span></label>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={handleMcuPengantarFileDrop}
                      className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                    >
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleMcuPengantarFileUpload} />
                      <UploadCloud className="w-6 h-6 text-on-surface-variant mb-2" />
                      <p className="text-xs font-semibold text-black">Upload / Drop File</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                    </div>
                    
                    {mcuPengantarFile && (
                      <div className="mt-2 border border-outline-variant rounded-xl overflow-hidden h-[250px] relative group">
                        {mcuPengantarFile.type === "application/pdf" ? (
                          <iframe src={mcuPengantarFile.base64} className="w-full h-full border-none bg-white" title="Surat Pengantar MCU" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mcuPengantarFile.base64} alt="Pengantar MCU" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate backdrop-blur-sm">
                          {mcuPengantarFile.name}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hasil MCU */}
                  <div>
                    <label className="block text-xs font-bold text-black mb-3">Hasil MCU</label>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={handleMcuHasilFileDrop}
                      className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                    >
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleMcuHasilFileUpload} />
                      <UploadCloud className="w-6 h-6 text-on-surface-variant mb-2" />
                      <p className="text-xs font-semibold text-black">Upload / Drop File</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                    </div>
                    
                    {mcuHasilFile && (
                      <div className="mt-2 border border-outline-variant rounded-xl overflow-hidden h-[250px] relative group">
                        {mcuHasilFile.type === "application/pdf" ? (
                          <iframe src={mcuHasilFile.base64} className="w-full h-full border-none bg-white" title="Hasil MCU" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mcuHasilFile.base64} alt="Hasil MCU" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate backdrop-blur-sm">
                          {mcuHasilFile.name}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hasil Follow Up MCU */}
                  <div>
                    <label className="block text-xs font-bold text-black mb-3">Hasil Follow-Up MCU</label>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={handleMcuFollowUpFileDrop}
                      className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                    >
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleMcuFollowUpFileUpload} />
                      <UploadCloud className="w-6 h-6 text-on-surface-variant mb-2" />
                      <p className="text-xs font-semibold text-black">Upload / Drop File</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                    </div>
                    
                    {mcuFollowUpFile && (
                      <div className="mt-2 border border-outline-variant rounded-xl overflow-hidden h-[250px] relative group">
                        {mcuFollowUpFile.type === "application/pdf" ? (
                          <iframe src={mcuFollowUpFile.base64} className="w-full h-full border-none bg-white" title="Hasil Follow-Up MCU" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mcuFollowUpFile.base64} alt="Follow-Up MCU" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate backdrop-blur-sm">
                          {mcuFollowUpFile.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : isTrainingUser ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Training Verification & Schedule
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan Training <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input 
                        type="date" 
                        value={trainingDate}
                        onChange={(e) => setTrainingDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                      />
                    </div>
                    {trainingHistory.length > 0 && (
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={trainingReason}
                          onChange={(e) => setTrainingReason(e.target.value)}
                          placeholder="Reason for change..."
                          className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                        />
                      </div>
                    )}
                    <button 
                      onClick={handleUpdateTrainingSchedule}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors whitespace-nowrap"
                    >
                      {trainingHistory.length > 0 ? "Update Schedule" : "Save Schedule"}
                    </button>
                  </div>
                </div>

                {trainingHistory.length > 0 && (
                  <div className="border border-table-border rounded-xl overflow-hidden mt-4">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-surface-container-lowest text-xs uppercase font-bold text-on-surface-variant">
                        <tr>
                          <th className="px-4 py-3">Original Date</th>
                          <th className="px-4 py-3">Revised Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Reason for Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-table-border">
                        {trainingHistory.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-3">{item.originalDate}</td>
                            <td className="px-4 py-3">{item.revisedDate}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-table-border pt-6 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti Pengajuan Training User</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleTrainingFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleTrainingFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop bukti pengajuan</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 2MB)</p>
                  </div>
                  
                  {trainingFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {trainingFile.type === "application/pdf" ? (
                        <iframe src={trainingFile.base64} className="w-full h-full border-none bg-white" title="Bukti Pengajuan Training User" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={trainingFile.base64} alt="Bukti Training" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {trainingFile.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isInduction ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Verification Submission
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan Induksi <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input 
                        type="date" 
                        value={inductionDate}
                        onChange={(e) => setInductionDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                      />
                    </div>
                    {inductionHistory.length > 0 && (
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={inductionReason}
                          onChange={(e) => setInductionReason(e.target.value)}
                          placeholder="Reason for change..."
                          className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                        />
                      </div>
                    )}
                    <button 
                      onClick={handleUpdateInductionSchedule}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors whitespace-nowrap"
                    >
                      {inductionHistory.length > 0 ? "Update Schedule" : "Save Schedule"}
                    </button>
                  </div>
                </div>

                {inductionHistory.length > 0 && (
                  <div className="border border-table-border rounded-xl overflow-hidden mt-4">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-surface-container-lowest text-xs uppercase font-bold text-on-surface-variant">
                        <tr>
                          <th className="px-4 py-3">Original Date</th>
                          <th className="px-4 py-3">Revised Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Reason for Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-table-border">
                        {inductionHistory.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-3">{item.originalDate}</td>
                            <td className="px-4 py-3">{item.revisedDate}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-table-border pt-6 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti Pengajuan Induksi</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleInductionFileDrop}
                    className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                  >
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handleInductionFileUpload} />
                    <UploadCloud className="w-10 h-10 text-on-surface-variant mb-3" />
                    <p className="text-base font-semibold text-black mb-1">Drag & Drop bukti pengajuan</p>
                    <p className="text-sm text-on-surface-variant">atau klik area ini untuk menelusuri komputer Anda</p>
                    <p className="text-xs text-on-surface-variant mt-2 font-mono">PDF, PNG, JPG, JPEG (Max 2MB)</p>
                  </div>
                  
                  {inductionFile && (
                    <div className="mt-4 border border-outline-variant rounded-xl overflow-hidden h-[300px] relative group">
                      {inductionFile.type === "application/pdf" ? (
                        <iframe src={inductionFile.base64} className="w-full h-full border-none bg-white" title="Bukti Pengajuan Induksi" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={inductionFile.base64} alt="Bukti Induksi" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate backdrop-blur-sm">
                        {inductionFile.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isPkwt ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Contract Duration
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Awal Kontrak <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={pkwtStartDate}
                      onChange={(e) => setPkwtStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Akhir Kontrak <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={pkwtEndDate}
                      onChange={(e) => setPkwtEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div className="border-t border-table-border pt-6 mt-4">
                  <h3 className="text-sm font-bold text-black flex items-center gap-2 mb-4">
                     Mandatory Onboarding Documents
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Berkas PKWT */}
                    <div>
                      <label className="block text-xs font-bold text-black mb-2">Berkas PKWT (Signed) <span className="text-red-500">*</span></label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handlePkwtFileDrop}
                        className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                      >
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handlePkwtFileUpload} />
                        <UploadCloud className="w-6 h-6 text-on-surface-variant mb-1" />
                        <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                      </div>
                      {pkwtFile && (
                        <div className="mt-2 border border-outline-variant rounded-lg overflow-hidden h-32 relative group">
                          {pkwtFile.type === "application/pdf" ? (
                            <iframe src={pkwtFile.base64} className="w-full h-full border-none bg-white" title="PKWT Signed" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1"><img src={pkwtFile.base64} alt="PKWT Signed" className="max-w-full max-h-full object-contain" /></div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate">{pkwtFile.name}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Safety Induction */}
                    <div>
                      <label className="block text-xs font-bold text-black mb-2">Hasil Safety Induction</label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handlePkwtSafetyFileDrop}
                        className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                      >
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handlePkwtSafetyFileUpload} />
                        <UploadCloud className="w-6 h-6 text-on-surface-variant mb-1" />
                        <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                      </div>
                      {pkwtSafetyFile && (
                        <div className="mt-2 border border-outline-variant rounded-lg overflow-hidden h-32 relative group">
                          {pkwtSafetyFile.type === "application/pdf" ? (
                            <iframe src={pkwtSafetyFile.base64} className="w-full h-full border-none bg-white" title="Safety Induction" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1"><img src={pkwtSafetyFile.base64} alt="Safety Induction" className="max-w-full max-h-full object-contain" /></div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate">{pkwtSafetyFile.name}</div>
                        </div>
                      )}
                    </div>

                    {/* NEOP */}
                    <div>
                      <label className="block text-xs font-bold text-black mb-2">Berkas NEOP</label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handlePkwtNeopFileDrop}
                        className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                      >
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handlePkwtNeopFileUpload} />
                        <UploadCloud className="w-6 h-6 text-on-surface-variant mb-1" />
                        <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                      </div>
                      {pkwtNeopFile && (
                        <div className="mt-2 border border-outline-variant rounded-lg overflow-hidden h-32 relative group">
                          {pkwtNeopFile.type === "application/pdf" ? (
                            <iframe src={pkwtNeopFile.base64} className="w-full h-full border-none bg-white" title="NEOP" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1"><img src={pkwtNeopFile.base64} alt="NEOP" className="max-w-full max-h-full object-contain" /></div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate">{pkwtNeopFile.name}</div>
                        </div>
                      )}
                    </div>

                    {/* MCU */}
                    <div>
                      <label className="block text-xs font-bold text-black mb-2">Berkas MCU Akhir</label>
                      <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handlePkwtMcuFileDrop}
                        className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest"
                      >
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf, .png, .jpg, .jpeg" onChange={handlePkwtMcuFileUpload} />
                        <UploadCloud className="w-6 h-6 text-on-surface-variant mb-1" />
                        <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Max 2MB</p>
                      </div>
                      {pkwtMcuFile && (
                        <div className="mt-2 border border-outline-variant rounded-lg overflow-hidden h-32 relative group">
                          {pkwtMcuFile.type === "application/pdf" ? (
                            <iframe src={pkwtMcuFile.base64} className="w-full h-full border-none bg-white" title="MCU Akhir" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest p-1"><img src={pkwtMcuFile.base64} alt="MCU Akhir" className="max-w-full max-h-full object-contain" /></div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate">{pkwtMcuFile.name}</div>
                        </div>
                      )}
                    </div>

                  </div>
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
          
          {/* Section 3: Recruitment History */}
          <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
            <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-600" /> 3. Recruitment History
            </h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant before:to-transparent">
              {(() => {
                const combinedHistory = [
                  ...(application.history || []).map((h: any) => ({ ...h, type: 'stage' })),
                  ...(application.messages || []).map((m: any) => ({ ...m, type: 'message', stageName: 'Message Sent', note: m.text }))
                ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                return combinedHistory.length > 0 ? combinedHistory.map((hist: any, index: number) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${hist.type === 'message' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {hist.type === 'message' ? <MessageSquare className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-black text-sm">{hist.stageName}</h4>
                        <time className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-right">
                          {new Date(hist.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                      <p className="text-sm text-on-surface-variant mt-2">{hist.note || "Memasuki tahapan ini."}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-sm text-on-surface-variant relative z-10 bg-white border border-outline-variant rounded-xl mx-10">Belum ada riwayat terekam.</div>
                );
              })()}
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
                onClick={() => {
                  setActiveDocTab(tab);
                  setCustomPreviewFile(null);
                }}
                className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                  !customPreviewFile && activeDocTab === tab 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-on-surface-variant hover:text-black hover:bg-surface-container-lowest"
                }`}
              >
                {tab}
              </button>
            ))}
            {customPreviewFile && (
              <div className="px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 border-primary text-primary bg-primary/5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{customPreviewFile.name}</span>
                <button
                  type="button"
                  onClick={() => setCustomPreviewFile(null)}
                  className="hover:text-red-500 font-bold ml-1 text-slate-400 hover:bg-slate-200 rounded px-1"
                  title="Tutup pratinjau berkas stage"
                >
                  ×
                </button>
              </div>
            )}
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
                  .filter((r) => r.stageId === application.currentStageId)
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

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-table-border bg-surface-container-lowest flex items-center justify-between">
              <h3 className="font-bold text-blue-700 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Send Message to Candidate
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-black mb-4">
                Tuliskan pesan atau catatan yang ingin disampaikan kepada kandidat pada tahap ini.
              </p>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Message</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                placeholder="Tulis pesan..."
                className="w-full px-3 py-2 border border-outline-variant rounded focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-black bg-white"
              />
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageText("");
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Kirim Pesan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-table-border bg-surface-container-lowest flex justify-between items-center">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                Candidate Actions
              </h3>
              <button onClick={() => setShowActionModal(false)} className="p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-black rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {application.status === "HIRED" && !application.currentStageId ? (
                <div className="w-full px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-lg text-sm flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Seluruh Onboarding Selesai (Resmi Active Employee)</span>
                </div>
              ) : (
                <button onClick={() => { setShowActionModal(false); handleApproveNextStage(); }} className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {isMcu ? "Loloskan MCU & Tetapkan Hired" : isLastStage || isPkwt ? "Selesaikan Onboarding PKWT (Hired Selesai)" : "Approve to Next Stage"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => { setShowActionModal(false); handleApproveAll(); }} className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Approve All Stages</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowActionModal(false); setShowMessageModal(true); }} className="w-full px-5 py-3 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                <MessageSquare className="w-5 h-5" /> Send Message
              </button>
              <a href={`https://wa.me/${profile?.whatsapp?.replace(/\D/g, '') || ''}`} target="_blank" rel="noopener noreferrer" onClick={() => setShowActionModal(false)} className="w-full px-5 py-3 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                <MessageSquare className="w-5 h-5" /> Message in WhatsApp
              </a>
              <div className="h-px bg-outline-variant my-1"></div>
              <button onClick={() => { setShowActionModal(false); setShowRejectModal(true); }} className="w-full px-5 py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                <Ban className="w-5 h-5" /> Reject Candidate
              </button>
              <button onClick={() => { setShowActionModal(false); setShowBlacklistModal(true); }} className="w-full px-5 py-3 border border-slate-700 text-slate-800 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                <UserX className="w-5 h-5" /> Blacklist Candidate
              </button>
              <button onClick={() => { setShowActionModal(false); setShowMoveJobModal(true); }} className="w-full px-5 py-3 border border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                <ArrowRight className="w-5 h-5" /> Move Candidate to Other Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-table-border bg-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserX className="w-5 h-5" /> Blacklist Candidate
              </h3>
              <button onClick={() => setShowBlacklistModal(false)} className="p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-black mb-4">
                Are you sure you want to blacklist <strong>{profile?.fullName}</strong>? This will reject their current application and mark them as blacklisted across the system.
              </p>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Blacklist Note / Reason</label>
              <textarea
                value={blacklistNote}
                onChange={(e) => setBlacklistNote(e.target.value)}
                rows={4}
                placeholder="Enter reason for blacklisting..."
                className="w-full px-3 py-2 border border-outline-variant rounded focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 text-sm text-black bg-white"
              />
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBlacklistModal(false);
                  setBlacklistNote("");
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlacklistCandidate}
                disabled={!blacklistNote.trim()}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <UserX className="w-4 h-4" /> Confirm Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Job Modal */}
      {showMoveJobModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-table-border bg-amber-500 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRight className="w-5 h-5" /> Move Candidate
              </h3>
              <button onClick={() => setShowMoveJobModal(false)} className="p-1.5 text-white/80 hover:bg-amber-600 hover:text-white rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-black mb-4">
                Select an active job opening to move <strong>{profile?.fullName}</strong> to. The candidate will need to approve this move on their dashboard.
              </p>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Target Job Opening</label>
              <select
                value={selectedMoveJobId}
                onChange={(e) => setSelectedMoveJobId(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm text-black bg-white"
              >
                <option value="">-- Select Job --</option>
                {activeJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.positionName || j.position?.name} (Ref: {j.noRegistrasi})
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveJobModal(false);
                  setSelectedMoveJobId("");
                }}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveCandidateRequest}
                disabled={!selectedMoveJobId}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Send Proposal
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
