"use client";

import { useState, useCallback } from "react";

export interface TableFilters {
  page: number;
  pageSize: number;
  [key: string]: unknown;
}

export interface UseTableFiltersReturn {
  filters: TableFilters;
  setFilters: (newFilters: Partial<TableFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export default function useTableFilters(
  initialFilters: Partial<TableFilters> = {},
): UseTableFiltersReturn {
  const [filters, setFiltersState] = useState<TableFilters>({
    page: 1,
    pageSize: 10,
    ...initialFilters,
  });

  const setFilters = useCallback((newFilters: Partial<TableFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ page: 1, pageSize: 10, ...initialFilters });
  }, [initialFilters]);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setFiltersState((prev) => ({ ...prev, page: 1, pageSize })); // reset page to 1
  }, []);

  return { filters, setFilters, resetFilters, setPage, setPageSize };
}
