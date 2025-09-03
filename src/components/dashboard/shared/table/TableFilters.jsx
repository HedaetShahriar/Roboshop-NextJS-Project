'use client';

import { useState, useMemo, useEffect, memo, useRef } from 'react';
import { Search, X, Calendar, Tag, Tags, SlidersHorizontal, ArrowUpDown, Percent, AlertTriangle, CircleDollarSign, RotateCcw, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CATEGORY_MAP } from '@/data/categories';
import DateRangePicker from '@/components/ui/date-range-picker';
import useSearchFilters from '@/hooks/useSearchFilters';
import { formatDate } from '@/lib/dates';
function TableFilters({
    value,
    onChange,
    onClear,
    config,
    sortOptions,
    searchPlaceholder,
    rightActions,
    advancedExtra,
    persistentExtra,
    counts, // optional: status counts { all, processing, packed, ... }
    countsUrl, // optional: fetch counts on mount for streaming updates
    title,
    subtitle,
    compact = false,
    categoryOptions,
    subcategoryOptions,
}) {
    // Backwards-compat: fall back to local URL-based hook if no controlled props
    const fallback = useSearchFilters();
    const filters = value ?? fallback.filters;
    const setFilters = onChange ?? fallback.setFilters;
    const resetFilters = onClear ?? fallback.resetFilters;

    const { search, status, from, to, sort, inStock, hasDiscount, minPrice, maxPrice, lowStock, category, subcategory } = filters;

    const [localSearch, setLocalSearch] = useState(search || '');
    const [countsState, setCountsState] = useState(counts);
    const searchRef = useRef(null);
    // Local advanced filter state (apply on click)
    const [localFrom, setLocalFrom] = useState(from || '');
    const [localTo, setLocalTo] = useState(to || '');
    const [localSort, setLocalSort] = useState(sort || 'newest');
    // Optional product extras
    const [localInStock, setLocalInStock] = useState(Boolean(inStock) || false);
    const [localHasDiscount, setLocalHasDiscount] = useState(Boolean(hasDiscount) || false);
    const [localLowStock, setLocalLowStock] = useState(Boolean(lowStock) || false);
    const [localMinPrice, setLocalMinPrice] = useState(minPrice || '');
    const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || '');
    const [localCategory, setLocalCategory] = useState(category || '');
    const [localSubcategory, setLocalSubcategory] = useState(subcategory || '');

    useEffect(() => {
        setLocalFrom(from || '');
        setLocalTo(to || '');
        setLocalSort(sort || 'newest');
    }, [from, to, sort]);
    useEffect(() => {
        setLocalInStock(Boolean(inStock) || false);
        setLocalHasDiscount(Boolean(hasDiscount) || false);
        setLocalLowStock(Boolean(lowStock) || false);
        setLocalMinPrice(minPrice || '');
        setLocalMaxPrice(maxPrice || '');
        setLocalCategory(category || '');
        setLocalSubcategory(subcategory || '');
    }, [inStock, hasDiscount, lowStock, minPrice, maxPrice, category, subcategory]);

    // Filter subcategory options based on selected category
    const filteredSubcategoryOptions = useMemo(() => {
        // If a mapping exists and a category is selected, use mapped subcategories
        if (localCategory && CATEGORY_MAP && CATEGORY_MAP[localCategory]) {
            return CATEGORY_MAP[localCategory];
        }
        // Otherwise fall back to provided list (if any)
        if (Array.isArray(subcategoryOptions) && subcategoryOptions.length) {
            return subcategoryOptions;
        }
        return [];
    }, [localCategory, subcategoryOptions]);

    // When category changes, clear subcategory if it's not valid anymore
    useEffect(() => {
        if (!localCategory) {
            if (localSubcategory) setLocalSubcategory('');
            return;
        }
        if (!localSubcategory) return;
        if (!filteredSubcategoryOptions.includes(localSubcategory)) {
            setLocalSubcategory('');
        }
    }, [localCategory, filteredSubcategoryOptions, localSubcategory]);

    const disableSubcategory = !localCategory;

    // Keep localSearch in sync if URL search changes (e.g., Clear All)
    useEffect(() => {
        setLocalSearch(search || '');
    }, [search]);

    const sortLabelMap = useMemo(() => {
        const defaults = {
            newest: 'Newest first',
            oldest: 'Oldest first',
            'amount-high': 'Amount: high → low',
            'amount-low': 'Amount: low → high',
            'status-asc': 'Status A→Z',
            'status-desc': 'Status Z→A',
        };
        if (Array.isArray(sortOptions) && sortOptions.length) {
            const map = {};
            for (const o of sortOptions) map[o.value] = o.label ?? o.value;
            return { ...defaults, ...map };
        }
        return defaults;
    }, [sortOptions]);

    const cfg = {
        search: true,
        dateRange: true,
    sort: true,
    // Product-specific extras
    showPriceRange: false,
    showHasDiscount: false,
    showInStock: false,
    showStatusBar: true,
    showLowStock: false,
    showCategory: false,
    showSubcategory: false,
        advancedButtonLabel: 'Advanced',
        ...(config || {}),
    };

    // Status filter removed
    const statuses = useMemo(() => (
        ['processing', 'packed', 'assigned', 'shipped', 'delivered', 'cancelled']
    ), []);

    const sortOpts = useMemo(() => (
        Array.isArray(sortOptions) && sortOptions.length
            ? sortOptions
            : [
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'amount-high', label: 'Amount: high → low' },
                { value: 'amount-low', label: 'Amount: low → high' },
                { value: 'status-asc', label: 'Status A→Z' },
                { value: 'status-desc', label: 'Status Z→A' },
            ]
    ), [sortOptions]);

    // Derive active filters count (excluding search)
    const activeCount = useMemo(() => {
        let n = 0;
        if (cfg.dateRange && (from || to)) n++;
        if (cfg.sort && sort) n++;
        if (cfg.showCategory && category) n++;
        if (cfg.showSubcategory && subcategory) n++;
        if (cfg.showInStock && Boolean(inStock)) n++;
        if (cfg.showHasDiscount && Boolean(hasDiscount)) n++;
        if (cfg.showLowStock && Boolean(lowStock)) n++;
        if (cfg.showPriceRange && (minPrice || maxPrice)) n++;
        if (status) n++; // orders
        return n;
    }, [cfg, from, to, sort, category, subcategory, inStock, hasDiscount, lowStock, minPrice, maxPrice, status]);

    // Whether any chip would render (includes search unlike activeCount)
    const hasChips = useMemo(() => {
        if (Boolean(search)) return true;
        if (cfg.dateRange && (from || to)) return true;
        if (cfg.sort && sort) return true;
        if (cfg.showCategory && category) return true;
        if (cfg.showSubcategory && subcategory) return true;
        if (cfg.showInStock && Boolean(inStock)) return true;
        if (cfg.showHasDiscount && Boolean(hasDiscount)) return true;
        if (cfg.showLowStock && Boolean(lowStock)) return true;
        if (cfg.showPriceRange && (minPrice || maxPrice)) return true;
        if (status) return true;
        return false;
    }, [search, cfg, from, to, sort, category, subcategory, inStock, hasDiscount, lowStock, minPrice, maxPrice, status]);

    // Date preset helpers
    const applyDatePreset = (key) => {
        const today = new Date();
        const toISO = (d) => d.toISOString().slice(0, 10);
        let start, end;
        if (key === 'today') {
            start = toISO(today);
            end = toISO(today);
        } else if (key === 'last7') {
            const s = new Date(today);
            s.setDate(s.getDate() - 6);
            start = toISO(s);
            end = toISO(today);
        } else if (key === 'last30') {
            const s = new Date(today);
            s.setDate(s.getDate() - 29);
            start = toISO(s);
            end = toISO(today);
        }
        if (start && end) {
            setLocalFrom(start);
            setLocalTo(end);
        }
    };

    // Fetch counts on mount/when countsUrl changes (best-effort)
    useEffect(() => {
        let ignore = false;
        if (!countsUrl) return;
        (async () => {
            try {
                const res = await fetch(countsUrl, { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (!ignore) setCountsState(data ?? counts);
            } catch {}
        })();
        return () => { ignore = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countsUrl]);

    return (
        <div className={compact ? "space-y-2" : "space-y-3"}>
            <KeyboardShortcuts searchRef={searchRef} />
            {/* Title + Advanced toggle */}
            <div className={"flex flex-col md:flex-row md:items-center md:justify-between " + (compact ? "gap-2" : "gap-3") }>
                <div>
                    <h2 className="text-lg font-bold tracking-tight">{title || 'Search & Filter'}</h2>
                    <p className="text-xs text-muted-foreground">
                        {subtitle || 'Find items with advanced filtering'}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="hidden md:flex items-center gap-2">
                        {cfg.sort && sort && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">
                                Sort: {sortLabelMap[sort] ?? sort}
                            </span>
                        )}
                        {cfg.showCategory && category && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">Category: {category}</span>
                        )}
                        {cfg.showSubcategory && subcategory && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">Subcategory: {subcategory}</span>
                        )}
                        {cfg.showInStock && localInStock && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">In stock</span>
                        )}
                        {cfg.showHasDiscount && localHasDiscount && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">Has discount</span>
                        )}
                        {cfg.dateRange && (from || to) && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">
                                Date: {from || '…'} → {to || '…'}
                            </span>
                        )}
                        {cfg.showLowStock && localLowStock && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">Low stock</span>
                        )}
                        {cfg.showPriceRange && (minPrice || maxPrice) && (
                            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted">
                                Price: {minPrice || '…'} → {maxPrice || '…'}
                            </span>
                        )}
                    </div>
                    {(cfg.showInStock || cfg.showHasDiscount || cfg.showLowStock) && (
                        <div className="flex items-center gap-2">
                            {cfg.showInStock && (
                                <button type="button" className={`h-8 px-3 rounded border text-xs ${localInStock ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`} onClick={() => setFilters({ inStock: !localInStock ? 1 : '' })}>
                                    In stock
                                </button>
                            )}
                            {cfg.showHasDiscount && (
                                <button type="button" className={`h-8 px-3 rounded border text-xs ${localHasDiscount ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`} onClick={() => setFilters({ hasDiscount: !localHasDiscount ? 1 : '' })}>
                                    Has discount
                                </button>
                            )}
                            {cfg.showLowStock && (
                                <button type="button" className={`h-8 px-3 rounded border text-xs ${localLowStock ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`} onClick={() => setFilters({ lowStock: !localLowStock ? 1 : '' })}>
                                    Low stock
                                </button>
                            )}
                        </div>
                    )}
                    {(cfg.showCategory || cfg.showSubcategory) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" size="sm" variant="outline" className="font-medium relative inline-flex items-center gap-1">
                                    <Tag size={14} />
                                    Category
                                    {((cfg.showCategory && category) || (cfg.showSubcategory && subcategory)) && (
                                        <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-zinc-900 text-white text-[10px]">
                                            {(category ? 1 : 0) + (subcategory ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[min(90vw,380px)] p-3 rounded-xl shadow-lg border bg-white">
                                <div className="grid grid-cols-1 gap-3">
                                    {cfg.showCategory && (
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="category-dd" className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1"><Tag size={12} /> Category</label>
                                            {Array.isArray(categoryOptions) && categoryOptions.length ? (
                                                <select
                                                    id="category-dd"
                                                    value={localCategory}
                                                    onChange={(e) => setLocalCategory(e.target.value)}
                                                    className="h-9 w-full rounded-md border px-2 bg-white"
                                                >
                                                    <option value="">Any</option>
                                                    {categoryOptions.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input id="category-dd" type="text" value={localCategory} onChange={(e)=>setLocalCategory(e.target.value)} className="h-9 w-full" />
                                            )}
                                        </div>
                                    )}
                                    {cfg.showSubcategory && (
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="subcategory-dd" className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1"><Tags size={12} /> Subcategory</label>
                                            {Array.isArray(filteredSubcategoryOptions) && filteredSubcategoryOptions.length ? (
                                                <select
                                                    id="subcategory-dd"
                                                    value={localSubcategory}
                                                    onChange={(e) => setLocalSubcategory(e.target.value)}
                                                    disabled={disableSubcategory}
                                                    aria-disabled={disableSubcategory}
                                                    className="h-9 w-full rounded-md border px-2 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">Any</option>
                                                    {filteredSubcategoryOptions.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input id="subcategory-dd" type="text" value={localSubcategory} onChange={(e)=>setLocalSubcategory(e.target.value)} disabled={disableSubcategory} aria-disabled={disableSubcategory} placeholder={disableSubcategory ? 'Select category first' : undefined} className="h-9 w-full disabled:opacity-60 disabled:cursor-not-allowed" />
                                            )}
                                            {disableSubcategory && (
                                                <p className="text-[11px] text-muted-foreground mt-1">Select category first</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        <Button onClick={() => { setLocalCategory(''); setLocalSubcategory(''); }} size="sm" variant="outline" className="font-medium inline-flex items-center gap-1"><RotateCcw size={14} /> Reset</Button>
                                        <Button onClick={() => {
                                            const updates = {};
                                            let changed = false;
                                            if (cfg.showCategory) { if ((category || '') !== (localCategory || '')) { updates.category = localCategory; changed = true; } }
                                            if (cfg.showSubcategory) { if ((subcategory || '') !== (localSubcategory || '')) { updates.subcategory = localSubcategory; changed = true; } }
                                            // If selected subcategory no longer valid for chosen category, clear it
                                            if (cfg.showCategory && cfg.showSubcategory) {
                                                const validSubs = (localCategory && CATEGORY_MAP && CATEGORY_MAP[localCategory]) ? CATEGORY_MAP[localCategory] : [];
                                                if (localSubcategory && !validSubs.includes(localSubcategory)) { updates.subcategory = ''; changed = true; }
                                            }
                                            if (changed) setFilters(updates);
                                        }} size="sm" className="font-medium inline-flex items-center gap-1"><Check size={14} /> Apply</Button>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {(cfg.dateRange || cfg.sort || advancedExtra) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" size="sm" variant="outline" className="font-medium relative inline-flex items-center gap-1">
                                    <SlidersHorizontal size={14} />
                                    {cfg.advancedButtonLabel}
                                    {activeCount > 0 && (
                                        <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-zinc-900 text-white text-[10px]">
                                            {activeCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[min(90vw,420px)] p-3 rounded-xl shadow-lg border bg-white"
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    {cfg.dateRange && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><Calendar size={12} /> Presets:</span>
                                            <button type="button" className="h-6 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50" onClick={()=>applyDatePreset('today')}>Today</button>
                                            <button type="button" className="h-6 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50" onClick={()=>applyDatePreset('last7')}>Last 7 days</button>
                                            <button type="button" className="h-6 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50" onClick={()=>applyDatePreset('last30')}>Last 30 days</button>
                                        </div>
                                    )}
                                    {(cfg.showInStock || cfg.showHasDiscount || cfg.showLowStock) && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            {cfg.showInStock && (
                                                <label className="inline-flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={!!localInStock} onChange={(e)=>setLocalInStock(e.target.checked)} /> <span className="inline-flex items-center gap-1"><Package size={12} /> In stock only</span>
                                                </label>
                                            )}
                                            {cfg.showHasDiscount && (
                                                <label className="inline-flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={!!localHasDiscount} onChange={(e)=>setLocalHasDiscount(e.target.checked)} /> <span className="inline-flex items-center gap-1"><Percent size={12} /> Has discount</span>
                                                </label>
                                            )}
                                            {cfg.showLowStock && (
                                                <label className="inline-flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={!!localLowStock} onChange={(e)=>setLocalLowStock(e.target.checked)} /> <span className="inline-flex items-center gap-1"><AlertTriangle size={12} /> Low stock</span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                    {/* Category/Subcategory moved out of Advanced */}
                                    {cfg.dateRange && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1"><Calendar size={12} /> Date range</label>
                                            <DateRangePicker
                                                from={localFrom}
                                                to={localTo}
                                                onChange={({ from, to }) => { setLocalFrom(from || ''); setLocalTo(to || ''); }}
                                            />
                                        </div>
                                    )}
                                    {cfg.showPriceRange && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor="minPrice" className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1"><CircleDollarSign size={12} /> Min price</label>
                                                <Input id="minPrice" type="number" value={localMinPrice} onChange={(e)=>setLocalMinPrice(e.target.value)} className="h-9 w-full" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor="maxPrice" className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1"><CircleDollarSign size={12} /> Max price</label>
                                                <Input id="maxPrice" type="number" value={localMaxPrice} onChange={(e)=>setLocalMaxPrice(e.target.value)} className="h-9 w-full" />
                                            </div>
                                        </div>
                                    )}
                                    {cfg.sort && (
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="sort" className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1"><ArrowUpDown size={12} /> Sort</label>
                                            <div className="relative">
                                                <select id="sort" value={localSort || (sortOpts[0]?.value || 'newest')} onChange={(e) => setLocalSort(e.target.value)} className="block w-full h-9 rounded-md border pr-8 px-3 text-sm bg-white">
                                                    {sortOpts.map((o) => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                                {Boolean(localSort) && (
                                                    <button
                                                        type="button"
                                                        aria-label="Clear sort"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                                                        onClick={() => setLocalSort('')}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {advancedExtra}

                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <Button onClick={() => { setLocalFrom(''); setLocalTo(''); setLocalSort('newest'); setLocalInStock(false); setLocalHasDiscount(false); setLocalLowStock(false); setLocalMinPrice(''); setLocalMaxPrice(''); setLocalCategory(''); setLocalSubcategory(''); }} size="sm" variant="outline" className="font-medium inline-flex items-center gap-1"><RotateCcw size={14} /> Reset</Button>
                                        <Button onClick={() => {
                                            const updates = {};
                                            let changed = false;
                                            if (cfg.dateRange) {
                                                if ((from || '') !== (localFrom || '')) { updates.from = localFrom; changed = true; }
                                                if ((to || '') !== (localTo || '')) { updates.to = localTo; changed = true; }
                                            }
                                            if (cfg.sort) {
                                                if ((sort || '') !== (localSort || '')) { updates.sort = localSort; changed = true; }
                                            }
                                            if (cfg.showCategory) {
                                                if ((category || '') !== (localCategory || '')) { updates.category = localCategory; changed = true; }
                                            }
                                            if (cfg.showSubcategory) {
                                                if ((subcategory || '') !== (localSubcategory || '')) { updates.subcategory = localSubcategory; changed = true; }
                                            }
                                            if (cfg.showInStock) {
                                                if (Boolean(inStock) !== Boolean(localInStock)) { updates.inStock = localInStock ? 1 : ''; changed = true; }
                                            }
                                            if (cfg.showHasDiscount) {
                                                if (Boolean(hasDiscount) !== Boolean(localHasDiscount)) { updates.hasDiscount = localHasDiscount ? 1 : ''; changed = true; }
                                            }
                                            if (cfg.showLowStock) {
                                                if (Boolean(lowStock) !== Boolean(localLowStock)) { updates.lowStock = localLowStock ? 1 : ''; changed = true; }
                                            }
                                            if (cfg.showPriceRange) {
                                                if ((minPrice || '') !== (localMinPrice || '')) { updates.minPrice = localMinPrice; changed = true; }
                                                if ((maxPrice || '') !== (localMaxPrice || '')) { updates.maxPrice = localMaxPrice; changed = true; }
                                            }
                                            if (changed) setFilters(updates);
                                        }} size="sm" className="font-medium inline-flex items-center gap-1"><Check size={14} /> Apply</Button>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            


            {/* Primary row: Search */}
            <div className={"grid grid-cols-1 " + (compact ? "gap-2" : "gap-3")}>
                {cfg.search && (
                    <form className="flex items-center gap-3 w-full" onSubmit={(e) => { 
                        e.preventDefault(); 
                        if ((search ?? '') !== (localSearch ?? '')) {
                            setFilters({ search: localSearch });
                        }
                    }}>
            <div className="relative w-full">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Search size={18} />
                            </span>
                            <Input
                                ref={searchRef}
                                value={localSearch}
                                placeholder={searchPlaceholder || 'Search'}
                                className={(compact ? 'h-9' : 'h-10') + " pl-9 pr-9 w-full bg-white"}
                                onChange={(e) => setLocalSearch(e.target.value)}
                            />
                            {localSearch?.length > 0 && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                                    onClick={() => {
                                        setLocalSearch('');
                                        if ((search ?? '') !== '') {
                                            setFilters({ search: '' });
                                        }
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <Button type="submit" size="sm" className={compact ? 'h-9' : 'h-10'}>Search</Button>
                    </form>
                )}

                {/* Category/Subcategory moved to dedicated dropdown */}

                {/* Applied filter chips */}
                {hasChips && (
                <div className="flex items-center gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {Boolean(search) && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ search: '' })}>
                            Search: “{search}” <X size={12} />
                        </button>
                    )}
                    {cfg.dateRange && (from || to) && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ from: '', to: '' })}>
                            Date: {formatDate(from) || '…'} → {formatDate(to) || '…'} <X size={12} />
                        </button>
                    )}
                    {cfg.sort && sort && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ sort: '' })}>
                            Sort: {sortLabelMap[sort] ?? sort} <X size={12} />
                        </button>
                    )}
                    {cfg.showCategory && category && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ category: '' })}>
                            Category: {category} <X size={12} />
                        </button>
                    )}
                    {cfg.showSubcategory && subcategory && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ subcategory: '' })}>
                            Subcategory: {subcategory} <X size={12} />
                        </button>
                    )}
                    {cfg.showInStock && Boolean(inStock) && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ inStock: '' })}>
                            In stock <X size={12} />
                        </button>
                    )}
                    {cfg.showHasDiscount && Boolean(hasDiscount) && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ hasDiscount: '' })}>
                            Has discount <X size={12} />
                        </button>
                    )}
                    {cfg.showLowStock && Boolean(lowStock) && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ lowStock: '' })}>
                            Low stock <X size={12} />
                        </button>
                    )}
                    {cfg.showPriceRange && (minPrice || maxPrice) && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1" onClick={()=>setFilters({ minPrice: '', maxPrice: '' })}>
                            Price: {minPrice || '…'} → {maxPrice || '…'} <X size={12} />
                        </button>
                    )}
                    {status && (
                        <button type="button" className="h-7 px-2 rounded-full border text-xs bg-white hover:bg-zinc-50 flex items-center gap-1 capitalize" onClick={()=>setFilters({ status: '' })}>
                            {status} <X size={12} />
                        </button>
                    )}
                </div>
                )}


                {/* Status quick filters bar */}
                {cfg.showStatusBar && (
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <Button
                            type="button"
                            variant={!status ? 'default' : 'outline'}
                            size="sm"
                            className="shrink-0"
                            onClick={() => { if ((status ?? '') !== '') setFilters({ status: '' }); }}
                        >
                            All <span className="ml-1 text-xs text-muted-foreground">({(countsState?.all ?? counts?.all) ?? 0})</span>
                        </Button>
                        {statuses.map((s) => (
                            <Button
                                key={s}
                                type="button"
                                variant={status === s ? 'default' : 'outline'}
                                size="sm"
                                className="capitalize shrink-0"
                                onClick={() => { if (status !== s) setFilters({ status: s }); }}
                            >
                                {s} <span className="ml-1 text-xs text-muted-foreground">({(countsState?.[s] ?? counts?.[s]) ?? 0})</span>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            

            {/* Action row */}
            <div className={"flex flex-col md:flex-row md:items-center md:justify-between " + (compact ? "gap-1" : "gap-2")}>
                <div className="flex items-center gap-2">
                    {persistentExtra ?? null}
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => (resetFilters ? resetFilters() : setFilters({ search: '', from: '', to: '', sort: '', category: '', subcategory: '', inStock: '', hasDiscount: '', lowStock: '', minPrice: '', maxPrice: '' }))} size="sm" variant="outline" className="font-medium">
                        Clear All Filters
                    </Button>
                    {rightActions}
                </div>
            </div>
        </div>
    );
}

export default memo(TableFilters);

function KeyboardShortcuts({ searchRef }) {
    useEffect(() => {
        let lastChecked = null;
        const onKey = (e) => {
            const active = document.activeElement;
            const isTyping = active && ((active.tagName === 'INPUT') || (active.tagName === 'TEXTAREA') || active.isContentEditable);
            if (e.key === '/') {
                if (searchRef?.current) {
                    e.preventDefault();
                    searchRef.current.focus();
                }
            }
            if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !isTyping) {
                const boxes = document.querySelectorAll('form#bulkOrdersForm input[type="checkbox"][name="ids"]');
                if (boxes.length) {
                    e.preventDefault();
                    boxes.forEach(b => { b.checked = true; b.dispatchEvent(new Event('change', { bubbles: true })); });
                }
            }
        };
        const onClick = (e) => {
            const target = e.target;
            if (target && target.matches('form#bulkOrdersForm input[type="checkbox"][name="ids"]')) {
                if (e.shiftKey && lastChecked && lastChecked !== target) {
                    const boxes = Array.from(document.querySelectorAll('form#bulkOrdersForm input[type="checkbox"][name="ids"]'));
                    const start = boxes.indexOf(lastChecked);
                    const end = boxes.indexOf(target);
                    if (start !== -1 && end !== -1) {
                        const [a, b] = start < end ? [start, end] : [end, start];
                        const checkVal = target.checked;
                        for (let i = a; i <= b; i++) {
                            const box = boxes[i];
                            if (box) { box.checked = checkVal; box.dispatchEvent(new Event('change', { bubbles: true })); }
                        }
                    }
                }
                lastChecked = target;
            }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('click', onClick, true);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('click', onClick, true);
        };
    }, [searchRef]);
    return null;
}
