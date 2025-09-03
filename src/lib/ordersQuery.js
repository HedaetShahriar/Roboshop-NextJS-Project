export function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build MongoDB filter for orders based on URL search params
export function buildOrdersWhere(sp = {}) {
  const q = ((sp?.q || sp?.search) || '').toString().trim();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();
  const status = (sp?.status || '').toString().trim();
  const paymentStatus = (sp?.paymentStatus || '').toString().trim();
  const paymentMethod = (sp?.paymentMethod || '').toString().trim();
  const codOnly = Boolean(sp?.codOnly);
  const city = (sp?.city || '').toString().trim();
  const where = {};

  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    where.$or = [
      { orderNumber: rx },
      { 'contact.fullName': rx },
      { 'contact.email': rx },
      { 'contact.phone': rx },
    ];
  }

  if (status) where.status = status;
  if (paymentStatus) where['payment.status'] = paymentStatus;
  if (paymentMethod) where['payment.method'] = paymentMethod;
  if (codOnly) where['payment.method'] = { $regex: /^cod$/i };
  if (city) where['shippingAddress.city'] = { $regex: new RegExp(`^${escapeRegex(city)}`, 'i') };

  // Date range (createdAt)
  const created = {};
  const fromDate = fromStr ? new Date(fromStr) : null;
  if (fromDate && !isNaN(fromDate)) created.$gte = fromDate;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate && !isNaN(toDate)) { toDate.setHours(23,59,59,999); created.$lte = toDate; }
  if (Object.keys(created).length) where.createdAt = created;

  return where;
}

export function getOrdersSort(sortKey = 'newest') {
  if (sortKey === 'oldest') return { createdAt: 1 };
  if (sortKey === 'amount-high') return { 'amounts.total': -1, createdAt: -1 };
  if (sortKey === 'amount-low') return { 'amounts.total': 1, createdAt: -1 };
  if (sortKey === 'status-asc') return { status: 1, createdAt: -1 };
  if (sortKey === 'status-desc') return { status: -1, createdAt: -1 };
  return { createdAt: -1 };
}
