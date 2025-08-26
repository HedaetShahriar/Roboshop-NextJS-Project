import TableFilters from "@/components/dashboard/shared/table/TableFilters";
import ProductsTable from "@/components/dashboard/seller/product/ProductsTable";

export default async function Products({ searchParams }) {
  const params = await searchParams;
  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name-asc', label: 'Name A→Z' },
    { value: 'name-desc', label: 'Name Z→A' },
    { value: 'price-high', label: 'Price: high → low' },
    { value: 'price-low', label: 'Price: low → high' },
    { value: 'stock-high', label: 'Stock: high → low' },
  { value: 'stock-low', label: 'Stock: low → high' },
  { value: 'rating-high', label: 'Rating: high → low' },
  { value: 'rating-low', label: 'Rating: low → high' },
  ];
  return (
    <div className="p-4 space-y-4">
  <TableFilters title="Products" subtitle="Filter and sort your catalog quickly" config={{ showStatusBar: false, showInStock: true, showHasDiscount: true, showPriceRange: true }} sortOptions={sortOptions} searchPlaceholder="Search products by name, SKU, category" />
      <ProductsTable sp={params} />
    </div>
  );
}
