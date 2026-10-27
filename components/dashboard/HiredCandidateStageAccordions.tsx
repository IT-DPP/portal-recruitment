"use client";

import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  FileText, 
  Calendar, 
  Download, 
  Eye, 
  ShieldCheck, 
  Award, 
  UserCheck, 
  HeartPulse, 
  Briefcase, 
  FolderCheck,
  ExternalLink,
  Layers
} from "lucide-react";
import MultipleDocumentStoreWidget, { StoredDocument } from "./MultipleDocumentStoreWidget";

interface HiredCandidateStageAccordionsProps {
  application: any;
  currentStageId?: string;
  // Stage 1: BNSP
  bnspData: {
    skema?: string;
    certNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    isApproved?: boolean;
    file?: any;
  };
  // Stage 2: HR Interview
  hrInterviewData: {
    result?: string;
    date?: string;
    feedback?: string;
    file?: any;
    resultFile?: any;
  };
  // Stage 3: Psikotes
  psikotesData: {
    result?: string;
    date?: string;
    file?: any;
  };
  // Stage 4: Test Skill
  testSkillData: {
    date?: string;
    videoLink?: string;
    proofs?: any[];
    resultFile?: any;
  };
  // Stage 5: User Interview
  userInterviewData: {
    result?: string;
    date?: string;
    feedback?: string;
    file?: any;
  };
  // Stage 6: Offering Letter
  offeringData: {
    date?: string;
    file?: any;
  };
  // Stage 7: MCU
  mcuData: {
    date?: string;
    pengantarFile?: any;
    hasilFile?: any;
    followUpFile?: any;
  };
  // Stages 8, 9, 10 Document Stores
  trainingDocs: StoredDocument[];
  onTrainingDocsChange: (docs: StoredDocument[]) => void;
  inductionDocs: StoredDocument[];
  onInductionDocsChange: (docs: StoredDocument[]) => void;
  pkwtDocs: StoredDocument[];
  onPkwtDocsChange: (docs: StoredDocument[]) => void;
  onPreviewFile: (file: { name: string; base64?: string; fileUrl?: string; type?: string }) => void;
}

