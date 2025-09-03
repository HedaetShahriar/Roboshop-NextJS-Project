"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import RowActions from "./RowActions";
import SelectAllOnPage from "./SelectAllOnPage";
import BillingModal from "../client/BillingModal";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const currencyFmt = { format: (n) => formatBDT(n) };

export default function OrdersRowsVirtual({ orders = [], visibleCols = ['order','customer','status','created','total','actions'], density = 'cozy', sortKey = 'newest', query = {}, basePath = '/dashboard/seller/orders' }) {
  const cols = useMemo(() => new Set(visibleCols || []), [visibleCols]);
  const containerRef = useRef(null);
  const rowH = density === 'compact' ? 48 : 56; // approximate, expanded rows may exceed
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    el.addEventListener('scroll', onScroll);
    ro.observe(el);
    setHeight(el.clientHeight);
    return () => { el.removeEventListener('scroll', onScroll); ro.disconnect(); };
  }, []);

  if (!orders || orders.length === 0) {
    return (
      <div className="hidden sm:block rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">No orders found for the current filters.</div>
    );
  }

  const pageTotal = (orders || []).reduce((acc, o) => acc + Number(o?.amounts?.total || 0), 0);
  const pageItems = (orders || []).reduce((acc, o) => acc + Number(o?.itemsCount || (Array.isArray(o?.items) ? o.items.length : 0)), 0);

  const createdSortDir = (sortKey === 'oldest') ? 'ascending' : (sortKey === 'newest' ? 'descending' : 'none');
  const totalSortDir = (sortKey === 'amount-low') ? 'ascending' : (sortKey === 'amount-high' ? 'descending' : 'none');
  const sortHref = (next) => {
    const params = new URLSearchParams({ ...query });
    if (next && next !== 'newest') params.set('sort', next); else params.delete('sort');
    return `${basePath}?${params.toString()}`;
  };

  const total = orders.length;
  const startIdx = Math.max(0, Math.floor(scrollTop / rowH) - 5);
  const visibleCount = Math.ceil(height / rowH) + 10;
  const endIdx = Math.min(total, startIdx + visibleCount);
  const padTop = startIdx * rowH;
  const padBottom = (total - endIdx) * rowH;

  return (
    <div className="hidden sm:flex min-h-0 flex-1 flex-col rounded border bg-white">
      {/* Header */}
      <div className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-[24px,90px,1fr,1fr,1fr,120px,1fr,140px] gap-0 py-2 text-left text-xs sm:text-sm">
          <div className="px-1 text-[11px] text-muted-foreground"><SelectAllOnPage /></div>
          {cols.has('order') && <div className="px-2 font-medium">Order</div>}
          {cols.has('customer') && <div className="px-3 font-medium">Customer</div>}
          {cols.has('payment') && <div className="px-3 font-medium">Payment</div>}
          {cols.has('status') && <div className="px-3 font-medium">Status</div>}
          {cols.has('created') && (
            <div className="px-3 font-medium select-none" aria-sort={createdSortDir}>
              <Link className="inline-flex items-center gap-1 hover:underline" href={sortHref(createdSortDir === 'descending' ? 'oldest' : 'newest')}>
                Created {createdSortDir === 'descending' ? <ArrowDown size={12} /> : createdSortDir === 'ascending' ? <ArrowUp size={12} /> : <ArrowUpDown size={12} />}
              </Link>
            </div>
          )}
          {cols.has('total') && (
            <div className="px-3 font-medium text-right select-none" aria-sort={totalSortDir}>
              <Link className="inline-flex items-center gap-1 hover:underline" href={sortHref(totalSortDir === 'descending' ? 'amount-low' : 'amount-high')}>
                Total {totalSortDir === 'descending' ? <ArrowDown size={12} /> : totalSortDir === 'ascending' ? <ArrowUp size={12} /> : <ArrowUpDown size={12} />}
              </Link>
            </div>
          )}
          {cols.has('billing') && <div className="px-3 font-medium">Billing</div>}
          {cols.has('actions') && <div className="px-2 sm:px-3 font-medium text-right">Actions</div>}
        </div>
      </div>
      {/* Body (virtualized) */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto">
        <div style={{ paddingTop: padTop, paddingBottom: padBottom }}>
          {orders.slice(startIdx, endIdx).map((o, i) => (
            <div key={o._id} className="grid grid-cols-[24px,90px,1fr,1fr,1fr,120px,1fr,140px] items-start border-t odd:bg-zinc-50/40">
              <div className={"px-1 " + (density === 'compact' ? 'py-1.5' : 'py-2')}><input form="bulkOrdersForm" type="checkbox" name="ids" value={o._id} aria-label={`Select order ${o.orderNumber || o._id}`} /></div>
        {cols.has('order') && (
                <div className={"px-2 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
          <div className="font-medium"><Link href={`/dashboard/seller/orders/${o._id}`} className="hover:underline">#{o.orderNumber || o._id.slice(-6)}</Link></div>
                  <div className="text-[11px] text-muted-foreground">{o.itemsCount || 0} items</div>
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <details className="mt-1 group">
                      <summary className="cursor-pointer select-none text-[11px] text-zinc-600 hover:text-zinc-900">View items</summary>
                      <div className="mt-2 rounded border bg-zinc-50 p-2 space-y-1">
                        {o.items.slice(0, 6).map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="truncate flex-1">
                              <span className="font-medium">{it?.name || it?.title || 'Item'}</span>
                              {it?.variant ? <span className="ml-1 text-[11px] text-muted-foreground">({it.variant})</span> : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground">x{it?.qty || it?.quantity || 1}</div>
                            <div className="ml-auto tabular-nums text-xs">{currencyFmt.format(Number(it?.price || it?.unitPrice || 0))}</div>
                          </div>
                        ))}
                        <div className="mt-2 h-px bg-zinc-200" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="tabular-nums">{currencyFmt.format(Number(o?.amounts?.subtotal ?? 0))}</span>
                        </div>
                        {Number(o?.amounts?.discount || 0) > 0 && (
                          <div className="flex items-center justify-between text-xs text-emerald-700">
                            <span>Discount</span>
                            <span className="tabular-nums">- {currencyFmt.format(Number(o?.amounts?.discount || 0))}</span>
                          </div>
                        )}
                        {Number(o?.amounts?.shipping || 0) > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Shipping</span>
                            <span className="tabular-nums">{currencyFmt.format(Number(o?.amounts?.shipping || 0))}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Total</span>
                          <span className="tabular-nums">{currencyFmt.format(Number(o?.amounts?.total || 0))}</span>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              )}
              {cols.has('customer') && (
                <div className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="font-medium truncate max-w-[240px]">{o?.contact?.fullName || '—'}</div>
                  <div className="text-[11px] text-muted-foreground">{o?.contact?.phone || o?.contact?.email || '—'}</div>
                </div>
              )}
              {cols.has('payment') && (
                <div className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="text-xs capitalize">{o?.payment?.method || '—'} {o?.payment?.status ? `• ${o.payment.status}` : ''}</div>
                  {o?.payment?.ref ? <div className="text-[11px] text-muted-foreground truncate">{String(o.payment.ref).slice(-8)}</div> : null}
                </div>
              )}
        {cols.has('status') && (
                <div className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
          <span title={o.status} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${badgeCls(o.status)}`}>{o.status}</span>
                </div>
              )}
              {cols.has('created') && (
                <div className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2') + ' text-xs text-muted-foreground'}>{formatDateTime(o.createdAt)}</div>
              )}
              {cols.has('total') && (
                <div className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2') + ' text-right tabular-nums'}>{currencyFmt.format(Number(o?.amounts?.total || 0))}</div>
              )}
              {cols.has('billing') && (
                <div className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="flex items-center gap-2 max-w-[260px]">
                    {/* <div className="text-xs truncate font-medium flex-1">{o?.billingAddress?.fullName || '—'}</div> */}
                    <div className="inline-flex items-center gap-2 shrink-0">
                      <BillingModal order={o} label="View" />
                    </div>
                  </div>
                </div>
              )}
              {cols.has('actions') && (
                <div className={"px-2 sm:px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2') + ' text-right'}>
                  <RowActions id={o._id} currentStatus={o.status} contact={o.contact} shipping={o.shippingAddress} tracking={o.tracking} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Footer summary */}
      <div className="border-t bg-zinc-50 text-xs px-3 py-2 flex items-center justify-between">
        <div className="text-muted-foreground">Page subtotal · {pageItems} items</div>
        <div className="font-medium tabular-nums">{currencyFmt.format(pageTotal)}</div>
      </div>
    </div>
  );
}

function badgeCls(status) {
  switch (status) {
    case 'processing': return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'packed': return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'assigned': return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'shipped': return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'delivered': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'cancelled': return 'border-rose-200 bg-rose-50 text-rose-700';
    default: return 'border-zinc-200 bg-zinc-50 text-zinc-700';
  }
}
