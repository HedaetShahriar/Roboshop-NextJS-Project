"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { addOrderAudit } from "@/lib/audit";

function idFilter(id) {
  const s = String(id);
  const or = [{ _id: s }];
  if (ObjectId.isValid(s)) {
    try { or.unshift({ _id: new ObjectId(s) }); } catch {}
  }
  return or.length > 1 ? { $or: or } : or[0];
}

export async function adminAssignRider(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const id = String(formData.get('id') || '');
  const riderName = String(formData.get('rider') || '').trim();
  if (!id) return { ok: false, message: 'Missing order id' };
  const db = await getDb();
  const now = new Date();
  const set = { status: 'assigned', updatedAt: now };
  if (riderName) set['rider'] = { name: riderName };
  const history = { code: 'rider-assigned', label: riderName ? `Rider assigned: ${riderName}` : 'Rider assigned', at: now };
  await db.collection('orders').updateOne(idFilter(id), { $set: set, $push: { history } });
  try { await addOrderAudit({ userEmail: session.user.email, action: 'assign_rider', ids: [id], params: { riderName } }); } catch {}
  revalidatePath('/dashboard/admin/orders');
  revalidatePath('/dashboard/seller/orders');
  return { ok: true, message: riderName ? `Assigned to ${riderName}` : 'Assigned' };
}

export async function adminUpdateOrderStatus(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const id = String(formData.get('id') || '');
  const next = String(formData.get('status') || '');
  if (!id || !next) return { ok: false, message: 'Missing order or status' };
  const allowed = ['processing','packed','assigned','shipped','delivered','cancelled','refunded'];
  if (!allowed.includes(next)) return { ok: false, message: 'Invalid status' };
  const db = await getDb();
  const now = new Date();
  await db.collection('orders').updateOne(idFilter(id), {
    $set: { status: next, updatedAt: now },
    $push: { history: { code: `status:${next}`, label: `Status set to ${next}`, at: now } }
  });
  try { await addOrderAudit({ userEmail: session.user.email, action: 'set_status', ids: [id], params: { status: next } }); } catch {}
  revalidatePath('/dashboard/admin/orders');
  revalidatePath('/dashboard/seller/orders');
  return { ok: true, message: `Status updated to ${next}` };
}

export async function adminRefundOrder(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const id = String(formData.get('id') || '');
  const amountRaw = Number(formData.get('amount'));
  const reason = String(formData.get('reason') || '').trim();
  if (!id) return { ok: false, message: 'Missing order id' };
  if (!isFinite(amountRaw) || amountRaw <= 0) return { ok: false, message: 'Invalid amount' };
  const db = await getDb();
  const order = await db.collection('orders').findOne(idFilter(id), { projection: { amounts: 1 } });
  if (!order) return { ok: false, message: 'Order not found' };
  const total = Number(order?.amounts?.total || 0);
  const already = Number(order?.amounts?.refunded || 0);
  const remaining = Math.max(0, total - already);
  const amount = Math.min(remaining, Math.round(amountRaw * 100) / 100);
  if (amount <= 0) return { ok: false, message: 'Nothing to refund' };
  const now = new Date();
  await db.collection('orders').updateOne(idFilter(id), {
    $set: { 'amounts.refunded': already + amount, updatedAt: now, ...(already + amount >= total ? { status: 'refunded' } : {}) },
    $push: { history: { code: 'refund', label: `Refunded ${amount}${reason ? ` (${reason})` : ''}`, at: now } }
  });
  try { await addOrderAudit({ userEmail: session.user.email, action: 'refund', ids: [id], params: { amount, reason } }); } catch {}
  revalidatePath('/dashboard/admin/orders');
  revalidatePath('/dashboard/seller/orders');
  return { ok: true, message: `Refunded ${amount}` };
}
