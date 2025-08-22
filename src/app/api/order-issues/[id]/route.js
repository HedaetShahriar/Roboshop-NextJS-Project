import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const client = await clientPromise;
  const db = client.db("roboshop");
  let issue;
  try {
    issue = await db.collection('order_issues').findOne({ _id: new ObjectId(id) });
  } catch {
    return NextResponse.json({ error: 'Invalid issue id' }, { status: 400 });
  }
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const now = new Date();
  const updates = { updatedAt: now };
  const push = {};

  // Customers can only add messages to their own issue
  const role = session.user.role || 'customer';
  const isOwner = issue.userId === session.user.email;

  if (body?.message) {
    const text = (body.message || '').toString().slice(0, 4000);
    if (text) {
      push.messages = { by: role === 'customer' && isOwner ? 'customer' : 'seller', text, at: now };
    }
  }

  if (body?.status) {
    if (role === 'customer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const next = body.status;
    if (!['open','in_progress','resolved'].includes(next)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = next;
  }

  const updateDoc = { $set: updates };
  if (push.messages) updateDoc.$push = { messages: push.messages };

  await db.collection('order_issues').updateOne({ _id: issue._id }, updateDoc);

  // If resolved, append to order history
  if (updates.status === 'resolved') {
    try {
      await db.collection('orders').updateOne(
        { _id: issue.orderId },
        { $push: { history: { code: 'issue-resolved', label: 'Issue resolved', at: now } }, $set: { updatedAt: now } }
      );
    } catch {}
  }

  return NextResponse.json({ ok: true });
}
