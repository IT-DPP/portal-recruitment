"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  Briefcase, 
  Clock, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";

export default function CandidateSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("nexus_candidate_session");
    if (session) {
      const parsed = JSON.parse(session);
      setUserEmail(parsed.email);
    } else {
      router.push("/candidate/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("nexus_candidate_session");
    router.push("/");
  };

  const navItems = [
    { name: "My Profile", href: "/candidate/profile", icon: User },
    { name: "Job Openings", href: "/candidate/jobs", icon: Briefcase },
    { name: "My Applications", href: "/candidate/history", icon: Clock },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-table-border"
      >
        <Menu className="w-5 h-5 text-on-surface" />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen bg-surface-container-lowest border-r border-table-border z-40 transition-all duration-300 flex flex-col
          ${isCollapsed ? "w-[80px]" : "w-[260px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-table-border shrink-0">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="ml-3 overflow-hidden">
              <h1 className="font-bold text-primary text-sm whitespace-nowrap">Candidate Portal</h1>
              <p className="text-[10px] text-on-surface-variant truncate">{userEmail}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg transition-colors group relative
                  ${isActive 
                    ? "bg-primary/10 text-primary font-bold" 
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-semibold"
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"}`} />
                {!isCollapsed && (
                  <span className="ml-3 text-sm">{item.name}</span>
                )}
                {/* Active Indicator Line */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-table-border space-y-2">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group
              text-status-error hover:bg-red-50 font-semibold
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="ml-3 text-sm">Logout</span>}
          </button>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full items-center justify-center py-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
