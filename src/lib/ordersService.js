import getDb from "./mongodb";
import { buildOrdersWhere, getOrdersSort } from "./ordersQuery";

export function getPageAndSize(sp = {}) {
  const page = Math.max(1, Number((sp?.page || '1')));
  const rawSize = Number((sp?.pageSize || '10'));
  const pageSize = Math.min(100, Math.max(5, isNaN(rawSize) ? 10 : rawSize));
  return { page, pageSize };
}

function buildProjection() {
  // Minimal fields the dashboard table needs
  return {
    _id: 1,
    orderNumber: 1,
    status: 1,
    contact: 1,
    shippingAddress: 1,
    payment: 1,
    amounts: 1,
    createdAt: 1,
    updatedAt: 1,
    itemsCount: { $cond: [{ $isArray: "$items" }, { $size: "$items" }, 0] },
  };
}

export async function getOrdersAndTotal(sp = {}) {
  const db = await getDb();
  const where = buildOrdersWhere(sp);
  const sort = getOrdersSort((sp?.sort || 'newest').toString());
  const { page, pageSize } = getPageAndSize(sp);
  const skip = (page - 1) * pageSize;
  const projection = buildProjection();

  const [total, list] = await Promise.all([
    db.collection('orders').countDocuments(where),
    db.collection('orders')
      .aggregate([
        { $match: where },
        { $addFields: { itemsCount: { $cond: [{ $isArray: "$items" }, { $size: "$items" }, 0] } } },
        { $sort: sort },
        { $skip: skip },
        { $limit: pageSize },
        { $project: projection },
      ]).toArray(),
  ]);

  const orders = list.map(o => ({ ...o, _id: o._id.toString() }));
  return { orders, total, page, pageSize };
}

export async function getOrdersQuickCounts(sp = {}) {
  const db = await getDb();
  const base = buildOrdersWhere({ ...sp, status: '' });
  const statuses = ['processing', 'packed', 'assigned', 'shipped', 'delivered', 'cancelled'];
  const counts = await Promise.all([
    db.collection('orders').countDocuments(base),
    ...statuses.map(s => db.collection('orders').countDocuments({ ...base, status: s })),
  ]);
  const [all, ...rest] = counts;
  const obj = { all };
  statuses.forEach((s, i) => obj[s] = rest[i] || 0);
  return obj;
}
