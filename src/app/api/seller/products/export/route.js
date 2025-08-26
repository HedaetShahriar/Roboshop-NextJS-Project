import getDb from "@/lib/mongodb";
import { buildProductsWhere, getProductsSort } from "@/lib/productsQuery";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sp = Object.fromEntries(searchParams.entries());
    if (sp.search && !sp.q) sp.q = sp.search;
    const where = buildProductsWhere(sp);
    const sortKey = (sp?.sort || 'newest').toString();
    const limitParam = Number(sp?.limit || 5000);
    const limit = Math.min(20000, Math.max(100, isNaN(limitParam) ? 5000 : limitParam));

    const db = await getDb();
    let products;
    if (sortKey === 'price-high' || sortKey === 'price-low') {
      const dir = sortKey === 'price-high' ? -1 : 1;
      products = await db.collection('products').aggregate([
        { $match: where },
        { $addFields: { priceValue: { $toDouble: '$price' } } },
        { $sort: { priceValue: dir, createdAt: -1 } },
        { $limit: limit },
      ]).toArray();
    } else {
      const sort = getProductsSort(sortKey);
      products = await db.collection('products')
        .find(where)
        .sort(sort)
        .limit(limit)
        .toArray();
    }

    const headers = ['Name','Slug','SKU','Price','HasDiscount','DiscountPrice','Stock','Rating','RatingCount','CreatedAt'];
    const rows = products.map(p => [
      p.name || '', p.slug || '', p.sku || '', p.price ?? '',
      p.has_discount_price ? 'true' : 'false', p.discount_price ?? '',
      p.current_stock ?? '', p.product_rating ?? '', p.product_rating_count ?? '',
      p.createdAt ? new Date(p.createdAt).toISOString() : ''
    ]);
    const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products-export.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response('Failed to export', { status: 500 });
  }
}
