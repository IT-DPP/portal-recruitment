"use client";

import React, { useState } from "react";
import {
  HeartPulse,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Calendar,
  FileText,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import { uploadCandidateMcuProof } from "@/app/actions/candidate-application";
import { getUploadUrl } from "@/app/actions/candidate-profile";

interface McuActionCardProps {
  applicationId: string;
  jobId: string;
  mcuData: any;
  jobSiteInfo?: any;
  onRefresh?: () => void;
}

export default function McuActionCard({
  applicationId,
  jobId,
  mcuData,
  jobSiteInfo,
  onRefresh,
}: McuActionCardProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pengantarFile = mcuData?.pengantarFile;
  const mcuDate = mcuData?.date;
  const candidateProof = mcuData?.candidateProof;

  let downloadPengantarUrl: string | null = null;
  if (typeof pengantarFile === "string" && pengantarFile) {
    downloadPengantarUrl = pengantarFile;
  } else if (pengantarFile?.base64) {
    downloadPengantarUrl = pengantarFile.base64;
  } else if (pengantarFile?.url) {
    downloadPengantarUrl = pengantarFile.url;
  } else if (pengantarFile?.objectKey) {
    downloadPengantarUrl = `/api/file?key=${encodeURIComponent(pengantarFile.objectKey)}`;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage("");
    if (!file) return;

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (
      !allowed.includes(file.type.toLowerCase()) &&
      !/\.(pdf|png|jpg|jpeg)$/i.test(file.name)
    ) {
      setErrorMessage("Format berkas harus berupa PDF, PNG, JPG, atau JPEG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ukuran berkas melebihi 5MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleProofSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage("Harap pilih berkas bukti pemeriksaan MCU.");
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

      try {
        const folder = `applications/${jobId}/${applicationId}/mcu-proof`;
        const uploadRes = await getUploadUrl(
          selectedFile.name,
          selectedFile.type,
          folder,
        );
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
        console.warn("Direct S3 upload failed, using fallback base64", err);
      }

      if (!uploadedFileAttachment.objectKey) {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(selectedFile);
        });
        uploadedFileAttachment.base64 = base64String;
      }

      const res = await uploadCandidateMcuProof(
        applicationId,
        uploadedFileAttachment,
        proofNotes.trim(),
      );

      if (res.success) {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setProofNotes("");
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        setErrorMessage(res.error || "Gagal mengunggah bukti MCU.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Terjadi kesalahan saat memproses file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 rounded-2xl border-2 border-teal-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              Pemeriksaan Kesehatan (Medical Check Up)
              {candidateProof?.file ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Bukti Hadir Terkirim
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Jadwal MCU Aktif
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              {mcuDate
                ? `Jadwal Pelaksanaan: ${new Date(mcuDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
                : "Informasi jadwal dan surat pengantar MCU untuk kandidat."}
            </p>
          </div>
        </div>

        {/* Download Surat Pengantar Button */}
        {downloadPengantarUrl && (
          <a
            href={
              downloadPengantarUrl.startsWith("/api/file?") && !downloadPengantarUrl.includes("download=")
                ? `${downloadPengantarUrl}&download=1`
                : downloadPengantarUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            download={pengantarFile?.name || "Surat_Pengantar_MCU.pdf"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 shadow-sm transition-all hover:border-teal-300 shrink-0"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Unduh Surat Pengantar MCU</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Left: Klinik & Tanggal */}
        <div className="bg-white p-4 rounded-xl border border-teal-100 space-y-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Standar Site MCU
              </p>
              <p className="font-bold text-gray-900 text-sm mt-0.5">
                {mcuData?.clinicName ||
                  jobSiteInfo?.site?.name ||
                  "Klinik Rekanan Perusahaan"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {mcuData?.clinicAddress ||
                  jobSiteInfo?.site?.mcuPackage ||
                  "Silakan tunjukkan Surat Pengantar MCU kepada petugas klinik saat pendaftaran."}
              </p>
            </div>
          </div>

          {jobSiteInfo?.site?.mcuPackage && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Paket MCU:
              </span>
              <span className="text-xs font-mono font-semibold text-teal-800">
                {jobSiteInfo.site.mcuPackage}
              </span>
            </div>
          )}
        </div>

        {/* Right: Panduan Persiapan MCU */}
        <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100">
          <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5 mb-2">
            <Info className="w-4 h-4 text-teal-700" />
            <span>Petunjuk Penting Sebelum MCU:</span>
          </p>
          <ul className="text-xs text-teal-900 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Puasa 10 – 12 jam</strong> sebelum pemeriksaan (hanya
              diperbolehkan minum air putih).
            </li>
            <li>
              Bawa <strong>e-KTP Asli</strong> &{" "}
              <strong>Surat Pengantar MCU</strong> (cetak fisik).
            </li>
            <li>Istirahat dan tidur yang cukup pada malam hari sebelum MCU.</li>
            <li>
              Hindari merokok atau minum beralkohol minimal 24 jam sebelum tes.
            </li>
          </ul>
        </div>
      </div>

      {/* Candidate Proof Upload Status */}
      <div className="mt-4 pt-4 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {candidateProof?.file ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-900">
                Bukti Kehadiran MCU Telah Diunggah
              </p>
              <p className="text-[11px] text-gray-500">
                {candidateProof.file.name} •{" "}
                {new Date(candidateProof.uploadedAt).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            Sudah selesai melaksanakan MCU di klinik? Anda dapat mengunggah
            struk/kwitansi/surat bukti hadir MCU dari klinik agar recruiter
            dapat mempercepat verifikasi.
          </p>
        )}

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>
            {candidateProof?.file
              ? "Unggah Ulang Bukti MCU"
              : "Unggah Bukti Selesai MCU"}
          </span>
        </button>
      </div>

      {/* MODAL UPLOAD BUKTI MCU */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  Unggah Bukti Pelaksanaan MCU
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
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

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Berkas Struk / Kwitansi / Surat Keterangan{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50/20 transition-colors rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf, .png, .jpg, .jpeg"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-900">
                    {selectedFile
                      ? selectedFile.name
                      : "Pilih atau seret berkas ke sini"}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Format: PDF, PNG, JPG, JPEG (Max 5MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Contoh: Pemeriksaan MCU selesai dilakukan di Klinik Tirta Tambun pukul 10:00 WIB."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProofSubmit}
                disabled={isSubmitting || !selectedFile}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim Bukti MCU</span>
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
