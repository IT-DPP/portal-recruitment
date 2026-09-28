import { useState, useMemo, useCallback } from 'react';

export interface UseClientTableProps<T> {
  data: T[];
  searchKeys?: (keyof T | string)[]; // e.g., ['name', 'code', 'province.name']
}

export function useClientTable<T>({ data, searchKeys = [] }: UseClientTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper to get nested object values
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const value = getNestedValue(item, key as string);
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRows: number) => {
    setRowsPerPage(newRows);
    setPage(1); // Reset to first page
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on search
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSearch,
    page: currentPage,
    setPage: handlePageChange,
    rowsPerPage,
    setRowsPerPage: handleRowsPerPageChange,
    totalPages,
    paginatedData,
    totalItems: filteredData.length,
    startIndex: (currentPage - 1) * rowsPerPage + 1,
    endIndex: Math.min(currentPage * rowsPerPage, filteredData.length),
  };
}
