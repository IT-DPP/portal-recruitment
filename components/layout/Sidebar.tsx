"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  Database,
  ChevronDown,
  ChevronRight,
  LogOut,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Track if Settings menu is expanded
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.includes('/settings'));

  const handleLogout = () => {
    localStorage.removeItem('nexus_logged_user');
    localStorage.removeItem('nexus_remember_login');
    router.push('/login');
  };

  const isMasterDataActive = pathname.includes('/settings/master-data');

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-table-border flex flex-col py-6 z-50">
      {/* Brand Header */}
      <div className="px-6 mb-8">
        <h1 className="font-sans text-lg font-bold text-primary">UGZ Console</h1>
        <p className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Admin Console</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-2 space-y-1">
        <Link
          href="/dashboard"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${
            pathname === '/dashboard'
              ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low/50'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <LayoutDashboard className="mr-3 w-5 h-5 shrink-0" />
          <span className="font-sans text-xs font-semibold">Dashboard</span>
        </Link>

        <Link
          href="/dashboard/job-openings"
          className={`w-full flex items-center px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${
            pathname.includes('/dashboard/job-openings')
              ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low/50'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <Briefcase className="mr-3 w-5 h-5 shrink-0" />
          <span className="font-sans text-xs font-semibold">Job Openings</span>
        </Link>

        {/* Expandable Settings Menu */}
        <div className="pt-2">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`w-full flex items-center justify-between px-6 py-3 transition-colors duration-200 text-left focus:outline-none ${
              pathname.includes('/settings')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-center">
              <Settings className="mr-3 w-5 h-5 shrink-0" />
              <span className="font-sans text-xs font-semibold">Settings</span>
            </div>
            {isSettingsOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isSettingsOpen && (
            <div className="bg-surface-container-low/30 py-1">
              <Link
                href="/dashboard/settings/master-data"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${
                  isMasterDataActive
                    ? 'text-primary font-bold bg-surface-container-low/50'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Database className="mr-2 w-4 h-4 shrink-0" />
                <span className="font-sans text-[11px] font-semibold">Master Data</span>
              </Link>
              <Link
                href="/dashboard/settings/sla"
                className={`w-full flex items-center pl-14 pr-6 py-2 transition-colors duration-200 text-left focus:outline-none ${
                  pathname.includes('/settings/sla')
                    ? 'text-primary font-bold bg-surface-container-low/50'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Clock className="mr-2 w-4 h-4 shrink-0" />
                <span className="font-sans text-[11px] font-semibold">SLA Configuration</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Footer Settings & Support */}
      <div className="border-t border-table-border pt-4 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-6 py-2 text-status-error hover:bg-red-50/50 transition-colors duration-200 text-left focus:outline-none cursor-pointer"
        >
          <LogOut className="mr-3 w-5 h-5 shrink-0" />
          <span className="font-sans text-xs font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
