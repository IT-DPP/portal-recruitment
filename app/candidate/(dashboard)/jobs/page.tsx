import React from "react";
import PublicJobList from "@/components/PublicJobList";

export default function CandidateJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">Job Openings</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Explore and apply for open positions.
        </p>
      </div>

      <div className="pt-4">
        <PublicJobList />
      </div>
    </div>
  );
}
