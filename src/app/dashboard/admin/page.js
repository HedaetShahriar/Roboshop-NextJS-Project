import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();

  // Fetch key metrics in parallel (fast aggregates)
  const [ordersCount, usersCount, productsCount, openIssues] = await Promise.all([
    db.collection('orders').countDocuments({}),
    db.collection('users').countDocuments({}),
    db.collection('products').countDocuments({}),
    db.collection('order_issues').countDocuments({ status: { $ne: 'resolved' } })
  ]);

  async function RecentOrders() {
    const orders = await db
      .collection('orders')
      .find({}, { projection: { number: 1, total: 1, status: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    return (
      <ul className="divide-y">
        {orders.map(o => (
          <li key={o._id.toString()} className="py-2 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">#{o.number}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">৳{Number(o.total || 0).toLocaleString('bn-BD')}</div>
              <span className="text-xs capitalize text-muted-foreground">{o.status}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  async function RecentUsers() {
    const users = await db
      .collection('users')
      .find({}, { projection: { name: 1, email: 1, role: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    return (
      <ul className="divide-y">
        {users.map(u => (
          <li key={u._id.toString()} className="py-2 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name || 'Unnamed'}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 capitalize">{u.role}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of platform health and recent activity.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Total orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ordersCount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usersCount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Active catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productsCount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Issues</CardTitle>
            <CardDescription>Pending order issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openIssues.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders placed</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-40 w-full" />}> 
              {/* Server component list */}
              {/* @ts-expect-error Server Component */}
              <RecentOrders />
            </Suspense>
            <div className="mt-3 text-right">
              <Link href="/dashboard/seller/orders" className="text-sm text-primary hover:underline">View all orders →</Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Users</CardTitle>
            <CardDescription>Recently registered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              {/* @ts-expect-error Server Component */}
              <RecentUsers />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
