"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, Eye, Download, Plus, CheckCircle, FileCheck, AlertCircle } from "lucide-react";

export interface StoredDocument {
  id: string;
  title: string;
  name: string;
  base64?: string;
  fileUrl?: string;
  type: string;
  objectKey?: string;
  createdAt: string;
  file?: File;
}

interface MultipleDocumentStoreWidgetProps {
  stageNumber: number;
  stageName: string;
  documents: StoredDocument[];
  onDocumentsChange: (newDocs: StoredDocument[]) => void;
  onPreviewFile?: (file: { name: string; base64?: string; fileUrl?: string; type?: string }) => void;
  readOnly?: boolean;
}

export default function MultipleDocumentStoreWidget({
  stageNumber,
  stageName,
  documents = [],
  onDocumentsChange,
  onPreviewFile,
  readOnly = false,
}: MultipleDocumentStoreWidgetProps) {
  const [docTitle, setDocTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setFileError("Format file tidak didukung. Harap gunakan PDF, PNG, atau JPG.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("Ukuran file melebihi batas 10MB.");
      setSelectedFile(null);
      return;
    }

    setFileError("");
    setSelectedFile(file);
    if (!docTitle.trim()) {
      // Auto-suggest title based on file name without extension
      const suggested = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setDocTitle(suggested);
    }
  };

  const handleAddDocument = () => {
    if (!docTitle.trim()) {
      setFileError("Harap isi judul dokumen terlebih dahulu.");
      return;
    }
    if (!selectedFile) {
      setFileError("Harap pilih file yang akan diunggah.");
      return;
    }

    setIsUploading(true);
    const localUrl = URL.createObjectURL(selectedFile);

    const newDoc: StoredDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: docTitle.trim(),
      name: selectedFile.name,
      base64: localUrl,
      type: selectedFile.type,
      createdAt: new Date().toISOString(),
      file: selectedFile,
    };

    const updated = [...documents, newDoc];
    onDocumentsChange(updated);

    // Reset input
    setDocTitle("");
    setSelectedFile(null);
    setFileError("");
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (docId: string) => {
    if (readOnly) return;
    const filtered = documents.filter((d) => d.id !== docId);
    onDocumentsChange(filtered);
  };

  const handlePreview = (doc: StoredDocument) => {
    if (onPreviewFile) {
      onPreviewFile({
        name: doc.title || doc.name,
        base64: doc.base64 || doc.fileUrl,
        fileUrl: doc.fileUrl,
        type: doc.type,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box (Only if not read-only) */}
      {!readOnly && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Tambah Rekap Dokumen Baru
            </h4>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full">
              Lifetime SLA (No Limit)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Judul Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Sertifikat K3, Hasil Induksi, Perjanjian PKWT"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Pilih File (PDF, PNG, JPG) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer border border-slate-200 bg-white rounded-xl p-1"
                />
              </div>
            </div>
          </div>

          {fileError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleAddDocument}
              disabled={isUploading || !selectedFile || !docTitle.trim()}
              className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Simpan Dokumen ke {stageName}
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            Dokumen Tersimpan ({documents.length})
          </h4>
          <span className="text-[11px] text-slate-500">
            Dapat mengunggah banyak berkas dokumentasi tanpa batas.
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Dokumen</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan unggah berkas rekapitulasi untuk tahapan ini di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc, idx) => {
              const fileSrc = doc.base64 || doc.fileUrl;
              return (
                <div
                  key={doc.id || idx}
                  className="bg-white border border-slate-200 hover:border-primary/40 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-black truncate" title={doc.title}>
                        {doc.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Tersimpan"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {fileSrc && (
                      <button
                        type="button"
                        onClick={() => handlePreview(doc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview di Document Viewer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {fileSrc && (
                      <a
                        href={fileSrc}
                        download={doc.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Unduh Berkas"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
