import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface TableControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  children?: React.ReactNode;
}

export default function TableControls({
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  children
}: TableControlsProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 px-6 bg-surface-container-lowest border-b border-table-border">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-on-surface-variant" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-outline-variant rounded-md leading-5 bg-white placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
          placeholder="Cari data..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>
        {children && <div className="flex items-center gap-4 w-full sm:w-auto">{children}</div>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-on-surface-variant">Tampilkan:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border border-outline-variant rounded px-2 py-1 text-sm bg-white focus:outline-none focus:border-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span>{totalItems === 0 ? 0 : startIndex}-{endIndex} dari {totalItems}</span>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-1 rounded hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              className="p-1 rounded hover:bg-surface-container-high disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
