import ProductsTable from "@/components/dashboard/seller/product/ProductsTable";

export const dynamic = 'force-dynamic';

export default async function Products({ searchParams }) {
  const params = await searchParams;
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ProductsTable sp={params} />
    </div>
  );
}
