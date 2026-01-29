"use server";

import getDb from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { buildOrdersWhere, getOrdersSort } from "@/lib/ordersQuery";

interface ActionResult {
  ok: boolean;
  message: string;
}

interface OrderAmounts {
  total?: number;
  subtotal?: number;
  originalTotal?: number;
  shipping?: number;
  discount?: number | {
    type?: string;
    value?: number;
    amount?: number;
    percent?: number;
  };
}

interface OrderItem {
  price?: number;
  unitPrice?: number;
  qty?: number;
  quantity?: number;
}

interface OrderDocument {
  _id: ObjectId | string;
  amounts?: OrderAmounts;
  items?: OrderItem[];
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

// Helper functions to bypass strict MongoDB typing for $push operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ordersUpdate(filter: any, update: any): Promise<void> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection('orders') as any).updateOne(filter, update);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ordersBulkWrite(ops: any[]): Promise<void> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection('orders') as any).bulkWrite(ops, { ordered: false });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ordersFindOne(filter: any, options?: any): Promise<any> {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (db.collection('orders') as any).findOne(filter, options);
}

export async function updateOrderStatus(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get('id');
    const next = formData.get('status');
    if (!id || !next) return { ok: false, message: 'Missing order or status' };
    const allowed = ['processing','packed','assigned','shipped','delivered','cancelled'];
    if (!allowed.includes(String(next))) return { ok: false, message: 'Invalid status' };
    const now = new Date();
    await ordersUpdate(idFilter(String(id)), { 
      $set: { status: String(next), updatedAt: now },
      $push: { history: { code: String(next), label: `Status set to ${next}`, at: now } }
    });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: `Status updated to ${next}` };
  } catch {
    return { ok: false, message: 'Failed to update status' };
  }
}

export async function editBillingAddress(formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get('id');
    if (!id) return { ok: false, message: 'Missing order id' };
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
    await ordersUpdate(idFilter(String(id)), { $set: { billingAddress: billing, updatedAt: new Date() } });
    revalidatePath('/dashboard/seller/orders');
    const name = billing.fullName || 'Billing';
    return { ok: true, message: `Updated ${name}` };
  } catch {
    return { ok: false, message: 'Failed to update billing' };
  }
}

