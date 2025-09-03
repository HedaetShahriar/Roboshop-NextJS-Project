"use server";

import getDb from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { buildOrdersWhere, getOrdersSort } from "@/lib/ordersQuery";

function idFilter(id) {
  const s = String(id);
  const or = [{ _id: s }];
  if (ObjectId.isValid(s)) {
    try { or.unshift({ _id: new ObjectId(s) }); } catch {}
  }
  return or.length > 1 ? { $or: or } : or[0];
}

export async function updateOrderStatus(_prevState, formData) {
  try {
    const id = formData.get('id');
    const next = formData.get('status');
    if (!id || !next) return { ok: false, message: 'Missing order or status' };
    const allowed = ['processing','packed','assigned','shipped','delivered','cancelled'];
    if (!allowed.includes(String(next))) return { ok: false, message: 'Invalid status' };
  const db = await getDb();
    const now = new Date();
  await db.collection('orders').updateOne(idFilter(id), { 
      $set: { status: String(next), updatedAt: now },
      $push: { history: { code: String(next), label: `Status set to ${next}`, at: now } }
    });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: `Status updated to ${next}` };
  } catch (e) {
    return { ok: false, message: 'Failed to update status' };
  }
}

export async function editBillingAddress(formData) {
  try {
    const id = formData.get('id');
    if (!id) return { ok: false, message: 'Missing order id' };
  const db = await getDb();
    const billing = {
      fullName: String(formData.get('fullName') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      address1: String(formData.get('address1') || ''),
      city: String(formData.get('city') || ''),
      state: String(formData.get('state') || ''),
      postalCode: String(formData.get('postalCode') || ''),
      country: String(formData.get('country') || ''),
    };
  await db.collection('orders').updateOne(idFilter(id), { $set: { billingAddress: billing, updatedAt: new Date() } });
    revalidatePath('/dashboard/seller/orders');
    const name = billing.fullName || 'Billing';
    return { ok: true, message: `Updated ${name}` };
  } catch (e) {
    return { ok: false, message: 'Failed to update billing' };
  }
}

export async function bulkOrders(_prevState, formData) {
  try {
    const scope = String(formData.get('scope') || 'selected');
    const action = String(formData.get('bulkAction') || '');
    const riderName = formData.get('bulkRiderName') ? String(formData.get('bulkRiderName')) : '';
    if (!action) return { ok: false, message: 'No action selected' };

    const db = await getDb();
    const now = new Date();

    // Determine target IDs by scope
    let ids = [];
    if (scope === 'selected') {
      ids = (formData.getAll('ids') || []).map(String);
    } else {
      // Build from form fields
      const sp = Object.fromEntries(Array.from(formData.keys()).map(k => [k, String(formData.get(k))]));
      const where = buildOrdersWhere(sp);
      if (scope === 'page') {
        const page = Math.max(1, Number(sp.page || '1'));
        const rawSize = Number(sp.pageSize || '10');
        const pageSize = Math.min(100, Math.max(5, isNaN(rawSize) ? 10 : rawSize));
        const skip = (page - 1) * pageSize;
        const sort = getOrdersSort((sp.sort || 'newest').toString());
        const list = await db.collection('orders').find(where, { projection: { _id: 1 } }).sort(sort).skip(skip).limit(pageSize).toArray();
        ids = list.map(o => String(o._id));
      } else if (scope === 'filtered') {
        const list = await db.collection('orders').find(where, { projection: { _id: 1 } }).toArray();
        ids = list.map(o => String(o._id));
      }
    }

    if (!ids.length) return { ok: false, message: 'No orders in scope' };

    const ops = [];
  for (const id of ids) {
      const set = { updatedAt: now };
      const push = [];
      const event = (code, label) => push.push({ code, label, at: now });
      if (action === 'pack') { set.status = 'packed'; event('packed','Order packed'); }
      else if (action === 'assign') { set.status = 'assigned'; if (riderName) set.rider = { name: riderName }; event('rider-assigned', riderName ? `Rider assigned: ${riderName}` : 'Rider assigned'); }
      else if (action === 'ship') { set.status = 'shipped'; event('shipped','Shipped'); }
      else if (action === 'deliver') { set.status = 'delivered'; event('delivered','Delivered'); }
      else if (action === 'revert') { set.status = 'processing'; event('reverted','Reverted to processing'); }
      else if (action === 'cancel') { set.status = 'cancelled'; event('cancelled','Cancelled'); }
      else { continue; }
      const update = { $set: set };
      if (push.length) update.$push = { history: { $each: push } };
  ops.push({ updateOne: { filter: idFilter(id), update } });
    }

    if (ops.length === 0) return { ok: false, message: 'Nothing to update' };
    await db.collection('orders').bulkWrite(ops, { ordered: false });
    revalidatePath('/dashboard/seller/orders');
    const count = ids.length;
    const verb = (a) => {
      switch (a) {
        case 'pack': return 'Packed';
        case 'assign': return 'Assigned';
        case 'ship': return 'Shipped';
        case 'deliver': return 'Delivered';
        case 'revert': return 'Reverted';
        case 'cancel': return 'Cancelled';
        default: return 'Updated';
      }
    };
    return { ok: true, message: `${verb(action)} ${count} order${count === 1 ? '' : 's'}` };
  } catch (e) {
    return { ok: false, message: `Bulk action failed${e?.message ? `: ${e.message}` : ''}` };
  }
}

export async function updateOrderDiscount(formData) {
  try {
    const id = String(formData.get('id') || '');
    const mode = String(formData.get('mode') || 'amount'); // 'amount' | 'percent'
    const valueStr = String(formData.get('value') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
    const raw = Number(valueStr);
    if (!isFinite(raw) || raw < 0) return { ok: false, message: 'Invalid discount value' };

  const db = await getDb();
  const order = await db.collection('orders').findOne(idFilter(id), { projection: { amounts: 1 } });
    if (!order) return { ok: false, message: 'Order not found' };
    const amt = order.amounts || {};
    const base = Number(amt.originalTotal ?? amt.total ?? 0);
    if (!isFinite(base) || base <= 0) return { ok: false, message: 'Nothing to discount' };

    let discountAmount = 0;
    let percent = null;
    if (mode === 'percent') {
      const p = Math.max(0, Math.min(100, raw));
      percent = p;
      discountAmount = +(base * (p / 100)).toFixed(2);
    } else {
      discountAmount = Math.max(0, Math.min(base, +raw.toFixed ? +raw.toFixed(2) : Math.round(raw * 100) / 100));
    }
    const newTotal = Math.max(0, +(base - discountAmount).toFixed(2));
    const now = new Date();

    const set = {
      'amounts.total': newTotal,
      updatedAt: now,
      'amounts.discount': { type: mode, value: raw, amount: discountAmount, percent: percent ?? undefined },
    };
    if (amt.originalTotal === undefined) set['amounts.originalTotal'] = base;

  await db.collection('orders').updateOne(idFilter(id), {
      $set: set,
      $push: { history: { code: 'discount', label: `Discount applied: ${mode === 'percent' ? raw + '%': discountAmount}`, at: now } }
    });

    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: `Discount applied${mode === 'percent' ? ` (${raw}%)` : ''}` };
  } catch (e) {
    return { ok: false, message: 'Failed to apply discount' };
  }
}

export async function clearOrderDiscount(formData) {
  try {
    const id = String(formData.get('id') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
  const db = await getDb();
  const doc = await db.collection('orders').findOne(idFilter(id), { projection: { amounts: 1 } });
    if (!doc) return { ok: false, message: 'Order not found' };
    const amt = doc.amounts || {};
    const base = Number(amt.originalTotal ?? amt.total ?? 0);
    const now = new Date();
    const update = { $set: { updatedAt: now }, $unset: { 'amounts.discount': '' } };
    if (amt.originalTotal !== undefined) {
      update.$set['amounts.total'] = base;
      update.$unset['amounts.originalTotal'] = '';
    }
  await db.collection('orders').updateOne(idFilter(id), update);
  await db.collection('orders').updateOne(idFilter(id), { $push: { history: { code: 'discount-cleared', label: 'Discount cleared', at: now } } });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: 'Discount cleared' };
  } catch (e) {
    return { ok: false, message: 'Failed to clear discount' };
  }
}

export async function updateOrderShipping(formData) {
  try {
    const id = String(formData.get('id') || '');
    const valueStr = String(formData.get('fee') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
    const fee = Number(valueStr);
    if (!isFinite(fee) || fee < 0) return { ok: false, message: 'Invalid shipping fee' };

  const db = await getDb();
  const doc = await db.collection('orders').findOne(idFilter(id), { projection: { amounts: 1, items: 1 } });
    if (!doc) return { ok: false, message: 'Order not found' };
    const amt = doc.amounts || {};
    const items = Array.isArray(doc.items) ? doc.items : [];
    const subtotal = isFinite(Number(amt.subtotal)) ? Number(amt.subtotal) : items.reduce((s, it) => s + Number(it?.price || it?.unitPrice || 0) * Number(it?.qty || it?.quantity || 1), 0);
    const base = isFinite(Number(amt.originalTotal)) ? Number(amt.originalTotal) : (isFinite(Number(amt.total)) ? Number(amt.total) : subtotal);
    const discount = typeof amt.discount === 'number' ? Number(amt.discount) : Number(amt?.discount?.amount || 0);
    const newTotal = Math.max(0, +(base - Math.max(0, discount) + Math.max(0, fee)).toFixed(2));
    const now = new Date();

    const set = {
      updatedAt: now,
      'amounts.shipping': fee,
      'amounts.total': newTotal,
    };
    if (amt.originalTotal === undefined) set['amounts.originalTotal'] = base;

  await db.collection('orders').updateOne(idFilter(id), {
      $set: set,
      $push: { history: { code: 'shipping-fee', label: `Shipping fee set: ${fee}`, at: now } }
    });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: 'Shipping fee updated' };
  } catch (e) {
    return { ok: false, message: 'Failed to update shipping fee' };
  }
}

export async function clearOrderShipping(formData) {
  try {
    const id = String(formData.get('id') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
  const db = await getDb();
  const doc = await db.collection('orders').findOne(idFilter(id), { projection: { amounts: 1, items: 1 } });
    if (!doc) return { ok: false, message: 'Order not found' };
    const amt = doc.amounts || {};
    const items = Array.isArray(doc.items) ? doc.items : [];
    const subtotal = isFinite(Number(amt.subtotal)) ? Number(amt.subtotal) : items.reduce((s, it) => s + Number(it?.price || it?.unitPrice || 0) * Number(it?.qty || it?.quantity || 1), 0);
    const base = isFinite(Number(amt.originalTotal)) ? Number(amt.originalTotal) : (isFinite(Number(amt.total)) ? Number(amt.total) : subtotal);
    const discount = typeof amt.discount === 'number' ? Number(amt.discount) : Number(amt?.discount?.amount || 0);
    const newTotal = Math.max(0, +(base - Math.max(0, discount)).toFixed(2));
    const now = new Date();

  await db.collection('orders').updateOne(idFilter(id), {
      $set: { updatedAt: now, 'amounts.total': newTotal },
      $unset: { 'amounts.shipping': '' },
    });
  await db.collection('orders').updateOne(idFilter(id), { $push: { history: { code: 'shipping-cleared', label: 'Shipping fee cleared', at: now } } });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: 'Shipping fee cleared' };
  } catch (e) {
    return { ok: false, message: 'Failed to clear shipping fee' };
  }
}

export async function assignOrderRider(formData) {
  try {
    const id = String(formData.get('id') || '');
    const riderName = String(formData.get('rider') || '').trim();
    if (!id) return { ok: false, message: 'Missing order id' };
    const db = await getDb();
    const now = new Date();
    const set = { status: 'assigned', updatedAt: now };
    if (riderName) set['rider'] = { name: riderName };
    const history = { code: 'rider-assigned', label: riderName ? `Rider assigned: ${riderName}` : 'Rider assigned', at: now };
    await db.collection('orders').updateOne(idFilter(id), { $set: set, $push: { history } });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: riderName ? `Assigned to ${riderName}` : 'Assigned' };
  } catch (e) {
    return { ok: false, message: 'Failed to assign rider' };
  }
}
