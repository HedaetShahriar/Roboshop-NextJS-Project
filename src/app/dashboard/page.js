import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

export default async function SellerDashboardHome() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

  // If not seller, redirect to role-specific index
  if (role === 'rider') return redirect('/dashboard/rider');
  if (role === 'admin') return redirect('/dashboard/admin');

  const client = await clientPromise;
  const db = client.db('roboshop');
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [processing, inTransit, delivered, cancelled, openIssues, revenueAgg, revenueTodayAgg, ordersToday] = await Promise.all([
    db.collection('orders').countDocuments({ status: 'processing' }),
    db.collection('orders').countDocuments({ status: { $in: ['packed','assigned','shipped'] } }),
    db.collection('orders').countDocuments({ status: 'delivered' }),
    db.collection('orders').countDocuments({ status: 'cancelled' }),
    db.collection('order_issues').countDocuments({ status: { $in: ['open','in_progress'] } }),
    db.collection('orders').aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$amounts.total' } } } },
    ]).toArray(),
    db.collection('orders').aggregate([
      { $match: { status: 'delivered', updatedAt: { $gte: dayAgo } } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$amounts.total' } } } },
    ]).toArray(),
    db.collection('orders').countDocuments({ createdAt: { $gte: dayAgo } }),
  ]);

  const totalRevenue = Number(revenueAgg?.[0]?.total || 0);
  const revenueToday = Number(revenueTodayAgg?.[0]?.total || 0);

  const cards = [
    { label: 'Processing', value: processing },
    { label: 'In transit', value: inTransit },
    { label: 'Delivered', value: delivered },
    { label: 'Cancelled', value: cancelled },
    { label: 'Open issues', value: openIssues },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded border bg-white p-4">
            <div className="text-sm text-gray-600">{c.label}</div>
            <div className="text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Total revenue</div>
          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Revenue (24h)</div>
          <div className="text-2xl font-bold">${revenueToday.toFixed(2)}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">New orders (24h)</div>
          <div className="text-2xl font-bold">{ordersToday}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        <div className="flex flex-wrap gap-2">
          <a href="/dashboard/orders?status=processing" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Processing</a>
          <a href="/dashboard/orders?status=packed" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Packed</a>
          <a href="/dashboard/orders?status=assigned" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Assigned</a>
          <a href="/dashboard/orders?status=shipped" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Shipped</a>
          <a href="/dashboard/orders?status=delivered" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Delivered</a>
          <a href="/dashboard/orders?status=cancelled" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Cancelled</a>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/dashboard/orders" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Manage orders</a>
          <a href="/dashboard/issues" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Order issues</a>
          <a href="/dashboard/add-product" className="inline-flex items-center rounded border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Add product</a>
        </div>
      </div>
    </div>
  );
}
