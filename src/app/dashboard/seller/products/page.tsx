import ProductsTable from "@/components/dashboard/seller/product/ProductsTable";

export const dynamic = 'force-dynamic';

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

interface ProductsProps {
  searchParams: Promise<SearchParams>;
}

export default async function Products({ searchParams }: ProductsProps) {
  const params = await searchParams;
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ProductsTable sp={params} />
    </div>
  );
}
