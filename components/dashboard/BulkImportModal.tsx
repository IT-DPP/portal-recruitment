"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import ExcelJS from "exceljs";
import { bulkImportCandidates, BulkCandidateInput } from "@/app/actions/job";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string | null;
  jobTitle?: string | null;
  onSuccess?: () => void;
}

interface ParsedRow extends BulkCandidateInput {
  rowNum: number;
  status: "VALID" | "INVALID";
  validationError?: string;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  jobId = null,
  jobTitle = null,
  onSuccess,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleReset();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setIsParsing(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseExcelFile = async (selectedFile: File) => {
    setIsParsing(true);
    setFile(selectedFile);
    setImportResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      // Read first sheet
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        alert("File Excel tidak memiliki sheet yang dapat dibaca.");
        setIsParsing(false);
        return;
      }

      // Map column headers
      const headerMap: Record<number, string> = {};
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        const val = (cell.value || "").toString().toLowerCase().trim();
        if (val.includes("nik")) headerMap[colNumber] = "nik";
        else if (val.includes("nama")) headerMap[colNumber] = "fullName";
        else if (val.includes("kartu keluarga") || val.includes("kk")) headerMap[colNumber] = "kk";
        else if (val.includes("email")) headerMap[colNumber] = "email";
        else if (val.includes("wa") || val.includes("whatsapp") || val.includes("hp") || val.includes("telepon") || val.includes("phone")) headerMap[colNumber] = "phone";
        else if (val.includes("tempat lahir")) headerMap[colNumber] = "birthPlace";
        else if (val.includes("tanggal lahir") || val.includes("tgl lahir")) headerMap[colNumber] = "birthDate";
        else if (val.includes("kelamin") || val.includes("gender")) headerMap[colNumber] = "gender";
        else if (val.includes("pendidikan")) headerMap[colNumber] = "latestEducation";
        else if (val.includes("sekolah") || val.includes("universitas") || val.includes("institusi")) headerMap[colNumber] = "educationInstitution";
        else if (val.includes("alamat") || val.includes("domisili") || val.includes("kota")) headerMap[colNumber] = "domicileAddress";
        else if (val.includes("catatan") || val.includes("kualifikasi") || val.includes("pengalaman") || val.includes("notes")) headerMap[colNumber] = "notes";
      });

      const rows: ParsedRow[] = [];

      worksheet.eachRow((row, rowNumber) => {
        // Skip header
        if (rowNumber === 1) return;

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const key = headerMap[colNumber];
          if (key) {
            let cellValue = cell.value;
            // Handle date objects or rich text
            if (cellValue && typeof cellValue === "object") {
              if (cellValue instanceof Date) {
                cellValue = cellValue.toISOString().split("T")[0];
              } else if ("text" in cellValue) {
                cellValue = (cellValue as any).text;
              } else if ("result" in cellValue) {
                cellValue = (cellValue as any).result;
              }
            }
            rowData[key] = cellValue !== undefined && cellValue !== null ? String(cellValue).trim() : "";
          }
        });

        // Skip completely empty rows
        if (!rowData.nik && !rowData.fullName && !rowData.phone) {
          return;
        }

        const cleanNik = (rowData.nik || "").replace(/\D/g, "");
        const rawFullName = (rowData.fullName || "").trim();

        let status: "VALID" | "INVALID" = "VALID";
        let validationError: string | undefined;

        if (!cleanNik || cleanNik.length !== 16) {
          status = "INVALID";
          validationError = cleanNik.length === 0 ? "NIK wajib diisi" : `NIK harus 16 digit (terbaca ${cleanNik.length} digit)`;
        } else if (!rawFullName || rawFullName.length < 2) {
          status = "INVALID";
          validationError = "Nama lengkap wajib diisi minimal 2 karakter";
        }

        rows.push({
          rowNum: rowNumber,
          nik: cleanNik || rowData.nik || "",
          fullName: rawFullName,
          kk: (rowData.kk || "").replace(/\D/g, "") || undefined,
          email: rowData.email || undefined,
          phone: rowData.phone || undefined,
          birthPlace: rowData.birthPlace || undefined,
          birthDate: rowData.birthDate || undefined,
          gender: rowData.gender || undefined,
          latestEducation: rowData.latestEducation || undefined,
          educationInstitution: rowData.educationInstitution || undefined,
          domicileAddress: rowData.domicileAddress || undefined,
          notes: rowData.notes || undefined,
          status,
          validationError,
        });
      });

      setParsedRows(rows);
    } catch (err: any) {
      console.error("Error parsing excel file:", err);
      alert("Gagal membaca file Excel. Pastikan format file .xlsx valid.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type.includes("sheet") ||
        droppedFile.type.includes("excel") ||
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls") ||
        droppedFile.name.endsWith(".csv")
      ) {
        parseExcelFile(droppedFile);
      } else {
        alert("Harap unggah file spreadsheet Excel (.xlsx, .xls) atau .csv");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseExcelFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.status === "VALID");
    if (validRows.length === 0) {
      alert("Tidak ada data kandidat valid untuk di-import.");
      return;
    }

    setIsSubmitting(true);
    try {
      const candidatesPayload: BulkCandidateInput[] = validRows.map((r) => ({
        nik: r.nik,
        fullName: r.fullName,
        kk: r.kk || null,
        email: r.email || null,
        phone: r.phone || null,
        birthPlace: r.birthPlace || null,
        birthDate: r.birthDate || null,
        gender: r.gender || null,
        latestEducation: r.latestEducation || null,
        educationInstitution: r.educationInstitution || null,
        domicileAddress: r.domicileAddress || null,
        notes: r.notes || null,
      }));

      const res = await bulkImportCandidates(jobId, candidatesPayload);
      if (res.success && res.data) {
        setImportResult(res.data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(res.error || "Gagal mengimpor kandidat.");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      alert("Terjadi kesalahan sistem saat memproses impor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === "VALID").length;
  const invalidCount = parsedRows.filter((r) => r.status === "INVALID").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0A2540] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 id="bulk-import-title" className="text-lg font-bold">
                Import Massal Kandidat (Excel)
              </h3>
              <p className="text-xs text-slate-300">
                {jobTitle
                  ? `Pendaftaran massal ke lowongan: ${jobTitle}`
                  : "Input data profil kandidat langsung ke Talent Pool"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Step 1: Upload & Template Guide */}
          {!importResult && (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Format Berkas Sesuai Standar DPP
                    </p>
                    <p>
                      Pastikan kolom NIK 16 digit dan Nama Lengkap terisi. Data pribadi otomatis
                      dienkripsi AES-256-GCM sesuai UU PDP.
                    </p>
                  </div>
                </div>
                <a
                  href="/api/candidates/import-template"
                  download="Template_Import_Kandidat_DPP.xlsx"
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-2xs"
                >
                  <Download className="w-4 h-4 text-primary" />
                  Unduh Template (.xlsx)
                </a>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-slate-300 hover:border-primary/60 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {isParsing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {file ? file.name : "Tarik dan lepas file Excel ke sini, atau klik untuk memilih"}
                  </p>
                  <p className="text-xs text-slate-500">Mendukung format .xlsx, .xls, atau .csv (Maksimal 500 baris)</p>
                </div>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Membaca dan memvalidasi struktur berkas Excel...
                </div>
              )}

              {/* Preview Table if rows parsed */}
              {parsedRows.length > 0 && !isParsing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 id="preview-table-title" className="text-sm font-bold text-slate-900">
                        Pratinjau Validasi Data ({parsedRows.length} Baris)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Periksa kelayakan baris data sebelum memproses import ke database.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Siap Import
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} Tidak Valid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Responsive Preview Table (Modern Web Guidance compliance) */}
                  <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby="preview-table-title"
                    className="overflow-x-auto focus:outline-hidden overscroll-x-contain max-h-72 border border-slate-200 rounded-xl"
                  >
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center">No</th>
                          <th className="px-3 py-2.5 w-24">Status</th>
                          <th className="px-3 py-2.5">NIK</th>
                          <th className="px-3 py-2.5">Nama Lengkap</th>
                          <th className="px-3 py-2.5">No. HP / WA</th>
                          <th className="px-3 py-2.5">Pendidikan</th>
                          <th className="px-3 py-2.5">Domisili</th>
                          <th className="px-3 py-2.5">Catatan Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              r.status === "INVALID" ? "bg-red-50/30" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-center font-mono text-slate-500">
                              {r.rowNum}
                            </td>
                            <td className="px-3 py-2">
                              {r.status === "VALID" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono font-medium text-slate-900">
                              {r.nik || "-"}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {r.fullName || "-"}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{r.phone || "-"}</td>
                            <td className="px-3 py-2 text-slate-600">{r.latestEducation || "-"}</td>
                            <td className="px-3 py-2 text-slate-600">{r.domicileAddress || "-"}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {r.validationError ? (
                                <span className="text-red-600 font-semibold">{r.validationError}</span>
                              ) : (
                                <span className="text-emerald-600">Format data sesuai</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Post-Import Result Summary */}
          {importResult && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Impor Massal Selesai Diproses</h4>
                  <p className="text-xs text-slate-600">
                    Data kandidat berhasil diverifikasi, dienkripsi, dan didaftarkan ke sistem rekrutmen DPP.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium">Total Diproses</p>
                  <p className="text-lg font-bold text-slate-900">{importResult.total}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-emerald-600 font-medium">Kandidat Baru</p>
                  <p className="text-lg font-bold text-emerald-700">{importResult.created}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-blue-600 font-medium">Profil Diperbarui</p>
                  <p className="text-lg font-bold text-blue-700">{importResult.updated}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <p className="text-xs text-amber-600 font-medium">Aplikasi Aktif</p>
                  <p className="text-lg font-bold text-amber-700">
                    {importResult.existingApps > 0
                      ? `${importResult.existingApps} (Sudah Ada)`
                      : jobId
                      ? `${importResult.created + importResult.updated} Terdaftar`
                      : "-"}
                  </p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-1 text-xs text-red-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" /> Catatan Error ({importResult.errors.length} baris dilewati):
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {importResult
              ? "Klik selesai untuk menyegarkan tampilan dashboard."
              : validCount > 0
              ? `${validCount} dari ${parsedRows.length} kandidat siap di-import.`
              : "Silakan unggah file template Excel terlebih dahulu."}
          </div>

          <div className="flex items-center gap-3">
            {importResult ? (
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-container transition-colors shadow-2xs"
              >
                Selesai & Tutup
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validCount === 0 || isSubmitting || isParsing}
                  className="px-5 py-2 bg-[#0A2540] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses Import ({validCount} Kandidat)...
                    </>
                  ) : (
                    `Proses Import (${validCount} Kandidat)`
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

