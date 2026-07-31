"use client";

import React from 'react';
import Link from 'next/link';
import { Building2, Users, MapPin, Briefcase, FileText, Map, Navigation } from 'lucide-react';

export default function MasterDataPage() {
  const masterDataList = [
    {
      title: 'Department',
      description: 'Kelola data departemen dalam perusahaan.',
      href: '/dashboard/settings/master-data/department',
      icon: Building2,
    },
    {
      title: 'Customer',
      description: 'Kelola master data pelanggan atau klien perusahaan.',
      href: '/dashboard/settings/master-data/customer',
      icon: Users,
    },
    {
      title: 'Sites Operation',
      description: 'Kelola data site operasional beserta lokasi koordinat (longitude/latitude).',
      href: '/dashboard/settings/master-data/sites-operation',
      icon: MapPin,
    },
    {
      title: 'Positions',
      description: 'Kelola daftar posisi pekerjaan yang tersedia.',
      href: '/dashboard/settings/master-data/positions',
      icon: Briefcase,
    },
    {
      title: 'Request Type',
      description: 'Kelola jenis permintaan pekerjaan dan deskripsinya.',
      href: '/dashboard/settings/master-data/request-type',
      icon: FileText,
    },
    {
      title: 'Province',
      description: 'Kelola master data provinsi.',
      href: '/dashboard/settings/master-data/province',
      icon: Map,
    },
    {
      title: 'City / Regency',
      description: 'Kelola master data kota/kabupaten yang berelasi dengan provinsi.',
      href: '/dashboard/settings/master-data/city',
      icon: Navigation,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary tracking-tight">Master Data Settings</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Kelola semua data referensi utama sistem dalam satu tempat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {masterDataList.map((item) => (
          <Link 
            key={item.title} 
            href={item.href}
            className="group block p-6 bg-white border border-table-border rounded-lg shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
          >
            <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-container/10 transition-colors">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
