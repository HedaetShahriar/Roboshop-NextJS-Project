import { notFound } from "next/navigation";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { Eye, EyeOff, Pencil } from "lucide-react";
import DashboardPage from "@/components/dashboard/DashboardPage";

async function getProductForDashboard(id) {
  const db = await getDb();
  let _id; try { _id = new ObjectId(id); } catch { return null; }
  const doc = await db.collection("products").findOne({ _id }, {
    projection: {
      name: 1, image: 1, sku: 1, slug: 1,
      category: 1, subcategory: 1,
      price: 1, has_discount_price: 1, discount_price: 1,
      current_stock: 1, is_hidden: 1, createdAt: 1, updatedAt: 1
    }
  });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export default async function ProductViewPage({ params }) {
  const { id } = await params;
  const p = await getProductForDashboard(id);
  if (!p) return notFound();

  return (
    <DashboardPage container>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{p.name}</h1>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/seller/products/${id}/edit`} className="inline-flex items-center gap-1 h-8 px-3 rounded border bg-white hover:bg-zinc-50 text-sm"><Pencil size={14} /> Edit</Link>
          {p.is_hidden ? (
            <span className="inline-flex items-center gap-1 h-8 px-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm"><EyeOff size={14} /> Hidden</span>
          ) : (
            <span className="inline-flex items-center gap-1 h-8 px-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm"><Eye size={14} /> Visible</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="rounded border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="w-full h-64 object-cover rounded" />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="rounded border bg-white p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">SKU</div>
              <div className="font-medium">{p.sku || '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="font-medium">{p.category || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Subcategory</div>
                <div className="font-medium">{p.subcategory || '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Price</div>
                <div className="font-medium">{formatBDT(Number(p.price || 0))}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Discount</div>
                <div className="font-medium">{p.has_discount_price && Number(p.discount_price) > 0 ? formatBDT(Number(p.discount_price)) : '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Stock</div>
                <div className="font-medium">{typeof p.current_stock !== 'undefined' ? p.current_stock : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="font-medium">{formatDateTime(p.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </DashboardPage>
  );
}
