"use client";

import { useEffect, useMemo, useState } from "react";
import useSearchFilters from "@/hooks/useSearchFilters.jsx";
import { Skeleton } from "@/components/ui/skeleton";

export default function FiltersClient({ defaultSearch = "", defaultStatus = "", defaultPageSize = 20 }) {
  const { filters, setFilters, resetFilters } = useSearchFilters();

  const [mounted, setMounted] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search ?? defaultSearch);
  const status = filters.status ?? defaultStatus;
  const pageSize = Number(filters.pageSize ?? defaultPageSize);

  useEffect(() => setMounted(true), []);

  // Debounce search updates to avoid rapid URL churn
  useEffect(() => {
    if (!mounted) return; // don't trigger during SSR hydration
    const t = setTimeout(() => {
      setFilters({ search: localSearch }, { replace: true, resetPage: true });
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, setFilters, mounted]);

  const exportHref = useMemo(() => {
    const usp = new URLSearchParams();
    if (filters.search) usp.set("search", filters.search);
    if (filters.status) usp.set("status", filters.status);
    return `/api/seller/issues/export?${usp.toString()}`;
  }, [filters.search, filters.status]);

  if (!mounted) {
    // Reserve space to prevent layout shifts during hydration
    return (
      <div className="static mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2" aria-hidden>
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28 ml-auto" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="static mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2" role="region" aria-label="Issue filters">
      <input
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search subject or order #"
        className="border rounded px-3 py-2 text-sm"
        aria-label="Search issues"
      />
      <select
        defaultValue={status}
        onChange={(e) => setFilters({ status: e.target.value }, { replace: true, resetPage: true })}
        className="border rounded px-3 py-2 text-sm"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="resolved">Resolved</option>
      </select>
      <div className="flex items-center gap-2">
        <select
          defaultValue={String(pageSize)}
          onChange={(e) => setFilters({ pageSize: e.target.value }, { replace: true, resetPage: true })}
          className="border rounded px-2 py-2 text-sm"
          aria-label="Items per page"
        >
          {[10, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              {n}/page
            </option>
          ))}
        </select>
        <a
          href={exportHref}
          className="ml-auto px-3 py-2 rounded border text-sm hover:bg-zinc-50"
          download
        >
          Export CSV
        </a>
        <button
          type="button"
          onClick={() => resetFilters()}
          className="px-3 py-2 rounded border text-sm hover:bg-zinc-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
