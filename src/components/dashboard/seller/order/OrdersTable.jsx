import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { getOrdersAndTotal } from "@/lib/ordersService";
import getDb from "@/lib/mongodb";
import AddressModalButton from "./AddressModalButton";
import EditAddressModalButton from "./EditAddressModalButton";
import PageSizeSelect from "../../shared/PageSizeSelect";

// Reuse formatters and style maps
const currencyFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const STATUS_CLASS = {
  processing: "bg-amber-100 text-amber-800",
  packed: "bg-sky-100 text-sky-800",
  assigned: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default async function OrdersTable(props) {
  // Accept both prop shapes for robustness
  const sp = props?.sp ?? props?.params ?? {};
  // Fetch data via service layer
  const { orders, total, page, pageSize } = await getOrdersAndTotal(sp);
  // Extract current filters for link building
  const status = sp?.status;
  // Accept both 'q' and 'search' params; prefer 'search'
  const q = (sp?.search || sp?.q || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  const skip = (page - 1) * pageSize;

  async function advance(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id');
    const action = formData.get('action');
    const riderName = formData.get('riderName');
    const db = await getDb();
    const _id = new ObjectId(id);
    const order = await db.collection('orders').findOne({ _id });
    if (!order) return;
    const now = new Date();
    const push = [];
    const set = { updatedAt: now };

    const pushEvent = (code, label) => push.push({ code, label, at: now });

    if (action === 'pack' && order.status === 'processing') {
      set.status = 'packed';
      pushEvent('packed', 'Order packed');
    } else if (action === 'assign' && ['packed', 'processing'].includes(order.status)) {
      set.status = 'assigned';
      if (riderName) set.rider = { name: riderName.toString() };
      pushEvent('rider-assigned', riderName ? `Rider assigned: ${riderName}` : 'Rider assigned');
    } else if (action === 'ship' && ['assigned', 'packed'].includes(order.status)) {
      set.status = 'shipped';
      pushEvent('shipped', 'Shipped');
    } else if (action === 'deliver' && order.status === 'shipped') {
      set.status = 'delivered';
      pushEvent('delivered', 'Delivered');
    } else if (action === 'revert' && order.status !== 'delivered' && order.status !== 'cancelled') {
      set.status = 'processing';
      pushEvent('reverted', 'Reverted to processing');
    } else {
      return;
    }

    const update = { $set: set };
    if (push.length) update.$push = { history: { $each: push } };
    await db.collection('orders').updateOne({ _id }, update);
    revalidatePath('/dashboard/seller/orders');
  }

  async function updateBillingAddress(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id')?.toString();
    if (!id) return;
    const db = await getDb();
    let _id;
    try {
      _id = new ObjectId(id);
    } catch {
      return;
    }
    const order = await db.collection('orders').findOne({ _id });
    if (!order) return;
    if (['delivered', 'cancelled'].includes(order.status)) {
      return;
    }
    const now = new Date();
    const keys = ['fullName', 'email', 'phone', 'address1', 'address2', 'city', 'state', 'postalCode', 'country'];
    const billingAddress = {};
    for (const k of keys) {
      const v = formData.get(k);
      if (v !== null && v !== undefined) billingAddress[k] = String(v);
    }
    const update = {
      $set: { billingAddress, updatedAt: now },
      $push: { history: { code: 'billing-updated', label: 'Billing address updated', at: now } },
    };
    await db.collection('orders').updateOne({ _id }, update);
    revalidatePath('/dashboard/seller/orders');
  }

  const fmtCurrency = (n) => currencyFmt.format(Number(n || 0));
  const fmtDT = (d) => formatDate(d, 'datetime');
  const statusClass = (s) => STATUS_CLASS[s] || 'bg-zinc-100 text-zinc-800';

  const mkQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set('search', q);
    if (status) usp.set('status', status);
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
  const showingTo = Math.min(total, skip + orders.length);

  return (
    <>
      {/* Mobile cards view */}
      <div className="sm:hidden space-y-2">
        {orders.map((o) => {
          const id = o._id.toString();
          const billingAddr = o.billingAddress || {
            fullName: o.contact?.fullName,
            email: o.contact?.email,
            phone: o.contact?.phone,
            ...o.shippingAddress,
          };
          return (
          <div key={id} className="rounded-md border bg-white p-3 shadow-sm">
            {/* Header: Order number + status */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">#{o.orderNumber}</div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] capitalize shrink-0 ${statusClass(o.status)}`}>{o.status}</span>
            </div>

            {/* Meta: Date and Total */}
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground truncate">{fmtDT(o.createdAt)}</div>
              <div className="text-sm font-semibold">{fmtCurrency(o?.amounts?.total)}</div>
            </div>

            {/* Rider badge if present */}
            {o?.rider?.name && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] text-zinc-700 bg-zinc-50">
                  Rider: <span className="ml-1 font-medium">{o.rider.name}</span>
                </span>
              </div>
            )}

            {/* Address actions */}
            <div className="mt-2 flex flex-wrap gap-2">
              <AddressModalButton address={billingAddr} />
              <EditAddressModalButton
                orderId={id}
                initialAddress={billingAddr}
                action={updateBillingAddress}
                label="Edit"
                disabled={['delivered', 'cancelled'].includes(o.status)}
              />
            </div>

            {/* Quick actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Pack */}
              {o.status === 'processing' && (
                <form action={advance}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="action" value="pack" />
                  <Button type="submit" size="sm" variant="outline">Pack</Button>
                </form>
              )}

              {/* Assign rider */}
              {(['processing', 'packed'].includes(o.status)) && (
                <form action={advance} className="flex items-center gap-2 w-full">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="action" value="assign" />
                  <Input name="riderName" placeholder="Rider name" className="h-9 flex-1" />
                  <Button type="submit" size="sm" className="shrink-0">Assign</Button>
                </form>
              )}

              {/* Ship */}
              {(['assigned', 'packed'].includes(o.status)) && (
                <form action={advance}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="action" value="ship" />
                  <Button type="submit" size="sm" variant="outline">Ship</Button>
                </form>
              )}

              {/* Deliver */}
              {o.status === 'shipped' && (
                <form action={advance}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="action" value="deliver" />
                  <Button type="submit" size="sm" variant="outline">Deliver</Button>
                </form>
              )}

              {/* Revert */}
              {(!['delivered', 'cancelled'].includes(o.status)) && (
                <form action={advance}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="action" value="revert" />
                  <Button type="submit" size="sm" variant="ghost">Revert</Button>
                </form>
              )}
            </div>
          </div>
        );})}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-auto rounded border bg-white max-h-[65vh]">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
            <tr className="text-left">
              <th className="px-2 sm:px-3 py-2 font-medium">Order #</th>
              <th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/orders${mkQS({ sort: sortKey === 'oldest' ? 'newest' : 'oldest', page: 1 })}`} className="inline-flex items-center gap-1">
                  Date
                  <span className="text-xs text-muted-foreground">{sortKey === 'oldest' ? '▲' : sortKey === 'newest' ? '▼' : ''}</span>
                </Link>
              </th>
              <th className="px-2 sm:px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/orders${mkQS({ sort: sortKey === 'status-asc' ? 'status-desc' : 'status-asc', page: 1 })}`} className="inline-flex items-center gap-1">
                  Status
                  <span className="text-xs text-muted-foreground">{sortKey?.startsWith('status-') ? (sortKey === 'status-asc' ? '▲' : '▼') : ''}</span>
                </Link>
              </th>
              <th className="px-2 sm:px-3 py-2 font-medium">Billing address</th>
              <th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/seller/orders${mkQS({ sort: sortKey === 'amount-high' ? 'amount-low' : 'amount-high', page: 1 })}`} className="inline-flex items-center gap-1">
                  Total
                  <span className="text-xs text-muted-foreground">{sortKey?.startsWith('amount-') ? (sortKey === 'amount-high' ? '▼' : '▲') : ''}</span>
                </Link>
              </th>
              <th className="px-2 sm:px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const id = o._id.toString();
              const billingAddr = o.billingAddress || {
                fullName: o.contact?.fullName,
                email: o.contact?.email,
                phone: o.contact?.phone,
                ...o.shippingAddress,
              };
              return (
              <tr key={id} className="border-t">
                <td className="px-2 sm:px-3 py-2 font-medium">#{o.orderNumber}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDT(o.createdAt)}</td>
                <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs capitalize ${statusClass(o.status)}`}>{o.status}</span></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AddressModalButton address={billingAddr} />
                    <EditAddressModalButton
                      orderId={id}
                      initialAddress={billingAddr}
                      action={updateBillingAddress}
                      label="Edit"
                      disabled={['delivered', 'cancelled'].includes(o.status)}
                    />
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2">{fmtCurrency(o?.amounts?.total)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {o?.rider?.name && (
                      <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-zinc-700 bg-zinc-50">
                        Rider: <span className="ml-1 font-medium">{o.rider.name}</span>
                      </span>
                    )}
                    <form action={advance} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={id} />
                      <select name="action" className="border rounded-md h-9 px-2 text-xs w-full sm:w-auto">
                        <option value="pack">Mark packed</option>
                        <option value="assign">Assign rider</option>
                        <option value="ship">Mark shipped</option>
                        <option value="deliver">Mark delivered</option>
                        <option value="revert">Revert</option>
                      </select>
                      <Input name="riderName" placeholder="Rider" className="h-9 w-full sm:w-[120px]" />
                      <Button type="submit" size="sm" className="w-full sm:w-auto">Apply</Button>
                    </form>
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="text-xs sm:text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm">Rows:</span>
          <PageSizeSelect value={pageSize} />
          <Link href={`/dashboard/seller/orders${mkQS({ page: Math.max(1, page - 1) })}`} className={`px-3 py-1 rounded border text-xs sm:text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Prev</Link>
          <div className="text-xs sm:text-sm">Page {page} / {totalPages}</div>
          <Link href={`/dashboard/seller/orders${mkQS({ page: Math.min(totalPages, page + 1) })}`} className={`px-3 py-1 rounded border text-xs sm:text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Next</Link>
        </div>
      </div>
    </>
  );
}
