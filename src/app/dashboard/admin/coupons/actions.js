"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { addCouponAudit } from "@/lib/audit";

function toPct(n) {
  const v = Number(n);
  if (!isFinite(v)) return null;
  return Math.max(0, Math.min(100, v));
}

export async function createCoupon(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const code = String(formData.get('code') || '').trim().toUpperCase();
  const type = String(formData.get('type') || 'percent'); // percent | amount
  const value = Number(formData.get('value'));
  const minOrder = Number(formData.get('minOrder') || 0);
  const startsAt = formData.get('startsAt') ? new Date(String(formData.get('startsAt'))) : null;
  const endsAt = formData.get('endsAt') ? new Date(String(formData.get('endsAt'))) : null;
  const maxRedemptions = Number(formData.get('maxRedemptions') || 0);
  const status = 'active';
  if (!code || !value || value <= 0) return { ok: false, message: 'Invalid input' };
  const db = await getDb();
  const exists = await db.collection('coupons').findOne({ code });
  if (exists) return { ok: false, message: 'Code already exists' };
  const doc = {
    code,
    type: type === 'amount' ? 'amount' : 'percent',
    value: type === 'percent' ? toPct(value) : Math.round(value * 100) / 100,
    minOrder: isNaN(minOrder) ? 0 : Math.max(0, Math.round(minOrder * 100) / 100),
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    usageCount: 0,
    maxRedemptions: isNaN(maxRedemptions) ? 0 : Math.max(0, Math.floor(maxRedemptions)),
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection('coupons').insertOne(doc);
  try { await addCouponAudit({ userEmail: session.user.email, action: 'create', ids: [code], params: { type: doc.type, value: doc.value } }); } catch {}
  revalidatePath('/dashboard/admin/coupons');
  return { ok: true };
}

export async function setCouponStatus(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || 'inactive');
  if (!id || !['active','inactive'].includes(status)) return { ok: false, message: 'Invalid input' };
  const db = await getDb();
  let _id; try { _id = new ObjectId(id); } catch { return { ok: false } }
  await db.collection('coupons').updateOne({ _id }, { $set: { status, updatedAt: new Date() } });
  try { await addCouponAudit({ userEmail: session.user.email, action: 'status', ids: [id], params: { status } }); } catch {}
  revalidatePath('/dashboard/admin/coupons');
  return { ok: true };
}

export async function deleteCoupon(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const id = String(formData.get('id') || '');
  if (!id) return { ok: false };
  const db = await getDb();
  let _id; try { _id = new ObjectId(id); } catch { return { ok: false } }
  await db.collection('coupons').deleteOne({ _id });
  try { await addCouponAudit({ userEmail: session.user.email, action: 'delete', ids: [id] }); } catch {}
  revalidatePath('/dashboard/admin/coupons');
  return { ok: true };
}

export async function updateCoupon(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const id = String(formData.get('id') || '');
  if (!id) return { ok: false, message: 'Missing id' };
  const type = String(formData.get('type') || 'percent');
  const value = Number(formData.get('value'));
  const minOrder = Number(formData.get('minOrder') || 0);
  const maxRedemptions = Number(formData.get('maxRedemptions') || 0);
  const startsAt = formData.get('startsAt') ? new Date(String(formData.get('startsAt'))) : null;
  const endsAt = formData.get('endsAt') ? new Date(String(formData.get('endsAt'))) : null;
  if (!value || value <= 0) return { ok: false, message: 'Invalid value' };
  const db = await getDb();
  let _id; try { _id = new ObjectId(id); } catch { return { ok: false } }
  const update = {
    type: type === 'amount' ? 'amount' : 'percent',
    value: type === 'percent' ? toPct(value) : Math.round(value * 100) / 100,
    minOrder: isNaN(minOrder) ? 0 : Math.max(0, Math.round(minOrder * 100) / 100),
    maxRedemptions: isNaN(maxRedemptions) ? 0 : Math.max(0, Math.floor(maxRedemptions)),
    startsAt: startsAt || null,
    endsAt: endsAt || null,
    updatedAt: new Date(),
  };
  await db.collection('coupons').updateOne({ _id }, { $set: update });
  try { await addCouponAudit({ userEmail: session.user.email, action: 'update', ids: [id], params: update }); } catch {}
  revalidatePath('/dashboard/admin/coupons');
  return { ok: true };
}

export async function bulkCouponStatus(_prev, formData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session?.user?.role !== 'admin') return { ok: false, message: 'Unauthorized' };
  const action = String(formData.get('bulkAction') || '');
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  if (!['activate','deactivate'].includes(action) || ids.length === 0) return { ok: false, message: 'Invalid input' };
  const status = action === 'activate' ? 'active' : 'inactive';
  const db = await getDb();
  const list = ids.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean);
  if (!list.length) return { ok: false };
  await db.collection('coupons').updateMany({ _id: { $in: list } }, { $set: { status, updatedAt: new Date() } });
  try { await addCouponAudit({ userEmail: session.user.email, action: 'bulk_status', ids, params: { status } }); } catch {}
  revalidatePath('/dashboard/admin/coupons');
  return { ok: true };
}
