import Link from "next/link";
import RowActionsMenu from "./RowActionsMenu";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export default function ProductsTableRow({
  p,
  id,
  index,
  page,
  pageSize,
  visibleCols,
  onAdjustStockAction,
  onUpdatePricingAction,
  onClearDiscountAction,
}) {
  const currencyFmt = { format: (n) => formatBDT(n) };
  const ratingVal = typeof p.product_rating !== 'undefined' ? Number(p.product_rating) : null;
  const ratingMax = Number(p.product_max_rating || 5);
  const categoryVal = p.category ?? p.categoryName ?? p.category_name ?? p.category_title ?? p.categoryLabel;
  const subcategoryVal = p.subcategory ?? p.subCategory ?? p.sub_category ?? p.subcategoryName ?? p.subcategory_name ?? p.subCategoryName ?? p.subcategoryLabel;

  return (
    <tr className="border-t odd:bg-zinc-50/40 hover:bg-zinc-50">
      <td className="px-1 py-2"><input form="bulkProductsForm" type="checkbox" name="ids" value={id} aria-label={`Select ${p.name}`} /></td>
      <td className="px-2 py-2 text-right w-[1%] whitespace-nowrap text-[11px] text-muted-foreground tabular-nums">{((page - 1) * pageSize) + index + 1}</td>
      {visibleCols.has('image') && (
        <td className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2 w-[64px]">
          {p.image ? (
            <div className="relative h-10 w-10 overflow-hidden rounded bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-500">
              {(p?.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </td>
      )}
      {visibleCols.has('info') && (
        <td className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2">
          <div className="flex flex-col min-w-0">
            <div className="font-medium line-clamp-1"><Link prefetch={false} href={`/dashboard/seller/products/${id}`} className="hover:underline">{p.name}</Link></div>
            <div className="text-[11px] text-muted-foreground line-clamp-1"><code className="font-mono text-[10px] bg-zinc-50 rounded px-1 py-0.5">{p.slug || p.sku || '—'}</code></div>
          </div>
        </td>
      )}
      {visibleCols.has('category') && (
        <td className="px-3 py-2">
          <div className="flex flex-col min-w-0">
            <span className="text-sm leading-tight truncate">{categoryVal ? String(categoryVal) : '—'}</span>
            {subcategoryVal ? (
              <span className="text-[11px] text-muted-foreground truncate">{String(subcategoryVal)}</span>
            ) : null}
          </div>
        </td>
      )}
      {visibleCols.has('added') && (
        <td className="px-3 py-2 text-muted-foreground">{formatDateTime(p.createdAt)}</td>
      )}
      {visibleCols.has('price') && (
        <td className="px-3 py-2 text-right">
          {p.has_discount_price && Number(p.discount_price) > 0 ? (
            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
              <span className="text-rose-600 font-semibold tabular-nums">{currencyFmt.format(Number(p.discount_price || 0))}</span>
              <span className="text-xs text-muted-foreground line-through tabular-nums">{currencyFmt.format(Number(p.price || 0))}</span>
              {Number(p.price) > 0 ? (
                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 tabular-nums">
                  -{Math.max(1, Math.min(99, Math.round(100 - ((Number(p.discount_price || 0) * 100) / Number(p.price || 1)))))}%
                </span>
              ) : null}
            </div>
          ) : (
            <span className="tabular-nums">{currencyFmt.format(Number(p.price || 0))}</span>
          )}
        </td>
      )}
      {visibleCols.has('stock') && (
        <td className="px-3 py-2 text-center">
          {typeof p.current_stock !== 'undefined' ? (
            <span className={`${Number(p.current_stock) === 0 ? 'text-rose-700' : Number(p.current_stock) <= 5 ? 'text-amber-700' : 'text-emerald-700'} font-semibold tabular-nums`}>
              {p.current_stock}
            </span>
          ) : '—'}
        </td>
      )}
      {visibleCols.has('rating') && (
        <td className="px-3 py-2 text-center">
          {ratingVal !== null ? (
            <span className="text-[11px]" aria-label={`Rating ${ratingVal} out of ${ratingMax}`}>
              {ratingVal}/{ratingMax} <span className="text-muted-foreground">({p.product_rating_count || 0})</span>
            </span>
          ) : '—'}
        </td>
      )}
      {visibleCols.has('actions') && (
        <td className="px-3 py-2 text-right">
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
                <form action={onAdjustStockAction} className="inline">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="delta" value="1" />
                  <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">+1</button>
                </form>
                <form action={onAdjustStockAction} className="inline">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="delta" value="-1" />
                  <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">-1</button>
                </form>
                <form action={onAdjustStockAction} className="ml-auto inline-flex items-center gap-1">
                  <input type="hidden" name="id" value={id} />
                  <input name="delta" type="number" step="1" className="h-7 w-16 rounded border px-2" placeholder="Δ" />
                  <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50">Apply</button>
                </form>
              </li>
              <li className="my-1 h-px bg-zinc-100" />
              <li>
                <details>
                  <summary className="cursor-pointer select-none rounded px-2 py-1 hover:bg-zinc-50">Pricing editor</summary>
                  <form action={onUpdatePricingAction} className="mt-2 grid grid-cols-2 gap-2 p-2 border rounded bg-white">
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
                  <form action={onClearDiscountAction} className="px-2">
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
}
