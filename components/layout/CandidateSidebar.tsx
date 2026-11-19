"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Briefcase,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface CandidateSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export default function CandidateSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: CandidateSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const navItems = [
    { name: "My Profile", href: "/candidate/profile", icon: User },
    { name: "Job Openings", href: "/candidate/jobs", icon: Briefcase },
    { name: "My Applications", href: "/candidate/history", icon: Clock },
    {
      name: "History Application",
      href: "/candidate/past-applications",
      icon: Clock,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-screen h-[100dvh] bg-surface-container-lowest border-r border-table-border z-50 transition-all duration-300 ease-in-out flex flex-col
          ${isCollapsed ? "w-[80px]" : "w-[260px]"}
          ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Floating Collapse / Expand Toggle Button for Desktop (Top Edge) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-5 w-7 h-7 bg-white border border-slate-300 text-slate-700 hover:text-primary hover:border-primary rounded-full items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 z-50 cursor-pointer group"
          title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          aria-label={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          )}
        </button>
        {/* Brand Header with Logo + Text */}
        <div
          className={`h-16 flex items-center border-b border-table-border shrink-0 ${
            isCollapsed ? "justify-center px-0" : "px-4 justify-between"
          }`}
        >
          {isCollapsed ? (
            <Link
              href="/candidate/jobs"
              className="flex items-center justify-center group"
              title="E-Recruitment PT Dian Pandu Pratama"
              aria-label="Portal Kandidat PT Dian Pandu Pratama"
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="w-10 h-10 bg-white border border-slate-200/90 rounded-md p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#D9232A]/50 transition-colors">
                <Image
                  src="/images/branding/dpp-icon.png"
                  alt="Logo PT Dian Pandu Pratama"
                  width={32}
                  height={32}
                  className="w-7 h-7 object-contain"
                  priority
                  unoptimized
                />
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link
                href="/candidate/jobs"
                className="flex items-center gap-3 min-w-0 group"
                aria-label="E-Recruitment PT Dian Pandu Pratama"
                onClick={() => setIsMobileOpen(false)}
              >
                <div className="w-10 h-10 bg-white border border-slate-200/90 rounded-md p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#D9232A]/50 transition-colors">
                  <Image
                    src="/images/branding/dpp-icon.png"
                    alt="Logo PT Dian Pandu Pratama"
                    width={32}
                    height={32}
                    className="w-7 h-7 object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[13px] tracking-tight text-slate-900 leading-tight">
                      E-Recruitment
                    </span>
                    <span className="px-1 py-0.2 text-[8px] font-bold bg-red-100 text-[#D9232A] rounded">
                      DPP
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 truncate leading-tight mt-0.5">
                    PT Dian Pandu Pratama
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Tutup menu navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto py-5 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 rounded-md transition-colors group relative
                  ${isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-semibold"
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"}`}
                />
                {!isCollapsed && (
                  <span className="ml-3 text-xs tracking-tight">{item.name}</span>
                )}
                {/* Active Indicator Line */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Sign Out */}
        <div className="shrink-0 p-3 pb-6 md:pb-3 border-t border-table-border mt-auto bg-surface-container-lowest">
          <button
            type="button"
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-2.5 rounded-md transition-colors group cursor-pointer
              text-status-error hover:bg-red-50/70 border border-transparent hover:border-red-200 font-bold
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`w-5 h-5 shrink-0 text-primary ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && <span className="text-xs text-primary">Keluar / Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
