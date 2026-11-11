"use client";

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-surface-container-lowest border-b border-table-border sticky top-0 z-40 font-sans w-full">
      {/* Left Title & Status */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden sm:flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Production System</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">E-Recruitment Enterprise Portal</span>
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* User Profile Section */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-4 border-l border-table-border text-left focus:outline-none cursor-pointer hover:opacity-90 transition-opacity"
            aria-label="User Profile Menu"
          >
            <div className="text-right hidden md:block">
              <p className="font-sans text-xs font-semibold text-on-surface leading-none">{session?.user?.name || 'User'}</p>
              <p className="font-mono text-[11px] font-medium text-on-surface-variant mt-1 leading-none">{(session?.user as any)?.role || 'RECRUITER'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-2xs">
              <User className="w-4 h-4" />
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-table-border rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-table-border">
                <p className="text-xs font-bold text-on-surface leading-snug">{session?.user?.name}</p>
                <p className="text-[11px] text-on-surface-variant font-mono truncate mt-0.5">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-status-error hover:bg-red-50 transition-colors font-sans focus:outline-none cursor-pointer flex items-center gap-2"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
