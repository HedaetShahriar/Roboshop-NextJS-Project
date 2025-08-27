import ProductsTable from "@/components/dashboard/seller/product/ProductsTable";

export default async function Products({ searchParams }) {
  const params = await searchParams;
  return (
    <div className="p-3 sm:p-4 space-y-3">
      <ProductsTable sp={params} />
    </div>
  );
}
