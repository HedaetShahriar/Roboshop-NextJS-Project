import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const keys = ['fullName','email','phone','address1','address2','city','state','postalCode','country'];
  const billingAddress = {};
  for (const k of keys) {
    if (k in body) billingAddress[k] = String(body[k] ?? '');
  }
  const client = await clientPromise;
  const db = client.db('roboshop');
  let _id;
  try {
    _id = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const order = await db.collection('orders').findOne({ _id });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (['delivered','cancelled'].includes(order.status)) {
    return NextResponse.json({ error: 'Finalized order' }, { status: 400 });
  }
  const now = new Date();
  await db.collection('orders').updateOne({ _id }, {
    $set: { billingAddress, updatedAt: now },
    $push: { history: { code: 'billing-updated', label: 'Billing address updated', at: now } },
  });
  return NextResponse.json({ ok: true });
}
