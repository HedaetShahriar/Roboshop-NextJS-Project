import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import OrdersTable from "../../../../components/dashboard/seller/order/OrdersTable";
import FiltersClient from "../../../../components/dashboard/seller/order/FilterOrderTable";
import Link from "next/link";
import { getStatusCounts } from "@/lib/ordersService";

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();
  const status = sp?.status;
  const q = (sp?.q || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const sortKey = (sp?.sort || 'newest').toString();
  const rawSize = Number((sp?.pageSize || '20'));
  const pageSize = Math.min(100, Math.max(10, isNaN(rawSize) ? 20 : rawSize));
  const statuses = ['processing', 'packed', 'assigned', 'shipped', 'delivered', 'cancelled'];

  // Compute counts per status for current filters (ignoring status itself)
  const counts = await getStatusCounts({ q, from: fromStr, to: toStr });

  const today = new Date();
  const last7From = new Date(today); last7From.setDate(today.getDate() - 6);
  const last30From = new Date(today); last30From.setDate(today.getDate() - 29);
  const makeQS = (from, to) => {
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    if (status) usp.set('status', status);
    if (sortKey) usp.set('sort', sortKey);
    usp.set('from', from);
    usp.set('to', to);
    usp.set('page', '1');
    usp.set('pageSize', String(pageSize));
    return usp.toString();
  };

  // Build query string preserving current filters
  const mkQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    if (fromStr) usp.set('from', fromStr);
    if (toStr) usp.set('to', toStr);
    if (sortKey) usp.set('sort', sortKey);
    if (status) usp.set('status', status);
    usp.set('pageSize', String(pageSize));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') usp.delete(k);
      else usp.set(k, String(v));
    });
    const s = usp.toString();
    return s ? `?${s}` : '';
  };

  return (
    <div className="py-4 md:py-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Manage orders</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and update order statuses</p>
      </div>

      <FiltersClient sp={sp} />
      {/* Quick status tabs */}
      <div className="flex items-center gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <Link href={`/dashboard/orders${mkQS({ status: '', page: 1 })}`} className="shrink-0">
          <Button variant={!status ? 'default' : 'outline'} size="sm" className="shrink-0">All <span className="ml-1 text-xs text-muted-foreground">({counts.all || 0})</span></Button>
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/dashboard/orders${mkQS({ status: s, page: 1 })}`} className="shrink-0">
            <Button variant={status === s ? 'default' : 'outline'} size="sm" className="capitalize shrink-0">{s} <span className="ml-1 text-xs text-muted-foreground">({counts[s] || 0})</span></Button>
          </Link>
        ))}
      </div>

      {/* Server table only */}
      <Suspense fallback={
        <div className="overflow-auto rounded border bg-white max-h-[65vh]">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
              <tr className="text-left">
                <th className="px-2 sm:px-3 py-2 font-medium">Order #</th>
                <th className="px-2 sm:px-3 py-2 font-medium">Date</th>
                <th className="px-2 sm:px-3 py-2 font-medium">Status</th>
                <th className="px-2 sm:px-3 py-2 font-medium">Billing address</th>
                <th className="px-2 sm:px-3 py-2 font-medium">Total</th>
                <th className="px-2 sm:px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="px-2 sm:px-3 py-3"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                  <td className="px-2 sm:px-3 py-3"><div className="h-4 w-28 bg-zinc-200 rounded" /></td>
                  <td className="px-2 sm:px-3 py-3"><div className="h-5 w-20 bg-zinc-200 rounded" /></td>
                  <td className="px-2 sm:px-3 py-3"><div className="h-4 w-32 bg-zinc-200 rounded" /></td>
                  <td className="px-2 sm:px-3 py-3"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                  <td className="px-2 sm:px-3 py-3"><div className="h-8 w-24 bg-zinc-200 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }>
        {/* Delegated table so only this area streams/replaces on filter submit */}
        {/* @ts-expect-error Async Server Component */}
        <OrdersTable sp={sp} />
      </Suspense>
    </div>
  );
}