export async function bulkOrders(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const scope = String(formData.get('scope') || 'selected');
    const action = String(formData.get('bulkAction') || '');
    const riderName = formData.get('bulkRiderName') ? String(formData.get('bulkRiderName')) : '';
    if (!action) return { ok: false, message: 'No action selected' };

    const db = await getDb();
    const now = new Date();

    // Determine target IDs by scope
    let ids: string[] = [];
    if (scope === 'selected') {
      ids = (formData.getAll('ids') || []).map(String);
    } else {
      // Build from form fields
      const sp: Record<string, string> = Object.fromEntries(Array.from(formData.keys()).map(k => [k, String(formData.get(k))]));
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [];
    for (const id of ids) {
      const set: Record<string, unknown> = { updatedAt: now };
      const push: Array<{ code: string; label: string; at: Date }> = [];
      const event = (code: string, label: string) => push.push({ code, label, at: now });
      if (action === 'pack') { set.status = 'packed'; event('packed','Order packed'); }
      else if (action === 'assign') { set.status = 'assigned'; if (riderName) set.rider = { name: riderName }; event('rider-assigned', riderName ? `Rider assigned: ${riderName}` : 'Rider assigned'); }
      else if (action === 'ship') { set.status = 'shipped'; event('shipped','Shipped'); }
      else if (action === 'deliver') { set.status = 'delivered'; event('delivered','Delivered'); }
      else if (action === 'revert') { set.status = 'processing'; event('reverted','Reverted to processing'); }
      else if (action === 'cancel') { set.status = 'cancelled'; event('cancelled','Cancelled'); }
      else { continue; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: any = { $set: set };
      if (push.length) update.$push = { history: { $each: push } };
      ops.push({ updateOne: { filter: idFilter(id), update } });
    }

    if (ops.length === 0) return { ok: false, message: 'Nothing to update' };
    await ordersBulkWrite(ops);
    revalidatePath('/dashboard/seller/orders');
    const count = ids.length;
    const verb = (a: string): string => {
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
    const err = e as Error;
    return { ok: false, message: `Bulk action failed${err?.message ? `: ${err.message}` : ''}` };
  }
}

export async function updateOrderDiscount(formData: FormData): Promise<ActionResult> {
  try {
    const id = String(formData.get('id') || '');
    const mode = String(formData.get('mode') || 'amount'); // 'amount' | 'percent'
    const valueStr = String(formData.get('value') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
    const raw = Number(valueStr);
    if (!isFinite(raw) || raw < 0) return { ok: false, message: 'Invalid discount value' };

    const order = await ordersFindOne(idFilter(id), { projection: { amounts: 1 } }) as OrderDocument | null;
    if (!order) return { ok: false, message: 'Order not found' };
    const amt = order.amounts || {};
    const base = Number(amt.originalTotal ?? amt.total ?? 0);
    if (!isFinite(base) || base <= 0) return { ok: false, message: 'Nothing to discount' };

    let discountAmount = 0;
    let percent: number | null = null;
    if (mode === 'percent') {
      const p = Math.max(0, Math.min(100, raw));
      percent = p;
      discountAmount = +(base * (p / 100)).toFixed(2);
    } else {
      discountAmount = Math.max(0, Math.min(base, +raw.toFixed(2)));
    }
    const newTotal = Math.max(0, +(base - discountAmount).toFixed(2));
    const now = new Date();

    const set: Record<string, unknown> = {
      'amounts.total': newTotal,
      updatedAt: now,
      'amounts.discount': { type: mode, value: raw, amount: discountAmount, percent: percent ?? undefined },
    };
    if (amt.originalTotal === undefined) set['amounts.originalTotal'] = base;

    await ordersUpdate(idFilter(id), {
      $set: set,
      $push: { history: { code: 'discount', label: `Discount applied: ${mode === 'percent' ? raw + '%': discountAmount}`, at: now } }
    });

    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: `Discount applied${mode === 'percent' ? ` (${raw}%)` : ''}` };
  } catch {
    return { ok: false, message: 'Failed to apply discount' };
  }
}

export async function clearOrderDiscount(formData: FormData): Promise<ActionResult> {
  try {
    const id = String(formData.get('id') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
    const doc = await ordersFindOne(idFilter(id), { projection: { amounts: 1 } }) as OrderDocument | null;
    if (!doc) return { ok: false, message: 'Order not found' };
    const amt = doc.amounts || {};
    const base = Number(amt.originalTotal ?? amt.total ?? 0);
    const now = new Date();
    const update: { $set: Record<string, unknown>; $unset: Record<string, string> } = { 
      $set: { updatedAt: now }, 
      $unset: { 'amounts.discount': '' } 
    };
    if (amt.originalTotal !== undefined) {
      update.$set['amounts.total'] = base;
      update.$unset['amounts.originalTotal'] = '';
    }
    await ordersUpdate(idFilter(id), update);
    await ordersUpdate(idFilter(id), { $push: { history: { code: 'discount-cleared', label: 'Discount cleared', at: now } } });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: 'Discount cleared' };
  } catch {
    return { ok: false, message: 'Failed to clear discount' };
  }
}

export async function updateOrderShipping(formData: FormData): Promise<ActionResult> {
  try {
    const id = String(formData.get('id') || '');
    const valueStr = String(formData.get('fee') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
    const fee = Number(valueStr);
    if (!isFinite(fee) || fee < 0) return { ok: false, message: 'Invalid shipping fee' };

    const doc = await ordersFindOne(idFilter(id), { projection: { amounts: 1, items: 1 } }) as OrderDocument | null;
    if (!doc) return { ok: false, message: 'Order not found' };
    const amt = doc.amounts || {};
    const items = Array.isArray(doc.items) ? doc.items : [];
    const subtotal = isFinite(Number(amt.subtotal)) ? Number(amt.subtotal) : items.reduce((s: number, it: OrderItem) => s + Number(it?.price || it?.unitPrice || 0) * Number(it?.qty || it?.quantity || 1), 0);
    const base = isFinite(Number(amt.originalTotal)) ? Number(amt.originalTotal) : (isFinite(Number(amt.total)) ? Number(amt.total) : subtotal);
    const discountObj = amt.discount;
    const discount = typeof discountObj === 'number' ? discountObj : Number((discountObj as { amount?: number })?.amount || 0);
    const newTotal = Math.max(0, +(base - Math.max(0, discount) + Math.max(0, fee)).toFixed(2));
    const now = new Date();

    const set: Record<string, unknown> = {
      updatedAt: now,
      'amounts.shipping': fee,
      'amounts.total': newTotal,
    };
    if (amt.originalTotal === undefined) set['amounts.originalTotal'] = base;

    await ordersUpdate(idFilter(id), {
      $set: set,
      $push: { history: { code: 'shipping-fee', label: `Shipping fee set: ${fee}`, at: now } }
    });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: 'Shipping fee updated' };
  } catch {
    return { ok: false, message: 'Failed to update shipping fee' };
  }
}

export async function clearOrderShipping(formData: FormData): Promise<ActionResult> {
  try {
    const id = String(formData.get('id') || '');
    if (!id) return { ok: false, message: 'Missing order id' };
    const doc = await ordersFindOne(idFilter(id), { projection: { amounts: 1, items: 1 } }) as OrderDocument | null;
    if (!doc) return { ok: false, message: 'Order not found' };
    const amt = doc.amounts || {};
    const items = Array.isArray(doc.items) ? doc.items : [];
    const subtotal = isFinite(Number(amt.subtotal)) ? Number(amt.subtotal) : items.reduce((s: number, it: OrderItem) => s + Number(it?.price || it?.unitPrice || 0) * Number(it?.qty || it?.quantity || 1), 0);
    const base = isFinite(Number(amt.originalTotal)) ? Number(amt.originalTotal) : (isFinite(Number(amt.total)) ? Number(amt.total) : subtotal);
    const discountObj = amt.discount;
    const discount = typeof discountObj === 'number' ? discountObj : Number((discountObj as { amount?: number })?.amount || 0);
    const newTotal = Math.max(0, +(base - Math.max(0, discount)).toFixed(2));
    const now = new Date();

    await ordersUpdate(idFilter(id), {
      $set: { updatedAt: now, 'amounts.total': newTotal },
      $unset: { 'amounts.shipping': '' },
    });
    await ordersUpdate(idFilter(id), { $push: { history: { code: 'shipping-cleared', label: 'Shipping fee cleared', at: now } } });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: 'Shipping fee cleared' };
  } catch {
    return { ok: false, message: 'Failed to clear shipping fee' };
  }
}

export async function assignOrderRider(formData: FormData): Promise<ActionResult> {
  try {
    const id = String(formData.get('id') || '');
    const riderName = String(formData.get('rider') || '').trim();
    if (!id) return { ok: false, message: 'Missing order id' };
    const now = new Date();
    const set: Record<string, unknown> = { status: 'assigned', updatedAt: now };
    if (riderName) set['rider'] = { name: riderName };
    const history = { code: 'rider-assigned', label: riderName ? `Rider assigned: ${riderName}` : 'Rider assigned', at: now };
    await ordersUpdate(idFilter(id), { $set: set, $push: { history } });
    revalidatePath('/dashboard/seller/orders');
    return { ok: true, message: riderName ? `Assigned to ${riderName}` : 'Assigned' };
  } catch {
    return { ok: false, message: 'Failed to assign rider' };
  }
}
