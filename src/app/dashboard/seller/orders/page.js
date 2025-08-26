import TableFilters from "@/components/dashboard/shared/table/TableFilters";
import OrdersTable from "@/components/dashboard/seller/order/OrdersTable";
import { getStatusCounts } from "@/lib/ordersService";

export default async function Orders({ searchParams }) {
  const params = await searchParams;
  // Fetch status counts to show in the quick status bar
  const counts = await getStatusCounts(params);
  return (
    <div className="p-4 space-y-4">
      <TableFilters counts={counts} />
      <OrdersTable params ={params} />
    </div>
  );
}
