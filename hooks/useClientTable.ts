import { useState, useMemo, useCallback, useEffect } from 'react';

export interface UseClientTableProps<T> {
  data: T[];
  searchKeys?: (keyof T | string)[]; // e.g., ['name', 'code', 'province.name']
  initialRowsPerPage?: number;
  debounceMs?: number;
}

export function useClientTable<T>({
  data,
  searchKeys = [],
  initialRowsPerPage = 10,
  debounceMs = 300,
}: UseClientTableProps<T>) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to first page when debounced query updates
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchInput, debounceMs]);

  // Helper to get nested object values
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;

    const lowerQuery = debouncedSearch.toLowerCase().trim();
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const value = getNestedValue(item, key as string);
        if (value !== null && value !== undefined) {
          return String(value).toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [data, debouncedSearch, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRows: number) => {
    setRowsPerPage(newRows);
    setPage(1);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchInput(query);
  }, []);

  return {
    searchQuery: searchInput, // Current text in input box
    debouncedSearch,          // Effective debounced query
    setSearchQuery: handleSearch,
    page: currentPage,
    setPage: handlePageChange,
    rowsPerPage,
    setRowsPerPage: handleRowsPerPageChange,
    totalPages,
    paginatedData,
    totalItems: filteredData.length,
    startIndex: filteredData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1,
    endIndex: Math.min(currentPage * rowsPerPage, filteredData.length),
  };
}
