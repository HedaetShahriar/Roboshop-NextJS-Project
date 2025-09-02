import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
// per-row update handled via hidden forms rendered by parent; we point to them via form attribute
import SelectAllOnPage from "../client/SelectAllOnPage";

const currencyFmt = { format: (n) => formatBDT(n) };

export default async function OrdersRows({ orders = [], visibleCols = ['order','customer','status','created','total','actions'] }) {
  const cols = new Set(visibleCols || []);
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
  return (
    <div className="hidden sm:block min-h-0 flex-1 overflow-auto rounded border bg-white">
      <table className="min-w-full table-auto text-xs sm:text-sm">
        <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
          <tr className="text-left">
            <th className="px-1 py-2 text-[11px] text-muted-foreground"><SelectAllOnPage /></th>
            {cols.has('order') && <th className="px-2 py-2 font-medium text-left w-[90px]">Order</th>}
            {cols.has('customer') && <th className="px-3 py-2 font-medium text-left">Customer</th>}
            {cols.has('status') && <th className="px-3 py-2 font-medium text-left">Status</th>}
            {cols.has('created') && <th className="px-3 py-2 font-medium text-left">Created</th>}
            {cols.has('total') && <th className="px-3 py-2 font-medium text-right w-[120px]">Total</th>}
            {cols.has('actions') && <th className="px-2 sm:px-3 py-2 font-medium text-right w-[140px]">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o._id} className="border-t odd:bg-zinc-50/40">
              <td className="px-1 py-2"><input form="bulkOrdersForm" type="checkbox" name="ids" value={o._id} aria-label={`Select order ${o.orderNumber || o._id}`} /></td>
              {cols.has('order') && (
                <td className="px-2 py-2">
                  <div className="font-medium">#{o.orderNumber || o._id.slice(-6)}</div>
                  <div className="text-[11px] text-muted-foreground">{o.itemsCount || 0} items</div>
                </td>
              )}
              {cols.has('customer') && (
                <td className="px-3 py-2">
                  <div className="font-medium truncate max-w-[240px]">{o?.contact?.fullName || '—'}</div>
                  <div className="text-[11px] text-muted-foreground">{o?.contact?.phone || o?.contact?.email || '—'}</div>
                </td>
              )}
              {cols.has('status') && (
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${badgeCls(o.status)}`}>{o.status}</span>
                </td>
              )}
              {cols.has('created') && (
                <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</td>
              )}
              {cols.has('total') && (
                <td className="px-3 py-2 text-right tabular-nums">{currencyFmt.format(Number(o?.amounts?.total || 0))}</td>
              )}
              {cols.has('actions') && (
                <td className="px-2 sm:px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link href={`/dashboard/seller/orders/${o._id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">View</Link>
                    <Link href={`/dashboard/seller/orders/${o._id}/edit`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Edit</Link>
                    <div className="inline-flex items-center gap-1">
                      <select name="status" defaultValue={o.status} form={`orderStatus-${o._id}`} className="h-8 rounded border text-xs px-2 bg-white">
                        {['processing','packed','assigned','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="submit" form={`orderStatus-${o._id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Update</button>
                    </div>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
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
