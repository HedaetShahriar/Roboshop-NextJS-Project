import { notFound } from "next/navigation";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { Eye, EyeOff, Pencil, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProductGalleryView from "@/components/dashboard/ProductGalleryView";

async function getProductForDashboard(id) {
  const db = await getDb();
  let _id; try { _id = new ObjectId(id); } catch { return null; }
  const doc = await db.collection("products").findOne({ _id }, {
    projection: {
      name: 1,
      image: 1,
      gallery: 1,
      sku: 1,
      slug: 1,
      category: 1,
      subcategory: 1,
      price: 1,
      has_discount_price: 1,
      discount_price: 1,
      current_stock: 1,
      is_hidden: 1,
      description: 1,
      specs: 1,
      updatedAt: 1,
      createdAt: 1
    }
  });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}

export default async function ProductViewPage({ params }) {
  const { id } = await params;
  const p = await getProductForDashboard(id);
  if (!p) return notFound();

  const hasDisc = !!p.has_discount_price && Number(p.discount_price) > 0;
  const base = Number(p.price || 0);
  const disc = Number(p.discount_price || 0);
  const pct = hasDisc && base > 0 ? Math.round((1 - disc / base) * 100) : null;
  const gallery = Array.isArray(p.gallery) ? p.gallery.filter(Boolean) : [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{p.name}</div>
          <div className="text-xs text-muted-foreground truncate">/{p.slug || 'slug'}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/seller/products/${id}/edit`} className="inline-flex items-center gap-1 h-8 px-3 rounded border bg-white hover:bg-zinc-50 text-sm"><Pencil size={14} /> Edit</Link>
          {p.is_hidden ? (
            <span className="inline-flex items-center gap-1 h-8 px-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm"><EyeOff size={14} /> Hidden</span>
          ) : (
            <span className="inline-flex items-center gap-1 h-8 px-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm"><Eye size={14} /> Visible</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
  {/* Left: Gallery with Lightbox */}
  <ProductGalleryView images={[p.image, ...gallery].filter(Boolean)} name={p.name} slug={p.slug} />

        {/* Right: Info panels with Accordion */}
        <div className="space-y-2">
          <Accordion type="multiple" defaultValue={["detail","pricing","inventory"]}>
            <AccordionItem value="detail">
              <AccordionTrigger>Product Detail</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">SKU</div>
                    <div className="font-medium">{p.sku || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Slug</div>
                    <div className="font-medium">{p.slug || '—'}</div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {(p.description && String(p.description).trim().length > 0) && (
              <AccordionItem value="description">
                <AccordionTrigger>Description</AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none text-sm leading-6 whitespace-pre-wrap">{p.description}</div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="category">
              <AccordionTrigger>Category</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="font-medium">{p.category || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Subcategory</div>
                    <div className="font-medium">{p.subcategory || '—'}</div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing">
              <AccordionTrigger>Price & Discount</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Base price</div>
                    <div className="font-medium">{formatBDT(base)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Discount</div>
                    <div className="font-medium">{hasDisc ? formatBDT(disc) : '—'}</div>
                  </div>
                </div>
                {hasDisc && pct !== null && (
                  <div className="text-[11px] text-emerald-700 mt-1">-{pct}% → {formatBDT(disc)} (was {formatBDT(base)})</div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="inventory">
              <AccordionTrigger>Inventory & Status</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Stock</div>
                    <div className="font-medium">{typeof p.current_stock !== 'undefined' ? p.current_stock : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Visibility</div>
                    <div className="font-medium">{p.is_hidden ? 'Hidden' : 'Published'}</div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="meta">
              <AccordionTrigger>Meta</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Created</div>
                    <div className="font-medium">{formatDateTime(p.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Updated</div>
                    <div className="font-medium">{formatDateTime(p.updatedAt)}</div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {p.specs && (
              <AccordionItem value="specs">
                <AccordionTrigger>Specifications</AccordionTrigger>
                <AccordionContent>
                  <div className="rounded border bg-white">
                    <div className="divide-y">
                      {Array.isArray(p.specs) ? (
                        p.specs.length > 0 ? p.specs.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                            <div className="text-muted-foreground">{row?.key || '—'}</div>
                            <div className="col-span-2 font-medium break-words">{row?.value || '—'}</div>
                          </div>
                        )) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No specs</div>
                        )
                      ) : (typeof p.specs === 'object' ? (
                        Object.keys(p.specs).length > 0 ? Object.entries(p.specs).map(([k,v]) => (
                          <div key={k} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                            <div className="text-muted-foreground">{k}</div>
                            <div className="col-span-2 font-medium break-words">{String(v)}</div>
                          </div>
                        )) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No specs</div>
                        )
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No specs</div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>
    </>
  );
}
