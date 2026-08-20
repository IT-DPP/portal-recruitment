import React from "react";
import CandidateSidebar from "@/components/layout/CandidateSidebar";
import PrivacyModal from "@/components/candidate/PrivacyModal";

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-surface-bright font-sans">
      <CandidateSidebar />
      <div className="flex-1 flex flex-col md:ml-[260px] transition-all duration-300 h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <PrivacyModal />
          {children}
        </main>
      </div>
    </div>
  );
}
