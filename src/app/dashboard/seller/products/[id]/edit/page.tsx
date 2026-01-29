import { notFound } from "next/navigation";
import Link from "next/link";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ClientEditForm from "./ClientEditForm";
import { updateProductDetails } from "@/components/dashboard/seller/product/server/actions";

interface ProductDocument {
  _id: ObjectId;
  name?: string;
  image?: string;
  sku?: string;
  slug?: string;
  category?: string;
  subcategory?: string;
  price?: number | string;
  has_discount_price?: boolean;
  discount_price?: number | string;
  current_stock?: number;
  is_hidden?: boolean;
  description?: string;
  specs?: Array<{ key: string; value: string }>;
  gallery?: string[];
  variants?: unknown[];
  markets?: unknown[];
}

interface ProductForDashboard extends Omit<ProductDocument, '_id'> {
  _id: string;
}

async function getProductForDashboard(id: string): Promise<ProductForDashboard | null> {
  const db = await getDb();
  let _id: ObjectId;
  try { _id = new ObjectId(id); } catch { return null; }
  const doc = await db.collection("products").findOne({ _id }, {
    projection: {
      name: 1, image: 1, sku: 1, slug: 1,
      category: 1, subcategory: 1,
      price: 1, has_discount_price: 1, discount_price: 1,
      current_stock: 1, is_hidden: 1,
      description: 1, specs: 1, gallery: 1, variants: 1, markets: 1
    }
  }) as ProductDocument | null;
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  const p = await getProductForDashboard(id);
  if (!p) return notFound();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Edit product</h1>
        <Link href={`/dashboard/seller/products/${id}`} className="text-sm underline">Back to view</Link>
      </div>

      <ClientEditForm product={p} action={updateProductDetails} />
    </>
  );
}
