import getDb from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { buildProductsWhere, getProductsSort } from "@/lib/productsQuery";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (!session?.user?.email || (role !== 'seller' && role !== 'admin')) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const sp = Object.fromEntries(searchParams.entries());
    if (sp.search && !sp.q) sp.q = sp.search;
    const where = buildProductsWhere(sp);
    const sortKey = (sp?.sort || 'newest').toString();
    const limitParam = Number(sp?.limit || 5000);
    const limit = Math.min(20000, Math.max(100, isNaN(limitParam) ? 5000 : limitParam));
    const page = Number(sp?.page);
    const pageSizeParam = Number(sp?.pageSize);
    const hasPage = !isNaN(page) && page > 0;
    const pageSize = hasPage ? (isNaN(pageSizeParam) ? 10 : Math.min(100, Math.max(10, pageSizeParam))) : undefined;
    const skip = hasPage ? (page - 1) * pageSize : 0;

    const db = await getDb();
    let products;
    if (sortKey === 'price-high' || sortKey === 'price-low') {
      const dir = sortKey === 'price-high' ? -1 : 1;
      const pipeline = [
        { $match: where },
        { $addFields: { priceValue: { $toDouble: '$price' } } },
        { $sort: { priceValue: dir, createdAt: -1 } },
      ];
      if (hasPage) pipeline.push({ $skip: skip }, { $limit: pageSize });
      else pipeline.push({ $limit: limit });
      products = await db.collection('products').aggregate(pipeline).toArray();
    } else {
      const sort = getProductsSort(sortKey);
      let cursor = db.collection('products')
        .find(where)
        .sort(sort);
      if (hasPage) {
        cursor = cursor.skip(skip).limit(pageSize);
      } else {
        cursor = cursor.limit(limit);
      }
      if (sortKey === 'name-asc' || sortKey === 'name-desc') {
        cursor = cursor.collation({ locale: 'en', strength: 2 });
      }
      products = await cursor.toArray();
    }

    const headers = ['Name', 'Slug', 'SKU', 'Price', 'HasDiscount', 'DiscountPrice', 'Stock', 'Rating', 'RatingCount', 'CreatedAt'];
    const rows = products.map(p => [
      p.name || '', p.slug || '', p.sku || '', p.price ?? '',
      p.has_discount_price ? 'true' : 'false', p.discount_price ?? '',
      p.current_stock ?? '', p.product_rating ?? '', p.product_rating_count ?? '',
      p.createdAt ? new Date(p.createdAt).toISOString() : ''
    ]);
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
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
