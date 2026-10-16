"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Trash2, FileText, Image as ImageIcon, AlertCircle, Eye, RefreshCw } from "lucide-react";

interface FileUploadProps {
  label: string;
  value: { url?: string; file?: File; preview?: string; name: string; type: string; objectKey?: string } | null;
  onChange: (fileData: { url?: string; file?: File; preview?: string; name: string; type: string; objectKey?: string } | null) => void;
  onDelete?: () => void;
  onPreview?: () => void;
  accept?: string;
  maxSizeKB?: number;
  required?: boolean;
  helperText?: React.ReactNode;
}

export default function FileUpload({
  label,
  value,
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxSizeKB = 5120, // 5MB
  onDelete,
  onPreview,
  required = true,
  helperText,
}: FileUploadProps) {
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError("");
    
    // Validate size
    if (file.size > maxSizeKB * 1024) {
      setError(`File size exceeds ${maxSizeKB}KB limit (Development Mode).`);
      return;
    }

    // Validate type
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file format. Please upload PDF, PNG, or JPG.");
      return;
    }

    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    onChange({
      file,
      preview,
      name: file.name,
      type: file.type,
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    if (onDelete) onDelete();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const previewFile = () => {
    if (onPreview) {
      onPreview();
      return;
    }
    
    // Fallback if no onPreview provided
    if (value?.preview || value?.url) {
      window.open(value.preview || value.url, '_blank');
    } else if (value?.file) {
      const url = URL.createObjectURL(value.file);
      window.open(url, '_blank');
    }
  };

  const changeFile = () => {
    fileInputRef.current?.click();
  };

  const isImage = value?.type.startsWith("image/");

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
        {label} {required ? <span className="text-status-error">*</span> : <span className="text-on-surface-variant font-medium text-[11px] normal-case">(opsional)</span>}
      </label>
      {helperText && (
        <p className="text-xs text-on-surface-variant leading-relaxed -mt-1 mb-1">
          {helperText}
        </p>
      )}
      
      {!value ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary/50"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            accept={accept}
            className="hidden"
          />
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-table-border">
            <UploadCloud className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-on-surface mb-1">Click to upload or drag & drop</p>
          <p className="text-xs text-on-surface-variant">PDF, PNG, JPG (Max. {maxSizeKB}KB)</p>
        </div>
      ) : (
        <div className="relative border border-outline-variant rounded-xl p-4 bg-white shadow-sm flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center border border-table-border">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.preview || value.url || ""} alt={value.name} className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-8 h-8 text-primary/60" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-24">
            <p className="text-sm font-semibold text-on-surface truncate">{value.name}</p>
            <p className="text-xs text-status-success font-bold mt-1">Uploaded successfully</p>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <button
              type="button"
              onClick={previewFile}
              title="Preview Document"
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={changeFile}
              title="Change Document"
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={removeFile}
              title="Delete Document"
              className="p-1.5 rounded-full text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            {/* Hidden input for Change action */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
              accept={accept}
              className="hidden"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-status-error text-xs font-semibold mt-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
