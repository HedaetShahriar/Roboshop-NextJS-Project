import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { getProductsAndTotalCached as getProductsAndTotal, getProductsQuickStats, getProductsFilteredTotals } from "@/lib/productsService";
import { buildProductsWhere } from "@/lib/productsQuery";
import BulkActionsPanel from "./client/BulkActionsPanel";
import RowActionsMenu from "./client/RowActionsMenu";
import SavedViews from "./client/SavedViews";
import SavedViewsServer from "./client/SavedViewsServer";
import SelectAllOnPage from "./client/SelectAllOnPage";
import { addProductAudit } from "@/lib/audit";
import TableFilters from "@/components/dashboard/shared/table/TableFilters";
import BulkModalTrigger from "./client/BulkModalTrigger";
import PaginationServer from "@/components/dashboard/shared/table/PaginationServer";

const currencyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export default async function ProductsTable(props) {
  const sp = props?.sp ?? props?.params ?? {};
  const { products, total, page, pageSize } = await getProductsAndTotal(sp);
  const stats = await getProductsQuickStats(sp);
  const totals = await getProductsFilteredTotals(sp);
  const q = (sp?.search || sp?.q || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  // const skip = (page - 1) * pageSize; // no longer needed; PaginationServer computes range
  const colsParam = (sp?.cols || '').toString();
  const allColsDefault = ['image','info','added','price','stock','rating','actions'];
  const scopeParam = (sp?.scope || '').toString();
  const visibleCols = new Set(
    colsParam
      ? colsParam.split(',').map(s => s.trim()).filter(Boolean)
      : allColsDefault
  );

  async function adjustStock(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id');
    const delta = Number(formData.get('delta'));
    if (!id || isNaN(delta)) return;
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return; }
    const doc = await db.collection('products').findOne({ _id });
    if (!doc) return;
    const current = Number(doc.current_stock || 0);
    const next = Math.max(0, current + delta);
    await db.collection('products').updateOne({ _id }, { $set: { current_stock: next, updatedAt: new Date() } });
    revalidatePath('/dashboard/seller/products');
  }

  async function updatePricing(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id');
    let price = Number(formData.get('price'));
    const hasDiscount = formData.get('hasDiscount') ? true : false;
    let discount = Number(formData.get('discountPrice'));
    if (!id || isNaN(price) || price <= 0) return;
    if (hasDiscount) {
      if (isNaN(discount) || discount <= 0 || discount >= price) return;
    } else {
      discount = 0;
    }
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return; }
    await db.collection('products').updateOne({ _id }, { $set: { price, has_discount_price: !!hasDiscount, discount_price: discount, updatedAt: new Date() } });
    revalidatePath('/dashboard/seller/products');
  }

  async function clearDiscountSingle(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id');
    if (!id) return;
    const db = await getDb();
    let _id; try { _id = new ObjectId(String(id)); } catch { return; }
    await db.collection('products').updateOne({ _id }, { $set: { has_discount_price: false, discount_price: 0, updatedAt: new Date() } });
    revalidatePath('/dashboard/seller/products');
  }

  async function bulkProducts(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
  const action = formData.get('bulkAction');
    const scope = (formData.get('scope') || 'selected').toString(); // selected | page | filtered
    const db = await getDb();
    const now = new Date();

    // Build targeting
    let filter = null;
    let ids = formData.getAll('ids');
    if (scope === 'page') {
      const s = {
        search: formData.get('search')?.toString() || '',
        from: formData.get('from')?.toString() || undefined,
        to: formData.get('to')?.toString() || undefined,
        sort: formData.get('sort')?.toString() || 'newest',
        page: Number(formData.get('page')?.toString() || '1'),
        pageSize: Number(formData.get('pageSize')?.toString() || '20'),
        inStock: formData.get('inStock')?.toString() || undefined,
        hasDiscount: formData.get('hasDiscount')?.toString() || undefined,
        minPrice: formData.get('minPrice')?.toString() || undefined,
        maxPrice: formData.get('maxPrice')?.toString() || undefined,
      };
      const { products: pageProducts } = await getProductsAndTotal(s);
      ids = pageProducts.map(p => p._id.toString());
    } else if (scope === 'filtered') {
      const s = {
        search: formData.get('search')?.toString() || '',
        from: formData.get('from')?.toString() || undefined,
        to: formData.get('to')?.toString() || undefined,
        inStock: formData.get('inStock')?.toString() || undefined,
        hasDiscount: formData.get('hasDiscount')?.toString() || undefined,
        minPrice: formData.get('minPrice')?.toString() || undefined,
        maxPrice: formData.get('maxPrice')?.toString() || undefined,
      };
      filter = buildProductsWhere(s);
    }

    // Normalize ids to ObjectId filter when needed
    const idsFilter = () => {
      const list = (ids || []).map(x => {
        try { return new ObjectId(String(x)); } catch { return null; }
      }).filter(Boolean);
      return list.length ? { _id: { $in: list } } : null;
    };

  if (!action) return;

  // Helpers for choosing the final filter (selected/page vs filtered)
    const targetFilter = () => (filter ? filter : idsFilter());
    const tf = targetFilter();
    if (!tf) return;

    // Parse inputs
    const stockDeltaRaw = Number(formData.get('bulkStockDelta'));
    const stockSetRaw = Number(formData.get('bulkStockSet'));
    const discountPriceRaw = Number(formData.get('bulkDiscountPrice'));
    const discountPercentRaw = Number(formData.get('bulkDiscountPercent'));
    const priceSetRaw = Number(formData.get('bulkPriceSet'));
    const confirmDelete = (formData.get('confirmDelete') || '').toString();

    const dryRun = (formData.get('dryRun') || '').toString() === '1';
  // Execute
    if (action === 'stockInc' || action === 'stockDec') {
      const delta = isNaN(stockDeltaRaw) ? 0 : (action === 'stockDec' ? -Math.abs(stockDeltaRaw) : Math.abs(stockDeltaRaw));
      if (delta === 0) return;
      if (dryRun) return;
      await db.collection('products').updateMany(tf, [
        { $set: { current_stock: { $max: [0, { $add: [ { $ifNull: ['$current_stock', 0] }, delta ] }] }, updatedAt: now } }
      ]);
    } else if (action === 'stockSet') {
      const next = Math.max(0, isNaN(stockSetRaw) ? 0 : stockSetRaw);
      if (dryRun) return;
      await db.collection('products').updateMany(tf, { $set: { current_stock: next, updatedAt: now } });
    } else if (action === 'setDiscount') {
      const discount = Number(discountPriceRaw);
      if (isNaN(discount) || discount <= 0) return;
      // Ensure price > discount
      const combined = filter ? { $and: [filter, { price: { $gt: discount } }] } : { ...tf, price: { $gt: discount } };
      if (dryRun) return;
      await db.collection('products').updateMany(combined, { $set: { has_discount_price: true, discount_price: discount, updatedAt: now } });
    } else if (action === 'discountPercent') {
      const pct = Number(discountPercentRaw);
      if (isNaN(pct) || pct <= 0 || pct >= 100) return;
      const factor = (100 - pct) / 100;
      if (dryRun) return;
      await db.collection('products').updateMany(tf, [
        { $set: { discount_price: { $round: [ { $multiply: [ { $toDouble: { $ifNull: ['$price', 0] } }, factor ] }, 2 ] }, has_discount_price: true, updatedAt: now } }
      ]);
    } else if (action === 'clearDiscount') {
      if (dryRun) return;
      await db.collection('products').updateMany(tf, { $set: { has_discount_price: false, discount_price: 0, updatedAt: now } });
    } else if (action === 'priceSet') {
      const p = Number(priceSetRaw);
      if (isNaN(p) || p <= 0) return;
      if (dryRun) return;
      await db.collection('products').updateMany(tf, [
        { $set: {
          price: p,
          has_discount_price: { $cond: [{ $gte: [ { $ifNull: ['$discount_price', 0] }, p ] }, false, { $ifNull: ['$has_discount_price', false] }] },
          discount_price: { $cond: [{ $gte: [ { $ifNull: ['$discount_price', 0] }, p ] }, 0, { $ifNull: ['$discount_price', 0] }] },
          updatedAt: now
        }}
      ]);
    } else if (action === 'priceRound99') {
      if (dryRun) return;
      // Compute floor to integer - 0.01 => xx.99
      await db.collection('products').updateMany(tf, [
        { $set: {
          price: { $subtract: [ { $toInt: { $ifNull: ['$price', 0] } }, 0.01 ] },
          updatedAt: now
        }}
      ]);
    } else if (action === 'deleteProducts') {
      if (confirmDelete !== 'DELETE') return;
      if (dryRun) return;
      await db.collection('products').deleteMany(tf);
    }
    // Audit (best-effort)
    try {
      await addProductAudit({
        userEmail: session?.user?.email,
        action: String(action),
        scope,
        ids: Array.isArray(ids) ? ids : [],
        filters: filter || {},
        params: {
          stockDeltaRaw, stockSetRaw, discountPriceRaw, discountPercentRaw, priceSetRaw,
        }
      });
    } catch {}
    revalidatePath('/dashboard/seller/products');
  }

  const mkQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set('search', q);
    if (fromStr) usp.set('from', fromStr);
    if (toStr) usp.set('to', toStr);
    if (sortKey) usp.set('sort', sortKey);
    usp.set('pageSize', String(pageSize));
    if (sp?.inStock) usp.set('inStock', String(sp.inStock));
    if (sp?.hasDiscount) usp.set('hasDiscount', String(sp.hasDiscount));
    if (sp?.minPrice) usp.set('minPrice', String(sp.minPrice));
    if (sp?.maxPrice) usp.set('maxPrice', String(sp.maxPrice));
    if (colsParam) usp.set('cols', colsParam);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') usp.delete(k);
      else usp.set(k, String(v));
    });
    const s = usp.toString();
    return s ? `?${s}` : '';
  };

  // totalPages handled inside PaginationServer

  // page items now rendered by PaginationServer

  return (
    <div className="space-y-3">
      <div>
        <TableFilters
        title="Products"
        subtitle="Filter, sort, and bulk manage in one place"
        config={{ showStatusBar: false, showInStock: true, showHasDiscount: true, showPriceRange: true }}
        sortOptions={[
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
          { value: 'name-asc', label: 'Name A→Z' },
          { value: 'name-desc', label: 'Name Z→A' },
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
            <BulkModalTrigger formId="bulkProductsForm" scope={(!scopeParam || scopeParam === 'selected') ? 'selected' : scopeParam} pageCount={products.length} total={total} />
            <details className="relative">
              <summary className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50 cursor-pointer select-none inline-flex items-center gap-1">Display <span className="text-[10px]">▾</span></summary>
              <div className="absolute right-0 mt-2 w-[min(92vw,420px)] rounded-md border bg-white shadow-md p-3 z-10">
                <div>
                  <div className="text-[11px] font-medium text-muted-foreground px-1 mb-1">Columns</div>
                  <ul className="max-h-56 overflow-auto">
                    {allColsDefault.map((c) => {
                      const nextCols = (() => { const set = new Set(visibleCols); if (set.has(c)) set.delete(c); else set.add(c); return Array.from(set).join(','); })();
                      return (
                        <li key={c}>
                          <Link href={`/dashboard/seller/products${mkQS({ cols: nextCols, page: 1 })}`} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50">
                            <input type="checkbox" readOnly checked={visibleCols.has(c)} className="h-4 w-4" />
                            <span className="capitalize text-sm">{c}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <Link href={`/dashboard/seller/products${mkQS({ cols: allColsDefault.join(','), page: 1 })}`} className="text-xs text-zinc-600 hover:underline">Show all</Link>
                    <Link href={`/dashboard/seller/products${mkQS({ cols: '', page: 1 })}`} className="text-xs text-zinc-600 hover:underline">Hide all</Link>
                  </div>
                </div>
                <div className="my-2 h-px bg-zinc-100" />
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-muted-foreground px-1">Saved views</div>
                  <div className="flex flex-col gap-2">
                    <SavedViews />
                    <SavedViewsServer />
                  </div>
                </div>
              </div>
            </details>
            <details className="relative">
              <summary className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50 cursor-pointer select-none inline-flex items-center gap-1">Export <span className="text-[10px]">▾</span></summary>
              <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md p-2 z-10">
                <ul>
                  <li>
                    <Link href={`/api/seller/products/export${mkQS({})}`} className="block rounded px-2 py-1 hover:bg-zinc-50 text-xs">All (filtered)</Link>
                  </li>
                  <li>
                    <Link href={`/api/seller/products/export${mkQS({ page, pageSize })}`} className="block rounded px-2 py-1 hover:bg-zinc-50 text-xs">Current page</Link>
                  </li>
                </ul>
              </div>
            </details>
          </div>
        )}
        advancedExtra={null}
        persistentExtra={(
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">In <b className="ml-1 text-emerald-900">{stats.inStock}</b></span>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">Low <b className="ml-1 text-amber-900">{stats.lowStock}</b></span>
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">Out <b className="ml-1 text-rose-900">{stats.outOfStock}</b></span>
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700">Sale <b className="ml-1 text-violet-900">{stats.discounted}</b></span>
          </div>
        )}
        />
      </div>

      {/* Bulk form wraps the table so selection works */}
      <form id="bulkProductsForm" action={bulkProducts} className="space-y-2">
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
        {colsParam ? <input type="hidden" name="cols" value={colsParam} /> : null}
        <input type="hidden" name="page" value={String(page)} />
        <input type="hidden" name="pageSize" value={String(pageSize)} />

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {/* Removed select-all checkbox in favor of bulk scope controls above */}
          {products.map((p) => {
            const id = p._id?.toString?.() || p._id;
            return (
              <div key={id} className="rounded-md border bg-white p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded bg-zinc-100 overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate"><Link href={`/dashboard/seller/products/${id}`} className="hover:underline">{p.name}</Link></div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.slug || p.sku || '—'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                  </div>
                  <label className="text-xs inline-flex items-center gap-1"><input form="bulkProductsForm" type="checkbox" name="ids" value={id} aria-label={`Select ${p.name}`} /> Select</label>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {p.has_discount_price && Number(p.discount_price) > 0 ? (
                      <span className="text-rose-600">{currencyFmt.format(Number(p.discount_price || 0))}</span>
                    ) : (
                      <span>{currencyFmt.format(Number(p.price || 0))}</span>
                    )}
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>Stock: {typeof p.current_stock !== 'undefined' ? p.current_stock : '—'}</span>
                    {typeof p.current_stock !== 'undefined' && Number(p.current_stock) === 0 ? (
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">Out of stock</span>
                    ) : Number(p.current_stock) <= 5 ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">Low</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">In stock</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/seller/products/${id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">View</Link>
                  <Link href={`/dashboard/seller/products/${id}/edit`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Edit</Link>
                  <RowActionsMenu title={`Actions – ${p.name}`}>
                    <ul className="space-y-1">
                      <li>
                        <Link href={`/dashboard/seller/products/${id}`} className="block rounded px-2 py-1 hover:bg-zinc-50">View</Link>
                      </li>
                      <li>
                        <Link href={`/dashboard/seller/products/${id}/edit`} className="block rounded px-2 py-1 hover:bg-zinc-50">Edit</Link>
                      </li>
                      <li className="my-1 h-px bg-zinc-100" />
                      <li className="flex items-center gap-2 px-2">
                        <form action={adjustStock} className="inline">
                          <input type="hidden" name="id" value={id} />
                          <input type="hidden" name="delta" value="1" />
                          <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">+1</button>
                        </form>
                        <form action={adjustStock} className="inline">
                          <input type="hidden" name="id" value={id} />
                          <input type="hidden" name="delta" value="-1" />
                          <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">-1</button>
                        </form>
                        <form action={adjustStock} className="ml-auto inline-flex items-center gap-1">
                          <input type="hidden" name="id" value={id} />
                          <input name="delta" type="number" step="1" className="h-7 w-16 rounded border px-2" placeholder="Δ" />
                          <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">Apply</button>
                        </form>
                      </li>
                      <li className="my-1 h-px bg-zinc-100" />
                      <li>
                        <details>
                          <summary className="cursor-pointer select-none rounded px-2 py-1 hover:bg-zinc-50">Pricing editor</summary>
                          <form action={updatePricing} className="mt-2 grid grid-cols-2 gap-2 p-2 border rounded bg-white">
                            <input type="hidden" name="id" value={id} />
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground">Price</span>
                              <input name="price" type="number" step="0.01" min="0.01" defaultValue={Number(p.price || 0)} className="h-8 px-2 rounded border text-xs" />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground">Discount</span>
                              <input name="discountPrice" type="number" step="0.01" min="0" defaultValue={Number(p.discount_price || 0)} className="h-8 px-2 rounded border text-xs" />
                            </label>
                            <label className="col-span-2 inline-flex items-center gap-2 text-[12px]">
                              <input type="checkbox" name="hasDiscount" defaultChecked={!!p.has_discount_price} /> Has discount
                            </label>
                            <div className="col-span-2 flex items-center justify-end">
                              <button type="submit" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Save</button>
                            </div>
                          </form>
                        </details>
                      </li>
                      {p.has_discount_price ? (
                        <li>
                          <form action={clearDiscountSingle} className="px-2">
                            <input type="hidden" name="id" value={id} />
                            <button type="submit" className="w-full text-left rounded px-2 py-1 hover:bg-zinc-50">Clear discount</button>
                          </form>
                        </li>
                      ) : null}
                    </ul>
                  </RowActionsMenu>
                  {p.has_discount_price && Number(p.discount_price) > 0 ? (
                    <span className="ml-auto inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">On sale</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

  {products.length === 0 ? (
          <div className="rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">
            <div>No products match your filters.</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link href="/dashboard/seller/products" className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Reset filters</Link>
              <Link href="/dashboard/add-product" className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Add product</Link>
            </div>
          </div>
        ) : (
  <div className="hidden sm:block overflow-x-auto rounded border bg-white">
  <table className="min-w-full table-fixed text-xs sm:text-sm">
          <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
            <tr className="text-left">
              <th className="px-2 py-2 text-[11px] text-muted-foreground"><SelectAllOnPage /></th>
              {visibleCols.has('image') && <th className="px-2 sm:px-3 py-2 font-medium">Product</th>}
              {visibleCols.has('info') && (
                <th className="px-3 py-2 font-medium">
                  <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'name-asc' ? 'name-desc' : 'name-asc', page: 1 })}`} className="inline-flex items-center gap-1">Info <span className="text-xs text-muted-foreground">{sortKey?.startsWith('name-') ? (sortKey === 'name-asc' ? '▲' : '▼') : ''}</span></Link>
                </th>
              )}
              {visibleCols.has('added') && (
                <th className="px-3 py-2 font-medium">
                  <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'oldest' ? 'newest' : 'oldest', page: 1 })}`} className="inline-flex items-center gap-1">Added <span className="text-xs text-muted-foreground">{sortKey === 'oldest' ? '▲' : sortKey === 'newest' ? '▼' : ''}</span></Link>
                </th>
              )}
              {visibleCols.has('price') && (<th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'price-high' ? 'price-low' : 'price-high', page: 1 })}`} className="inline-flex items-center gap-1">Price <span className="text-xs text-muted-foreground">{sortKey?.startsWith('price-') ? (sortKey === 'price-high' ? '▼' : '▲') : ''}</span></Link>
              </th>)}
              {visibleCols.has('stock') && (<th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'stock-high' ? 'stock-low' : 'stock-high', page: 1 })}`} className="inline-flex items-center gap-1">Stock <span className="text-xs text-muted-foreground">{sortKey?.startsWith('stock-') ? (sortKey === 'stock-high' ? '▼' : '▲') : ''}</span></Link>
              </th>)}
              {visibleCols.has('rating') && (<th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'rating-high' ? 'rating-low' : 'rating-high', page: 1 })}`} className="inline-flex items-center gap-1">Rating <span className="text-xs text-muted-foreground">{sortKey?.startsWith('rating-') ? (sortKey === 'rating-high' ? '▼' : '▲') : ''}</span></Link>
              </th>)}
              {visibleCols.has('actions') && <th className="px-2 sm:px-3 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const id = p._id?.toString?.() || p._id;
              return (
                <tr key={id} className="border-t odd:bg-zinc-50/40 hover:bg-zinc-50">
                  <td className="px-2 py-2"><input form="bulkProductsForm" type="checkbox" name="ids" value={id} aria-label={`Select ${p.name}`} /></td>
                  {visibleCols.has('image') && (
                    <td className="px-2 sm:px-3 py-2 w-[64px]">
                      {p.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded bg-zinc-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded bg-zinc-100" />
                      )}
                    </td>
                  )}
                  {visibleCols.has('info') && (
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex flex-col min-w-0">
                        <div className="font-medium line-clamp-1"><Link prefetch={false} href={`/dashboard/seller/products/${id}`} className="hover:underline">{p.name}</Link></div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">{p.slug || p.sku || '—'}</div>
                      </div>
                    </td>
                  )}
                  {visibleCols.has('added') && (
                    <td className="px-3 py-2 text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
                  )}
                  {visibleCols.has('price') && (
                    <td className="px-3 py-2">
                      {p.has_discount_price && Number(p.discount_price) > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-rose-600 font-semibold">{currencyFmt.format(Number(p.discount_price || 0))}</span>
                          <span className="text-xs text-muted-foreground line-through">{currencyFmt.format(Number(p.price || 0))}</span>
                        </div>
                      ) : (
                        <span>{currencyFmt.format(Number(p.price || 0))}</span>
                      )}
                    </td>
                  )}
                  {visibleCols.has('stock') && (
                    <td className="px-3 py-2">
                      {typeof p.current_stock !== 'undefined' ? (
                        <div className="flex items-center gap-2">
                          <span className={`${Number(p.current_stock) <= 5 ? 'text-amber-700' : ''}`}>{p.current_stock}</span>
                          {Number(p.current_stock) === 0 ? (
                            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">Out of stock</span>
                          ) : Number(p.current_stock) <= 5 ? (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">Low</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">In stock</span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                  )}
                  {visibleCols.has('rating') && (
                    <td className="px-3 py-2">
                      {typeof p.product_rating !== 'undefined' ? (
                        <span className="text-xs">{p.product_rating}/{p.product_max_rating || 5} <span className="text-muted-foreground">({p.product_rating_count || 0})</span></span>
                      ) : '—'}
                    </td>
                  )}
                  {visibleCols.has('actions') && (
                    <td className="px-3 py-2">
                      <RowActionsMenu title={`Actions – ${p.name}`}> 
                        <ul className="space-y-1">
                            <li>
                              <Link href={`/dashboard/seller/products/${id}`} className="block rounded px-2 py-1 hover:bg-zinc-50">View</Link>
                            </li>
                            <li>
                              <Link href={`/dashboard/seller/products/${id}/edit`} className="block rounded px-2 py-1 hover:bg-zinc-50">Edit</Link>
                            </li>
                            <li className="my-1 h-px bg-zinc-100" />
                            <li className="flex items-center gap-2 px-2">
                              <form action={adjustStock} className="inline">
                                <input type="hidden" name="id" value={id} />
                                <input type="hidden" name="delta" value="1" />
                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">+1</button>
                              </form>
                              <form action={adjustStock} className="inline">
                                <input type="hidden" name="id" value={id} />
                                <input type="hidden" name="delta" value="-1" />
                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">-1</button>
                              </form>
                              <form action={adjustStock} className="ml-auto inline-flex items-center gap-1">
                                <input type="hidden" name="id" value={id} />
                                <input name="delta" type="number" step="1" className="h-7 w-16 rounded border px-2" placeholder="Δ" />
                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">Apply</button>
                              </form>
                            </li>
                            <li className="my-1 h-px bg-zinc-100" />
                            <li>
                              <details>
                                <summary className="cursor-pointer select-none rounded px-2 py-1 hover:bg-zinc-50">Pricing editor</summary>
                                <form action={updatePricing} className="mt-2 grid grid-cols-2 gap-2 p-2 border rounded bg-white">
                                  <input type="hidden" name="id" value={id} />
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">Price</span>
                                    <input name="price" type="number" step="0.01" min="0.01" defaultValue={Number(p.price || 0)} className="h-8 px-2 rounded border text-xs" />
                                  </label>
                                  <label className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground">Discount</span>
                                    <input name="discountPrice" type="number" step="0.01" min="0" defaultValue={Number(p.discount_price || 0)} className="h-8 px-2 rounded border text-xs" />
                                  </label>
                                  <label className="col-span-2 inline-flex items-center gap-2 text-[12px]">
                                    <input type="checkbox" name="hasDiscount" defaultChecked={!!p.has_discount_price} /> Has discount
                                  </label>
                                  <div className="col-span-2 flex items-center justify-end">
                                    <button type="submit" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Save</button>
                                  </div>
                                </form>
                              </details>
                            </li>
                            {p.has_discount_price ? (
                              <li>
                                <form action={clearDiscountSingle} className="px-2">
                                  <input type="hidden" name="id" value={id} />
                                  <button type="submit" className="w-full text-left rounded px-2 py-1 hover:bg-zinc-50">Clear discount</button>
                                </form>
                              </li>
                            ) : null}
              </ul>
            </RowActionsMenu>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        )}
      </form>

      {/* Pagination (server component) */}
      <PaginationServer
        basePath="/dashboard/seller/products"
        total={total}
        page={page}
        pageSize={pageSize}
        query={{
          search: q || undefined,
          from: fromStr || undefined,
          to: toStr || undefined,
          sort: sortKey || undefined,
          cols: colsParam || undefined,
          inStock: sp?.inStock || undefined,
          hasDiscount: sp?.hasDiscount || undefined,
          minPrice: sp?.minPrice || undefined,
          maxPrice: sp?.maxPrice || undefined,
        }}
      />
      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-4">
        <span>Total stock (filtered): {totals.stockSum}</span>
        <span>Inventory value (filtered): {currencyFmt.format(Number(totals.inventoryValue || 0))}</span>
      </div>
    </div>
  );
}
