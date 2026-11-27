"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, User } from "lucide-react";
import { useSession } from "next-auth/react";
import CandidateSidebar from "@/components/layout/CandidateSidebar";
import PrivacyModal from "@/components/candidate/PrivacyModal";

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore persisted desktop collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dpp_candidate_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem("dpp_candidate_sidebar_collapsed", String(val));
    } catch {
      // ignore
    }
  };

  const userName = session?.user?.name || "Kandidat";

  return (
    <div className="flex h-screen bg-surface-bright font-sans overflow-hidden relative">
      <CandidateSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 h-screen overflow-hidden ml-0 ${
          isCollapsed ? "md:ml-[80px]" : "md:ml-[260px]"
        }`}
      >
        {/* Mobile Header Bar - prevents floating menu from overlapping main page content */}
        <header className="md:hidden h-14 px-4 bg-white border-b border-table-border flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              aria-label="Buka navigasi menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white rounded-md border border-slate-200/90 p-0.5 flex items-center justify-center shrink-0">
                <Image
                  src="/images/branding/dpp-icon.png"
                  alt="Logo DPP"
                  width={24}
                  height={24}
                  className="w-5 h-5 object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-900 leading-none">
                  E-Recruitment
                </span>
                <span className="text-[9px] font-medium text-slate-500 leading-none mt-0.5">
                  PT Dian Pandu Pratama
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/candidate/profile"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate">{userName}</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <PrivacyModal />
          {children}
        </main>
      </div>
    </div>
  );
}
