import getDb from "@/lib/mongodb";


export const dynamic = 'force-dynamic';

function parseDate(value, fallback) {
  const d = value ? new Date(value) : null;
  return isNaN(d?.getTime?.()) ? fallback : d;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const end = parseDate(searchParams.get('end'), now);
    const days = Number(searchParams.get('days') || '30');
    const start = parseDate(searchParams.get('start'), new Date(end.getTime() - days * 24 * 60 * 60 * 1000));

  const db = await getDb();

    // Group key: UTC date string YYYY-MM-DD
    const dateFmt = { format: '%Y-%m-%d', date: '$$ROOT.updatedAt' };
    const createdFmt = { format: '%Y-%m-%d', date: '$$ROOT.createdAt' };

    const [revenueByDay, ordersByDay] = await Promise.all([
      db.collection('orders').aggregate([
        { $match: { status: 'delivered', updatedAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: dateFmt }, value: { $sum: { $toDouble: '$amounts.total' } } } },
        { $project: { _id: 0, date: '$_id', value: 1 } },
        { $sort: { date: 1 } },
      ]).toArray(),
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: createdFmt }, value: { $sum: 1 } } },
        { $project: { _id: 0, date: '$_id', value: 1 } },
        { $sort: { date: 1 } },
      ]).toArray(),
    ]);

    const totals = {
      revenue: Number(revenueByDay.reduce((s, d) => s + Number(d.value || 0), 0).toFixed(2)),
      orders: ordersByDay.reduce((s, d) => s + Number(d.value || 0), 0),
    };

  return Response.json({
      range: { start: start.toISOString(), end: end.toISOString(), days },
      series: { revenue: revenueByDay, orders: ordersByDay },
      totals,
    });
  } catch (err) {
    console.error('metrics api error', err);
    return new Response(JSON.stringify({ error: 'Failed to load metrics' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
