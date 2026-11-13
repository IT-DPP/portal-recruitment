"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (newLimit: number) => void;
  rowsPerPageOptions?: number[];
  isLoading?: boolean;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  isLoading = false,
}: PaginationBarProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1; // pages around current
    const pages: (number | string)[] = [];
    const range: number[] = [];

    for (
      let i = Math.max(2, safeCurrentPage - delta);
      i <= Math.min(safeTotalPages - 1, safeCurrentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (safeCurrentPage - delta > 2) {
      range.unshift(-1); // indicator for left ellipsis
    }
    if (safeCurrentPage + delta < safeTotalPages - 1) {
      range.push(-2); // indicator for right ellipsis
    }

    range.unshift(1);
    if (safeTotalPages > 1) {
      range.push(safeTotalPages);
    }

    return range;
  };

  const pageRange = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-table-border text-sm text-on-surface-variant">
      {/* Left: Rows Per Page Selector */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            Tampilkan:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            disabled={isLoading}
            className="border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs sm:text-sm bg-white font-medium text-slate-700 hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
          >
            {rowsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} baris
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs sm:text-sm text-slate-500 font-medium">
          {totalItems === 0 ? (
            "0 data"
          ) : (
            <>
              <span className="font-semibold text-slate-800">{startIndex}</span>
              {" - "}
              <span className="font-semibold text-slate-800">{endIndex}</span>
              {" dari "}
              <span className="font-semibold text-slate-800">{totalItems}</span>
              {" data"}
            </>
          )}
        </span>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1 || isLoading}
          title="Halaman Pertama"
          className="p-1.5 rounded-lg border border-outline-variant hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1 || isLoading}
          title="Halaman Sebelumnya"
          className="p-1.5 rounded-lg border border-outline-variant hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Number Buttons */}
        <div className="flex items-center gap-1 px-1">
          {pageRange.map((p, idx) => {
            if (p === -1 || p === -2) {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 font-bold select-none text-xs"
                >
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === safeCurrentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages || isLoading}
          title="Halaman Berikutnya"
          className="p-1.5 rounded-lg border border-outline-variant hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages || isLoading}
          title="Halaman Terakhir"
          className="p-1.5 rounded-lg border border-outline-variant hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

