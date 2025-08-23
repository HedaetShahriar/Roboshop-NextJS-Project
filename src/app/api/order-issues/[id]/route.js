import { NextResponse } from "next/server";
import { getAuthedSession, forbidden, badRequest, notFound, ok } from "@/lib/api";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";

export async function PATCH(request, { params }) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  let issue;
  try {
    issue = await db.collection('order_issues').findOne({ _id: new ObjectId(id) });
  } catch {
    return badRequest('Invalid issue id');
  }
  if (!issue) return notFound();

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
    if (role === 'customer') return forbidden();
    const next = body.status;
    if (!['open','in_progress','resolved'].includes(next)) {
      return badRequest('Invalid status');
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

  return ok({ ok: true });
}
