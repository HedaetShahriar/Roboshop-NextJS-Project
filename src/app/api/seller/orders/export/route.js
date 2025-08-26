import getDb from "@/lib/mongodb";
import { buildOrdersWhere, getSortFromKey } from "@/lib/ordersQuery";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    // Accept both 'q' and 'search'
    const sp = Object.fromEntries(searchParams.entries());
    if (sp.search && !sp.q) sp.q = sp.search;
    const where = buildOrdersWhere(sp);
    const sortKey = (sp?.sort || 'newest').toString();
    const limitParam = Number(sp?.limit || 5000);
    const limit = Math.min(20000, Math.max(100, isNaN(limitParam) ? 5000 : limitParam));

    const db = await getDb();
    let orders;
    if (sortKey === 'amount-high' || sortKey === 'amount-low') {
      const dir = sortKey === 'amount-high' ? -1 : 1;
      orders = await db.collection('orders').aggregate([
        { $match: where },
        { $addFields: { amountValue: { $toDouble: '$amounts.total' } } },
        { $sort: { amountValue: dir, createdAt: -1 } },
        { $limit: limit },
      ]).toArray();
    } else {
      const sort = getSortFromKey(sortKey);
      const cursor = db.collection('orders')
        .find(where)
        .sort(sort)
        .limit(limit);
      if (sortKey.startsWith('status')) cursor.collation({ locale: 'en', strength: 2 });
      orders = await cursor.toArray();
    }

    // Build CSV
    const headers = [
      'Order', 'Status', 'Total', 'Date', 'Rider', 'Customer', 'Email', 'Phone'
    ];
    const rows = orders.map((o) => {
      const orderNo = o.orderNumber || (o._id?.toString?.() || '');
      const status = o.status || '';
      const total = o?.amounts?.total ?? '';
      const date = o.createdAt ? new Date(o.createdAt).toISOString() : '';
      const rider = o?.rider?.name || '';
      const customer = o?.contact?.fullName || '';
      const email = o?.contact?.email || '';
      const phone = o?.contact?.phone || '';
      return [orderNo, status, total, date, rider, customer, email, phone];
    });
    const csvEsc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(csvEsc).join(',')).join('\r\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="orders-export.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response('Failed to export', { status: 500 });
  }
}
