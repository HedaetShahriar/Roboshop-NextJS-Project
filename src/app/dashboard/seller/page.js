import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Truck, CheckCircle2, XCircle, TriangleAlert, DollarSign, TrendingUp, Receipt } from "lucide-react";
import getDb from "@/lib/mongodb";
import MetricsPanel from "@/components/dashboard/seller/overview/MetricsPanel";
import { formatBDT } from "@/lib/currency";

export const dynamic = 'force-dynamic';

export default async function SellerDashboardHome() {
  const db = await getDb();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [processing, inTransit, delivered, cancelled, openIssues, revenueAgg, revenueTodayAgg, ordersToday] = await Promise.all([
    db.collection('orders').countDocuments({ status: 'processing' }),
    db.collection('orders').countDocuments({ status: { $in: ['packed', 'assigned', 'shipped'] } }),
    db.collection('orders').countDocuments({ status: 'delivered' }),
    db.collection('orders').countDocuments({ status: 'cancelled' }),
    db.collection('order_issues').countDocuments({ status: { $in: ['open', 'in_progress'] } }),
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
    { label: 'Processing', value: processing, icon: Clock, color: 'text-amber-600' },
    { label: 'In transit', value: inTransit, icon: Truck, color: 'text-blue-600' },
    { label: 'Delivered', value: delivered, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Cancelled', value: cancelled, icon: XCircle, color: 'text-rose-600' },
    { label: 'Open issues', value: openIssues, icon: TriangleAlert, color: 'text-yellow-600' },
  ];

  const fmtCurrency = (n) => formatBDT(n);

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Key stats for your store</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon className={`size-5 ${c.color}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue and new orders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <div>
              <CardTitle>Total revenue</CardTitle>
              <CardDescription>All-time delivered orders</CardDescription>
            </div>
            <DollarSign className="size-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{fmtCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <div>
              <CardTitle>Revenue (24h)</CardTitle>
              <CardDescription>Delivered in the last 24 hours</CardDescription>
            </div>
            <TrendingUp className="size-5 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{fmtCurrency(revenueToday)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
            <div>
              <CardTitle>New orders (24h)</CardTitle>
              <CardDescription>Created in the last 24 hours</CardDescription>
            </div>
            <Receipt className="size-5 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{ordersToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick filters and actions */}
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/seller/orders?status=processing"><Button variant="outline" size="sm">Processing</Button></Link>
          <Link href="/dashboard/seller/orders?status=packed"><Button variant="outline" size="sm">Packed</Button></Link>
          <Link href="/dashboard/seller/orders?status=assigned"><Button variant="outline" size="sm">Assigned</Button></Link>
          <Link href="/dashboard/seller/orders?status=shipped"><Button variant="outline" size="sm">Shipped</Button></Link>
          <Link href="/dashboard/seller/orders?status=delivered"><Button variant="outline" size="sm">Delivered</Button></Link>
          <Link href="/dashboard/seller/orders?status=cancelled"><Button variant="outline" size="sm">Cancelled</Button></Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/seller/orders"><Button variant="ghost" size="sm">Manage orders</Button></Link>
          <Link href="/dashboard/seller/issues"><Button variant="ghost" size="sm">Order issues</Button></Link>
          <Link href="/dashboard/seller/products"><Button variant="ghost" size="sm">Manage products</Button></Link>
          <Link href="/dashboard/seller/add-product"><Button size="sm">Add product</Button></Link>
        </div>
      </div>

      {/* Metrics with filters and charts */}
      <MetricsPanel />
    </>
  );
}
