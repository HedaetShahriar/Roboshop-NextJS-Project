'use client';

import { useState, useMemo, useEffect, memo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useSearchFilters from '@/hooks/useSearchFilters';
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
    title,
    subtitle,
    compact = false,
}) {
    // Backwards-compat: fall back to local URL-based hook if no controlled props
    const fallback = useSearchFilters();
    const filters = value ?? fallback.filters;
    const setFilters = onChange ?? fallback.setFilters;
    const resetFilters = onClear ?? fallback.resetFilters;

    const { search, status, from, to, sort, inStock, hasDiscount, minPrice, maxPrice, lowStock, category, subcategory } = filters;

    const [localSearch, setLocalSearch] = useState(search || '');
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

    return (
        <div className={compact ? "space-y-2" : "space-y-3"}>
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
                    {(cfg.dateRange || cfg.sort || advancedExtra) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" size="sm" variant="outline" className="font-medium">
                                    {cfg.advancedButtonLabel}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[min(90vw,420px)] p-4 rounded-xl shadow-lg border bg-white"
                            >
                                <div className="grid grid-cols-1 gap-4">
                                    {(cfg.showInStock || cfg.showHasDiscount || cfg.showLowStock) && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            {cfg.showInStock && (
                                                <label className="inline-flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={!!localInStock} onChange={(e)=>setLocalInStock(e.target.checked)} /> In stock only
                                                </label>
                                            )}
                                            {cfg.showHasDiscount && (
                                                <label className="inline-flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={!!localHasDiscount} onChange={(e)=>setLocalHasDiscount(e.target.checked)} /> Has discount
                                                </label>
                                            )}
                                            {cfg.showLowStock && (
                                                <label className="inline-flex items-center gap-2 text-xs">
                                                    <input type="checkbox" checked={!!localLowStock} onChange={(e)=>setLocalLowStock(e.target.checked)} /> Low stock
                                                </label>
                                            )}
                                        </div>
                                    )}
                                    {(cfg.showCategory || cfg.showSubcategory) && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {cfg.showCategory && (
                                                <div className="flex flex-col gap-1">
                                                    <label htmlFor="category" className="text-xs text-muted-foreground font-medium">Category</label>
                                                    <Input id="category" type="text" value={localCategory} onChange={(e)=>setLocalCategory(e.target.value)} className="h-9 w-full" />
                                                </div>
                                            )}
                                            {cfg.showSubcategory && (
                                                <div className="flex flex-col gap-1">
                                                    <label htmlFor="subcategory" className="text-xs text-muted-foreground font-medium">Subcategory</label>
                                                    <Input id="subcategory" type="text" value={localSubcategory} onChange={(e)=>setLocalSubcategory(e.target.value)} className="h-9 w-full" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {cfg.dateRange && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor="from" className="text-xs text-muted-foreground font-medium">From</label>
                                                <div className="relative">
                                                    <Input id="from" type="date" value={localFrom} onChange={(e) => setLocalFrom(e.target.value)} className="h-9 w-full pr-8" />
                                                    {localFrom && (
                                                        <button
                                                            type="button"
                                                            aria-label="Clear from date"
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                                                            onClick={() => setLocalFrom('')}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor="to" className="text-xs text-muted-foreground font-medium">To</label>
                                                <div className="relative">
                                                    <Input id="to" type="date" value={localTo} onChange={(e) => setLocalTo(e.target.value)} className="h-9 w-full pr-8" />
                                                    {localTo && (
                                                        <button
                                                            type="button"
                                                            aria-label="Clear to date"
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                                                            onClick={() => setLocalTo('')}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {cfg.showPriceRange && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor="minPrice" className="text-xs text-muted-foreground font-medium">Min price</label>
                                                <Input id="minPrice" type="number" value={localMinPrice} onChange={(e)=>setLocalMinPrice(e.target.value)} className="h-9 w-full" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor="maxPrice" className="text-xs text-muted-foreground font-medium">Max price</label>
                                                <Input id="maxPrice" type="number" value={localMaxPrice} onChange={(e)=>setLocalMaxPrice(e.target.value)} className="h-9 w-full" />
                                            </div>
                                        </div>
                                    )}
                                    {cfg.sort && (
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="sort" className="text-xs text-muted-foreground font-medium">Sort</label>
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
                                        <Button onClick={() => { setLocalFrom(''); setLocalTo(''); setLocalSort('newest'); setLocalInStock(false); setLocalHasDiscount(false); setLocalLowStock(false); setLocalMinPrice(''); setLocalMaxPrice(''); setLocalCategory(''); setLocalSubcategory(''); }} size="sm" variant="outline" className="font-medium">Reset</Button>
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
                                        }} size="sm" className="font-medium">Apply</Button>
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
                                value={localSearch}
                                placeholder={searchPlaceholder || 'Search'}
                                className="h-10 pl-9 pr-9 w-full bg-white"
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
                        <Button type="submit" size="sm" className="h-10">Search</Button>
                    </form>
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
                            All <span className="ml-1 text-xs text-muted-foreground">({(counts?.all) ?? 0})</span>
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
                                {s} <span className="ml-1 text-xs text-muted-foreground">({(counts?.[s]) ?? 0})</span>
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
                    <Button onClick={() => (resetFilters ? resetFilters() : setFilters({ search: '', from: '', to: '', sort: '' }))} size="sm" variant="outline" className="font-medium">
                        Clear All Filters
                    </Button>
                    {rightActions}
                </div>
            </div>
        </div>
    );
}

export default memo(TableFilters);
