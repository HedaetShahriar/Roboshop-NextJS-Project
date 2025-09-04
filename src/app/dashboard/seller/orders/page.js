import { Suspense } from "react";
import OrdersTable from "@/components/dashboard/seller/order/OrdersTable";
import OrdersTableSkeleton from "@/components/dashboard/seller/order/OrdersTableSkeleton";

export default async function Orders({ searchParams }) {
  const params = await searchParams;
  // Fetch status counts to show in the quick status bar
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTable sp={params} />
      </Suspense>
    </div>
  );
}
