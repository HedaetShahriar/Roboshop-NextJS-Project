import Link from "next/link";
import { getProductsQuickStats, getProductsFilteredTotals } from "@/lib/productsService";
import { getPageAndSize } from "@/lib/productsQuery";
import { formatBDT } from "@/lib/currency";
import BulkActionsPanel from "./client/BulkActionsPanel";
import TableFilters from "@/components/dashboard/shared/table/TableFilters";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PaginationServer from "@/components/dashboard/shared/table/PaginationServer";
import { CATEGORY_MAP, CATEGORY_LIST } from "@/data/categories";
import { LayoutGrid, Boxes, Download, Filter, FileDown, Check } from "lucide-react";
import { buildQuery } from "@/lib/url";
import DisplayControls from "./client/DisplayControls";
import { bulkProducts } from "./server/actions";
import ProductsRows from "./server/ProductsRows";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const currencyFmt = { format: (n) => formatBDT(n) };

export default async function ProductsTable(props) {
  const sp = props?.sp ?? props?.params ?? {};
  const basePath = props?.basePath || "/dashboard/seller/products";
  const { page, pageSize } = getPageAndSize(sp);
  const q = (sp?.search || sp?.q || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  // const skip = (page - 1) * pageSize; // no longer needed; PaginationServer computes range
  const colsParam = (sp?.cols || '').toString();
  const allColsDefault = ['no', 'image', 'info', 'category', 'added', 'price', 'stock', 'rating', 'actions'];
  const scopeParam = (sp?.scope || '').toString();
  const visibleColsArray = (
    colsParam
      ? colsParam.split(',').map(s => s.trim()).filter(Boolean)
      : allColsDefault
  );
  const visibleCols = new Set(visibleColsArray);

  // server actions moved to ./server/actions

  const mkQS = (overrides = {}) => buildQuery({
    search: q || undefined,
    from: fromStr || undefined,
    to: toStr || undefined,
    sort: sortKey !== 'newest' ? sortKey : undefined,
    pageSize: (pageSize && Number(pageSize) !== 10) ? String(pageSize) : undefined,
    inStock: sp?.inStock || undefined,
    hasDiscount: sp?.hasDiscount || undefined,
    minPrice: sp?.minPrice || undefined,
    maxPrice: sp?.maxPrice || undefined,
    lowStock: sp?.lowStock || undefined,
    cols: (colsParam && colsParam !== allColsDefault.join(',')) ? colsParam : undefined,
    category: sp?.category || undefined,
    subcategory: sp?.subcategory || undefined,
  }, overrides);

  // totalPages handled inside PaginationServer

  // page items now rendered by PaginationServer

  return (
    <div className="flex flex-col min-h-0 gap-2">
      {/* Filters/header (auto height) */}
      <div className="shrink-0">
        <TableFilters
          compact
          title="Products"
          subtitle="Filter, sort, and bulk manage in one place"
          config={{ showStatusBar: false, showInStock: true, showHasDiscount: true, showPriceRange: true, showLowStock: true, showCategory: true, showSubcategory: true }}
          categoryOptions={CATEGORY_LIST}
          subcategoryOptions={(sp?.category && CATEGORY_MAP[sp.category]) ? CATEGORY_MAP[sp.category] : Array.from(new Set(Object.values(CATEGORY_MAP).flat()))}
          sortOptions={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'name-asc', label: 'Name A→Z' },
            { value: 'name-desc', label: 'Name Z→A' },
            { value: 'category-asc', label: 'Category A→Z' },
            { value: 'category-desc', label: 'Category Z→A' },
            { value: 'subcategory-asc', label: 'Subcategory A→Z' },
            { value: 'subcategory-desc', label: 'Subcategory Z→A' },
            { value: 'price-high', label: 'Price: high → low' },
            { value: 'price-low', label: 'Price: low → high' },
            { value: 'stock-high', label: 'Stock: high → low' },
            { value: 'stock-low', label: 'Stock: low → high' },
            { value: 'rating-high', label: 'Rating: high → low' },
            { value: 'rating-low', label: 'Rating: low → high' },
          ]}
          searchPlaceholder="Search products by name, SKU, category"
          rightActions={(
            <div className="flex items-center gap-2">
              {/* Bulk dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                    <Boxes size={14} />
                    Bulk
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[min(92vw,520px)] p-3 rounded-xl shadow-lg border bg-white">
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-muted-foreground px-1 inline-flex items-center gap-1"><Boxes size={12} /> Bulk actions</div>
                    {/* Client bulk panel with counts streamed */}
                    <Suspense fallback={<div className="px-1 text-xs text-muted-foreground">Loading counts…</div>}>
                      <BulkCountsHole sp={sp} scopeParam={scopeParam} page={page} pageSize={pageSize} />
                    </Suspense>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button type="submit" form="bulkProductsForm" formMethod="post" className="h-8 px-3 rounded border text-xs bg-zinc-900 text-white hover:bg-zinc-800 inline-flex items-center gap-1"><Check size={14} /> Apply</button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                    <Download size={14} />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-lg border bg-white">
                  <ul>
                    <li>
                      <Link href={`/api/seller/products/export${mkQS({})}`} className="rounded px-2 py-1 hover:bg-zinc-50 text-xs inline-flex items-center gap-1"><Filter size={12} /> All (filtered)</Link>
                    </li>
                    <li>
                      <Link href={`/api/seller/products/export${mkQS({ page, pageSize })}`} className="rounded px-2 py-1 hover:bg-zinc-50 text-xs inline-flex items-center gap-1"><FileDown size={12} /> Current page</Link>
                    </li>
                  </ul>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Display dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                    <LayoutGrid size={14} />
                    Display
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[min(92vw,460px)] p-3 rounded-xl shadow-lg border bg-white">
                  <DisplayControls basePath={basePath} allCols={allColsDefault} visibleCols={visibleColsArray} query={{
                    search: q || undefined,
                    from: fromStr || undefined,
                    to: toStr || undefined,
                    sort: sortKey !== 'newest' ? sortKey : undefined,
                    pageSize: (pageSize && Number(pageSize) !== 10) ? String(pageSize) : undefined,
                    inStock: sp?.inStock || undefined,
                    hasDiscount: sp?.hasDiscount || undefined,
                    minPrice: sp?.minPrice || undefined,
                    maxPrice: sp?.maxPrice || undefined,
                    lowStock: sp?.lowStock || undefined,
                    cols: (colsParam && colsParam !== allColsDefault.join(',')) ? colsParam : undefined,
                    category: sp?.category || undefined,
                    subcategory: sp?.subcategory || undefined,
                  }} />
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Export dropdown */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="font-medium inline-flex items-center gap-1">
                    <Download size={14} />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-lg border bg-white">
                  <ul>
                    <li>
                      <Link href={`/api/seller/products/export${mkQS({})}`} className="rounded px-2 py-1 hover:bg-zinc-50 text-xs inline-flex items-center gap-1"><Filter size={12} /> All (filtered)</Link>
                    </li>
                    <li>
                      <Link href={`/api/seller/products/export${mkQS({ page, pageSize })}`} className="rounded px-2 py-1 hover:bg-zinc-50 text-xs inline-flex items-center gap-1"><FileDown size={12} /> Current page</Link>
                    </li>
                  </ul>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
          )}
          advancedExtra={null}
          persistentExtra={(
            <Suspense fallback={<StatsChipsSkeleton />}>
              <StatsChips sp={sp} />
            </Suspense>
          )}
        />
      </div>

      {/* Scrollable content: bulk form + table */}
  <form id="bulkProductsForm" action={bulkProducts} className="min-h-0 flex-1 flex flex-col gap-2">
        {/* carry current filters for scope targeting and dry run */}
        <input type="hidden" name="search" value={q} />
        {fromStr ? <input type="hidden" name="from" value={fromStr} /> : null}
        {toStr ? <input type="hidden" name="to" value={toStr} /> : null}
        {sortKey ? <input type="hidden" name="sort" value={sortKey} /> : null}
        {/* carry product filter extras for filtered-scope */}
        {sp?.inStock ? <input type="hidden" name="inStock" value={sp.inStock} /> : null}
        {sp?.hasDiscount ? <input type="hidden" name="hasDiscount" value={sp.hasDiscount} /> : null}
        {sp?.minPrice ? <input type="hidden" name="minPrice" value={sp.minPrice} /> : null}
        {sp?.maxPrice ? <input type="hidden" name="maxPrice" value={sp.maxPrice} /> : null}
        {sp?.category ? <input type="hidden" name="category" value={sp.category} /> : null}
        {sp?.subcategory ? <input type="hidden" name="subcategory" value={sp.subcategory} /> : null}
        {sp?.lowStock ? <input type="hidden" name="lowStock" value={sp.lowStock} /> : null}
        {colsParam ? <input type="hidden" name="cols" value={colsParam} /> : null}
        <input type="hidden" name="page" value={String(page)} />
        <input type="hidden" name="pageSize" value={String(pageSize)} />
  {/* super admin impersonation (optional) */}
  {sp?.impersonateSellerId ? <input type="hidden" name="impersonateSellerId" value={String(sp.impersonateSellerId)} /> : null}
  {sp?.sellerId && !sp?.impersonateSellerId ? <input type="hidden" name="impersonateSellerId" value={String(sp.sellerId)} /> : null}

        {/* Rows area streamed with Suspense */}
        <Suspense fallback={
          <>
            {/* Mobile skeleton list */}
            <div className="sm:hidden space-y-2 overflow-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-md border bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <div className="mt-1"><Skeleton className="h-3 w-28" /></div>
                      <div className="mt-1"><Skeleton className="h-3 w-40" /></div>
                      <div className="mt-1"><Skeleton className="h-3 w-24" /></div>
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table skeleton with sticky header */}
            <div className="hidden sm:block min-h-0 flex-1 overflow-auto rounded border bg-white">
              <table className="min-w-full table-auto text-xs sm:text-sm">
                <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                  <tr className="text-left">
                    <th scope="col" className="px-1 py-2 text-[11px] text-muted-foreground">
                      <div className="h-6 w-6 rounded border bg-white" />
                    </th>
                    <th scope="col" className="px-2 py-2 font-medium text-right w-[1%] whitespace-nowrap">#</th>
                    {visibleCols.has('image') && <th scope="col" className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2 font-medium">Product</th>}
                    {visibleCols.has('info') && <th scope="col" className="px-3 py-2 font-medium">Info</th>}
                    {visibleCols.has('category') && <th scope="col" className="px-3 py-2 font-medium">Category</th>}
                    {visibleCols.has('added') && <th scope="col" className="px-3 py-2 font-medium">Added</th>}
                    {visibleCols.has('price') && <th scope="col" className="px-3 py-2 font-medium text-right">Price</th>}
                    {visibleCols.has('stock') && <th scope="col" className="px-3 py-2 font-medium text-center">Stock</th>}
                    {visibleCols.has('rating') && <th scope="col" className="px-3 py-2 font-medium text-center">Rating</th>}
                    {visibleCols.has('actions') && <th scope="col" className="px-2 sm:px-3 py-2 font-medium text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.min(10, pageSize || 10) }).map((_, i) => (
                    <tr key={i} className="border-t odd:bg-zinc-50/40">
                      <td className="px-1 py-2">
                        <div className="h-5 w-5 rounded border bg-white" />
                      </td>
                      <td className="px-2 py-2 text-right w-[1%] whitespace-nowrap text-[11px] text-muted-foreground">
                        <Skeleton className="h-4 w-6 ml-auto" />
                      </td>
                      {visibleCols.has('image') && (
                        <td className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2 w-[64px]">
                          <Skeleton className="h-10 w-10" />
                        </td>
                      )}
                      {visibleCols.has('info') && (
                        <td className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2">
                          <Skeleton className="h-4 w-48" />
                          <div className="mt-1"><Skeleton className="h-3 w-24" /></div>
                        </td>
                      )}
                      {visibleCols.has('category') && (
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-28" />
                          <div className="mt-1"><Skeleton className="h-3 w-20" /></div>
                        </td>
                      )}
                      {visibleCols.has('added') && (
                        <td className="px-3 py-2">
                          <Skeleton className="h-4 w-32" />
                        </td>
                      )}
                      {visibleCols.has('price') && (
                        <td className="px-3 py-2 text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </td>
                      )}
                      {visibleCols.has('stock') && (
                        <td className="px-3 py-2 text-center">
                          <Skeleton className="h-4 w-10 mx-auto" />
                        </td>
                      )}
                      {visibleCols.has('rating') && (
                        <td className="px-3 py-2 text-center">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </td>
                      )}
                      {visibleCols.has('actions') && (
                        <td className="px-2 sm:px-3 py-2 text-right">
                          <Skeleton className="h-7 w-16 ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        }>
          <ProductsRows sp={sp} visibleColsArray={visibleColsArray} />
        </Suspense>
      </form>

      {/* Pagination streamed */}
      <Suspense fallback={<div className="h-8" />}>
        <PaginationHole
          sp={sp}
          page={page}
          pageSize={pageSize}
          q={q}
          fromStr={fromStr}
          toStr={toStr}
          sortKey={sortKey}
          colsParam={colsParam}
          basePath={basePath}
        />
      </Suspense>

      {/* Totals footer streamed */}
      <Suspense fallback={<TotalsFooterSkeleton />}>
        <TotalsFooter sp={sp} />
      </Suspense>
    </div>
  );
}

// --- Dynamic holes for SSI/PPR ---

async function StatsChips({ sp }) {
  const stats = await getProductsQuickStats(sp);
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">In <b className="ml-1 text-emerald-900">{stats.inStock}</b></span>
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">Low <b className="ml-1 text-amber-900">{stats.lowStock}</b></span>
      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">Out <b className="ml-1 text-rose-900">{stats.outOfStock}</b></span>
      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700">Sale <b className="ml-1 text-violet-900">{stats.discounted}</b></span>
    </div>
  );
}

function StatsChipsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

async function BulkCountsHole({ sp, scopeParam, page, pageSize }) {
  const totals = await getProductsFilteredTotals(sp);
  const total = Number(totals?.count || 0);
  const pageCount = Math.max(0, Math.min(pageSize, total - ((page - 1) * pageSize)));
  return (
    <BulkActionsPanel
      compact
      formId="bulkProductsForm"
      defaultScope={(!scopeParam || scopeParam === 'selected') ? 'selected' : scopeParam}
      pageCount={pageCount}
      total={total}
    />
  );
}

async function PaginationHole({ sp, page, pageSize, q, fromStr, toStr, sortKey, colsParam, basePath = "/dashboard/seller/products" }) {
  const totals = await getProductsFilteredTotals(sp);
  const total = Number(totals?.count || 0);
  return (
    <PaginationServer
  basePath={basePath}
      total={total}
      page={page}
      pageSize={pageSize}
      query={{
        search: q || undefined,
        from: fromStr || undefined,
        to: toStr || undefined,
        sort: (sortKey && sortKey !== 'newest') ? sortKey : undefined,
        cols: colsParam || undefined,
        inStock: sp?.inStock || undefined,
        hasDiscount: sp?.hasDiscount || undefined,
        minPrice: sp?.minPrice || undefined,
        maxPrice: sp?.maxPrice || undefined,
        category: sp?.category || undefined,
        subcategory: sp?.subcategory || undefined,
        lowStock: sp?.lowStock || undefined,
        pageSize: (pageSize && Number(pageSize) !== 10) ? pageSize : undefined,
      }}
    />
  );
}

async function TotalsFooter({ sp }) {
  const totals = await getProductsFilteredTotals(sp);
  return (
    <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap pb-1">
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">Total stock: <b className="ml-1 text-emerald-900 tabular-nums">{totals.stockSum}</b></span>
      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700">Inventory value: <b className="ml-1 text-sky-900 tabular-nums">{currencyFmt.format(Number(totals.inventoryValue || 0))}</b></span>
    </div>
  );
}

function TotalsFooterSkeleton() {
  return (
    <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap pb-1">
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-6 w-48 rounded-full" />
    </div>
  );
}
