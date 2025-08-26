'use client';
import { useState, useCallback } from "react";

export default function useTableFilters(initialFilters = {}) {
  const [filters, setFiltersState] = useState({
    page: 1,
    pageSize: 10,
    ...initialFilters,
  });

  const setFilters = useCallback((newFilters) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ page: 1, pageSize: 10, ...initialFilters });
  }, [initialFilters]);

  const setPage = useCallback((page) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize) => {
    setFiltersState({ page: 1, pageSize, ...filters }); // reset page to 1
  }, [filters]);

  return { filters, setFilters, resetFilters, setPage, setPageSize };
}