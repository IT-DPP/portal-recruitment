import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface CandidateRow {
  id: string;
  name: string;
  position: string;
  stage: string;
  site: string;
  candidateId: string;
}

interface Props {
  candidates: CandidateRow[];
}

export default function RecentCandidatesTable({ candidates }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-table-border overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-table-border flex justify-between items-center">
        <h3 className="font-bold text-on-surface">Recent Stage Changes</h3>
        <Link href="/dashboard/pipeline" className="text-primary text-sm font-semibold hover:underline">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-table-border text-xs uppercase text-on-surface-variant">
              <th className="px-5 py-3 font-semibold">Nama Kandidat</th>
              <th className="px-5 py-3 font-semibold">Posisi</th>
              <th className="px-5 py-3 font-semibold">Stage</th>
              <th className="px-5 py-3 font-semibold">Site Operation</th>
              <th className="px-5 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-table-border last:border-0 hover:bg-surface-container-lowest/50">
                <td className="px-5 py-3 font-medium text-on-surface">{c.name}</td>
                <td className="px-5 py-3 text-on-surface-variant">{c.position}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {c.stage}
                  </span>
                </td>
                <td className="px-5 py-3 text-on-surface-variant">{c.site}</td>
                <td className="px-5 py-3 text-center">
                  <Link href={`/dashboard/pipeline?candidate=${c.candidateId}`} className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant">
                  No recent changes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
