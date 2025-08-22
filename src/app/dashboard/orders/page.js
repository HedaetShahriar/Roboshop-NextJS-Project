import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import OrdersTable from "./OrdersTable";

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
  const page = Math.max(1, Number((sp?.page || '1')));
  const rawSize = Number((sp?.pageSize || '20'));
  const pageSize = Math.min(100, Math.max(10, isNaN(rawSize) ? 20 : rawSize));
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
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/dashboard/orders?pageSize=${pageSize}`}>
            <Button type="button" size="sm" variant="outline">Clear</Button>
          </Link>
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
      <Suspense fallback={
        <div className="overflow-auto rounded border bg-white max-h-[65vh]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Order #</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Billing address</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="px-3 py-3"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-28 bg-zinc-200 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-5 w-20 bg-zinc-200 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-32 bg-zinc-200 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-8 w-24 bg-zinc-200 rounded" /></td>
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
