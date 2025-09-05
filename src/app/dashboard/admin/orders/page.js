import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import OrdersTable from "@/components/dashboard/seller/order/OrdersTable";

export default async function AdminOrdersPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  // Reuse the seller OrdersTable in read-only mode for admin view
  return (
    <div className="flex flex-col min-h-0">
      {/* @ts-expect-error Server Component */}
      <OrdersTable sp={searchParams || {}} readOnly basePath="/dashboard/admin/orders" />
    </div>
  );
}
