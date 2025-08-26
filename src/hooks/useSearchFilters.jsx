'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export default function useSearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract all filters from URL
  const filters = useMemo(() => {
    const obj = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [searchParams]);

  // Internal function to update URL
  const updateFilters = useCallback(
    (newFilters, options = { replace: true, resetPage: true }) => {
      const prevParams = new URLSearchParams(searchParams.toString());
      const params = new URLSearchParams(prevParams.toString());

      let changed = false;
      for (const [key, raw] of Object.entries(newFilters)) {
        const value = raw ?? '';
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
      if (options.resetPage && !('page' in newFilters)) {
        if (changed && params.get('page') !== '1') {
          params.set('page', '1');
          // page change is a change too, but 'changed' is already true here
        }
      }

      const nextQuery = params.toString();
      const prevQuery = prevParams.toString();
      if (nextQuery === prevQuery) {
        return; // No-op: avoid redundant URL update
      }

      const method = options.replace ? router.replace : router.push;
      method(`${pathname}${nextQuery ? `?${nextQuery}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Public setter (no debounce)
  const setFilters = useCallback(
    (newFilters, options = { replace: true, resetPage: true }) => {
      updateFilters(newFilters, options);
    },
    [updateFilters]
  );

  // Pagination setter
  const setPage = useCallback(
    (page) => {
      updateFilters({ page: String(page) }, { replace: true, resetPage: false });
    },
    [updateFilters]
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    if (!searchParams.toString()) return; // already clean
    router.replace(pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return { filters, setFilters, setPage, resetFilters };
}
