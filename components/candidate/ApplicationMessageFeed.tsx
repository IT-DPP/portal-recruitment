"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  User,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { sendCandidateApplicationMessage } from "@/app/actions/candidate-application";

interface ApplicationMessageFeedProps {
  applicationId: string;
  messages: Array<{
    id?: string;
    sender?: string;
    senderName?: string;
    stage?: string;
    text: string;
    date: string;
  }>;
  onRefresh?: () => void;
}

export default function ApplicationMessageFeed({
  applicationId,
  messages = [],
  onRefresh,
}: ApplicationMessageFeedProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      const res = await sendCandidateApplicationMessage(applicationId, text.trim());
      if (res.success) {
        setText("");
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        setErrorMessage(res.error || "Gagal mengirim pesan.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Terjadi kesalahan.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-table-border shadow-sm overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="p-4 border-b border-table-border bg-surface-container-lowest flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h4 className="font-bold text-sm text-gray-900">
            Komunikasi & Catatan Recruiter
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-gray-500 bg-surface-container-low px-2.5 py-0.5 rounded-full">
          {messages.length} Pesan
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <MessageSquare className="w-10 h-10 stroke-1 mb-2 text-gray-300" />
            <p className="text-xs font-semibold text-gray-600">Belum Ada Riwayat Pesan</p>
            <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">
              Pesan dan instruksi khusus dari tim HR/Recruiter mengenai lamaran ini akan muncul di sini. Anda juga dapat mengirimkan pertanyaan langsung.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isCandidate = msg.sender === "CANDIDATE";
            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isCandidate ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {isCandidate ? (
                    <>
                      <span className="text-[10px] font-bold text-gray-700">Anda</span>
                      <User className="w-3 h-3 text-emerald-600" />
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3 text-blue-600" />
                      <span className="text-[10px] font-bold text-blue-800">
                        {msg.senderName || "Recruiter / HR Team"}
                      </span>
                    </>
                  )}
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.date).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                    isCandidate
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                <span className="text-[9px] text-gray-400 mt-1 px-1">
                  {new Date(msg.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-table-border bg-white">
        {errorMessage && (
          <div className="mb-2 p-2 bg-red-50 text-red-600 rounded-lg text-[11px] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis pesan atau pertanyaan ke tim rekrutmen..."
            className="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !text.trim()}
            className="px-3.5 py-2 bg-primary hover:bg-primary-container disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

