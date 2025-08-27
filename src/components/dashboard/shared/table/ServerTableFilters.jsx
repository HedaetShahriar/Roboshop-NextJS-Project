import Link from "next/link";

export default function ServerTableFilters({
  params = {},
  config = {},
  sortOptions = [],
  searchPlaceholder = 'Search',
  rightActions,
  persistentExtra,
  title = 'Search & Filter',
  subtitle = 'Find items with filtering',
  actionHref = '',
}) {
  const cfg = {
    search: true,
    dateRange: true,
    sort: true,
    showPriceRange: false,
    showHasDiscount: false,
    showInStock: false,
    ...config,
  };

  const q = (params.search || params.q || '').toString();
  const from = (params.from || '').toString();
  const to = (params.to || '').toString();
  const sort = (params.sort || (sortOptions[0]?.value ?? 'newest')).toString();
  const inStock = params.inStock ? '1' : '';
  const hasDiscount = params.hasDiscount ? '1' : '';
  const minPrice = (params.minPrice || '').toString();
  const maxPrice = (params.maxPrice || '').toString();
  const pageSize = (params.pageSize || '').toString();
  const cols = (params.cols || '').toString();

  const href = actionHref || '';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">{rightActions}</div>
      </div>

      {/* Search and filters (GET) */}
      <form method="GET" action={href || undefined} className="grid grid-cols-1 gap-3">
        {cfg.search && (
          <div className="flex items-center gap-3">
            <input name="search" defaultValue={q} placeholder={searchPlaceholder} className="h-10 w-full border rounded px-3 text-sm bg-white" />
            <button type="submit" className="h-10 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Search</button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cfg.dateRange && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">From</label>
                <input type="date" name="from" defaultValue={from} className="h-9 border rounded px-2 text-sm bg-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">To</label>
                <input type="date" name="to" defaultValue={to} className="h-9 border rounded px-2 text-sm bg-white" />
              </div>
            </>
          )}
          {cfg.sort && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Sort</label>
              <select name="sort" defaultValue={sort} className="h-9 border rounded px-2 text-sm bg-white">
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {(cfg.showInStock || cfg.showHasDiscount || cfg.showPriceRange) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(cfg.showInStock || cfg.showHasDiscount) && (
              <div className="flex items-center gap-3">
                {cfg.showInStock && (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" name="inStock" value="1" defaultChecked={!!inStock} /> In stock only
                  </label>
                )}
                {cfg.showHasDiscount && (
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" name="hasDiscount" value="1" defaultChecked={!!hasDiscount} /> Has discount
                  </label>
                )}
              </div>
            )}
            {cfg.showPriceRange && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Min price</label>
                  <input name="minPrice" defaultValue={minPrice} type="number" step="0.01" min="0" className="h-9 border rounded px-2 text-sm bg-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Max price</label>
                  <input name="maxPrice" defaultValue={maxPrice} type="number" step="0.01" min="0" className="h-9 border rounded px-2 text-sm bg-white" />
                </div>
              </div>
            )}
          </div>
        )}
        {/* preserve others and reset page */}
        {cols ? <input type="hidden" name="cols" value={cols} /> : null}
        {pageSize ? <input type="hidden" name="pageSize" value={pageSize} /> : null}
        <input type="hidden" name="page" value="1" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">{persistentExtra}</div>
          <div className="flex items-center gap-2">
            <Link href={href || '#'} className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Clear All Filters</Link>
            <button type="submit" className="h-9 px-3 rounded border text-xs bg-zinc-900 text-white hover:bg-zinc-800">Apply</button>
          </div>
        </div>
      </form>
    </div>
  );
}