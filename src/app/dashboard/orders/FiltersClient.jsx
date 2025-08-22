import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import PrintButton from "@/components/dashboard/PrintButton";
import { Search } from "lucide-react";

export default function FiltersClient({ sp }) {
  // read params from server-provided props
  const q = (sp?.q || '').toString().trim();
  const status = (sp?.status || '').toString();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  const pageSize = (sp?.pageSize || '20').toString();

  const SORT_LABELS = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    'amount-high': 'Amount high→low',
    'amount-low': 'Amount low→high',
    'status-asc': 'Status A→Z',
    'status-desc': 'Status Z→A',
  };
  const sortLabel = SORT_LABELS[sortKey] || SORT_LABELS.newest;
  const dateLabel = (!fromStr && !toStr) ? 'Any' : `${fromStr || '…'} → ${toStr || '…'}`;
  const mkQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    if (status) usp.set('status', status);
    if (fromStr) usp.set('from', fromStr);
    if (toStr) usp.set('to', toStr);
    if (sortKey) usp.set('sort', sortKey);
    if (pageSize) usp.set('pageSize', pageSize);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') usp.delete(k);
      else usp.set(k, String(v));
    });
    if (!('page' in overrides)) usp.set('page', '1');
    const s = usp.toString();
    return s ? `?${s}` : '';
  };

  // Handlers for auto-apply
  // Server: forms submit with GET to navigate

  // status dropdown removed

  // Clear links
  const clearAdvancedHref = `/dashboard/orders${mkQS({ from: '', to: '', sort: 'newest', page: '1' })}`;
  const clearAllHref = `/dashboard/orders`;

  return (
    <div className="rounded-lg border bg-card p-4 md:p-5">
      {/* Title + Advanced toggle */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Search & Filter</h2>
          <p className="text-xs text-muted-foreground">Find your orders with advanced filtering</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">Sort: {sortLabel}</span>
            <span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">Date: {dateLabel}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline">Show Advanced</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(90vw,420px)] p-3">
              <form className="grid grid-cols-1 gap-3" method="GET" action="/dashboard/orders">
                <div className="flex flex-col gap-1">
                  <label htmlFor="from" className="text-xs text-muted-foreground">From</label>
                  <Input id="from" type="date" name="from" defaultValue={fromStr} className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="to" className="text-xs text-muted-foreground">To</label>
                  <Input id="to" type="date" name="to" defaultValue={toStr} className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="sort" className="text-xs text-muted-foreground">Sort</label>
                  <select id="sort" name="sort" defaultValue={sortKey} className="block w-full h-9 rounded-md border px-3 text-sm">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="amount-high">Amount: high to low</option>
                    <option value="amount-low">Amount: low to high</option>
                    <option value="status-asc">Status A→Z</option>
                    <option value="status-desc">Status Z→A</option>
                  </select>
                </div>
                <input type="hidden" name="q" value={q} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="pageSize" value={pageSize} />
                <input type="hidden" name="page" value="1" />
                <div className="flex items-center justify-end gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={clearAdvancedHref}>Clear</Link></Button>
                  <Button type="submit" size="sm">Apply</Button>
                </div>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Primary row: Search + Status */}
      <form className="mt-3 grid grid-cols-1 gap-2" method="GET" action="/dashboard/orders">
        <div className="col-span-1">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={18} />
              </span>
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search order #, customer, email, phone"
                aria-label="Search orders"
                className="h-10 pl-9 w-full"
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </div>
        </div>
        {/* preserve other filters */}
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="from" value={fromStr} />
        <input type="hidden" name="to" value={toStr} />
        <input type="hidden" name="sort" value={sortKey} />
        <input type="hidden" name="pageSize" value={pageSize} />
        <input type="hidden" name="page" value="1" />
      </form>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button asChild size="sm" variant="outline"><Link href={clearAllHref}>Clear All Filters</Link></Button>
        <PrintButton />
      </div>
    </div>
  );
}
