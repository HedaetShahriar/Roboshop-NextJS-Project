import { notFound } from "next/navigation";
import Link from "next/link";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ClientEditForm from "./ClientEditForm";
import { updateProductDetails } from "@/components/dashboard/seller/product/server/actions";
import DashboardPage from "@/components/dashboard/DashboardPage";

async function getProductForDashboard(id) {
  const db = await getDb();
  let _id; try { _id = new ObjectId(id); } catch { return null; }
  const doc = await db.collection("products").findOne({ _id }, {
    projection: {
      name: 1, image: 1, sku: 1, slug: 1,
      category: 1, subcategory: 1,
      price: 1, has_discount_price: 1, discount_price: 1,
  current_stock: 1, is_hidden: 1,
  description: 1, specs: 1, gallery: 1, variants: 1, markets: 1
    }
  });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export default async function ProductEditPage({ params }) {
  const { id } = await params;
  const p = await getProductForDashboard(id);
  if (!p) return notFound();

  return (
    <DashboardPage container>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Edit product</h1>
        <Link href={`/dashboard/seller/products/${id}`} className="text-sm underline">Back to view</Link>
      </div>

  <ClientEditForm product={p} action={updateProductDetails} />
    </DashboardPage>
  );
}
