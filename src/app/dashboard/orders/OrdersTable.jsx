import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageSizeSelect from "@/components/dashboard/PageSizeSelect";
import { formatDate } from "@/lib/date";
import AddressModalButton from "@/components/dashboard/AddressModalButton";
import EditAddressModalButton from "@/components/dashboard/EditAddressModalButton";

export default async function OrdersTable({ sp }) {
  const client = await clientPromise;
  const db = client.db('roboshop');

  const where = {};
  const status = sp?.status;
  if (status) where.status = status;

  const q = (sp?.q || '').toString().trim();
  if (q) {
    where.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
      { 'contact.fullName': { $regex: q, $options: 'i' } },
      { 'contact.email': { $regex: q, $options: 'i' } },
      { 'contact.phone': { $regex: q, $options: 'i' } },
    ];
  }

  // Optional date range and sort
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const created = {};
  const fromDate = fromStr ? new Date(fromStr) : null;
  if (fromDate && !isNaN(fromDate)) created.$gte = fromDate;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate && !isNaN(toDate)) created.$lte = toDate;
  if (Object.keys(created).length) where.createdAt = created;

  const sortKey = (sp?.sort || 'newest').toString();
  let sort = { createdAt: -1 };
  if (sortKey === 'oldest') sort = { createdAt: 1 };
  if (sortKey === 'status-asc') sort = { status: 1, createdAt: -1 };
  if (sortKey === 'status-desc') sort = { status: -1, createdAt: -1 };

  // Pagination
  const page = Math.max(1, Number((sp?.page || '1')));
  const rawSize = Number((sp?.pageSize || '20'));
  const pageSize = Math.min(100, Math.max(10, isNaN(rawSize) ? 20 : rawSize));
  const skip = (page - 1) * pageSize;

  const total = await db.collection('orders').countDocuments(where);

  // Fetch orders with server-side sorting and pagination
  let orders;
  if (sortKey === 'amount-high' || sortKey === 'amount-low') {
    const dir = sortKey === 'amount-high' ? -1 : 1;
    orders = await db.collection('orders').aggregate([
      { $match: where },
      { $addFields: { amountValue: { $toDouble: '$amounts.total' } } },
      { $sort: { amountValue: dir, createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();
  } else {
    const cursor = db.collection('orders')
      .find(where)
      .sort(sort)
      .skip(skip)
      .limit(pageSize);
    if (sortKey.startsWith('status')) {
      cursor.collation({ locale: 'en', strength: 2 });
    }
    orders = await cursor.toArray();
  }

  async function advance(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id');
    const action = formData.get('action');
    const riderName = formData.get('riderName');
    const client = await clientPromise;
    const db = client.db('roboshop');
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
    } else if (action === 'assign' && ['packed','processing'].includes(order.status)) {
      set.status = 'assigned';
      if (riderName) set.rider = { name: riderName.toString() };
      pushEvent('rider-assigned', riderName ? `Rider assigned: ${riderName}` : 'Rider assigned');
    } else if (action === 'ship' && ['assigned','packed'].includes(order.status)) {
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
    revalidatePath('/dashboard/orders');
  }

  async function updateBillingAddress(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id')?.toString();
    if (!id) return;
    const client = await clientPromise;
    const db = client.db('roboshop');
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
    const keys = ['fullName','email','phone','address1','address2','city','state','postalCode','country'];
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
    revalidatePath('/dashboard/orders');
  }

  const fmtCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(n || 0));
  const fmtDT = (d) => formatDate(d, 'datetime');
  const statusClass = (s) => (
    s === 'processing' ? 'bg-amber-100 text-amber-800' :
    s === 'packed' ? 'bg-sky-100 text-sky-800' :
    s === 'assigned' ? 'bg-blue-100 text-blue-800' :
    s === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
    s === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
    s === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-zinc-100 text-zinc-800'
  );

  const mkQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
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
        {orders.map((o) => (
          <div key={o._id.toString()} className="rounded-md border bg-white p-3 shadow-sm">
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
              <AddressModalButton address={o.billingAddress || {
                fullName: o.contact?.fullName,
                email: o.contact?.email,
                phone: o.contact?.phone,
                ...o.shippingAddress,
              }} />
              <EditAddressModalButton
                orderId={o._id.toString()}
                initialAddress={o.billingAddress || {
                  fullName: o.contact?.fullName,
                  email: o.contact?.email,
                  phone: o.contact?.phone,
                  ...o.shippingAddress,
                }}
                action={updateBillingAddress}
                label="Edit"
                disabled={['delivered','cancelled'].includes(o.status)}
              />
            </div>

            {/* Quick actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Pack */}
              {o.status === 'processing' && (
                <form action={advance}>
                  <input type="hidden" name="id" value={o._id.toString()} />
                  <input type="hidden" name="action" value="pack" />
                  <Button type="submit" size="sm" variant="outline">Pack</Button>
                </form>
              )}

              {/* Assign rider */}
              {(['processing','packed'].includes(o.status)) && (
                <form action={advance} className="flex items-center gap-2 w-full">
                  <input type="hidden" name="id" value={o._id.toString()} />
                  <input type="hidden" name="action" value="assign" />
                  <Input name="riderName" placeholder="Rider name" className="h-9 flex-1" />
                  <Button type="submit" size="sm" className="shrink-0">Assign</Button>
                </form>
              )}

              {/* Ship */}
              {(['assigned','packed'].includes(o.status)) && (
                <form action={advance}>
                  <input type="hidden" name="id" value={o._id.toString()} />
                  <input type="hidden" name="action" value="ship" />
                  <Button type="submit" size="sm" variant="outline">Ship</Button>
                </form>
              )}

              {/* Deliver */}
              {o.status === 'shipped' && (
                <form action={advance}>
                  <input type="hidden" name="id" value={o._id.toString()} />
                  <input type="hidden" name="action" value="deliver" />
                  <Button type="submit" size="sm" variant="outline">Deliver</Button>
                </form>
              )}

              {/* Revert */}
              {(!['delivered','cancelled'].includes(o.status)) && (
                <form action={advance}>
                  <input type="hidden" name="id" value={o._id.toString()} />
                  <input type="hidden" name="action" value="revert" />
                  <Button type="submit" size="sm" variant="ghost">Revert</Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-auto rounded border bg-white max-h-[65vh]">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
            <tr className="text-left">
              <th className="px-2 sm:px-3 py-2 font-medium">Order #</th>
              <th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/orders${mkQS({ sort: sortKey === 'oldest' ? 'newest' : 'oldest', page: 1 })}`} className="inline-flex items-center gap-1">
                  Date
                  <span className="text-xs text-muted-foreground">{sortKey === 'oldest' ? '▲' : sortKey === 'newest' ? '▼' : ''}</span>
                </Link>
              </th>
              <th className="px-2 sm:px-3 py-2 font-medium">
                <Link href={`/dashboard/orders${mkQS({ sort: sortKey === 'status-asc' ? 'status-desc' : 'status-asc', page: 1 })}`} className="inline-flex items-center gap-1">
                  Status
                  <span className="text-xs text-muted-foreground">{sortKey?.startsWith('status-') ? (sortKey === 'status-asc' ? '▲' : '▼') : ''}</span>
                </Link>
              </th>
              <th className="px-2 sm:px-3 py-2 font-medium">Billing address</th>
              <th className="px-3 py-2 font-medium">
                <Link href={`/dashboard/orders${mkQS({ sort: sortKey === 'amount-high' ? 'amount-low' : 'amount-high', page: 1 })}`} className="inline-flex items-center gap-1">
                  Total
                  <span className="text-xs text-muted-foreground">{sortKey?.startsWith('amount-') ? (sortKey === 'amount-high' ? '▼' : '▲') : ''}</span>
                </Link>
              </th>
              <th className="px-2 sm:px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id.toString()} className="border-t">
                <td className="px-2 sm:px-3 py-2 font-medium">#{o.orderNumber}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDT(o.createdAt)}</td>
                <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs capitalize ${statusClass(o.status)}`}>{o.status}</span></td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AddressModalButton address={o.billingAddress || {
                      fullName: o.contact?.fullName,
                      email: o.contact?.email,
                      phone: o.contact?.phone,
                      ...o.shippingAddress,
                    }} />
                    <EditAddressModalButton
                      orderId={o._id.toString()}
                      initialAddress={o.billingAddress || {
                        fullName: o.contact?.fullName,
                        email: o.contact?.email,
                        phone: o.contact?.phone,
                        ...o.shippingAddress,
                      }}
                      action={updateBillingAddress}
                      label="Edit"
                      disabled={['delivered','cancelled'].includes(o.status)}
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
                      <input type="hidden" name="id" value={o._id.toString()} />
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="text-xs sm:text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm">Rows:</span>
          <PageSizeSelect value={pageSize} />
          <Link href={`/dashboard/orders${mkQS({ page: Math.max(1, page - 1) })}`} className={`px-3 py-1 rounded border text-xs sm:text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Prev</Link>
          <div className="text-xs sm:text-sm">Page {page} / {totalPages}</div>
          <Link href={`/dashboard/orders${mkQS({ page: Math.min(totalPages, page + 1) })}`} className={`px-3 py-1 rounded border text-xs sm:text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Next</Link>
        </div>
      </div>
    </>
  );
}
