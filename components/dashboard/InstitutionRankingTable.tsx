import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function InstitutionRankingTable({ data }: InstitutionRankingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const getTypeColor = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'BLK') return 'bg-blue-100 text-blue-700';
    if (t === 'LPK') return 'bg-cyan-100 text-cyan-700';
    if (t === 'EDUCATIONAL') return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    if (status === 'High Priority') return 'text-green-600';
    if (status === 'Underperforming') return 'text-red-600';
    return 'text-gray-500';
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-500';
    if (rate >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-table-border flex flex-col">
      <div className="p-5 border-b border-table-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="font-bold text-on-surface text-lg">Institution Performance Ranking</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search institution..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-4 py-2 border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full sm:w-64 bg-surface-container-lowest"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-table-border text-sm text-on-surface-variant">
              <th className="p-4 font-semibold whitespace-nowrap">Institution Name</th>
              <th className="p-4 font-semibold whitespace-nowrap">Type</th>
              <th className="p-4 font-semibold whitespace-nowrap">Total Applicants</th>
              <th className="p-4 font-semibold whitespace-nowrap">Pass Rate</th>
              <th className="p-4 font-semibold whitespace-nowrap">Active Candidates</th>
              <th className="p-4 font-semibold whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {currentData.length > 0 ? (
              currentData.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-table-border last:border-b-0 hover:bg-surface-container-lowest/50 transition-colors">
                  <td className="p-4 font-semibold text-on-surface whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${getTypeColor(item.type)}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface whitespace-nowrap">
                    {item.totalApplicants}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getPassRateColor(item.passRate)}`}
                          style={{ width: `${item.passRate}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-on-surface w-9">{item.passRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-on-surface whitespace-nowrap">
                    {item.activeCandidates}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className={`flex items-center gap-1.5 font-medium ${getStatusColor(item.status)}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      {item.status}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                  No institutions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-table-border flex items-center justify-between text-sm text-on-surface-variant">
        <div>
          Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} institutions
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            // Simple pagination logic for demo
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page 
                      ? 'bg-primary text-white border-primary' 
                      : 'border border-outline-variant hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {page}
                </button>
              );
            }
            if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-1">...</span>;
            }
            return null;
          })}

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
