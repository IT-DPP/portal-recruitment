"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  LogOut,
  Clock,
  ChevronLeft,
  Users,
  Archive,
  Contact,
  BarChart2,
  UserX,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Track if Settings menu is expanded
  const [isSettingsOpen, setIsSettingsOpen] = useState(
    pathname.includes("/settings"),
  );

  // Track if Dashboard menu is expanded
  const [isDashboardOpen, setIsDashboardOpen] = useState(
    pathname === "/dashboard" ||
    pathname.includes("/dashboard/executive") ||
    pathname.includes("/dashboard/geosource") ||
    pathname.includes("/dashboard/calendar"),
  );

  const userRole = (session?.user as any)?.role?.toLowerCase() || null;

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const isMasterDataActive = pathname.includes("/settings/master-data");

  return (
    <aside
      className={`h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-table-border flex flex-col py-6 z-50 transition-all duration-300 ${isCollapsed ? "w-[80px]" : "w-[260px]"}`}
    >
      {/* Brand Header */}
      <div
        className={`px-6 mb-8 flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3"}`}
      >
        <div className="w-10 h-10 bg-primary rounded-md p-1 flex items-center justify-center shrink-0 overflow-hidden">
          <Image
            src="/icon.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="font-sans text-lg font-bold text-primary leading-none">
              E-Recruitment
            </h1>
            <p className="font-mono text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1">
              Recruitment Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-2 space-y-1">
        {/* Expandable Dashboard Menu */}
        <div className="pb-1">
          <button
            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
            className={`w-full flex items-center justify-between px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname === "/dashboard" ||
                pathname.includes("/dashboard/executive") ||
                pathname.includes("/dashboard/geosource") ||
                pathname.includes("/dashboard/calendar")
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:bg-surface-container-low"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <div
              className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}
            >
              <LayoutDashboard
                className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
              />
              {!isCollapsed && (
                <span className="font-sans text-xs font-semibold">
                  Dashboard
                </span>
              )}
            </div>
            {!isCollapsed &&
              (isDashboardOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              ))}
          </button>

          {isDashboardOpen && !isCollapsed && (
            <div className="bg-surface-container-low/30 py-1">
              <Link
                href="/dashboard/executive"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/executive") ||
                    pathname === "/dashboard"
                    ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
              >
                <span className="font-sans text-[11px] font-semibold">
                  Executive Dashboard
                </span>
              </Link>
              <Link
                href="/dashboard/geosource"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/geosource")
                    ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
              >
                <span className="font-sans text-[11px] font-semibold">
                  GeoSource Dashboard
                </span>
              </Link>
              <Link
                href="/dashboard/calendar"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/calendar")
                    ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
              >
                <span className="font-sans text-[11px] font-semibold">
                  Calendar
                </span>
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/dashboard/job-openings"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/job-openings")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Job Openings" : undefined}
        >
          <Briefcase
            className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
          />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">
              Job Openings
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/pipeline"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/pipeline")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Pipeline" : undefined}
        >
          <Database
            className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
          />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">Pipeline</span>
          )}
        </Link>

        <Link
          href="/dashboard/archived-candidates"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/archived-candidates")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Archived Candidates" : undefined}
        >
          <Archive
            className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
          />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">
              Archived Candidates
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/blacklist"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/blacklist")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Blacklist" : undefined}
        >
          <UserX className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`} />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">Blacklist</span>
          )}
        </Link>

        <Link
          href="/dashboard/talent-pool"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/talent-pool")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Talent Pool" : undefined}
        >
          <Contact
            className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
          />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">Talent Pool</span>
          )}
        </Link>

        <Link
          href="/dashboard/interviews"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/interviews")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Interviews" : undefined}
        >
          <Users className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`} />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">Interviews</span>
          )}
        </Link>

        <Link
          href="/dashboard/generate-documents"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/dashboard/generate-documents")
              ? "text-primary font-bold border-r-4 border-primary bg-surface-container-low/50"
              : "text-on-surface-variant hover:bg-surface-container-low"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? "Generate Documents" : undefined}
        >
          <FileText
            className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
          />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">
              Generate Documents
            </span>
          )}
        </Link>

        {/* Expandable Settings Menu */}
        <div className="pt-2">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`w-full flex items-center justify-between px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/settings")
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:bg-surface-container-low"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            title={isCollapsed ? "Settings" : undefined}
          >
            <div
              className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}
            >
              <Settings
                className={`${isCollapsed ? "" : "mr-3"} w-5 h-5 shrink-0`}
              />
              {!isCollapsed && (
                <span className="font-sans text-xs font-semibold">
                  Settings
                </span>
              )}
            </div>
            {!isCollapsed &&
              (isSettingsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              ))}
          </button>

          {isSettingsOpen && !isCollapsed && (
            <div className="bg-surface-container-low/30 py-1">
              <Link
                href="/dashboard/settings/master-data"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${isMasterDataActive
                    ? "text-primary font-bold bg-surface-container-low/50"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
              >
                <Database className="mr-2 w-4 h-4 shrink-0" />
                <span className="font-sans text-[11px] font-semibold">
                  Master Data
                </span>
              </Link>
              {(userRole === "administrator" || userRole === "admin") && (
                <>
                  <Link
                    href="/dashboard/settings/users"
                    className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/settings/users")
                        ? "text-primary font-bold bg-surface-container-low/50"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                  >
                    <Users className="mr-2 w-4 h-4 shrink-0" />
                    <span className="font-sans text-[11px] font-semibold">
                      Users
                    </span>
                  </Link>
                  <Link
                    href="/dashboard/settings/audit-logs"
                    className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/settings/audit-logs")
                        ? "text-primary font-bold bg-surface-container-low/50"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                  >
                    <ShieldAlert className="mr-2 w-4 h-4 shrink-0" />
                    <span className="font-sans text-[11px] font-semibold">
                      Audit Logs
                    </span>
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/settings/sla"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${pathname.includes("/settings/sla")
                    ? "text-primary font-bold bg-surface-container-low/50"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
              >
                <Clock className="mr-2 w-4 h-4 shrink-0" />
                <span className="font-sans text-[11px] font-semibold">
                  SLA Configuration
                </span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Footer Settings & Support */}
      <div className="border-t border-table-border pt-4 px-3 space-y-2">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-status-error hover:bg-red-50/50 transition-colors duration-200 focus:outline-none cursor-pointer ${isCollapsed ? "justify-center" : ""}`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className={`w-5 h-5 shrink-0 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && (
            <span className="font-sans text-xs font-semibold">Sign Out</span>
          )}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center py-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
