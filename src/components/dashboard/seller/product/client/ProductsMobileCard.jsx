import Link from "next/link";
import RowActionsMenu from "./RowActionsMenu";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export default function ProductsMobileCard({ p, id, onAdjustStockAction, onUpdatePricingAction, onClearDiscountAction }) {
  const currencyFmt = { format: (n) => formatBDT(n) };
  const categoryVal = p.category ?? p.categoryName ?? p.category_name ?? p.category_title ?? p.categoryLabel;
  const subcategoryVal = p.subcategory ?? p.subCategory ?? p.sub_category ?? p.subcategoryName ?? p.subcategory_name ?? p.subCategoryName ?? p.subcategoryLabel;
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm">
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
          {(categoryVal || subcategoryVal) ? (
            <div className="mt-1 text-[11px] text-muted-foreground truncate">
              <span>{categoryVal || '—'}</span>
              {subcategoryVal ? <span className="mx-1">/</span> : null}
              {subcategoryVal ? <span>{subcategoryVal}</span> : null}
            </div>
          ) : null}
          <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</div>
        </div>
        <label className="text-xs inline-flex items-center gap-1"><input form="bulkProductsForm" type="checkbox" name="ids" value={id} aria-label={`Select ${p.name}`} /> Select</label>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm font-semibold">
          {p.has_discount_price && Number(p.discount_price) > 0 ? (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-rose-600 tabular-nums">{currencyFmt.format(Number(p.discount_price || 0))}</span>
              <span className="text-[11px] text-muted-foreground line-through tabular-nums">{currencyFmt.format(Number(p.price || 0))}</span>
              {Number(p.price) > 0 ? (
                <span className="ml-1 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 tabular-nums">
                  -{Math.max(1, Math.min(99, Math.round(100 - ((Number(p.discount_price || 0) * 100) / Number(p.price || 1)))))}%
                </span>
              ) : null}
            </div>
          ) : (
            <span className="tabular-nums">{currencyFmt.format(Number(p.price || 0))}</span>
          )}
        </div>
        <div className="text-xs flex items-center gap-1">
          <span>Stock:</span>
          {typeof p.current_stock !== 'undefined' ? (
            <span className={`${Number(p.current_stock) === 0 ? 'text-rose-700' : Number(p.current_stock) <= 5 ? 'text-amber-700' : 'text-emerald-700'} font-semibold tabular-nums`}>
              {p.current_stock}
            </span>
          ) : (
            <span>—</span>
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
        {p.has_discount_price && Number(p.discount_price) > 0 ? (
          <span className="ml-auto inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">On sale</span>
        ) : null}
      </div>
    </div>
  );
}
