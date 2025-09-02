import Link from "next/link";
import PageSizeSelect from "../PageSizeSelect";

// Server component: compact, numbered pager + page-size selector
// Props:
// - basePath: string (e.g., "/dashboard/seller/products")
// - total: number
// - page: number (1-based)
// - pageSize: number
// - query?: object of existing query params to preserve (search, sort, filters, cols, etc.)
// - pageSizes?: number[] (defaults [10,20,50,100])
export default function PaginationServer({ basePath, total, page, pageSize, query = {}, pageSizes = [10, 20, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(pageSize) || 1)));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const currentPageSize = Number(pageSize) || 20;
  const skip = (currentPage - 1) * currentPageSize;
  const showingFrom = total === 0 ? 0 : skip + 1;
  const showingTo = Math.min(total, skip + currentPageSize);

  const toQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    // Preserve existing query params
    for (const [k, v] of Object.entries(query || {})) {
      if (v === undefined || v === null || v === "") continue;
      usp.set(k, String(v));
    }
    for (const [k, v] of Object.entries(overrides || {})) {
      if (v === undefined || v === null || v === "") usp.delete(k);
      else usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
  };

  const pageItems = (() => {
    const items = [];
    const win = 2; // pages around current
    const add = (type, value = null) => items.push({ type, value });
    const pushPage = (p) => add("page", p);
    if (totalPages <= 1) return items;
    pushPage(1);
    const start = Math.max(2, currentPage - win);
    const end = Math.min(totalPages - 1, currentPage + win);
    if (start > 2) add("ellipsis");
    for (let p = start; p <= end; p++) pushPage(p);
    if (end < totalPages - 1) add("ellipsis");
    if (totalPages > 1) pushPage(totalPages);
    return items;
  })();

  const sizeOptions = (pageSizes || [10,20,50,100]).map((n) => ({
    value: n,
    label: String(n),
    href: `${basePath}${toQS({ ...query, pageSize: n, page: 1 })}`,
  }));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="text-xs sm:text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total}</div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Page size (dropdown, auto-navigate) */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm">Rows:</span>
          <PageSizeSelect current={currentPageSize} options={sizeOptions} />
        </div>
        {/* Pager */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href={`${basePath}${toQS({ ...query, page: Math.max(1, currentPage - 1) })}`} className={`h-8 px-2 rounded border text-xs sm:text-sm ${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'bg-white hover:bg-zinc-50'}`}>Prev</Link>
          <div className="flex items-center gap-1">
            {pageItems.map((it, idx) => it.type === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-2 text-xs sm:text-sm text-muted-foreground">…</span>
            ) : (
              <Link
                key={`p-${it.value}`}
                href={`${basePath}${toQS({ ...query, page: it.value })}`}
                aria-current={it.value === currentPage ? 'page' : undefined}
                className={`h-8 min-w-8 px-2 rounded border text-center text-xs sm:text-sm inline-flex items-center justify-center ${it.value === currentPage ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}
              >
                {it.value}
              </Link>
            ))}
          </div>
          <Link href={`${basePath}${toQS({ ...query, page: Math.min(totalPages, currentPage + 1) })}`} className={`h-8 px-2 rounded border text-xs sm:text-sm ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'bg-white hover:bg-zinc-50'}`}>Next</Link>
        </div>
      </div>
    </div>
  );
}
