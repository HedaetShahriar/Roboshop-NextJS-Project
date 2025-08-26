import TableFilters from "@/components/dashboard/shared/table/TableFilters";
import { getStatusCounts } from "@/lib/ordersService";

export default async function Orders({ searchParams }) {
  const params = await searchParams;
  // Fetch status counts to show in the quick status bar
  const counts = await getStatusCounts(params);
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
        <TableFilters counts={counts} />
        {/* Generate a server side table for orders with server components here */}
      </div>
    </div>
  );
}
