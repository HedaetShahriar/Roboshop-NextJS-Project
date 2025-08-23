import { NextResponse } from "next/server";
import { getAuthedSession, getDb, ok, badRequest } from "@/lib/api";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  let order;
  try {
    order = await db.collection("orders").findOne({ _id: new ObjectId(id) });
  } catch {
    return badRequest("Invalid order id");
  }
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Allow owner or non-customer roles to read
  if (order.userId !== session.user.email && (session.user.role || 'customer') === 'customer') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const issues = await db
    .collection("order_issues")
    .find({ orderId: order._id })
    .sort({ createdAt: -1 })
    .toArray();
  const mapped = issues.map((i) => ({ ...i, _id: i._id.toString(), orderId: i.orderId.toString() }));
  return ok({ issues: mapped });
}

export async function POST(request, { params }) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  let order;
  try {
    order = await db.collection("orders").findOne({ _id: new ObjectId(id), userId: session.user.email });
  } catch {
    return badRequest("Invalid order id");
  }
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const category = (body?.category || '').toString().slice(0, 50) || 'other';
  const subject = (body?.subject || '').toString().slice(0, 120) || 'Order issue';
  const description = (body?.description || '').toString().slice(0, 2000);
  if (!description) return badRequest("Description is required");

  // Prevent duplicate open issues per order
  const existingOpen = await db.collection('order_issues').findOne({ orderId: order._id, status: { $in: ['open', 'in_progress'] } });
  if (existingOpen) {
    return ok({ ok: true, id: existingOpen._id.toString(), duplicate: true });
  }

  const now = new Date();
  const issue = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    userId: session.user.email,
    category,
    subject,
    description,
    status: 'open',
    messages: [
      { by: 'customer', text: description, at: now }
    ],
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection('order_issues').insertOne(issue);

  // Optional: append to order history
  try {
    await db.collection('orders').updateOne(
      { _id: order._id },
      { $push: { history: { code: 'issue-opened', label: 'Issue reported', at: now } }, $set: { updatedAt: now } }
    );
  } catch {}

  return ok({ ok: true, id: result.insertedId.toString() });
}
