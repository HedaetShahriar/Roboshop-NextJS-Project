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

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

  const client = await clientPromise;
  const db = client.db('roboshop');
  const where = {};
  const status = searchParams?.status;
  if (status) where.status = status;
  const q = (searchParams?.q || '').toString().trim();
  if (q) {
    where.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
      { 'contact.fullName': { $regex: q, $options: 'i' } },
      { 'contact.email': { $regex: q, $options: 'i' } },
      { 'contact.phone': { $regex: q, $options: 'i' } },
    ];
  }
  // Optional date range and sort
  const fromStr = (searchParams?.from || '').toString();
  const toStr = (searchParams?.to || '').toString();
  const created = {};
  const fromDate = fromStr ? new Date(fromStr) : null;
  if (fromDate && !isNaN(fromDate)) created.$gte = fromDate;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate && !isNaN(toDate)) created.$lte = toDate;
  if (Object.keys(created).length) where.createdAt = created;

  const sortKey = (searchParams?.sort || 'newest').toString();
  let sort = { createdAt: -1 };
  if (sortKey === 'oldest') sort = { createdAt: 1 };

  let orders = await db.collection('orders').find(where).sort(sort).limit(200).toArray();

  // Client-side amount sorting if requested
  if (sortKey === 'amount-high' || sortKey === 'amount-low') {
    orders = orders.sort((a, b) => {
      const av = Number(a?.amounts?.total || 0);
      const bv = Number(b?.amounts?.total || 0);
      return sortKey === 'amount-high' ? bv - av : av - bv;
    });
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

  const fmtCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(n || 0));
  const fmtDT = (d) => new Date(d).toLocaleString();
  const statusClass = (s) => (
    s === 'processing' ? 'bg-amber-100 text-amber-800' :
    s === 'packed' ? 'bg-sky-100 text-sky-800' :
    s === 'assigned' ? 'bg-blue-100 text-blue-800' :
    s === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
    s === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
    s === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-zinc-100 text-zinc-800'
  );

  const statuses = ['processing','packed','assigned','shipped','delivered','cancelled'];

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
        <div className="grid gap-3">
          {orders.map((o) => (
            <Card key={o._id.toString()}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">Order #{o.orderNumber}</CardTitle>
                    <CardDescription>{fmtDT(o.createdAt)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${statusClass(o.status)}`}>{o.status}</span>
                    <span className="text-sm font-medium">{fmtCurrency(o?.amounts?.total)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-1 text-sm text-muted-foreground">
                  <div>Customer: <span className="text-foreground">{o.contact?.fullName}</span> ({o.contact?.email})</div>
                  <div>Phone: <span className="text-foreground">{o.contact?.phone}</span></div>
                  {o.shippingAddress && (
                    <div>Ship to: <span className="text-foreground">{o.shippingAddress.address1}{o.shippingAddress.address2 ? `, ${o.shippingAddress.address2}` : ''}, {o.shippingAddress.city}</span></div>
                  )}
                  {o.rider?.name && <div>Rider: <span className="text-foreground">{o.rider.name}</span></div>}
                </div>
                <form action={advance} className="mt-4 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={o._id.toString()} />
                  <select name="action" className="border rounded-md h-9 px-2 text-sm">
                    <option value="pack">Mark packed</option>
                    <option value="assign">Assign rider</option>
                    <option value="ship">Mark shipped</option>
                    <option value="deliver">Mark delivered</option>
                    <option value="revert">Revert to processing</option>
                  </select>
                  <Input name="riderName" placeholder="Rider name (for assign)" className="h-9" />
                  <Button type="submit" size="sm">Apply</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
