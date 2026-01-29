"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";
import { revalidatePath } from "next/cache";
import { addOrderAudit } from "@/lib/audit";

interface OrderAmounts {
  total?: number;
  refunded?: number;
}

interface Order extends Document {
  _id: ObjectId | string;
  amounts?: OrderAmounts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function idFilter(id: string): any {
  const s = String(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const or: any[] = [{ _id: s }];
  if (ObjectId.isValid(s)) {
    try { or.unshift({ _id: new ObjectId(s) }); } catch { /* ignore */ }
  }
  return or.length > 1 ? { $or: or } : or[0];
}

export async function adminAssignRider(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return;
  const id = String(formData.get('id') || '');
  const riderName = String(formData.get('rider') || '').trim();
  if (!id) return;
  const db = await getDb();
  const now = new Date();
  const set: Record<string, unknown> = { status: 'assigned', updatedAt: now };
  if (riderName) set['rider'] = { name: riderName };
  const history = { code: 'rider-assigned', label: riderName ? `Rider assigned: ${riderName}` : 'Rider assigned', at: now };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection('orders') as any).updateOne(idFilter(id), { $set: set, $push: { history } });
  try { await addOrderAudit({ userEmail: session.user.email, action: 'assign_rider', ids: [id], params: { riderName } }); } catch { /* ignore */ }
  revalidatePath('/dashboard/admin/orders');
  revalidatePath('/dashboard/seller/orders');
}

export async function adminUpdateOrderStatus(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return;
  const id = String(formData.get('id') || '');
  const next = String(formData.get('status') || '');
  if (!id || !next) return;
  const allowed = ['processing','packed','assigned','shipped','delivered','cancelled','refunded'];
  if (!allowed.includes(next)) return;
  const db = await getDb();
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection('orders') as any).updateOne(idFilter(id), {
    $set: { status: next, updatedAt: now },
    $push: { history: { code: `status:${next}`, label: `Status set to ${next}`, at: now } }
  });
  try { await addOrderAudit({ userEmail: session.user.email, action: 'set_status', ids: [id], params: { status: next } }); } catch { /* ignore */ }
  revalidatePath('/dashboard/admin/orders');
  revalidatePath('/dashboard/seller/orders');
}

export async function adminRefundOrder(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return;
  const id = String(formData.get('id') || '');
  const amountRaw = Number(formData.get('amount'));
  const reason = String(formData.get('reason') || '').trim();
  if (!id) return;
  if (!isFinite(amountRaw) || amountRaw <= 0) return;
  const db = await getDb();
  const order = await db.collection<Order>('orders').findOne(idFilter(id), { projection: { amounts: 1 } });
  if (!order) return;
  const total = Number(order?.amounts?.total || 0);
  const already = Number(order?.amounts?.refunded || 0);
  const remaining = Math.max(0, total - already);
  const amount = Math.min(remaining, Math.round(amountRaw * 100) / 100);
  if (amount <= 0) return;
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection('orders') as any).updateOne(idFilter(id), {
    $set: { 'amounts.refunded': already + amount, updatedAt: now, ...(already + amount >= total ? { status: 'refunded' } : {}) },
    $push: { history: { code: 'refund', label: `Refunded ${amount}${reason ? ` (${reason})` : ''}`, at: now } }
  });
  try { await addOrderAudit({ userEmail: session.user.email, action: 'refund', ids: [id], params: { amount, reason } }); } catch { /* ignore */ }
  revalidatePath('/dashboard/admin/orders');
  revalidatePath('/dashboard/seller/orders');
}
