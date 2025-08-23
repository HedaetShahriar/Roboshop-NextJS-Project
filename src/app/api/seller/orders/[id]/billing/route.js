import { NextResponse } from "next/server";
import { getAuthedSession, badRequest, ok } from "@/lib/api";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";

export async function PATCH(request, { params }) {
  const { error, session } = await getAuthedSession({ requireSeller: true });
  if (error) return error;
  const { id } = await params;
  const body = await request.json();
  const keys = ['fullName','email','phone','address1','address2','city','state','postalCode','country'];
  const billingAddress = {};
  for (const k of keys) {
    if (k in body) billingAddress[k] = String(body[k] ?? '');
  }
  const db = await getDb();
  let _id;
  try {
    _id = new ObjectId(id);
  } catch {
    return badRequest('Invalid id');
  }
  const order = await db.collection('orders').findOne({ _id });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (['delivered','cancelled'].includes(order.status)) {
    return badRequest('Finalized order');
  }
  const now = new Date();
  await db.collection('orders').updateOne({ _id }, {
    $set: { billingAddress, updatedAt: now },
    $push: { history: { code: 'billing-updated', label: 'Billing address updated', at: now } },
  });
  return ok({ ok: true });
}
