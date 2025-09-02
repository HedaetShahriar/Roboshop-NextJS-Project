import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
// per-row update handled via hidden forms rendered by parent; we point to them via form attribute

const currencyFmt = { format: (n) => formatBDT(n) };

export default async function OrdersMobileList({ orders = [] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="sm:hidden rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">
        No orders found.
      </div>
    );
  }
  return (
    <div className="sm:hidden space-y-2 overflow-auto">
      {orders.map((o) => (
        <div key={o._id} className="rounded-md border bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="font-semibold">#{o.orderNumber || o._id.slice(-6)}</div>
            <span className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${badgeCls(o.status)}`}>{o.status}</span>
          </div>
          <div className="mt-2">
            <label className="text-xs inline-flex items-center gap-2"><input form="bulkOrdersForm" type="checkbox" name="ids" value={o._id} /> Select</label>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(o.createdAt)} • {o.itemsCount || 0} items</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-sm font-medium truncate">{o?.contact?.fullName || '—'}</div>
            <div className="ml-auto text-sm tabular-nums">{currencyFmt.format(Number(o?.amounts?.total || 0))}</div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Link href={`/dashboard/seller/orders/${o._id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">View</Link>
            <div className="ml-auto inline-flex items-center gap-1">
              <select name="status" defaultValue={o.status} form={`orderStatus-${o._id}`} className="h-8 rounded border text-xs px-2 bg-white">
                {['processing','packed','assigned','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" form={`orderStatus-${o._id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Update</button>
            </div>
          </div>
        </div>
      ))}
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
