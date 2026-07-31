"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem('nexus_logged_user');
    if (!loggedUser) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return null; // Or a loading spinner

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bright font-sans text-on-surface">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full ml-64">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-bright p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
