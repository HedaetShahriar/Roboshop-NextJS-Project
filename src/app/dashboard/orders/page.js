import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

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
  const orders = await db.collection('orders').find(where).sort({ createdAt: -1 }).limit(200).toArray();

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

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Search by order, name, email, phone" className="border rounded px-2 py-1 text-sm min-w-[260px]" />
        <select name="status" defaultValue={status || ''} className="border rounded px-2 py-1 text-sm">
          <option value="">All statuses</option>
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="assigned">Assigned</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Filter</button>
      </form>
      {orders.length === 0 ? (
        <div className="text-gray-600">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id.toString()} className="border rounded bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">Order {o.orderNumber}</div>
                  <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="px-2 py-1 rounded text-sm bg-zinc-100 capitalize">{o.status}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <div>Customer: {o.contact?.fullName} ({o.contact?.email})</div>
                <div>Phone: {o.contact?.phone}</div>
                {o.shippingAddress && (
                  <div>Ship to: {o.shippingAddress.address1}{o.shippingAddress.address2 ? `, ${o.shippingAddress.address2}` : ''}, {o.shippingAddress.city}</div>
                )}
                {o.rider?.name && <div>Rider: {o.rider.name}</div>}
              </div>
              <form action={advance} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={o._id.toString()} />
                <select name="action" className="border rounded px-2 py-1 text-sm">
                  <option value="pack">Mark packed</option>
                  <option value="assign">Assign rider</option>
                  <option value="ship">Mark shipped</option>
                  <option value="deliver">Mark delivered</option>
                  <option value="revert">Revert to processing</option>
                </select>
                <input name="riderName" placeholder="Rider name (for assign)" className="border rounded px-2 py-1 text-sm" />
                <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Apply</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
