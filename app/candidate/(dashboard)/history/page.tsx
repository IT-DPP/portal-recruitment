import React from "react";
import { Clock, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CandidateHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">My Applications</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Track the status of your job applications.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-table-border p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mb-4 mx-auto">
          <FileText className="w-8 h-8 text-primary/50" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2">No Applications Yet</h3>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
          You haven't applied to any positions yet. Browse our job openings and find your next opportunity!
        </p>
        <Link 
          href="/candidate/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors"
        >
          Browse Jobs <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
