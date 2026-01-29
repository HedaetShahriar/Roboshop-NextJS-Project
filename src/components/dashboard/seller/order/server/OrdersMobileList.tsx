import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
// per-row update handled via hidden forms rendered by parent; we point to them via form attribute
import RowActions from "../client/RowActions";
import OrderItemsModal from "../client/OrderItemsModal";
import BillingModal from "../client/BillingModal";
import type { Order } from "@/types";

const currencyFmt = { format: (n: number) => formatBDT(n) };

interface OrdersMobileListProps {
  orders?: Order[];
  density?: 'cozy' | 'compact';
  readOnly?: boolean;
  basePath?: string;
}

export default async function OrdersMobileList({ 
  orders = [], 
  density = 'cozy', 
  readOnly = false, 
  basePath = '/dashboard/seller/orders' 
}: OrdersMobileListProps): Promise<React.ReactElement> {
  if (!orders || orders.length === 0) {
    return (
      <div className="sm:hidden rounded-md border bg-white p-6 text-center text-sm text-muted-foreground">
        No orders found.
      </div>
    );
  }
  return (
    <div className="sm:hidden space-y-2 overflow-auto">
      {orders.map((o) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order = o as any;
        return (
          <div key={order._id} className={"rounded-md border bg-white " + (density === 'compact' ? 'p-2.5' : 'p-3')}>
            <div className="flex items-center gap-2">
              <div className="font-semibold">#{order.orderNumber || order._id.slice(-6)}</div>
              <span className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${badgeCls(order.status)}`}>{order.status}</span>
            </div>
            {!readOnly && (
              <div className="mt-2">
                <label className="text-xs inline-flex items-center gap-2"><input form="bulkOrdersForm" type="checkbox" name="ids" value={order._id} /> Select</label>
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.createdAt)} • {order.itemsCount || 0} items</div>
            <div className={"mt-2 flex items-center gap-2 " + (density === 'compact' ? 'text-[13px]' : '')}>
              <div className="text-sm font-medium truncate">{order?.contact?.fullName || '—'}</div>
              <div className="ml-auto text-sm tabular-nums">{currencyFmt.format(Number(order?.amounts?.total || 0))}</div>
            </div>
            {/* Billing quick access */}
            <div className="mt-1">
              <BillingModal order={order} />
            </div>
            {/* View items modal trigger */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <div className="mt-1"><OrderItemsModal order={order} /></div>
            )}
            <div className="mt-1 text-[11px] text-muted-foreground">
              <span className="capitalize">{order?.payment?.method || '—'}</span>
              {order?.payment?.status ? <span> • {order.payment.status}</span> : null}
              {order?.payment?.ref ? <span> • ref {String(order.payment.ref).slice(-8)}</span> : null}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {order?.shippingAddress?.city || '—'}{order?.shippingAddress?.area ? <span> • {order.shippingAddress.area}</span> : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Link href={`${basePath}/${order._id}`} className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50">View</Link>
              {!readOnly && (
                <div className="ml-auto">
                  <RowActions id={order._id} currentStatus={order.status} contact={order.contact} shipping={order.shippingAddress} tracking={order.tracking} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function badgeCls(status?: string): string {
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
