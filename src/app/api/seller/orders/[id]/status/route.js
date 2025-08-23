import { NextResponse } from "next/server";
import { getAuthedSession, getDb, badRequest, ok } from "@/lib/api";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  const { error, session } = await getAuthedSession({ requireSeller: true });
  if (error) return error;

  const { id } = await params;
  let _id;
  try { _id = new ObjectId(id); } catch { return badRequest('Invalid id'); }

  const { action, riderName } = await request.json();
  if (!action) return badRequest('Missing action');

  const db = await getDb();
  const order = await db.collection('orders').findOne({ _id });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const now = new Date();
  const set = { updatedAt: now };
  const push = [];
  const pushEvent = (code, label) => push.push({ code, label, at: now });

  if (action === 'pack' && order.status === 'processing') {
    set.status = 'packed';
    pushEvent('packed', 'Order packed');
  } else if (action === 'assign' && ['packed','processing'].includes(order.status)) {
    set.status = 'assigned';
    if (riderName) set.rider = { name: String(riderName) };
    pushEvent('rider-assigned', riderName ? `Rider assigned: ${riderName}` : 'Rider assigned');
  } else if (action === 'ship' && ['assigned','packed'].includes(order.status)) {
    set.status = 'shipped';
    pushEvent('shipped', 'Shipped');
  } else if (action === 'deliver' && order.status === 'shipped') {
    set.status = 'delivered';
    pushEvent('delivered', 'Delivered');
  } else if (action === 'revert' && order.status !== 'delivered' && order.status !== 'cancelled') {
    set.status = 'processing';
    pushEvent('reverted', 'Reverted to processing');
  } else {
    return badRequest('Invalid transition');
  }

  const update = { $set: set };
  if (push.length) update.$push = { history: { $each: push } };
  await db.collection('orders').updateOne({ _id }, update);
  return ok({ ok: true });
}
