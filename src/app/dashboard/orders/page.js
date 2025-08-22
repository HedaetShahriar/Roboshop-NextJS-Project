import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Suspense } from "react";
import OrdersTable from "./OrdersTable";
import FiltersClient from "./FiltersClient";

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();
  // Client filters handle UI; server page only renders table below.

  return (
    <div className="py-4 md:py-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Manage orders</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and update order statuses</p>
      </div>

  {/* Client-side Filters */}
  <FiltersClient />

      {/* Server table only */}
      <Suspense fallback={
        <div className="overflow-auto rounded border bg-card max-h-[65vh]">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="sticky top-0 z-[1] bg-card shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
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
        {/* @ts-expect-error Async Server Component */}
        <OrdersTable sp={sp} />
      </Suspense>
    </div>
  );
}
