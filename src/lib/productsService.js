import getDb from "./mongodb";
import { buildProductsWhere, getProductsSort, getPageAndSize } from "./productsQuery";
import { unstable_cache } from "next/cache";

function buildProjection(sp = {}) {
  // Minimal fields used by the table/actions; reduce IO and serialization
  // Always include essentials for actions/editor even if some columns hidden
  const proj = {
    _id: 1,
    name: 1,
    slug: 1,
    sku: 1,
    image: 1,
    price: 1,
    has_discount_price: 1,
    discount_price: 1,
    current_stock: 1,
    product_rating: 1,
    product_max_rating: 1,
    product_rating_count: 1,
    createdAt: 1,
  };
  return proj;
}

async function getProductsAndTotalCore(sp = {}) {
  const db = await getDb();
  const where = buildProductsWhere(sp);
  const sortKey = (sp?.sort || 'newest').toString();
  const { page, pageSize } = getPageAndSize(sp);
  const skip = (page - 1) * pageSize;
  const projection = buildProjection(sp);

  const countPromise = db.collection('products').countDocuments(where);
  let listPromise;
  if (sortKey === 'price-high' || sortKey === 'price-low') {
    const dir = sortKey === 'price-high' ? -1 : 1;
    listPromise = db.collection('products').aggregate([
      { $match: where },
      { $addFields: { priceValue: { $toDouble: { $ifNull: ['$price', 0] } } } },
      { $sort: { priceValue: dir, createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      { $project: projection },
    ]).toArray();
  } else {
    const sort = getProductsSort(sortKey);
    let cursor = db.collection('products')
      .find(where, { projection })
      .sort(sort)
      .skip(skip)
      .limit(pageSize);
    if (sortKey === 'name-asc' || sortKey === 'name-desc') {
      cursor = cursor.collation({ locale: 'en', strength: 2 });
    }
    listPromise = cursor.toArray();
  }
  const [total, products] = await Promise.all([countPromise, listPromise]);
  return { products, total, page, pageSize };
}

export async function getProductsAndTotal(sp = {}) {
  return getProductsAndTotalCore(sp);
}

export async function getProductsAndTotalCached(sp = {}) {
  // Build a stable cache key based on relevant params
  const key = [
    'products:list',
    JSON.stringify({
      q: sp?.q || sp?.search || '',
      from: sp?.from || '',
      to: sp?.to || '',
      sort: sp?.sort || 'newest',
      page: Number(sp?.page || 1),
      pageSize: Number(sp?.pageSize || 20),
      inStock: !!sp?.inStock,
      hasDiscount: !!sp?.hasDiscount,
      minPrice: sp?.minPrice ?? '',
      maxPrice: sp?.maxPrice ?? '',
      cols: sp?.cols || '',
    })
  ];
  const runner = unstable_cache(
    () => getProductsAndTotalCore(sp),
    key,
    { tags: ['products:list'], revalidate: 60 }
  );
  return runner();
}

export async function getProductsQuickStats(sp = {}) {
  const db = await getDb();
  const where = buildProductsWhere(sp);
  const [inStock, discounted, outOfStock, lowStock] = await Promise.all([
    db.collection('products').countDocuments({ ...where, current_stock: { $gt: 0 } }),
    db.collection('products').countDocuments({ ...where, has_discount_price: true }),
    db.collection('products').countDocuments({ ...where, current_stock: 0 }),
    db.collection('products').countDocuments({ ...where, current_stock: { $gt: 0, $lte: 5 } }),
  ]);
  return { inStock, discounted, outOfStock, lowStock };
}

export async function getProductsFilteredTotals(sp = {}) {
  const db = await getDb();
  const where = buildProductsWhere(sp);
  const [agg] = await db.collection('products').aggregate([
    { $match: where },
    { $addFields: {
      effPrice: {
        $cond: [
          { $and: [ { $eq: ['$has_discount_price', true] }, { $gt: [ { $ifNull: ['$discount_price', 0] }, 0 ] } ] },
          { $toDouble: { $ifNull: ['$discount_price', 0] } },
          { $toDouble: { $ifNull: ['$price', 0] } }
        ]
      }
    } },
    { $group: {
      _id: null,
      stockSum: { $sum: { $ifNull: ['$current_stock', 0] } },
      inventoryValue: { $sum: { $multiply: [ { $ifNull: ['$current_stock', 0] }, '$effPrice' ] } },
      count: { $sum: 1 }
    } },
    { $project: { _id: 0, stockSum: 1, inventoryValue: { $round: ['$inventoryValue', 2] }, count: 1 } }
  ]).toArray();
  return agg || { stockSum: 0, inventoryValue: 0, count: 0 };
}
