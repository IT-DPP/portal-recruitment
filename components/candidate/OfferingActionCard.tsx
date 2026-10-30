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
} from "lucide-react";
import { submitOfferingResponse } from "@/app/actions/candidate-application";
import { getUploadUrl } from "@/app/actions/candidate-profile";

interface OfferingActionCardProps {
  applicationId: string;
  jobId: string;
  offeringData: any;
  currentStageName: string;
  onRefresh?: () => void;
}

export default function OfferingActionCard({
  applicationId,
  jobId,
  offeringData,
  currentStageName,
  onRefresh,
}: OfferingActionCardProps) {
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
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

  return (
    <div className="bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/40 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
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
        <div className="mt-4 bg-red-50/80 border border-red-200 rounded-xl p-4">
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
                </span>. Tim HR akan mengevaluasi respon Anda dan menghubungi Anda apabila ada penyesuaian atau penawaran lowongan lain.
              </p>
              <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-red-100 text-xs text-red-900">
                <strong>Alasan Anda:</strong> {candidateResponse.note}
              </div>
            </div>
          </div>
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
    </div>
  );
}

