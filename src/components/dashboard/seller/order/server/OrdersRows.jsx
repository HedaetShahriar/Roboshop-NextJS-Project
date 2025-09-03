import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
// per-row update handled via hidden forms rendered by parent; we point to them via form attribute
import RowActions from "../client/RowActions";
import OrderItemsModal from "../client/OrderItemsModal";
import BillingModal from "../client/BillingModal";
import SelectAllOnPage from "../client/SelectAllOnPage";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const currencyFmt = { format: (n) => formatBDT(n) };

export default async function OrdersRows({ orders = [], visibleCols = ['order','customer','status','created','total','actions'], density = 'cozy', sortKey = 'newest', query = {}, basePath = '/dashboard/seller/orders', tableHeight = 560 }) {
  const cols = new Set(visibleCols || []);
  const pageTotal = (orders || []).reduce((acc, o) => acc + Number(o?.amounts?.total || 0), 0);
  const pageItems = (orders || []).reduce((acc, o) => acc + Number(o?.itemsCount || (Array.isArray(o?.items) ? o.items.length : 0)), 0);
  const allColKeys = ['order','customer','payment','status','created','total','billing','actions'];
  const colCount = 1 + allColKeys.reduce((n, k) => n + (cols.has(k) ? 1 : 0), 0); // 1 for checkbox column

  const createdSortDir = (sortKey === 'oldest') ? 'ascending' : (sortKey === 'newest' ? 'descending' : 'none');
  const totalSortDir = (sortKey === 'amount-low') ? 'ascending' : (sortKey === 'amount-high' ? 'descending' : 'none');

  const sortHref = (next) => {
    const params = new URLSearchParams({ ...query });
    if (next && next !== 'newest') params.set('sort', next); else params.delete('sort');
    return `${basePath}?${params.toString()}`;
  };
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">
        <div>No orders found for the current filters.</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Link href="/dashboard/seller/orders" replace className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Reset filters</Link>
        </div>
      </div>
    );
  }
  const heightStyle = { height: typeof tableHeight === 'number' ? `${tableHeight}px` : tableHeight };
  return (
    <div className="hidden sm:block overflow-auto rounded border bg-white" style={heightStyle}>
      <table className={"min-w-full table-auto " + (density === 'compact' ? 'text-[12px]' : 'text-xs sm:text-sm')} data-orders-table>
        <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
          <tr className="text-left">
            <th className="px-1 py-2 text-[11px] text-muted-foreground"><SelectAllOnPage /></th>
            {cols.has('order') && <th className="px-2 py-2 font-medium text-left w-[90px]">Order</th>}
            {cols.has('customer') && <th className="px-3 py-2 font-medium text-left">Customer</th>}
            {cols.has('payment') && <th className="px-3 py-2 font-medium text-left">Payment</th>}
            {cols.has('status') && <th className="px-3 py-2 font-medium text-left">Status</th>}
            {cols.has('created') && (
              <th className="px-3 py-2 font-medium text-left select-none" aria-sort={createdSortDir}>
                <Link className="inline-flex items-center gap-1 hover:underline" href={sortHref(createdSortDir === 'descending' ? 'oldest' : 'newest')}>
                  Created {createdSortDir === 'descending' ? <ArrowDown size={12} /> : createdSortDir === 'ascending' ? <ArrowUp size={12} /> : <ArrowUpDown size={12} />}
                </Link>
              </th>
            )}
            {cols.has('total') && (
              <th className="px-3 py-2 font-medium text-right w-[120px] select-none" aria-sort={totalSortDir}>
                <Link className="inline-flex items-center gap-1 hover:underline" href={sortHref(totalSortDir === 'descending' ? 'amount-low' : 'amount-high')}>
                  Total {totalSortDir === 'descending' ? <ArrowDown size={12} /> : totalSortDir === 'ascending' ? <ArrowUp size={12} /> : <ArrowUpDown size={12} />}
                </Link>
              </th>
            )}
            {cols.has('billing') && <th className="px-3 py-2 font-medium text-left">Billing</th>}
            {cols.has('actions') && <th className="px-2 sm:px-3 py-2 font-medium text-right w-[140px]">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o._id} className={(density === 'compact' ? 'border-t odd:bg-zinc-50/40' : 'border-t odd:bg-zinc-50/40') + ''} data-row-idx={i}>
              <td className={"px-1 " + (density === 'compact' ? 'py-1.5' : 'py-2')}><input form="bulkOrdersForm" type="checkbox" name="ids" value={o._id} aria-label={`Select order ${o.orderNumber || o._id}`} /></td>
              {cols.has('order') && (
                <td className={"px-2 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="font-medium">
                    <Link href={`/dashboard/seller/orders/${o._id}`} className="hover:underline">#{o.orderNumber || o._id.slice(-6)}</Link>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{o.itemsCount || 0} items{Array.isArray(o.items) && o.items.length ? <> · <OrderItemsModal order={o} /></> : null}</div>
                </td>
              )}
              {cols.has('customer') && (
                <td className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="font-medium truncate max-w-[240px]">{o?.contact?.fullName || '—'}</div>
                  <div className="text-[11px] text-muted-foreground">{o?.contact?.phone || o?.contact?.email || '—'}</div>
                </td>
              )}
              {cols.has('payment') && (
                <td className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="text-xs capitalize">{o?.payment?.method || '—'} {o?.payment?.status ? `• ${o.payment.status}` : ''}</div>
                  {o?.payment?.ref ? <div className="text-[11px] text-muted-foreground truncate">{String(o.payment.ref).slice(-8)}</div> : null}
                </td>
              )}
              {cols.has('status') && (
                <td className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <span title={o.status} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${badgeCls(o.status)}`}>{o.status}</span>
                </td>
              )}
              {cols.has('created') && (
                <td className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2') + ' text-xs text-muted-foreground'}>{formatDateTime(o.createdAt)}</td>
              )}
              {cols.has('total') && (
                <td className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2') + ' text-right'}>
                  <div className="tabular-nums">{currencyFmt.format(Number(o?.amounts?.total || 0))}</div>
                  {(() => {
                    const hasDisc = typeof o?.amounts?.discount === 'number' ? o.amounts.discount > 0 : Boolean(o?.amounts?.discount?.amount || o?.amounts?.discount?.value);
                    const hasShip = Number(o?.amounts?.shipping || 0) > 0;
                    if (!hasDisc && !hasShip) return null;
                    return (
                      <div className="mt-0.5 flex justify-end gap-1">
                        {hasDisc ? <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px]">Disc</span> : null}
                        {hasShip ? <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px]">Ship</span> : null}
                      </div>
                    );
                  })()}
                </td>
              )}
              {cols.has('billing') && (
                <td className={"px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2')}>
                  <div className="flex items-center gap-2 max-w-[260px]">
                    {/* <div className="text-xs truncate font-medium flex-1">{o?.billingAddress?.fullName || '—'}</div> */}
                    <div className="inline-flex items-center gap-2 shrink-0">
                      <BillingModal order={o} label="View" />
                    </div>
                  </div>
                </td>
              )}
              {cols.has('actions') && (
                <td className={"px-2 sm:px-3 " + (density === 'compact' ? 'py-1.5' : 'py-2') + ' text-right'}>
                  <RowActions id={o._id} currentStatus={o.status} contact={o.contact} shipping={o.shippingAddress} tracking={o.tracking} shippingFee={o?.amounts?.shipping} discount={o?.amounts?.discount} />
                </td>
              )}
            </tr>
          ))}
          {/* Spacer row to prevent the sticky footer from overlapping the last data row */}
          <tr aria-hidden="true">
            <td className="p-0" colSpan={colCount}>
              <div className="h-9" />
            </td>
          </tr>
        </tbody>
        {orders.length > 0 ? (
          <tfoot className="sticky bottom-0 z-[2] bg-zinc-50 text-xs shadow-[inset_0_1px_0_0_rgba(0,0,0,0.06)]">
            <tr>
              {/* checkbox + order + customer span to align right totals */}
              <td className="px-1 py-2" />
              {cols.has('order') && <td className="px-2 py-2 text-muted-foreground">Page subtotal</td>}
              {cols.has('customer') && <td className="px-3 py-2 text-muted-foreground">{pageItems} items</td>}
              {cols.has('payment') && <td className="px-3 py-2" />}
              {cols.has('status') && <td className="px-3 py-2" />}
              {cols.has('created') && <td className="px-3 py-2" />}
              {cols.has('total') && <td className="px-3 py-2 text-right font-medium tabular-nums">{currencyFmt.format(pageTotal)}</td>}
              {cols.has('billing') && <td className="px-3 py-2" />}
              {cols.has('actions') && <td className="px-3 py-2" />}
            </tr>
          </tfoot>
        ) : null}
      </table>
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
