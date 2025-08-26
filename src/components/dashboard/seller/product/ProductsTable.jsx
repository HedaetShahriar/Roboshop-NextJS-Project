import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { getProductsAndTotal } from "@/lib/productsService";

const currencyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export default async function ProductsTable(props) {
  const sp = props?.sp ?? props?.params ?? {};
  const { products, total, page, pageSize } = await getProductsAndTotal(sp);
  const q = (sp?.search || sp?.q || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  const skip = (page - 1) * pageSize;
  const colsParam = (sp?.cols || '').toString();
  const allColsDefault = ['image','info','added','price','stock','rating','actions'];
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

  async function bulkProducts(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    let ids = formData.getAll('ids');
    const action = formData.get('bulkAction');
    const selectAll = formData.get('selectAll');
    // derive current page items when selectAll is checked and ids are empty
    if ((!ids || ids.length === 0) && selectAll) {
      const s = {
        search: formData.get('search')?.toString() || '',
        from: formData.get('from')?.toString() || undefined,
        to: formData.get('to')?.toString() || undefined,
        sort: formData.get('sort')?.toString() || 'newest',
        page: Number(formData.get('page')?.toString() || '1'),
        pageSize: Number(formData.get('pageSize')?.toString() || '20'),
      };
      const { products: pageProducts } = await getProductsAndTotal(s);
      ids = pageProducts.map(p => p._id.toString());
    }
    if (!ids?.length || !action) return;
    const db = await getDb();
    const now = new Date();
    if (action === 'stockInc' || action === 'stockDec') {
      const deltaRaw = Number(formData.get('bulkStockDelta'));
      const delta = isNaN(deltaRaw) ? 0 : (action === 'stockDec' ? -Math.abs(deltaRaw) : Math.abs(deltaRaw));
      for (const id of ids) {
        let _id; try { _id = new ObjectId(String(id)); } catch { continue; }
        const doc = await db.collection('products').findOne({ _id });
        if (!doc) continue;
        const current = Number(doc.current_stock || 0);
        const next = Math.max(0, current + delta);
        await db.collection('products').updateOne({ _id }, { $set: { current_stock: next, updatedAt: now } });
      }
    } else if (action === 'setDiscount') {
      const discount = Number(formData.get('bulkDiscountPrice'));
      if (isNaN(discount) || discount <= 0) return;
      for (const id of ids) {
        let _id; try { _id = new ObjectId(String(id)); } catch { continue; }
        const doc = await db.collection('products').findOne({ _id });
        if (!doc) continue;
        const price = Number(doc.price || 0);
        if (discount >= price || price <= 0) continue;
        await db.collection('products').updateOne({ _id }, { $set: { has_discount_price: true, discount_price: discount, updatedAt: now } });
      }
    } else if (action === 'clearDiscount') {
      for (const id of ids) {
        let _id; try { _id = new ObjectId(String(id)); } catch { continue; }
        await db.collection('products').updateOne({ _id }, { $set: { has_discount_price: false, discount_price: 0, updatedAt: now } });
      }
    }
    revalidatePath('/dashboard/seller/products');
  }

  const mkQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set('search', q);
    if (fromStr) usp.set('from', fromStr);
    if (toStr) usp.set('to', toStr);
    if (sortKey) usp.set('sort', sortKey);
    usp.set('pageSize', String(pageSize));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') usp.delete(k);
      else usp.set(k, String(v));
    });
    const s = usp.toString();
    return s ? `?${s}` : '';
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : skip + 1;
  const showingTo = Math.min(total, skip + products.length);

  return (
    <div className="space-y-3">
      {/* Controls row: Columns dropdown + Export */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50 cursor-pointer select-none inline-flex items-center gap-1">Columns <span className="text-[10px]">▾</span></summary>
            <div className="absolute left-0 mt-2 w-56 rounded-md border bg-white shadow-md p-2 z-10">
              <ul className="max-h-64 overflow-auto">
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
          </details>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/api/seller/products/export${mkQS({})}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Export CSV</Link>
        </div>
      </div>

  {/* Bulk actions + table (single form) */}
      <form action={bulkProducts} className="space-y-2">
        {/* carry current filters for selectAll-on-page */}
        <input type="hidden" name="search" value={q} />
        {fromStr ? <input type="hidden" name="from" value={fromStr} /> : null}
        {toStr ? <input type="hidden" name="to" value={toStr} /> : null}
        {sortKey ? <input type="hidden" name="sort" value={sortKey} /> : null}
        <input type="hidden" name="page" value={String(page)} />
        <input type="hidden" name="pageSize" value={String(pageSize)} />

        {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-zinc-50 p-2">
          <span className="text-xs text-muted-foreground">Bulk:</span>
          <select name="bulkAction" className="h-9 rounded border px-2 text-xs">
            <option value="stockInc">Increase stock</option>
            <option value="stockDec">Decrease stock</option>
            <option value="setDiscount">Set discount price</option>
            <option value="clearDiscount">Clear discount</option>
          </select>
          <input name="bulkStockDelta" placeholder="Qty" className="h-9 px-3 rounded border text-xs w-20" />
          <input name="bulkDiscountPrice" placeholder="Discount" className="h-9 px-3 rounded border text-xs w-28" />
          <button type="submit" className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Apply to selected</button>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1"><input type="checkbox" name="selectAll" value="1" /> Select all on page</label>
          </div>
        </div>) }

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {products.length > 0 && (
            <label className="text-xs inline-flex items-center gap-1 px-1"><input type="checkbox" name="selectAll" value="1" /> Select all on page</label>
          )}
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
                  <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" name="ids" value={id} aria-label={`Select ${p.name}`} /> Select</label>
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
                  <form action={adjustStock}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="delta" value="1" />
                    <button type="submit" className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">+1</button>
                  </form>
                  <form action={adjustStock}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="delta" value="-1" />
                    <button type="submit" className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">-1</button>
                  </form>
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
        <div className="hidden sm:block overflow-auto rounded border bg-white max-h-[65vh]">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
            <tr className="text-left">
              <th className="px-2 py-2"><input type="checkbox" name="selectAll" value="1" aria-label="Select all on page (server)" /></th>
              {visibleCols.has('image') && <th className="px-2 sm:px-3 py-2 font-medium">Product</th>}
              {visibleCols.has('info') && (
                <th className="px-3 py-2 font-medium">
                  <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'name-asc' ? 'name-desc' : 'name-asc', page: 1 })}`} className="inline-flex items-center gap-1">Info <span className="text-xs text-muted-foreground">{sortKey?.startsWith('name-') ? (sortKey === 'name-asc' ? '▲' : '▼') : ''}</span></Link>
                </th>
              )}
              <th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/products${mkQS({ sort: sortKey === 'oldest' ? 'newest' : 'oldest', page: 1 })}`} className="inline-flex items-center gap-1">Added <span className="text-xs text-muted-foreground">{sortKey === 'oldest' ? '▲' : sortKey === 'newest' ? '▼' : ''}</span></Link>
              </th>
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
                  <td className="px-2 py-2"><input type="checkbox" name="ids" value={id} aria-label={`Select ${p.name}`} /></td>
                  {visibleCols.has('image') && (
                    <td className="px-2 sm:px-3 py-2 w-[64px]">
                      {p.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded bg-zinc-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded bg-zinc-100" />
                      )}
                    </td>
                  )}
                  {visibleCols.has('info') && (
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex flex-col min-w-0">
                        <div className="font-medium line-clamp-1"><Link href={`/dashboard/seller/products/${id}`} className="hover:underline">{p.name}</Link></div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">{p.slug || p.sku || '—'}</div>
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2 text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/dashboard/seller/products/${id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">View</Link>
                        <Link href={`/dashboard/seller/products/${id}/edit`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Edit</Link>
                        {/* Quick stock +/- */}
                        <form action={adjustStock}>
                          <input type="hidden" name="id" value={id} />
                          <input type="hidden" name="delta" value="1" />
                          <button type="submit" className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">+1</button>
                        </form>
                        <form action={adjustStock}>
                          <input type="hidden" name="id" value={id} />
                          <input type="hidden" name="delta" value="-1" />
                          <button type="submit" className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">-1</button>
                        </form>
                        {/* Inline pricing editor */}
                        <details className="text-xs">
                          <summary className="cursor-pointer select-none inline-flex items-center rounded border px-2 py-1">Pricing</summary>
                          <form action={updatePricing} className="mt-2 grid grid-cols-2 gap-2 p-2 border rounded bg-white">
                            <input type="hidden" name="id" value={id} />
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground">Price</span>
                              <input name="price" defaultValue={Number(p.price || 0)} className="h-8 px-2 rounded border text-xs" />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground">Discount</span>
                              <input name="discountPrice" defaultValue={Number(p.discount_price || 0)} className="h-8 px-2 rounded border text-xs" />
                            </label>
                            <label className="col-span-2 inline-flex items-center gap-2 text-[12px]">
                              <input type="checkbox" name="hasDiscount" defaultChecked={!!p.has_discount_price} /> Has discount
                            </label>
                            <div className="col-span-2 flex items-center justify-end">
                              <button type="submit" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Save</button>
                            </div>
                          </form>
                        </details>
                      </div>
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="text-xs sm:text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm">Rows:</span>
          <form method="GET" action={`/dashboard/seller/products`} className="flex items-center gap-2">
            <input type="hidden" name="search" value={q} />
            {fromStr ? <input type="hidden" name="from" value={fromStr} /> : null}
            {toStr ? <input type="hidden" name="to" value={toStr} /> : null}
            {sortKey ? <input type="hidden" name="sort" value={sortKey} /> : null}
            {colsParam ? <input type="hidden" name="cols" value={colsParam} /> : null}
            <select name="pageSize" defaultValue={String(pageSize)} className="border rounded-md h-9 px-2 text-sm">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <button type="submit" className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Apply</button>
          </form>
          <Link href={`/dashboard/seller/products${mkQS({ page: Math.max(1, page - 1) })}`} className={`px-3 py-1 rounded border text-xs sm:text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Prev</Link>
          <div className="text-xs sm:text-sm">Page {page} / {totalPages}</div>
          <Link href={`/dashboard/seller/products${mkQS({ page: Math.min(totalPages, page + 1) })}`} className={`px-3 py-1 rounded border text-xs sm:text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Next</Link>
        </div>
      </div>
    </div>
  );
}
