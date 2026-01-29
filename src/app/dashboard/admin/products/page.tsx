import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProductsTable from "@/components/dashboard/seller/product/ProductsTable";

interface AdminProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const sp = await searchParams;
  return (
    <div className="flex flex-col min-h-0">
  <ProductsTable sp={sp || {}} basePath="/dashboard/admin/products" />
    </div>
  );
}
