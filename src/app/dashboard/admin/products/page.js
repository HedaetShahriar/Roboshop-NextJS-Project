import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ProductsTable from "@/components/dashboard/seller/product/ProductsTable";

export default async function AdminProductsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  return (
    <div className="flex flex-col min-h-0">
      {/* @ts-expect-error Server Component */}
  <ProductsTable sp={searchParams || {}} basePath="/dashboard/admin/products" />
    </div>
  );
}
