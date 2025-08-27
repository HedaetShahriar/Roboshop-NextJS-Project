export function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildProductsWhere(sp = {}) {
  const q = ((sp?.q || sp?.search) || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const where = {};
  // product extras
  const inStock = sp?.inStock ? true : false;
  const hasDiscount = sp?.hasDiscount ? true : false;
  const lowStock = sp?.lowStock ? true : false;
  const minPrice = sp?.minPrice !== undefined && sp?.minPrice !== '' ? Number(sp.minPrice) : undefined;
  const maxPrice = sp?.maxPrice !== undefined && sp?.maxPrice !== '' ? Number(sp.maxPrice) : undefined;
  if (q) {
    where.$or = [
      { name: { $regex: escapeRegex(q), $options: 'i' } },
      { slug: { $regex: escapeRegex(q), $options: 'i' } },
      { sku: { $regex: escapeRegex(q), $options: 'i' } },
      { category: { $regex: escapeRegex(q), $options: 'i' } },
    ];
  }
  if (inStock) where.current_stock = { $gt: 0 };
  if (lowStock) where.current_stock = { ...(where.current_stock || {}), $gt: 0, $lte: 5 };
  if (hasDiscount) where.has_discount_price = true;
  if (minPrice !== undefined || maxPrice !== undefined) {
    const price = {};
    if (minPrice !== undefined && !isNaN(minPrice)) price.$gte = minPrice;
    if (maxPrice !== undefined && !isNaN(maxPrice)) price.$lte = maxPrice;
    if (Object.keys(price).length) where.price = price;
  }
  const created = {};
  const fromDate = fromStr ? new Date(fromStr) : null;
  if (fromDate && !isNaN(fromDate)) created.$gte = fromDate;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate && !isNaN(toDate)) { toDate.setHours(23,59,59,999); created.$lte = toDate; }
  if (Object.keys(created).length) where.createdAt = created;
  return where;
}

export function getProductsSort(sortKey = 'newest') {
  if (sortKey === 'oldest') return { createdAt: 1 };
  if (sortKey === 'name-asc') return { name: 1, createdAt: -1 };
  if (sortKey === 'name-desc') return { name: -1, createdAt: -1 };
  if (sortKey === 'price-high') return { price: -1, createdAt: -1 };
  if (sortKey === 'price-low') return { price: 1, createdAt: -1 };
  if (sortKey === 'stock-high') return { current_stock: -1, createdAt: -1 };
  if (sortKey === 'stock-low') return { current_stock: 1, createdAt: -1 };
  if (sortKey === 'rating-high') return { product_rating: -1, product_rating_count: -1, createdAt: -1 };
  if (sortKey === 'rating-low') return { product_rating: 1, product_rating_count: -1, createdAt: -1 };
  return { createdAt: -1 };
}

export function getPageAndSize(sp = {}) {
  const page = Math.max(1, Number((sp?.page || '1')));
  const rawSize = Number((sp?.pageSize || '10'));
  const pageSize = Math.min(100, Math.max(5, isNaN(rawSize) ? 10 : rawSize));
  return { page, pageSize };
}
