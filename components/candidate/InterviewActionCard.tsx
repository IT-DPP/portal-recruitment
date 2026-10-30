"use client";

import React from "react";
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

interface InterviewActionCardProps {
  stageType: "HR" | "USER";
  interviewData: any;
}

export default function InterviewActionCard({
  stageType,
  interviewData,
}: InterviewActionCardProps) {
  if (!interviewData || (!interviewData.date && !interviewData.feedback && !interviewData.result)) {
    return null;
  }

  const isVirtual =
    interviewData.locationOrLink?.startsWith("http://") ||
    interviewData.locationOrLink?.startsWith("https://") ||
    interviewData.locationOrLink?.toLowerCase().includes("meet.google.com") ||
    interviewData.locationOrLink?.toLowerCase().includes("zoom.us");

  const title = stageType === "HR" ? "Wawancara HR (HR Interview)" : "Wawancara User (User Interview)";

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-2xl border-2 border-indigo-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-indigo-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Video className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
            {title}
            {interviewData.result ? (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Selesai ({interviewData.result})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Terjadwal
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Informasi pelaksanaan dan jadwal wawancara kerja Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Left: Jadwal & Link */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Tanggal Wawancara
              </span>
              <span className="text-xs font-bold text-gray-900">
                {interviewData.date
                  ? new Date(interviewData.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Menunggu penentuan jadwal"}
              </span>
            </div>
          </div>

          {interviewData.locationOrLink && (
            <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
              {isVirtual ? (
                <Video className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              ) : (
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {isVirtual ? "Tautan Video Conference" : "Lokasi Wawancara"}
                </span>
                {isVirtual ? (
                  <a
                    href={interviewData.locationOrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline mt-1 break-all"
                  >
                    <span>Masuk ke Ruang Temu Virtual</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-gray-800 font-medium mt-0.5">
                    {interviewData.locationOrLink}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Catatan & Feedback */}
        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
              Catatan / Instruksi dari Pewawancara:
            </span>
            <p className="text-xs text-indigo-950 leading-relaxed italic">
              {interviewData.feedback
                ? `"${interviewData.feedback}"`
                : "Harap mempersiapkan perangkat kamera, mikrofon, dan koneksi internet yang stabil 10 menit sebelum wawancara dimulai."}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-indigo-200/50 flex items-center gap-1.5 text-[11px] text-indigo-800 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pastikan mengenakan pakaian rapi & sopan.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

