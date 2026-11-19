"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore persisted desktop collapse state
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("dpp_sidebar_collapsed");
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
      localStorage.setItem("dpp_sidebar_collapsed", String(val));
    } catch {
      // ignore
    }
  };

  // Not authenticated — redirect to login
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Still loading session from server
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-bright">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bright font-sans text-on-surface relative">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ml-0 ${
          isCollapsed ? 'md:ml-[80px]' : 'md:ml-[260px]'
        }`}
      >
        <Header onToggleMobile={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-bright p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
