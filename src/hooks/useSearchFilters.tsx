"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface SearchFilters {
  [key: string]: string | undefined;
  search?: string;
  q?: string;
  page?: string;
}

export interface UpdateFiltersOptions {
  replace?: boolean;
  resetPage?: boolean;
}

export interface UseSearchFiltersReturn {
  filters: SearchFilters;
  setFilters: (
    newFilters: Record<string, string | undefined | null>,
    options?: UpdateFiltersOptions,
  ) => void;
  setPage: (page: number | string) => void;
  resetFilters: () => void;
}

export default function useSearchFilters(): UseSearchFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract all filters from URL
  const filters = useMemo<SearchFilters>(() => {
    const obj: SearchFilters = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    // Normalize 'q' to 'search' while preserving explicit 'search'
    if (!obj.search && obj.q) obj.search = obj.q;
    return obj;
  }, [searchParams]);

  // Internal function to update URL
  const updateFilters = useCallback(
    (
      newFilters: Record<string, string | undefined | null>,
      options: UpdateFiltersOptions = { replace: true, resetPage: true },
    ) => {
      const prevParams = new URLSearchParams(searchParams.toString());
      const params = new URLSearchParams(prevParams.toString());

      let changed = false;
      for (const [key0, raw] of Object.entries(newFilters)) {
        // Normalize incoming 'q' => 'search'
        const key = key0 === "q" ? "search" : key0;
        const value = raw ?? "";
        if (value) {
          const next = String(value);
          if (params.get(key) !== next) {
            params.set(key, next);
            changed = true;
          }
        } else {
          if (params.has(key)) {
            params.delete(key);
            changed = true;
          }
        }
      }

      // Reset page to 1 only if filters changed (and page not explicitly provided)
      if (options.resetPage && !("page" in newFilters)) {
        if (changed && params.get("page") !== "1") {
          params.set("page", "1");
          // page change is a change too, but 'changed' is already true here
        }
      }

      const nextQuery = params.toString();
      const prevQuery = prevParams.toString();
      if (nextQuery === prevQuery) {
        return; // No-op: avoid redundant URL update
      }

      const method = options.replace ? router.replace : router.push;
      method(`${pathname}${nextQuery ? `?${nextQuery}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  // Public setter (no debounce)
  const setFilters = useCallback(
    (
      newFilters: Record<string, string | undefined | null>,
      options: UpdateFiltersOptions = { replace: true, resetPage: true },
    ) => {
      updateFilters(newFilters, options);
    },
    [updateFilters],
  );

  // Pagination setter
  const setPage = useCallback(
    (page: number | string) => {
      updateFilters(
        { page: String(page) },
        { replace: true, resetPage: false },
      );
    },
    [updateFilters],
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    if (!searchParams.toString()) return; // already clean
    router.replace(pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return { filters, setFilters, setPage, resetFilters };
}
