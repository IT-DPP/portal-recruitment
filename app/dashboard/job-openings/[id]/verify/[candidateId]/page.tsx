"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FileText, Download, Printer, Search, AlertCircle, Save, CheckCircle, Ban, ArrowRight, ArrowLeft, XCircle, UploadCloud, MessageSquare, Send, ChevronDown, UserX } from "lucide-react";
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
        setBnspFile(foundApp.bnspValidation.file || null);
      }
      if (foundApp.hrInterview) {
        setInterviewResult(foundApp.hrInterview.result || "");
        setInterviewDate(foundApp.hrInterview.date || "");
        setInterviewFeedback(foundApp.hrInterview.feedback || "");
        setInterviewFile(foundApp.hrInterview.file || null);
        setInterviewResultFile(foundApp.hrInterview.resultFile || null);
      }
      if (foundApp.psikotes) {
        setPsikotesResult(foundApp.psikotes.result || "");
        setPsikotesDate(foundApp.psikotes.date || "");
        setPsikotesFile(foundApp.psikotes.file || null);
      }
      if (foundApp.testSkill) {
        setTestSkillDate(foundApp.testSkill.date || "");
        setTestSkillProofs(foundApp.testSkill.proofs || [{ title: "", file: null }]);
        setTestSkillResultFile(foundApp.testSkill.resultFile || null);
      }
      if (foundApp.userInterview) {
        setUserInterviewResult(foundApp.userInterview.result || "");
        setUserInterviewDate(foundApp.userInterview.date || "");
        setUserInterviewFeedback(foundApp.userInterview.feedback || "");
        setUserInterviewFile(foundApp.userInterview.file || null);
      }
      if (foundApp.offeringLetter) {
        setOfferingDate(foundApp.offeringLetter.date || "");
        setOfferingFile(foundApp.offeringLetter.file || null);
      }
      if (foundApp.mcu) {
        setMcuDate(foundApp.mcu.date || "");
        setMcuPengantarFile(foundApp.mcu.pengantarFile || null);
        setMcuHasilFile(foundApp.mcu.hasilFile || null);
        setMcuFollowUpFile(foundApp.mcu.followUpFile || null);
      }
      if (foundApp.trainingUser) {
        setTrainingDate(foundApp.trainingUser.date || "");
        setTrainingFile(foundApp.trainingUser.file || null);
        setTrainingHistory(foundApp.trainingUser.history || []);
      }
      if (foundApp.induction) {
        setInductionDate(foundApp.induction.date || "");
        setInductionFile(foundApp.induction.file || null);
        setInductionHistory(foundApp.induction.history || []);
      }
      if (foundApp.pkwt) {
        setPkwtStartDate(foundApp.pkwt.startDate || "");
        setPkwtEndDate(foundApp.pkwt.endDate || "");
        setPkwtFile(foundApp.pkwt.file || null);
        setPkwtSafetyFile(foundApp.pkwt.safetyFile || null);
        setPkwtNeopFile(foundApp.pkwt.neopFile || null);
        setPkwtMcuFile(foundApp.pkwt.mcuFile || null);
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
  const isPsikotes = currentStageName.toLowerCase().includes("psikotes") || currentStageName.toLowerCase().includes("psychotest") || currentStageName.toLowerCase().includes("psychological");
  const isTestSkill = currentStageName.toLowerCase().includes("test skill") || currentStageName.toLowerCase().includes("technical assessment");
  const isUserInterview = currentStageName.toLowerCase().includes("user interview");
  const isOfferingLetter = currentStageName.toLowerCase().includes("offering");
  const isMcu = currentStageName.toLowerCase().includes("mcu") || currentStageName.toLowerCase().includes("medical");
  const isTrainingUser = currentStageName.toLowerCase().includes("training") || application.currentStage === "stage_8";
  const isInduction = currentStageName.toLowerCase().includes("induction") || application.currentStage === "stage_9";
  const isPkwt = currentStageName.toLowerCase().includes("pkwt") || application.currentStage === "stage_10" || application.currentStage === "Hired";

  const safeSaveApplications = (allApps: any[], silent = false) => {
    try {
      localStorage.setItem("ugz_applications", JSON.stringify(allApps));
      return true;
    } catch (e: any) {
      console.error("Storage quota exceeded", e);
      if (!silent) {
        window.alert("Gagal menyimpan: Kapasitas penyimpanan browser penuh. Harap unggah file dengan ukuran lebih kecil (maks. 1-2MB).");
      }
      return false;
    }
  };

  const handleSaveDraftSilent = () => {
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    if (appIndex !== -1) {
      if (isAdministration) {
        allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved, file: bnspFile };
      } else if (isHrInterview) {
        allApps[appIndex].hrInterview = { result: interviewResult, date: interviewDate, feedback: interviewFeedback, file: interviewFile, resultFile: interviewResultFile };
      } else if (isPsikotes) {
        allApps[appIndex].psikotes = { result: psikotesResult, date: psikotesDate, file: psikotesFile };
      } else if (isTestSkill) {
        allApps[appIndex].testSkill = { date: testSkillDate, proofs: testSkillProofs, resultFile: testSkillResultFile };
      } else if (isUserInterview) {
        allApps[appIndex].userInterview = { result: userInterviewResult, date: userInterviewDate, feedback: userInterviewFeedback, file: userInterviewFile };
      } else if (isOfferingLetter) {
        allApps[appIndex].offeringLetter = { date: offeringDate, file: offeringFile };
      } else if (isMcu) {
        allApps[appIndex].mcu = { date: mcuDate, pengantarFile: mcuPengantarFile, hasilFile: mcuHasilFile, followUpFile: mcuFollowUpFile };
      } else if (isTrainingUser) {
        allApps[appIndex].trainingUser = { date: trainingDate, file: trainingFile, history: trainingHistory };
      } else if (isInduction) {
        allApps[appIndex].induction = { date: inductionDate, file: inductionFile, history: inductionHistory };
      } else if (isPkwt) {
        allApps[appIndex].pkwt = { startDate: pkwtStartDate, endDate: pkwtEndDate, file: pkwtFile, safetyFile: pkwtSafetyFile, neopFile: pkwtNeopFile, mcuFile: pkwtMcuFile };
      }
      safeSaveApplications(allApps, true);
    }
  };

  const handleToggleApprove = () => {
    const newIsApproved = !isApproved;
    setIsApproved(newIsApproved);

    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    
    if (appIndex !== -1) {
      if (isAdministration) {
        allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved: newIsApproved, file: bnspFile };
      }
      safeSaveApplications(allApps);
    }
  };

  const handleDraftMark = () => {
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    if (appIndex !== -1) {
      if (isAdministration) {
        allApps[appIndex].bnspValidation = { skema, issueDate, expiryDate, certNumber, isApproved, file: bnspFile };
      } else if (isHrInterview) {
        allApps[appIndex].hrInterview = { result: interviewResult, date: interviewDate, feedback: interviewFeedback, file: interviewFile, resultFile: interviewResultFile };
      } else if (isPsikotes) {
        allApps[appIndex].psikotes = { result: psikotesResult, date: psikotesDate, file: psikotesFile };
      } else if (isTestSkill) {
        allApps[appIndex].testSkill = { date: testSkillDate, proofs: testSkillProofs, resultFile: testSkillResultFile };
      } else if (isUserInterview) {
        allApps[appIndex].userInterview = { result: userInterviewResult, date: userInterviewDate, feedback: userInterviewFeedback, file: userInterviewFile };
      } else if (isOfferingLetter) {
        allApps[appIndex].offeringLetter = { date: offeringDate, file: offeringFile };
      } else if (isMcu) {
        allApps[appIndex].mcu = { date: mcuDate, pengantarFile: mcuPengantarFile, hasilFile: mcuHasilFile, followUpFile: mcuFollowUpFile };
      } else if (isTrainingUser) {
        allApps[appIndex].trainingUser = { date: trainingDate, file: trainingFile, history: trainingHistory };
      } else if (isInduction) {
        allApps[appIndex].induction = { date: inductionDate, file: inductionFile, history: inductionHistory };
      } else if (isPkwt) {
        allApps[appIndex].pkwt = { startDate: pkwtStartDate, endDate: pkwtEndDate, file: pkwtFile, safetyFile: pkwtSafetyFile, neopFile: pkwtNeopFile, mcuFile: pkwtMcuFile };
      }
      allApps[appIndex].isDraft = true;
      if (safeSaveApplications(allApps)) {
        window.alert("Saved as Draft successfully.");
        router.push(`/dashboard/job-openings/${job.id}`);
      }
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
        if (safeSaveApplications(allApps)) {
          window.alert(`Candidate approved and moved to ${nextStage.title}.`);
          router.push(`/dashboard/job-openings/${job.id}`);
        }
      } else {
        if (isPkwt) {
          app.currentStage = "Hired";
          app.isDraft = false;
          if (!app.history) app.history = [];
          app.history.push({
            stageId: "Hired",
            stageName: "Hired / Employee",
            date: new Date().toISOString(),
            note: "Candidate successfully hired."
          });
          if (safeSaveApplications(allApps)) {
            window.alert(`Candidate successfully hired and marked as Employee!`);
            router.push(`/dashboard/job-openings/${job.id}`);
          }
        } else {
          window.alert("Candidate is already at the last stage.");
        }
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
      
      if (safeSaveApplications(allApps)) {
        window.alert("Kandidat berhasil ditolak (Rejected) dan diarsipkan.");
        router.push(`/dashboard/job-openings/${job.id}`);
      }
    }
  };

  const handleBlacklistCandidate = () => {
    if (!blacklistNote.trim()) {
      window.alert("Please provide a note for blacklisting.");
      return;
    }
    
    // Update Profile
    const profiles = JSON.parse(localStorage.getItem("ugz_candidate_profiles") || "{}");
    const candidateProfile = profiles[unwrappedParams.candidateId];
    if (candidateProfile) {
      candidateProfile.isBlacklisted = true;
      candidateProfile.blacklistNote = blacklistNote;
      candidateProfile.blacklistedDate = new Date().toISOString();
      localStorage.setItem("ugz_candidate_profiles", JSON.stringify(profiles));
      
      setProfile(candidateProfile);
    }
    
    // Set application status to Rejected (Blacklisted)
    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);
    
    if (appIndex !== -1) {
      const app = allApps[appIndex];
      const stageName = job.timeline?.find((t: any) => t.id === app.currentStage)?.title || app.currentStage;
      
      app.currentStage = "Rejected";
      app.isDraft = false;
      if (!app.history) app.history = [];
      app.history.push({
        stageId: "Rejected",
        stageName: `Rejected (Blacklisted) at ${stageName}`,
        date: new Date().toISOString(),
        note: `Blacklisted: ${blacklistNote}`
      });
      
      if (safeSaveApplications(allApps)) {
        setShowBlacklistModal(false);
        window.alert("Candidate has been blacklisted.");
        router.push(`/dashboard/blacklist`);
      }
    }
  };

  const handleMoveCandidateRequest = () => {
    if (!selectedMoveJobId) {
      window.alert("Please select a target job opening.");
      return;
    }

    const proposals = JSON.parse(localStorage.getItem("ugz_job_move_proposals") || "[]");
    
    // Check if there's already a pending proposal for this candidate and this source job
    const existingPending = proposals.find((p: any) => 
      p.candidateId === unwrappedParams.candidateId && 
      p.fromJobId === job.id && 
      p.status === "Pending"
    );

    if (existingPending) {
      window.alert("There is already a pending job move proposal for this candidate.");
      return;
    }

    const newProposal = {
      id: `jmp-${Math.random().toString(36).substr(2, 9)}`,
      candidateId: unwrappedParams.candidateId,
      fromJobId: job.id,
      toJobId: selectedMoveJobId,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    proposals.push(newProposal);
    try {
      localStorage.setItem("ugz_job_move_proposals", JSON.stringify(proposals));
      window.alert("Move request sent successfully. Waiting for candidate approval.");
      setShowMoveJobModal(false);
      setSelectedMoveJobId("");
      setShowActionModal(false);
    } catch (e) {
      console.error("Failed to save proposal", e);
      window.alert("Failed to send move request.");
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const allApps = JSON.parse(localStorage.getItem("ugz_applications") || "[]");
    const appIndex = allApps.findIndex((a: any) => a.id === application.id);

    if (appIndex !== -1) {
      const app = allApps[appIndex];
      if (!app.messages) app.messages = [];
      app.messages.push({
        stage: app.currentStage,
        text: messageText,
        date: new Date().toISOString()
      });

      if (safeSaveApplications(allApps)) {
        window.alert("Pesan berhasil dikirim ke kandidat.");
        setShowMessageModal(false);
        setMessageText("");
      }
    }
  };

  const handleApproveAll = () => {
    handleSaveDraftSilent();
    window.alert("All verification approved. Returning to Pipeline.");
    router.push(`/dashboard/job-openings/${job.id}`);
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

  const processUploadedFile = (file: File, callback: (data: {name: string, base64: string, type: string}) => void) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      window.alert("Format file tidak didukung. Harap unggah PDF, PNG, atau JPG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      callback({
        name: file.name,
        base64: event.target?.result as string,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
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
              {application.currentStage === "Hired" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">Employee</span>
              )}
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
          
          {/* Section 1: Dynamic based on Stage */}
          {isAdministration ? (
            <div className="bg-white rounded-2xl shadow-sm border border-table-border p-6 flex-1">
              <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-blue-600" /> 1. Sertifikat BNSP Validation
              </h3>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Upload Bukti File Validasi BNSP */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti File Validasi BNSP</label>
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

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti Interview HR</label>
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
                  <label className="block text-sm font-bold text-black mb-3">Upload Hasil Penilaian Interview</label>
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Hasil Psikotes</label>
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Psikotes</label>
                    <input 
                      type="date" 
                      value={psikotesDate}
                      onChange={(e) => setPsikotesDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Bukti Hasil Psikotes</label>
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
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Test Skill</label>
                  <input 
                    type="date" 
                    value={testSkillDate}
                    onChange={(e) => setTestSkillDate(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Result Status</label>
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Interview</label>
                    <input 
                      type="date" 
                      value={userInterviewDate}
                      onChange={(e) => setUserInterviewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Interviewer Notes</label>
                  <textarea 
                    value={userInterviewFeedback}
                    onChange={(e) => setUserInterviewFeedback(e.target.value)}
                    rows={4}
                    placeholder="Tuliskan catatan atau feedback dari proses interview user..."
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload File Hasil Penilaian Interview</label>
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Offering Letter</label>
                  <input 
                    type="date" 
                    value={offeringDate}
                    onChange={(e) => setOfferingDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                  />
                </div>

                <div className="border-t border-table-border pt-4 mt-4">
                  <label className="block text-sm font-bold text-black mb-3">Upload Dokumen Offering Letter</label>
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan MCU</label>
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
                    <label className="block text-xs font-bold text-black mb-3">Surat Pengantar MCU</label>
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
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan Training</label>
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
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Pelaksanaan Induksi</label>
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
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Awal Kontrak</label>
                    <input 
                      type="date" 
                      value={pkwtStartDate}
                      onChange={(e) => setPkwtStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tanggal Akhir Kontrak</label>
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
                      <label className="block text-xs font-bold text-black mb-2">Berkas PKWT (Signed)</label>
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
              <button onClick={() => { setShowActionModal(false); handleApproveNextStage(); }} className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Approve to Next Stage</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowActionModal(false); handleApproveAll(); }} className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Approve All Stages</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowActionModal(false); setShowMessageModal(true); }} className="w-full px-5 py-3 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm">
                <MessageSquare className="w-5 h-5" /> Send Message
              </button>
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
                    {j.posisi} (Ref: {j.noRegistrasi})
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
