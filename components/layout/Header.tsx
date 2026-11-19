"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ChevronRight, Home, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface HeaderProps {
  onToggleMobile?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  executive: "Executive",
  geosource: "Geosource",
  calendar: "Kalender Rekrutmen",
  pipeline: "Pipeline Rekrutmen",
  "job-openings": "Lowongan Kerja",
  create: "Tambah Lowongan",
  edit: "Edit Lowongan",
  verify: "Verifikasi Pelamar",
  "talent-pool": "Talent Pool",
  add: "Tambah Kandidat",
  blacklist: "Blacklist",
  "archived-candidates": "Arsip Pelamar",
  "generate-documents": "Generate Dokumen",
  interviews: "Jadwal Interview",
  settings: "Pengaturan",
  "master-data": "Master Data",
  positions: "Posisi & Jabatan",
  department: "Departemen",
  customer: "Customer & Klien",
  "sites-operation": "Site Operasional",
  clinics: "Klinik MCU",
  province: "Provinsi",
  city: "Kota & Kabupaten",
  certification: "Sertifikasi",
  "skema-sertifikasi": "Skema Sertifikasi",
  institute: "Lembaga Sertifikasi",
  "request-type": "Tipe Permintaan",
  "rejection-message": "Template Penolakan",
  users: "Pengguna",
  "audit-logs": "Audit Log PDP",
  sla: "Konfigurasi SLA",
  candidate: "Kandidat",
  profile: "Profil Saya",
  jobs: "Lowongan Kerja",
  history: "Riwayat Lamaran",
  "past-applications": "Aplikasi Terdahulu",
};

function getBreadcrumbLabel(segment: string): string {
  if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment];
  // If it's a CUID, UUID, or long identifier
  if (/^c[a-z0-9]{20,}$/i.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) || /^\d+$/.test(segment)) {
    return "Detail";
  }
  // Otherwise humanize
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Header({ onToggleMobile }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Generate dynamic breadcrumb items from current pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    return {
      label: getBreadcrumbLabel(seg),
      href,
    };
  });

  return (
    <header className="flex justify-between items-center h-16 px-4 sm:px-8 bg-surface-container-lowest border-b border-table-border sticky top-0 z-30 font-sans w-full">
      {/* Left Dynamic Breadcrumbs Navigation with Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {onToggleMobile && (
          <button
            type="button"
            onClick={onToggleMobile}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors shrink-0 cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium min-w-0 flex-1 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-[#D9232A] transition-colors shrink-0 flex items-center"
            title="Beranda Dashboard"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.href} className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                {isLast ? (
                  <span className="font-bold text-[#0A2540] truncate max-w-[160px] sm:max-w-none">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-500 hover:text-slate-900 transition-colors truncate max-w-[110px] sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4 shrink-0">
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
