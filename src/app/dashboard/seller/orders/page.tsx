import { Suspense } from "react";
import OrdersTable from "@/components/dashboard/seller/order/OrdersTable";
import OrdersTableSkeleton from "@/components/dashboard/seller/order/OrdersTableSkeleton";

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

interface OrdersProps {
  searchParams: Promise<SearchParams>;
}

export default async function Orders({ searchParams }: OrdersProps) {
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
