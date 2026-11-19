"use client";

import React, { useState, useMemo } from 'react';
import { Search, X, Filter, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { useClientTable } from '@/hooks/useClientTable';
import PaginationBar from '@/components/ui/PaginationBar';

export interface InstitutionData {
  id: string;
  name: string;
  type: string;
  totalApplicants: number;
  passRate: number;
  activeCandidates: number;
  status: 'High Priority' | 'Standard' | 'Underperforming' | string;
}

interface InstitutionRankingTableProps {
  data: InstitutionData[];
}

type SortOption = 
  | 'totalApplicants_desc'
  | 'totalApplicants_asc'
  | 'passRate_desc'
  | 'passRate_asc'
  | 'name_asc'
  | 'name_desc';

export default function InstitutionRankingTable({ data }: InstitutionRankingTableProps) {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [currentSort, setCurrentSort] = useState<SortOption>('totalApplicants_desc');

  // 1. Filter by Institution Type
  const filteredByType = useMemo(() => {
    if (selectedType === "ALL") return data;
    return data.filter((item) => {
      const t = (item.type || "").toUpperCase();
      if (selectedType === "UNIVERSITY") {
        return t === "UNIVERSITY" || t.includes("UNIV");
      }
      if (selectedType === "SMK") {
        return t === "SMK" || t.includes("SMK");
      }
      if (selectedType === "SMA") {
        return t === "SMA" || t.includes("SMA");
      }
      if (selectedType === "BLK") {
        return t === "BLK" || t.includes("BLK");
      }
      if (selectedType === "LPK") {
        return t === "LPK" || t.includes("LPK");
      }
      return t === selectedType;
    });
  }, [data, selectedType]);

  // 2. Sort by selected criterion (Pass Rate, Total Applicants, or Name)
  const sortedData = useMemo(() => {
    const list = [...filteredByType];
    switch (currentSort) {
      case 'passRate_desc':
        return list.sort((a, b) => b.passRate - a.passRate || b.totalApplicants - a.totalApplicants);
      case 'passRate_asc':
        return list.sort((a, b) => a.passRate - b.passRate || a.totalApplicants - b.totalApplicants);
      case 'totalApplicants_desc':
        return list.sort((a, b) => b.totalApplicants - a.totalApplicants || b.passRate - a.passRate);
      case 'totalApplicants_asc':
        return list.sort((a, b) => a.totalApplicants - b.totalApplicants || a.passRate - b.passRate);
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return list;
    }
  }, [filteredByType, currentSort]);

  // 3. Search and Pagination
  const {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    paginatedData,
    totalItems,
  } = useClientTable({
    data: sortedData,
    searchKeys: ['name', 'type', 'status'],
    initialRowsPerPage: 5,
    debounceMs: 300,
  });

  // Helper for clicking table headers to toggle sort
  const handleHeaderSort = (field: 'totalApplicants' | 'passRate' | 'name') => {
    if (field === 'passRate') {
      const next = currentSort === 'passRate_desc' ? 'passRate_asc' : 'passRate_desc';
      setCurrentSort(next);
    } else if (field === 'totalApplicants') {
      const next = currentSort === 'totalApplicants_desc' ? 'totalApplicants_asc' : 'totalApplicants_desc';
      setCurrentSort(next);
    } else if (field === 'name') {
      const next = currentSort === 'name_asc' ? 'name_desc' : 'name_asc';
      setCurrentSort(next);
    }
    setPage(1);
  };

  const getSortIcon = (field: 'totalApplicants' | 'passRate' | 'name') => {
    if (field === 'passRate') {
      if (currentSort === 'passRate_desc') return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
      if (currentSort === 'passRate_asc') return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    } else if (field === 'totalApplicants') {
      if (currentSort === 'totalApplicants_desc') return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
      if (currentSort === 'totalApplicants_asc') return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    } else if (field === 'name') {
      if (currentSort === 'name_asc') return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
      if (currentSort === 'name_desc') return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
  };

  const getTypeColor = (type: string) => {
    const t = (type || "").toUpperCase();
    if (t === 'BLK') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (t === 'LPK') return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
    if (t === 'UNIVERSITY' || t === 'UNIVERSITAS' || t.includes('UNIV')) return 'bg-purple-50 text-purple-700 border border-purple-200';
    if (t === 'SMK' || t.includes('SMK')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (t === 'SMA' || t.includes('SMA')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (t === 'EDUCATIONAL') return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    return 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const t = (type || "").toUpperCase();
    if (t === 'UNIVERSITY' || t === 'UNIVERSITAS') return 'UNIVERSITAS';
    if (t === 'SMK') return 'SMK (VOKASI)';
    if (t === 'SMA') return 'SMA / SEDERAJAT';
    if (t === 'BLK') return 'BLK';
    if (t === 'LPK') return 'LPK';
    return t;
  };

  const getStatusColor = (status: string) => {
    if (status === 'High Priority') return 'text-emerald-600 font-bold';
    if (status === 'Underperforming') return 'text-rose-600 font-bold';
    return 'text-slate-600 font-semibold';
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-table-border flex flex-col">
      {/* Header Bar */}
      <div className="p-5 border-b border-table-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-on-surface text-lg">Institution Performance Ranking</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Peringkat dan efektivitas kelulusan asal institusi pelamar (Universitas, SMK, SMA, BLK, & LPK).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={currentSort}
              onChange={(e) => {
                setCurrentSort(e.target.value as SortOption);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-outline-variant rounded-md text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
            >
              <option value="totalApplicants_desc">Paling Banyak Mendaftar</option>
              <option value="totalApplicants_asc">Paling Sedikit Mendaftar</option>
              <option value="passRate_desc">Pass Rate Tertinggi</option>
              <option value="passRate_asc">Pass Rate Terendah</option>
              <option value="name_asc">Nama Institusi (A-Z)</option>
              <option value="name_desc">Nama Institusi (Z-A)</option>
            </select>
          </div>

          {/* Filter Type Selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 border border-outline-variant rounded-xl text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
            >
              <option value="ALL">Semua Tipe Institusi</option>
              <option value="UNIVERSITY">Universitas / PT</option>
              <option value="SMK">SMK / Kejuruan</option>
              <option value="SMA">SMA / Sederajat</option>
              <option value="BLK">BLK (Balai Latihan)</option>
              <option value="LPK">LPK (Lembaga Pelatihan)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari nama institusi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 border border-outline-variant rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-table-border text-xs uppercase font-bold text-on-surface-variant select-none">
              <th 
                className="p-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleHeaderSort('name')}
                title="Klik untuk mengurutkan berdasarkan nama"
              >
                <div className="flex items-center gap-1.5">
                  <span>Institution Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th className="p-4 whitespace-nowrap">Type</th>
              <th 
                className="p-4 whitespace-nowrap text-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleHeaderSort('totalApplicants')}
                title="Klik untuk mengurutkan berdasarkan jumlah pelamar"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Total Applicants</span>
                  {getSortIcon('totalApplicants')}
                </div>
              </th>
              <th 
                className="p-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleHeaderSort('passRate')}
                title="Klik untuk mengurutkan berdasarkan pass rate"
              >
                <div className="flex items-center gap-1.5">
                  <span>Pass Rate (%)</span>
                  {getSortIcon('passRate')}
                </div>
              </th>
              <th className="p-4 whitespace-nowrap text-center">Active Candidates</th>
              <th className="p-4 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-table-border last:border-b-0 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-800 whitespace-nowrap">
                    {item.totalApplicants}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-surface-container rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getPassRateColor(item.passRate)}`} 
                          style={{ width: `${item.passRate}%` }}
                        />
                      </div>
                      <span className="font-semibold text-xs text-slate-800">{item.passRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-semibold text-slate-700 whitespace-nowrap">
                    {item.activeCandidates}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-on-surface-variant text-sm">
                  Tidak ada data institusi yang sesuai dengan filter dan pengurutan saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <PaginationBar
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={rowsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={setRowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
        />
      )}
    </div>
  );
}
