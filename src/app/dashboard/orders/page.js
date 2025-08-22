import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageSizeSelect from "@/components/dashboard/PageSizeSelect";
import { formatDate } from "@/lib/date";
import AddressModalButton from "@/components/dashboard/AddressModalButton";
import EditAddressModalButton from "@/components/dashboard/EditAddressModalButton";

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

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
    // Apply case-insensitive collation when sorting by strings
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
      // revert to processing
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
      return; // do not allow editing after finalization
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

  const statuses = ['processing','packed','assigned','shipped','delivered','cancelled'];

  const mkQS = (overrides = {}) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (status) sp.set('status', status);
    if (fromStr) sp.set('from', fromStr);
    if (toStr) sp.set('to', toStr);
    if (sortKey) sp.set('sort', sortKey);
    sp.set('pageSize', String(pageSize));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') sp.delete(k);
      else sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : '';
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showingFrom = total === 0 ? 0 : skip + 1;
  const showingTo = Math.min(total, skip + orders.length);

  return (
    <div className="py-4 md:py-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Manage orders</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and update order statuses</p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] max-w-[380px]">
          <Input name="q" defaultValue={q} placeholder="Search order #, customer, email, phone" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Status</label>
          <select name="status" defaultValue={status || ''} className="block border rounded-md h-9 px-3 text-sm">
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" name="from" defaultValue={fromStr} className="h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" name="to" defaultValue={toStr} className="h-9" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Sort</label>
          <select name="sort" defaultValue={sortKey} className="block border rounded-md h-9 px-3 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-high">Amount: high to low</option>
            <option value="amount-low">Amount: low to high</option>
            <option value="status-asc">Status A→Z</option>
            <option value="status-desc">Status Z→A</option>
          </select>
        </div>
        <div className="ml-auto">
          <Button type="submit" size="sm">Apply filters</Button>
        </div>
      </form>

      {/* Quick status tabs */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/orders`}><Button variant={!status ? 'default' : 'outline'} size="sm">All</Button></Link>
        {statuses.map(s => (
          <Link key={s} href={`/dashboard/orders?status=${s}`}>
            <Button variant={status === s ? 'default' : 'outline'} size="sm" className="capitalize">{s}</Button>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-muted-foreground text-sm">No orders found.</div>
      ) : (
        <>
          <div className="overflow-auto rounded border bg-white max-h-[65vh]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Order #</th>
                  <th className="px-3 py-2 font-medium">
                    <Link href={`/dashboard/orders${mkQS({ sort: sortKey === 'oldest' ? 'newest' : 'oldest', page: 1 })}`} className="inline-flex items-center gap-1">
                      Date
                      <span className="text-xs text-muted-foreground">{sortKey === 'oldest' ? '▲' : sortKey === 'newest' ? '▼' : ''}</span>
                    </Link>
                  </th>
                  <th className="px-3 py-2 font-medium">
                    <Link href={`/dashboard/orders${mkQS({ sort: sortKey === 'status-asc' ? 'status-desc' : 'status-asc', page: 1 })}`} className="inline-flex items-center gap-1">
                      Status
                      <span className="text-xs text-muted-foreground">{sortKey?.startsWith('status-') ? (sortKey === 'status-asc' ? '▲' : '▼') : ''}</span>
                    </Link>
                  </th>
                  <th className="px-3 py-2 font-medium">Billing address</th>
                  <th className="px-3 py-2 font-medium">
                    <Link href={`/dashboard/orders${mkQS({ sort: sortKey === 'amount-high' ? 'amount-low' : 'amount-high', page: 1 })}`} className="inline-flex items-center gap-1">
                      Total
                      <span className="text-xs text-muted-foreground">{sortKey?.startsWith('amount-') ? (sortKey === 'amount-high' ? '▼' : '▲') : ''}</span>
                    </Link>
                  </th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id.toString()} className="border-t">
                    <td className="px-3 py-2 font-medium">#{o.orderNumber}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDT(o.createdAt)}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs capitalize ${statusClass(o.status)}`}>{o.status}</span></td>
                    <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
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
                    <td className="px-3 py-2">{fmtCurrency(o?.amounts?.total)}</td>
                    <td className="px-3 py-2">
                      <form action={advance} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={o._id.toString()} />
                        <select name="action" className="border rounded-md h-9 px-2 text-xs">
                          <option value="pack">Mark packed</option>
                          <option value="assign">Assign rider</option>
                          <option value="ship">Mark shipped</option>
                          <option value="deliver">Mark delivered</option>
                          <option value="revert">Revert</option>
                        </select>
                        <Input name="riderName" placeholder="Rider" className="h-9 w-[120px]" />
                        <Button type="submit" size="sm">Apply</Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total}</div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows:</span>
        <PageSizeSelect value={pageSize} />
              <Link href={`/dashboard/orders${mkQS({ page: Math.max(1, page - 1) })}`} className={`px-3 py-1 rounded border text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Prev</Link>
              <div className="text-sm">Page {page} / {totalPages}</div>
              <Link href={`/dashboard/orders${mkQS({ page: Math.min(totalPages, page + 1) })}`} className={`px-3 py-1 rounded border text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-zinc-50'}`}>Next</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
