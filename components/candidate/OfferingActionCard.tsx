"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Send,
  Loader2,
  Calendar,
  ShieldCheck,
  ArrowRightLeft,
  Building2,
  MapPin,
} from "lucide-react";
import { submitOfferingResponse, respondToJobMoveProposal } from "@/app/actions/candidate-application";
import { getUploadUrl } from "@/app/actions/candidate-profile";

interface OfferingActionCardProps {
  applicationId: string;
  jobId: string;
  offeringData: any;
  currentStageName: string;
  moveProposalData?: any;
  onRefresh?: () => void;
}

export default function OfferingActionCard({
  applicationId,
  jobId,
  offeringData,
  currentStageName,
  moveProposalData,
  onRefresh,
}: OfferingActionCardProps) {
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isAcceptMoveModalOpen, setIsAcceptMoveModalOpen] = useState(false);
  const [isDeclineMoveModalOpen, setIsDeclineMoveModalOpen] = useState(false);
  const [moveDeclineReason, setMoveDeclineReason] = useState("");
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [acceptNote, setAcceptNote] = useState("");
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const candidateResponse = offeringData?.candidateResponse;
  const offeringFile = offeringData?.file;
  const offeringDate = offeringData?.date;

  const downloadUrl = offeringFile?.base64
    ? offeringFile.base64
    : offeringFile?.objectKey
    ? `/api/file?key=${encodeURIComponent(offeringFile.objectKey)}`
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage("");
    if (!file) return;

    // Validate type: PDF, JPG, JPEG, PNG
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type.toLowerCase()) && !/\.(pdf|png|jpg|jpeg)$/i.test(file.name)) {
      setErrorMessage("Format berkas harus berupa PDF, PNG, JPG, atau JPEG.");
      return;
    }

    // Validate size: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran berkas melebihi batas maksimum 5MB.");
      return;
    }

    setSelectedFile(file);
    setFilePreview({
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  const handleAcceptSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage("Harap pilih file dokumen Offering Letter yang telah ditandatangani.");
      return;
    }
    if (!isDisclaimerChecked) {
      setErrorMessage("Anda harus menyetujui pernyataan keabsahan dokumen sebelum melanjutkan.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let uploadedFileAttachment: {
        name: string;
        objectKey?: string;
        base64?: string;
        type: string;
        sizeBytes: number;
      } = {
        name: selectedFile.name,
        type: selectedFile.type,
        sizeBytes: selectedFile.size,
      };

      // Try uploading to S3
      try {
        const folder = `applications/${jobId}/${applicationId}/signed-offering`;
        const uploadRes = await getUploadUrl(selectedFile.name, selectedFile.type, folder);
        if (uploadRes.success && uploadRes.uploadUrl) {
          const s3Put = await fetch(uploadRes.uploadUrl, {
            method: "PUT",
            body: selectedFile,
            headers: { "Content-Type": selectedFile.type },
          });
          if (s3Put.ok) {
            uploadedFileAttachment.objectKey = uploadRes.objectKey;
            uploadedFileAttachment.base64 = uploadRes.publicUrl;
          }
        }
      } catch (err) {
        console.warn("Direct S3 upload failed, converting to fallback base64", err);
      }

      // If S3 objectKey is not set, convert to base64 fallback
      if (!uploadedFileAttachment.objectKey) {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(selectedFile);
        });
        uploadedFileAttachment.base64 = base64String;
      }

      const res = await submitOfferingResponse(applicationId, "ACCEPTED", {
        signedFile: uploadedFileAttachment,
        note: acceptNote.trim(),
      });

      if (res.success) {
        setIsAcceptModalOpen(false);
        setSelectedFile(null);
        setAcceptNote("");
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        setErrorMessage(res.error || "Gagal mengirim dokumen penawaran.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Terjadi kesalahan saat memproses file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason || declineReason.trim().length < 15) {
      setErrorMessage("Harap berikan alasan penolakan secara jelas (minimal 15 karakter).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await submitOfferingResponse(applicationId, "DECLINED", {
        note: declineReason.trim(),
      });

      if (res.success) {
        setIsDeclineModalOpen(false);
        setDeclineReason("");
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        setErrorMessage(res.error || "Gagal memproses penolakan tawaran.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptMove = async () => {
    setIsSubmittingMove(true);
    setErrorMessage("");
    try {
      const res = await respondToJobMoveProposal(applicationId, "ACCEPT");
      if (res.success) {
        setIsAcceptMoveModalOpen(false);
        window.alert(res.message || "Tawaran pemindahan lowongan berhasil disetujui! Anda sekarang terdaftar pada lowongan baru.");
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        setErrorMessage(res.error || "Gagal menyetujui pemindahan lowongan.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses persetujuan.");
    } finally {
      setIsSubmittingMove(false);
    }
  };

  const handleDeclineMove = async () => {
    setIsSubmittingMove(true);
    setErrorMessage("");
    try {
      const res = await respondToJobMoveProposal(applicationId, "DECLINE", {
        reason: moveDeclineReason.trim() || undefined,
      });
      if (res.success) {
        setIsDeclineMoveModalOpen(false);
        setMoveDeclineReason("");
        window.alert(res.message || "Penolakan tawaran pemindahan lowongan telah disampaikan ke tim rekrutmen.");
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        setErrorMessage(res.error || "Gagal menolak pemindahan lowongan.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses penolakan.");
    } finally {
      setIsSubmittingMove(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/40 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              Dokumen Penawaran Kerja (Offering Letter)
              {candidateResponse?.status === "ACCEPTED" && (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Diterima
                </span>
              )}
              {candidateResponse?.status === "DECLINED_REVIEW_REQUIRED" && (
                <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Penolakan Ditinjau
                </span>
              )}
              {!candidateResponse && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" /> Menunggu Respon Anda
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              {offeringDate
                ? `Diterbitkan pada: ${new Date(offeringDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                : "Silakan periksa dan tindak lanjuti surat penawaran kerja dari recruiter."}
            </p>
          </div>
        </div>

        {/* Download Button for Candidate */}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={offeringFile?.name || "Offering_Letter.pdf"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-sm transition-all hover:border-blue-300 shrink-0"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Unduh Surat Penawaran Resmi ({offeringFile?.name || "PDF"})</span>
          </a>
        )}
      </div>

      {/* Response Status Display */}
      {candidateResponse?.status === "ACCEPTED" ? (
        <div className="mt-4 bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-bold text-sm text-emerald-950">
                Anda Telah Menyetujui Penawaran Kerja Ini
              </h5>
              <p className="text-xs text-emerald-800 mt-1">
                Dokumen Offering Letter yang telah Anda tandatangani telah berhasil diterima oleh tim rekrutmen kami pada{" "}
                <span className="font-semibold">
                  {new Date(candidateResponse.signedAt).toLocaleString("id-ID")}
                </span>.
              </p>

              {candidateResponse.signedFile && (
                <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200 max-w-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {candidateResponse.signedFile.name}
                    </span>
                  </div>
                  <a
                    href={
                      candidateResponse.signedFile.base64 ||
                      `/api/file?key=${encodeURIComponent(candidateResponse.signedFile.objectKey || "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 ml-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Lihat Berkas
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : candidateResponse?.status === "DECLINED_REVIEW_REQUIRED" ? (
        <div className="space-y-4 mt-4">
          <div className="bg-red-50/80 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-bold text-sm text-red-950">
                  Pemberitahuan Penolakan Sedang Ditinjau Tim Rekrutmen
                </h5>
                <p className="text-xs text-red-800 mt-1">
                  Anda mengajukan penolakan pada{" "}
                  <span className="font-semibold">
                    {new Date(candidateResponse.declinedAt).toLocaleString("id-ID")}
                  </span>. Tim HR sedang mengevaluasi respon Anda.
                </p>
                <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-red-100 text-xs text-red-900">
                  <strong>Alasan Anda:</strong> {candidateResponse.note}
                </div>
              </div>
            </div>
          </div>

          {/* Job Move Proposal Section from Recruiter */}
          {moveProposalData && moveProposalData.status === "PENDING" && (
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/90 border-2 border-indigo-400 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                      Tawaran Pengalihan ke Lowongan Lain dari Tim Rekrutmen
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full animate-pulse">
                        Butuh Konfirmasi Anda
                      </span>
                    </h5>
                    <span className="text-[11px] text-indigo-600 font-mono">
                      {new Date(moveProposalData.proposedAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1.5 leading-relaxed">
                    Setelah meninjau penolakan penawaran sebelumnya, tim rekrutmen kami menawarkan pengalihan proses lamaran Anda ke lowongan alternatif berikut:
                  </p>

                  {/* Target Job Opening Card */}
                  <div className="mt-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Lowongan Pekerjaan Tujuan</span>
                        <h6 className="font-bold text-gray-900 text-base mt-0.5">
                          {moveProposalData.targetJobTitle}
                        </h6>
                      </div>
                      <span className="self-start sm:self-center px-2.5 py-1 bg-gray-100 font-mono font-bold text-xs text-gray-700 rounded-lg">
                        Ref: {moveProposalData.targetJobRegistrationNo}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 pt-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Customer: <strong className="text-gray-900">{moveProposalData.targetCustomerName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Site: <strong className="text-gray-900">{moveProposalData.targetSiteName}</strong></span>
                      </div>
                    </div>

                    {moveProposalData.note && (
                      <div className="mt-2.5 pt-2.5 border-t border-gray-100 bg-indigo-50/50 p-2.5 rounded-lg text-xs text-gray-800">
                        <span className="font-bold text-indigo-900">Catatan / Rekomendasi Recruiter:</span>
                        <p className="mt-0.5 text-gray-900 italic font-medium">"{moveProposalData.note}"</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Candidate */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAcceptMoveModalOpen(true)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui Pemindahan Lowongan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeclineMoveModalOpen(true)}
                      className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl border border-red-200 shadow-sm transition-all flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak Tawaran Pindah</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {moveProposalData && moveProposalData.status === "ACCEPTED" && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h6 className="font-bold text-sm text-emerald-950">
                  Pemindahan Lowongan Disetujui
                </h6>
                <p className="text-xs text-emerald-800 mt-1">
                  Anda telah menyetujui pemindahan proses seleksi ke lowongan <strong>{moveProposalData.targetJobTitle}</strong>. Lamaran baru Anda telah aktif dan dapat dipantau di menu My Applications.
                </p>
              </div>
            </div>
          )}

          {moveProposalData && moveProposalData.status === "DECLINED" && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <h6 className="font-bold text-sm text-gray-900">
                  Tawaran Pemindahan Lowongan Ditolak
                </h6>
                <p className="text-xs text-gray-700 mt-1">
                  Anda telah menolak tawaran pemindahan ke {moveProposalData.targetJobTitle}. Menunggu keputusan final dari recruiter.
                </p>
                {moveProposalData.candidateDeclineReason && (
                  <p className="text-xs text-gray-600 mt-1 italic">
                    Alasan Anda: "{moveProposalData.candidateDeclineReason}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Action buttons for Pending response */
        <div className="mt-4 pt-1">
          <p className="text-xs text-gray-700 mb-4 leading-relaxed">
            Selamat! Anda telah menerima penawaran kerja resmi. Silakan unduh dokumen penawaran di atas, pelajari rincian kompensasi dan persyaratan yang tercantum, lalu tanda tangani secara mandiri (tanda tangan basah atau tanda tangan digital) dan unggah kembali dokumen tersebut di bawah ini.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAcceptModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui & Unggah Signed OL</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeclineModalOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl border border-red-200 shadow-sm transition-all flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Tolak Penawaran</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ACCEPT & UPLOAD SIGNED OL */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  Unggah Offering Letter Bertandatangan
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAcceptModalOpen(false);
                  setErrorMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Upload Drop Area */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Berkas Dokumen Tanda Tangan <span className="text-red-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/20 transition-colors rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf, .png, .jpg, .jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-900">
                    {filePreview ? filePreview.name : "Klik atau seret berkas Anda ke sini"}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Format: PDF, PNG, JPG, JPEG (Maksimal 5MB)
                  </p>
                </div>
              </div>

              {/* Note / Message */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                  Catatan untuk Recruiter (Opsional)
                </label>
                <textarea
                  value={acceptNote}
                  onChange={(e) => setAcceptNote(e.target.value)}
                  placeholder="Contoh: Saya siap mulai bergabung sesuai tanggal yang tercantum pada surat penawaran."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900"
                />
              </div>

              {/* Legal Disclaimer Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDisclaimerChecked}
                  onChange={(e) => setIsDisclaimerChecked(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-700 leading-snug">
                  Saya menyatakan bahwa dokumen yang saya unggah adalah benar telah saya tanda tangani secara sadar, sah, dan mengikat sesuai ketentuan yang berlaku.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAcceptSubmit}
                disabled={isSubmitting || !selectedFile || !isDisclaimerChecked}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim Konfirmasi Penerimaan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DECLINE OFFERING */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  Konfirmasi Penolakan Penawaran
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsDeclineModalOpen(false);
                  setErrorMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Penolakan ini akan diteruskan ke tim rekrutmen untuk peninjauan. Anda dapat menyampaikan alasan pertimbangan (misal: penawaran lain, lokasi penempatan, atau negosiasi).
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas dan profesional (minimal 15 karakter)..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-gray-900"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Panjang karakter: {declineReason.length}/15 karakter minimum
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={isSubmitting || declineReason.trim().length < 15}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Kirim Penolakan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Job Move Confirmation Modal */}
      {isAcceptMoveModalOpen && moveProposalData && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-blue-600 flex justify-between items-center text-white">
              <h4 className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-200" /> Konfirmasi Pemindahan Lowongan
              </h4>
              <button
                type="button"
                onClick={() => setIsAcceptMoveModalOpen(false)}
                className="p-1.5 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                Apakah Anda yakin ingin menyetujui tawaran pemindahan proses rekrutmen ini?
              </p>

              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Lowongan Baru</p>
                <h5 className="font-bold text-gray-900 text-sm">
                  {moveProposalData.targetJobTitle}
                </h5>
                <p className="text-xs text-gray-600">
                  Ref: <span className="font-mono font-bold">{moveProposalData.targetJobRegistrationNo}</span>
                  {moveProposalData.targetCustomerName && ` • ${moveProposalData.targetCustomerName}`}
                  {moveProposalData.targetSiteName && ` • ${moveProposalData.targetSiteName}`}
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>Catatan Sistem:</strong> Lamaran lama Anda akan dialihkan dan Anda akan memulai proses seleksi untuk lowongan baru ini. Aturan sistem 1 lowongan aktif per NIK tetap terjaga.
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsAcceptMoveModalOpen(false)}
                disabled={isSubmittingMove}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAcceptMove}
                disabled={isSubmittingMove}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmittingMove ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Setujui Pemindahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Job Move Reason Modal */}
      {isDeclineMoveModalOpen && moveProposalData && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-red-600 flex justify-between items-center text-white">
              <h4 className="text-base font-bold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-200" /> Tolak Tawaran Pemindahan Lowongan
              </h4>
              <button
                type="button"
                onClick={() => setIsDeclineMoveModalOpen(false)}
                className="p-1.5 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                Anda memilih untuk menolak pengalihan ke lowongan <strong>{moveProposalData.targetJobTitle}</strong>. Silakan sampaikan alasan penolakan untuk bahan pertimbangan tim rekrutmen.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                  Alasan Penolakan Pindah Lowongan
                </label>
                <textarea
                  value={moveDeclineReason}
                  onChange={(e) => setMoveDeclineReason(e.target.value)}
                  placeholder="Contoh: Lokasi penempatan terlalu jauh, ketidaksesuaian kualifikasi, dsb..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-gray-900"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsDeclineMoveModalOpen(false)}
                disabled={isSubmittingMove}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeclineMove}
                disabled={isSubmittingMove}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmittingMove ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Konfirmasi Tolak Tawaran Pindah</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