export default function HiredCandidateStageAccordions({
  application,
  currentStageId,
  bnspData,
  hrInterviewData,
  psikotesData,
  testSkillData,
  userInterviewData,
  offeringData,
  mcuData,
  trainingDocs,
  onTrainingDocsChange,
  inductionDocs,
  onInductionDocsChange,
  pkwtDocs,
  onPkwtDocsChange,
  onPreviewFile,
}: HiredCandidateStageAccordionsProps) {
  // Determine which accordion should be open by default
  const [openStages, setOpenStages] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      stage_1: false,
      stage_2: false,
      stage_3: false,
      stage_4: false,
      stage_5: false,
      stage_6: false,
      stage_7: true, // MCU open by default as proof of Hire
      stage_8: currentStageId === "stage_8",
      stage_9: currentStageId === "stage_9",
      stage_10: currentStageId === "stage_10" || currentStageId === "Hired" || !currentStageId,
    };
    return initial;
  });

  const toggleStage = (stageKey: string) => {
    setOpenStages(prev => ({
      ...prev,
      [stageKey]: !prev[stageKey]
    }));
  };

  const handleExpandAll = () => {
    setOpenStages({
      stage_1: true,
      stage_2: true,
      stage_3: true,
      stage_4: true,
      stage_5: true,
      stage_6: true,
      stage_7: true,
      stage_8: true,
      stage_9: true,
      stage_10: true,
    });
  };

  const handleCollapseAll = () => {
    setOpenStages({
      stage_1: false,
      stage_2: false,
      stage_3: false,
      stage_4: false,
      stage_5: false,
      stage_6: false,
      stage_7: false,
      stage_8: false,
      stage_9: false,
      stage_10: false,
    });
  };

  const renderFileActionButtons = (file: any, label: string) => {
    if (!file) return <span className="text-xs text-slate-400 italic">Tidak ada berkas</span>;
    const fileSrc = file.base64 || file.fileUrl;
    return (
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => onPreviewFile({ name: label, base64: fileSrc, fileUrl: file.fileUrl, type: file.type })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors border border-blue-200"
        >
          <Eye className="w-3.5 h-3.5" /> Preview {label}
        </button>
        {fileSrc && (
          <a
            href={fileSrc}
            download={file.name || label}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Accordion Controls */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Rekapitulasi Seluruh Tahapan Rekrutmen</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Hired Employee
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Kandidat dinyatakan <strong>HIRED</strong> di Stage MCU. Seluruh riwayat data stage 1–7 tersimpan permanen dan tahap 8–10 berfungsi sebagai rekap dokumentasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
            >
              Buka Semua
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* Accordion 1: CV Screening & BNSP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_1")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                CV Screening & Validasi Sertifikat BNSP
              </h4>
              <p className="text-[11px] text-slate-500">Tahap Administrasi & Kelayakan Dokumen</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {bnspData.isApproved ? "Approved" : "Verified"}
            </span>
            {openStages.stage_1 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_1 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Skema Sertifikasi</p>
              <p className="font-semibold text-slate-900 mt-0.5">{bnspData.skema || "-"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nomor Sertifikat</p>
              <p className="font-semibold font-mono text-slate-900 mt-0.5">{bnspData.certNumber || "-"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Masa Berlaku</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {bnspData.issueDate || "-"} s/d {bnspData.expiryDate || "-"}
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Berkas Bukti Validasi BNSP</p>
              {renderFileActionButtons(bnspData.file, "Bukti BNSP")}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: HR Interview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_2")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                HR Interview
              </h4>
              <p className="text-[11px] text-slate-500">Wawancara Kompetensi & Budaya</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {hrInterviewData.result || "Disetujui"}
            </span>
            {openStages.stage_2 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_2 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Hasil Keputusan HR</p>
                <p className="font-semibold text-slate-900 mt-0.5">{hrInterviewData.result || "-"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Wawancara</p>
                <p className="font-semibold text-slate-900 mt-0.5">{hrInterviewData.date || "-"}</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Feedback & Catatan HR</p>
              <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200 mt-1 whitespace-pre-wrap">
                {hrInterviewData.feedback || "Tidak ada catatan."}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bukti Wawancara</p>
                {renderFileActionButtons(hrInterviewData.file, "Bukti Wawancara HR")}
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Form Hasil Wawancara</p>
                {renderFileActionButtons(hrInterviewData.resultFile, "Hasil Penilaian HR")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Psikotes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_3")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Psikotes
              </h4>
              <p className="text-[11px] text-slate-500">Evaluasi Psikologis & Kepribadian</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {psikotesData.result || "Disarankan"}
            </span>
            {openStages.stage_3 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_3 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Hasil Psikotes</p>
              <p className="font-semibold text-slate-900 mt-0.5">{psikotesData.result || "-"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Tes</p>
              <p className="font-semibold text-slate-900 mt-0.5">{psikotesData.date || "-"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Laporan Berkas Psikotes</p>
              {renderFileActionButtons(psikotesData.file, "Hasil Psikotes")}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 4: Technical Test */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_4")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Technical / Skill Test
              </h4>
              <p className="text-[11px] text-slate-500">Uji Keahlian & Praktik Lapangan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Lulus
            </span>
            {openStages.stage_4 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_4 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Ujian Praktik</p>
                <p className="font-semibold text-slate-900 mt-0.5">{testSkillData.date || "-"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Link Rekaman Video Praktik</p>
                {testSkillData.videoLink ? (
                  <a
                    href={testSkillData.videoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold mt-0.5"
                  >
                    Buka Video <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-slate-400 mt-0.5">-</p>
                )}
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">Lembar Penilaian & Bukti Praktik</p>
              <div className="flex flex-wrap gap-2">
                {renderFileActionButtons(testSkillData.resultFile, "Lembar Penilaian Skill")}
                {testSkillData.proofs?.map((p, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {renderFileActionButtons(p.file, p.title || `Bukti ${pIdx + 1}`)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 5: User Interview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_5")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              5
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Interview User
              </h4>
              <p className="text-[11px] text-slate-500">Wawancara dengan User / Departemen Terkait</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {userInterviewData.result || "Disetujui User"}
            </span>
            {openStages.stage_5 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_5 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Hasil Rekomendasi User</p>
                <p className="font-semibold text-slate-900 mt-0.5">{userInterviewData.result || "-"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Wawancara</p>
                <p className="font-semibold text-slate-900 mt-0.5">{userInterviewData.date || "-"}</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Feedback & Catatan Teknis User</p>
              <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200 mt-1 whitespace-pre-wrap">
                {userInterviewData.feedback || "Tidak ada catatan."}
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bukti Wawancara User</p>
              {renderFileActionButtons(userInterviewData.file, "Bukti Wawancara User")}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 6: Offering Letter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_6")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              6
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Offering Letter
              </h4>
              <p className="text-[11px] text-slate-500">Penawaran Kontrak & Kompensasi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Signed & Accepted
            </span>
            {openStages.stage_6 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_6 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Penandatanganan Offering</p>
              <p className="font-semibold text-slate-900 mt-0.5">{offeringData.date || "-"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Berkas Offering Letter</p>
              {renderFileActionButtons(offeringData.file, "Offering Letter Signed")}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 7: Medical Check-Up (MCU) - THE HIRED GATE */}
      <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleStage("stage_7")}
          className="w-full p-4 flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              7
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Medical Check-Up (MCU)
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Hired Decision Gate
                </span>
              </h4>
              <p className="text-[11px] text-emerald-700 font-medium">Pemeriksaan Kesehatan Fisik & Laboratorium (Penetapan Karyawan)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> FIT TO WORK
            </span>
            {openStages.stage_7 ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5 text-emerald-700" />}
          </div>
        </button>

        {openStages.stage_7 && (
          <div className="p-5 border-t border-emerald-100 bg-white space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tanggal Pelaksanaan MCU</p>
                <p className="font-semibold text-slate-900 mt-0.5">{mcuData.date || "-"}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Keputusan Akhir MCU</p>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">FIT TO WORK (Status: HIRED)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Surat Pengantar MCU</p>
                {renderFileActionButtons(mcuData.pengantarFile, "Surat Pengantar")}
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Hasil Lab MCU</p>
                {renderFileActionButtons(mcuData.hasilFile, "Hasil Lab MCU")}
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Follow-Up MCU (Jika Ada)</p>
                {renderFileActionButtons(mcuData.followUpFile, "Follow-Up MCU")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 8: Training (Post-MCU Recap Store) */}
      <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${currentStageId === "stage_8" ? "border-primary ring-2 ring-primary/20" : "border-slate-200"}`}>
        <button
          type="button"
          onClick={() => toggleStage("stage_8")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${currentStageId === "stage_8" ? "bg-primary text-white" : "bg-blue-100 text-blue-700"}`}>
              8
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Training
                {currentStageId === "stage_8" && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-md uppercase">
                    Stage Aktif
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500">Rekapitulasi Dokumen Pelatihan & Sertifikasi Teknis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {trainingDocs.length} Dokumen Tersimpan
            </span>
            {openStages.stage_8 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_8 && (
          <div className="p-5 border-t border-slate-100 bg-white">
            <MultipleDocumentStoreWidget
              stageNumber={8}
              stageName="Training"
              documents={trainingDocs}
              onDocumentsChange={onTrainingDocsChange}
              onPreviewFile={onPreviewFile}
            />
          </div>
        )}
      </div>

      {/* Accordion 9: Induction (Post-MCU Recap Store) */}
      <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${currentStageId === "stage_9" ? "border-primary ring-2 ring-primary/20" : "border-slate-200"}`}>
        <button
          type="button"
          onClick={() => toggleStage("stage_9")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${currentStageId === "stage_9" ? "bg-primary text-white" : "bg-blue-100 text-blue-700"}`}>
              9
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Induction
                {currentStageId === "stage_9" && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-md uppercase">
                    Stage Aktif
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500">Rekapitulasi Dokumen Induksi K3 & Orientasi Perusahaan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {inductionDocs.length} Dokumen Tersimpan
            </span>
            {openStages.stage_9 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_9 && (
          <div className="p-5 border-t border-slate-100 bg-white">
            <MultipleDocumentStoreWidget
              stageNumber={9}
              stageName="Induction"
              documents={inductionDocs}
              onDocumentsChange={onInductionDocsChange}
              onPreviewFile={onPreviewFile}
            />
          </div>
        )}
      </div>

      {/* Accordion 10: PKWT (Post-MCU Recap Store) */}
      <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${currentStageId === "stage_10" || currentStageId === "Hired" ? "border-primary ring-2 ring-primary/20" : "border-slate-200"}`}>
        <button
          type="button"
          onClick={() => toggleStage("stage_10")}
          className="w-full p-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${currentStageId === "stage_10" || currentStageId === "Hired" ? "bg-primary text-white" : "bg-blue-100 text-blue-700"}`}>
              10
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                PKWT (Perjanjian Kerja Waktu Tertentu)
                {(currentStageId === "stage_10" || currentStageId === "Hired") && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-md uppercase">
                    Tahap Akhir Onboarding
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500">Rekapitulasi Berkas Kontrak Kerja, NEOP, & Dokumen Onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {pkwtDocs.length} Dokumen Tersimpan
            </span>
            {openStages.stage_10 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {openStages.stage_10 && (
          <div className="p-5 border-t border-slate-100 bg-white">
            <MultipleDocumentStoreWidget
              stageNumber={10}
              stageName="PKWT"
              documents={pkwtDocs}
              onDocumentsChange={onPkwtDocsChange}
              onPreviewFile={onPreviewFile}
            />
          </div>
        )}
      </div>
    </div>
  );
}
