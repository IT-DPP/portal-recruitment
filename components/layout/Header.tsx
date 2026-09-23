"use client";

import React, { useState } from 'react';
import { Search, Bell, Grid, User, DatabaseZap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { generateDummyData } from '@/lib/seeder';

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, text: "System updated to Next.js App Router", time: "Just now", unread: true },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="flex justify-between items-center h-16 px-8 bg-surface-container-lowest border-b border-table-border sticky top-0 z-40 font-sans w-full">
      {/* Left Title & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        
        {/* Interactive Search Bar Placeholder */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-transparent rounded focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-xs font-sans text-on-surface"
          />
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        
        {/* Generate Dummy Data Button */}
        <button
          onClick={() => {
            generateDummyData();
            alert("10 Dummy Data berhasil di-generate! Halaman akan dimuat ulang.");
            window.location.reload();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          title="Generate 10 Dummy Data"
        >
          <DatabaseZap className="w-4 h-4" />
          <span className="hidden sm:inline">Seed Data</span>
        </button>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowProfileMenu(false);
            }}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative focus:outline-none cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-warning rounded-full border border-white" />
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-table-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-table-border bg-surface-container-low flex justify-between items-center">
                <span className="font-semibold text-xs text-primary">Notifications</span>
                <span className="text-[10px] text-status-success font-semibold uppercase">1 New</span>
              </div>
              <div className="divide-y divide-table-border max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`px-4 py-3 hover:bg-surface-container-low transition-colors ${notif.unread ? 'bg-blue-50/20' : ''}`}>
                    <p className="text-xs text-on-surface font-sans leading-snug">{notif.text}</p>
                    <span className="text-[10px] text-on-surface-variant mt-1 block">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Apps Grid Icon */}
        <button
          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors focus:outline-none hidden sm:block cursor-pointer"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* User profile section */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-3 pl-4 border-l border-table-border text-left focus:outline-none cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="font-sans text-xs font-semibold text-on-surface leading-none">{session?.user?.name || 'User'}</p>
              <p className="font-mono text-[11px] font-medium text-on-surface-variant mt-0.5 leading-none">{(session?.user as any)?.role || 'Role'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-table-border rounded-lg shadow-lg z-50 py-1">
              <div className="px-4 py-2 border-b border-table-border">
                <p className="text-xs font-bold text-on-surface leading-snug">{session?.user?.name}</p>
                <p className="text-[11px] text-on-surface-variant font-mono truncate">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-status-error hover:bg-red-50/50 transition-colors font-sans focus:outline-none cursor-pointer"
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
