import getDb from "./mongodb";
import { buildProductsWhere, getProductsSort, getPageAndSize } from "./productsQuery";

export async function getProductsAndTotal(sp = {}) {
  const db = await getDb();
  const where = buildProductsWhere(sp);
  const sortKey = (sp?.sort || 'newest').toString();
  const { page, pageSize } = getPageAndSize(sp);
  const skip = (page - 1) * pageSize;

  const total = await db.collection('products').countDocuments(where);
  let products;
  if (sortKey === 'price-high' || sortKey === 'price-low') {
    const dir = sortKey === 'price-high' ? -1 : 1;
    products = await db.collection('products').aggregate([
      { $match: where },
      { $addFields: { priceValue: { $toDouble: '$price' } } },
      { $sort: { priceValue: dir, createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();
  } else {
    const sort = getProductsSort(sortKey);
    products = await db.collection('products')
      .find(where)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .toArray();
  }
  return { products, total, page, pageSize };
}
