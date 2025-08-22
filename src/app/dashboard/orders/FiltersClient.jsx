"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import PrintButton from "@/components/dashboard/PrintButton";
import { Search } from "lucide-react";

const STATUSES = ['processing', 'packed', 'assigned', 'shipped', 'delivered', 'cancelled'];

export default function FiltersClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [advOpen, setAdvOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // read params
  const q = (sp.get('q') || '').trim();
  const status = sp.get('status') || '';
  const fromStr = sp.get('from') || '';
  const toStr = sp.get('to') || '';
  const sortKey = sp.get('sort') || 'newest';
  const pageSize = sp.get('pageSize') || '20';

  const SORT_LABELS = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    'amount-high': 'Amount high→low',
    'amount-low': 'Amount low→high',
    'status-asc': 'Status A→Z',
    'status-desc': 'Status Z→A',
  };
  // local controlled state so Clear All resets UI immediately
  const [qVal, setQVal] = useState(q);
  const [statusVal, setStatusVal] = useState(status);
  const [fromVal, setFromVal] = useState(fromStr);
  const [toVal, setToVal] = useState(toStr);
  const [sortVal, setSortVal] = useState(sortKey);

  // Sync state when URL params change externally (e.g., back/forward or other links)
  useEffect(() => { setQVal(q); }, [q]);
  useEffect(() => { setStatusVal(status); }, [status]);
  useEffect(() => { setFromVal(fromStr); }, [fromStr]);
  useEffect(() => { setToVal(toStr); }, [toStr]);
  useEffect(() => { setSortVal(sortKey); }, [sortKey]);

  const sortLabel = SORT_LABELS[sortVal] || SORT_LABELS.newest;
  const dateLabel = (!fromVal && !toVal) ? 'Any' : `${fromVal || '…'} → ${toVal || '…'}`;

  const buildQS = useCallback((overrides = {}) => {
    const usp = new URLSearchParams();
    if (qVal) usp.set('q', qVal);
    if (statusVal) usp.set('status', statusVal);
    if (fromVal) usp.set('from', fromVal);
    if (toVal) usp.set('to', toVal);
    if (sortVal) usp.set('sort', sortVal);
    if (pageSize) usp.set('pageSize', pageSize);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') usp.delete(k);
      else usp.set(k, String(v));
    });
    // always reset page to 1 on filter changes unless explicitly set
    if (!('page' in overrides)) usp.set('page', '1');
    const s = usp.toString();
    return s ? `?${s}` : '';
  }, [qVal, statusVal, fromVal, toVal, sortVal, pageSize]);

  // Handlers for auto-apply
  const searchDebounce = useRef();
  const onSearchChange = useCallback((e) => {
    const value = e.target.value;
    setQVal(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    // only trigger when cleared or when 2+ chars to reduce churn
    searchDebounce.current = setTimeout(() => {
      if (value === '' || value.length >= 2) {
        const next = `${pathname}${buildQS({ q: value, page: '1' })}`;
        startTransition(() => router.replace(next));
      }
    }, 600);
  }, [buildQS, pathname, router]);

  // cleanup debounce on unmount
  useEffect(() => () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); }, []);

  const onSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
      const value = qVal;
      const next = `${pathname}${buildQS({ q: value, page: '1' })}`;
      startTransition(() => router.replace(next));
    }
  }, [buildQS, pathname, qVal, router]);

  const onStatusChange = useCallback((e) => {
    const value = e.target.value;
    setStatusVal(value);
    startTransition(() => router.replace(`${pathname}${buildQS({ status: value, page: '1' })}`));
  }, [buildQS, pathname, router]);

  // Advanced fields: update local state only; apply via Apply button
  const onFromChange = useCallback((e) => {
    setFromVal(e.target.value);
  }, []);

  const onToChange = useCallback((e) => {
    setToVal(e.target.value);
  }, []);

  const onSortChange = useCallback((e) => {
    setSortVal(e.target.value);
  }, []);

  const onSubmitAdvanced = useCallback((e) => {
    e.preventDefault();
    router.push(`${pathname}${buildQS({ from: fromVal, to: toVal, sort: sortVal, page: '1' })}`);
    setAdvOpen(false);
  }, [buildQS, fromVal, toVal, sortVal, pathname, router]);

  const onClearAdvanced = useCallback(() => {
    setFromVal('');
    setToVal('');
    setSortVal('newest');
    router.push(`${pathname}${buildQS({ from: '', to: '', sort: 'newest', page: '1' })}`);
    setAdvOpen(false);
  }, [buildQS, pathname, router]);

  const onClearAll = useCallback(() => {
    // reset local state so inputs/dropdowns clear immediately
    setQVal('');
    setStatusVal('');
    setFromVal('');
    setToVal('');
    setSortVal('newest');
    router.push(`${pathname}`);
  }, [pathname, router]);

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
          <DropdownMenu open={advOpen} onOpenChange={setAdvOpen}>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline">Show Advanced</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(90vw,420px)] p-3">
              <form className="grid grid-cols-1 gap-3" onSubmit={onSubmitAdvanced}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="from" className="text-xs text-muted-foreground">From</label>
                  <Input id="from" type="date" name="from" value={fromVal} onChange={onFromChange} className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="to" className="text-xs text-muted-foreground">To</label>
                  <Input id="to" type="date" name="to" value={toVal} onChange={onToChange} className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="sort" className="text-xs text-muted-foreground">Sort</label>
                  <select id="sort" name="sort" value={sortVal} onChange={onSortChange} className="block w-full h-9 rounded-md border px-3 text-sm">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="amount-high">Amount: high to low</option>
                    <option value="amount-low">Amount: low to high</option>
                    <option value="status-asc">Status A→Z</option>
                    <option value="status-desc">Status Z→A</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={onClearAdvanced}>Clear</Button>
                  <Button type="submit" size="sm">Apply</Button>
                </div>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Primary row: Search + Status */}
  <form className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <div className="relative col-span-1 md:col-span-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search size={18} />
          </span>
          <Input
            name="q"
    value={qVal}
    onChange={onSearchChange}
            placeholder="Search order #, customer, email, phone"
            aria-label="Search orders"
            onKeyDown={onSearchKeyDown}
            className="h-10 pl-9 w-full"
          />
        </div>
        <div>
          <select
            name="status"
    value={statusVal}
    onChange={onStatusChange}
            className="block w-full h-10 rounded-md border px-3 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </form>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onClearAll}>Clear All Filters</Button>
        <PrintButton />
      </div>
    </div>
  );
}
