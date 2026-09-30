import React from "react";
import CandidateJobsClient from "./CandidateJobsClient";
import { getPublicJobs } from "@/app/actions/job";
import { getProvinces, getDepartments } from "@/app/actions/master-data";
import { getCandidateProfile } from "@/app/actions/candidate-profile";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CandidateJobsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const province = typeof sp.province === 'string' ? sp.province : undefined;
  const department = typeof sp.department === 'string' ? sp.department : undefined;

  const session = await getServerSession(authOptions);
  
  const [jobsRes, provincesRes, deptsRes, profileRes] = await Promise.all([
    getPublicJobs(q, province, undefined, department),
    getProvinces(),
    getDepartments(),
    getCandidateProfile()
  ]);

  const profile = profileRes.success ? profileRes.data as any : null;
  
  // Extract applied job IDs
  const appliedJobIds = profile?.applications?.map((app: any) => app.jobId) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">Job Openings</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Explore and apply for open positions.
        </p>
      </div>

      <div className="pt-4">
        <CandidateJobsClient 
          initialJobs={jobsRes.success ? (jobsRes.data || []) : []} 
          provinces={provincesRes.success ? (provincesRes.data || []) : []}
          departments={deptsRes.success ? (deptsRes.data || []) : []}
          initialSearch={q}
          initialProvince={province}
          initialDepartment={department}
          candidateProfile={profile}
          appliedJobIds={appliedJobIds}
        />
      </div>
    </div>
  );
}
