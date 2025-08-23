// Shared query builder for Orders
export function escapeRegex(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildOrdersWhere(sp = {}) {
  const q = (sp?.q || '').toString().trim();
  const status = (sp?.status || '').toString();
  const fromStr = (sp?.from || '').toString();
  const toStr = (sp?.to || '').toString();

  const where = {};
  if (status) where.status = status;
  if (q) {
    where.$or = [
      { orderNumber: { $regex: escapeRegex(q), $options: 'i' } },
      { 'contact.fullName': { $regex: escapeRegex(q), $options: 'i' } },
      { 'contact.email': { $regex: escapeRegex(q), $options: 'i' } },
      { 'contact.phone': { $regex: escapeRegex(q), $options: 'i' } },
    ];
  }
  const created = {};
  const fromDate = fromStr ? new Date(fromStr) : null;
  if (fromDate && !isNaN(fromDate)) created.$gte = fromDate;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate && !isNaN(toDate)) {
    toDate.setHours(23, 59, 59, 999);
    created.$lte = toDate;
  }
  if (Object.keys(created).length) where.createdAt = created;
  return where;
}

export function getSortFromKey(sortKey = 'newest') {
  if (sortKey === 'oldest') return { createdAt: 1 };
  if (sortKey === 'status-asc') return { status: 1, createdAt: -1 };
  if (sortKey === 'status-desc') return { status: -1, createdAt: -1 };
  return { createdAt: -1 };
}

export function getPageAndSize(sp = {}) {
  const page = Math.max(1, Number((sp?.page || '1')));
  const rawSize = Number((sp?.pageSize || '20'));
  const pageSize = Math.min(100, Math.max(10, isNaN(rawSize) ? 20 : rawSize));
  return { page, pageSize };
}
