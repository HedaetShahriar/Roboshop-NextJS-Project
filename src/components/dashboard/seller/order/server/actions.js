"use server";

import getDb from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export async function updateOrderStatus(formData) {
  try {
    const id = formData.get('id');
    const next = formData.get('status');
    if (!id || !next) return { ok: false, message: 'Missing order or status' };
    const allowed = ['processing','packed','assigned','shipped','delivered','cancelled'];
    if (!allowed.includes(String(next))) return { ok: false, message: 'Invalid status' };
    const db = await getDb();
    const _id = new ObjectId(String(id));
    const now = new Date();
    await db.collection('orders').updateOne({ _id }, { 
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
    const _id = new ObjectId(String(id));
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
    await db.collection('orders').updateOne({ _id }, { $set: { billingAddress: billing, updatedAt: new Date() } });
    revalidatePath('/dashboard/seller/orders');
    const name = billing.fullName || 'Billing';
    return { ok: true, message: `Updated ${name}` };
  } catch (e) {
    return { ok: false, message: 'Failed to update billing' };
  }
}

export async function bulkOrders(formData) {
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
      // Need to fetch page or filtered list based on provided filters in the form
      const sp = Object.fromEntries(Array.from(formData.keys()).map(k => [k, String(formData.get(k))]));
      if (scope === 'page') {
        const { getOrdersAndTotal } = await import('@/lib/ordersService');
        const { orders } = await getOrdersAndTotal(sp);
        ids = orders.map((o) => String(o._id));
      } else if (scope === 'filtered') {
        const { buildOrdersWhere } = await import('@/lib/ordersQuery');
        const where = buildOrdersWhere(sp);
        const cursor = db.collection('orders').find(where, { projection: { _id: 1, status: 1 } });
        const all = await cursor.toArray();
        ids = all.map((o) => String(o._id));
      }
    }

    if (!ids.length) return { ok: false, message: 'No orders in scope' };

    const bulk = db.collection('orders').initializeUnorderedBulkOp();

    for (const id of ids) {
      let _id; try { _id = new ObjectId(String(id)); } catch { continue; }
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
      bulk.find({ _id }).updateOne(update);
    }

    if (bulk.length === 0) return { ok: false, message: 'Nothing to update' };
    await bulk.execute();
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
    return { ok: false, message: 'Bulk action failed' };
  }
}
