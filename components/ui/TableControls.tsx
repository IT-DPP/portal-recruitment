"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import PaginationBar from "./PaginationBar";

export interface TableControlsProps {
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
  searchPlaceholder?: string;
  rowsPerPageOptions?: number[];
  isLoading?: boolean;
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
  searchPlaceholder = "Cari data...",
  rowsPerPageOptions = [10, 25, 50, 100],
  isLoading = false,
  children,
}: TableControlsProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync internal search state if parent searchQuery changes externally
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
        setPage(1); // Reset to page 1 on search change
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery, setPage]);

  const handleClear = () => {
    setLocalSearch("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="flex flex-col w-full bg-white border-b border-table-border">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-3.5 px-6 bg-surface-container-lowest">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-8 py-2 border border-outline-variant rounded-xl leading-5 bg-white placeholder-on-surface-variant text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-all shadow-2xs"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pagination Bar Component */}
      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={rowsPerPage}
        onPageChange={setPage}
        onItemsPerPageChange={setRowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        isLoading={isLoading}
      />
    </div>
  );
}
