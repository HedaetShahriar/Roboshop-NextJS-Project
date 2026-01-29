import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OrdersTable from "@/components/dashboard/seller/order/OrdersTable";

interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const sp = await searchParams;
  // Reuse the seller OrdersTable in read-only mode for admin view
  return (
    <div className="flex flex-col min-h-0">
  <div className="mb-2 text-xs text-muted-foreground">Open an order to assign riders, update status, or refund.</div>
      <OrdersTable sp={sp || {}} readOnly basePath="/dashboard/admin/orders" />
    </div>
  );
}
