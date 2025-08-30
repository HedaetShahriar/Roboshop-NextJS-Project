import Link from "next/link";
import ActionsDropdown from "../client/ActionsDropdown";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { Eye, EyeOff, Pencil, Plus, Minus, Tag, CircleDollarSign, Trash2, Percent } from "lucide-react";
import CopyLinkButton from "../client/CopyLinkButton";
import FormWithToast from "../client/FormWithToast";

export default function ProductsTableRow({
    p,
    id,
    index,
    page,
    pageSize,
    visibleCols,
    adjustStockAction,
    updatePricingAction,
    clearDiscountAction,
    setVisibilityAction,
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
                        <div className="font-medium line-clamp-1 flex items-center gap-2">
                            <Link prefetch={false} href={`/dashboard/seller/products/${id}`} className="hover:underline">{p.name}</Link>
                            {p.is_hidden ? (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Hidden</span>
                            ) : null}
                        </div>
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
                    <ActionsDropdown title="Actions">
                        <ul className="space-y-2">
                            {/* Quick links */}
                            <li className="grid grid-cols-3 gap-2 px-2">
                                <Link href={`/dashboard/seller/products/${id}`} className="inline-flex items-center justify-center gap-1 h-8 rounded border text-xs bg-white hover:bg-zinc-50" title="View" aria-label={`View ${p.name}`}>
                                    <Eye className="size-3.5" /> View
                                </Link>
                                <Link href={`/dashboard/seller/products/${id}/edit`} className="inline-flex items-center justify-center gap-1 h-8 rounded border text-xs bg-white hover:bg-zinc-50" title="Edit" aria-label={`Edit ${p.name}`}>
                                    <Pencil className="size-3.5" /> Edit
                                </Link>
                                <CopyLinkButton
                                    url={`/dashboard/seller/products/${id}`}
                                    className="inline-flex items-center justify-center gap-1 h-8 rounded border text-xs bg-white hover:bg-zinc-50"
                                    title="Copy link"
                                />
                            </li>

                            {/* Stock */}
                            <li className="px-2">
                                <div className="text-[11px] text-muted-foreground mb-1 inline-flex items-center gap-1"><Tag className="size-3.5" /> Stock</div>
                                <div className="flex items-center gap-2">
                                    <FormWithToast
                                        action={adjustStockAction}
                                        className="inline"
                                        onSubmitToast="Updating stock…"
                                        successToast="Stock updated"
                                    >
                                        <input type="hidden" name="id" value={id} />
                                        <input type="hidden" name="delta" value="1" />
                                        <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Increase stock by 1" aria-label="Increase stock by 1"><Plus className="size-3.5" /> 1</button>
                                    </FormWithToast>
                                    <FormWithToast
                                        action={adjustStockAction}
                                        className="inline"
                                        onSubmitToast="Updating stock…"
                                        successToast="Stock updated"
                                    >
                                        <input type="hidden" name="id" value={id} />
                                        <input type="hidden" name="delta" value="-1" />
                                        <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Decrease stock by 1" aria-label="Decrease stock by 1"><Minus className="size-3.5" /> 1</button>
                                    </FormWithToast>
                                    <FormWithToast
                                        action={adjustStockAction}
                                        className="ml-auto inline-flex items-center gap-1"
                                        onSubmitToast="Updating stock…"
                                        successToast="Stock updated"
                                    >
                                        <input type="hidden" name="id" value={id} />
                                        <input name="delta" type="number" step="1" className="h-7 w-16 rounded border px-2" placeholder="Δ" aria-label="Stock delta" />
                                        <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50" title="Apply custom stock delta">Apply</button>
                                    </FormWithToast>
                                    {typeof p.current_stock !== 'undefined' ? (
                                        <FormWithToast
                                            action={adjustStockAction}
                                            className="inline"
                                            onSubmitToast="Updating stock…"
                                            successToast="Stock updated"
                                            confirmMessage="Set stock to 0?"
                                        >
                                            <input type="hidden" name="id" value={id} />
                                            <input type="hidden" name="delta" value={`${-Number(p.current_stock || 0)}`} />
                                            <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50" aria-label="Set stock to zero" title={Number(p.current_stock || 0) <= 0 ? 'Already zero' : 'Set stock to 0'} disabled={Number(p.current_stock || 0) <= 0} aria-disabled={Number(p.current_stock || 0) <= 0}>Set 0</button>
                                        </FormWithToast>
                                    ) : null}
                                </div>
                            </li>

                            {/* Pricing */}
                            <li className="px-2">
                                <div className="text-[11px] text-muted-foreground mb-1 inline-flex items-center gap-1"><CircleDollarSign className="size-3.5" /> Pricing</div>
                                <details>
                                    <summary className="cursor-pointer select-none rounded px-2 py-1 hover:bg-zinc-50">Open editor</summary>
                                    <FormWithToast action={updatePricingAction} className="mt-2 grid grid-cols-2 gap-2 p-2 border rounded bg-white" onSubmitToast="Saving pricing…" successToast="Pricing saved">
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
                                    </FormWithToast>
                                    {/* Quick discount presets */}
                                    {Number(p.price) > 0 ? (
                                        <div className="mt-2 flex items-center gap-2 px-2">
                                            <FormWithToast action={updatePricingAction} onSubmitToast="Saving pricing…" successToast="Pricing saved" className="inline">
                                                <input type="hidden" name="id" value={id} />
                                                <input type="hidden" name="price" value={`${Number(p.price || 0)}`} />
                                                <input type="hidden" name="hasDiscount" value="on" />
                                                <input type="hidden" name="discountPrice" value={`${(Math.round((Number(p.price || 0) * 0.9) * 100) / 100).toFixed(2)}`} />
                                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Apply 10% off" aria-label="Apply 10 percent off">
                                                    <Percent className="size-3.5" /> 10%
                                                </button>
                                            </FormWithToast>
                                            <FormWithToast action={updatePricingAction} onSubmitToast="Saving pricing…" successToast="Pricing saved" className="inline">
                                                <input type="hidden" name="id" value={id} />
                                                <input type="hidden" name="price" value={`${Number(p.price || 0)}`} />
                                                <input type="hidden" name="hasDiscount" value="on" />
                                                <input type="hidden" name="discountPrice" value={`${(Math.round((Number(p.price || 0) * 0.8) * 100) / 100).toFixed(2)}`} />
                                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Apply 20% off" aria-label="Apply 20 percent off">
                                                    <Percent className="size-3.5" /> 20%
                                                </button>
                                            </FormWithToast>
                                            <FormWithToast action={updatePricingAction} onSubmitToast="Saving pricing…" successToast="Pricing saved" className="inline">
                                                <input type="hidden" name="id" value={id} />
                                                <input type="hidden" name="price" value={`${Number(p.price || 0)}`} />
                                                <input type="hidden" name="hasDiscount" value="on" />
                                                <input type="hidden" name="discountPrice" value={`${(Math.round((Number(p.price || 0) * 0.95) * 100) / 100).toFixed(2)}`} />
                                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Apply 5% off" aria-label="Apply 5 percent off">
                                                    <Percent className="size-3.5" /> 5%
                                                </button>
                                            </FormWithToast>
                                            <FormWithToast action={updatePricingAction} onSubmitToast="Saving pricing…" successToast="Pricing saved" className="inline">
                                                <input type="hidden" name="id" value={id} />
                                                <input type="hidden" name="price" value={`${Number(p.price || 0)}`} />
                                                <input type="hidden" name="hasDiscount" value="on" />
                                                <input type="hidden" name="discountPrice" value={`${(Math.round((Number(p.price || 0) * 0.7) * 100) / 100).toFixed(2)}`} />
                                                <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Apply 30% off" aria-label="Apply 30 percent off">
                                                    <Percent className="size-3.5" /> 30%
                                                </button>
                                            </FormWithToast>
                                                {/* Keep standalone Clear Discount action elsewhere; no inline Clear here */}
                                        </div>
                                    ) : null}
                                </details>
                            </li>

                            {/* Clear discount */}
                            {p.has_discount_price ? (
                                <li className="px-2">
                                    <FormWithToast
                                        action={clearDiscountAction}
                                        className=""
                                        onSubmitToast="Clearing discount…"
                                        successToast="Discount cleared"
                                        confirmMessage="Clear discount for this product?"
                                    >
                                        <input type="hidden" name="id" value={id} />
                                        <button
                                            type="submit"
                                            className="w-full text-left rounded px-2 py-1 hover:bg-zinc-50 inline-flex items-center gap-1 text-rose-700"
                                        >
                                            <Trash2 className="size-3.5" /> Clear discount
                                        </button>
                                    </FormWithToast>
                                </li>
                            ) : null}

                            {/* Visibility */}
                            <li className="px-2">
                                <div className="text-[11px] text-muted-foreground mb-1 inline-flex items-center gap-1"><Eye className="size-3.5" /> Visibility</div>
                                <div className="flex items-center gap-2">
                                    {p.is_hidden ? (
                                        <FormWithToast action={setVisibilityAction} onSubmitToast="Updating…" successToast="Now visible">
                                            <input type="hidden" name="id" value={id} />
                                            <input type="hidden" name="hidden" value="0" />
                                            <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1" title="Show to customers"><Eye className="size-3.5" /> Show</button>
                                        </FormWithToast>
                                    ) : (
                                        <FormWithToast action={setVisibilityAction} onSubmitToast="Updating…" successToast="Hidden from customers" confirmMessage="Hide this product from customers?">
                                            <input type="hidden" name="id" value={id} />
                                            <input type="hidden" name="hidden" value="1" />
                                            <button type="submit" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 inline-flex items-center gap-1 text-amber-700" title="Hide from customers"><EyeOff className="size-3.5" /> Hide</button>
                                        </FormWithToast>
                                    )}
                                </div>
                            </li>
                        </ul>
                    </ActionsDropdown>
                </td>
            )}
        </tr>
    );
}
