import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').toString().trim();
  const status = url.searchParams.get('status') || '';
  const fromStr = (url.searchParams.get('from') || '').toString();
  const toStr = (url.searchParams.get('to') || '').toString();
  const sortKey = (url.searchParams.get('sort') || 'newest').toString();
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const rawSize = Number(url.searchParams.get('pageSize') || '20');
  const pageSize = Math.min(100, Math.max(10, isNaN(rawSize) ? 20 : rawSize));
  const skip = (page - 1) * pageSize;

  const client = await clientPromise;
  const db = client.db('roboshop');
  const where = {};
  if (status) where.status = status;
  if (q) {
    where.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
      { 'contact.fullName': { $regex: q, $options: 'i' } },
      { 'contact.email': { $regex: q, $options: 'i' } },
      { 'contact.phone': { $regex: q, $options: 'i' } },
    ];
  }
  const created = {};
  const fromDate = fromStr ? new Date(fromStr) : null;
  if (fromDate && !isNaN(fromDate)) created.$gte = fromDate;
  const toDate = toStr ? new Date(toStr) : null;
  if (toDate && !isNaN(toDate)) created.$lte = toDate;
  if (Object.keys(created).length) where.createdAt = created;

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
    const sort = sortKey === 'oldest' ? { createdAt: 1 }
      : sortKey === 'status-asc' ? { status: 1, createdAt: -1 }
      : sortKey === 'status-desc' ? { status: -1, createdAt: -1 }
      : { createdAt: -1 };
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

  const mapped = orders.map(o => ({ ...o, _id: o._id.toString() }));
  return NextResponse.json({ orders: mapped, total, page, pageSize });
}
