import getDb from "./mongodb";
import { buildOrdersWhere, getSortFromKey, getPageAndSize } from "./ordersQuery";

export async function getOrdersAndTotal(sp = {}) {
  const db = await getDb();
  const where = buildOrdersWhere(sp);
  const sortKey = (sp?.sort || 'newest').toString();
  const { page, pageSize } = getPageAndSize(sp);
  const skip = (page - 1) * pageSize;

  const total = await db.collection('orders').countDocuments(where);
  let orders;
  if (sortKey === 'amount-high' || sortKey === 'amount-low') {
    const dir = sortKey === 'amount-high' ? -1 : 1;
    orders = await db.collection('orders').aggregate([
      { $match: where },
      { $addFields: { amountValue: { $toDouble: '$amounts.total' } } },
      { $sort: { amountValue: dir, createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();
  } else {
    const sort = getSortFromKey(sortKey);
    const cursor = db.collection('orders')
      .find(where)
      .sort(sort)
      .skip(skip)
      .limit(pageSize);
    if (sortKey.startsWith('status')) {
      cursor.collation({ locale: 'en', strength: 2 });
    }
    orders = await cursor.toArray();
  }
  return { orders, total, page, pageSize };
}

export async function getStatusCounts(sp = {}) {
  const db = await getDb();
  const where = buildOrdersWhere({ ...sp, status: '' });
  const statuses = ['processing', 'packed', 'assigned', 'shipped', 'delivered', 'cancelled'];
  const entries = await Promise.all([
    db.collection('orders').countDocuments(where).then(n => ['all', n]),
    ...statuses.map(s => db.collection('orders').countDocuments({ ...where, status: s }).then(n => [s, n]))
  ]);
  return Object.fromEntries(entries);
}
