import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { adminAssignRider, adminUpdateOrderStatus, adminRefundOrder } from "../actions";
import ConfirmButton from "@/app/dashboard/admin/coupons/client/ConfirmButton";

export default async function AdminOrderDetail({ params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  let id; try { id = new ObjectId(params.id); } catch { return notFound(); }
  const order = await db.collection('orders').findOne({ _id: id });
  if (!order) return notFound();
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Order #{order.orderNumber || order._id.toString().slice(-6)}</h2>
      <div className="rounded border bg-white p-4 text-sm space-y-2">
        <div><span className="text-muted-foreground">Status:</span> {order.status}</div>
        <div><span className="text-muted-foreground">Created:</span> {formatDateTime(order.createdAt)}</div>
        <div><span className="text-muted-foreground">Total:</span> {formatBDT(Number(order?.amounts?.total || 0))}</div>
        <div><span className="text-muted-foreground">Customer:</span> {order?.contact?.fullName} ({order?.contact?.email || order?.contact?.phone})</div>
      </div>
      <div className="rounded border bg-white p-4 text-sm space-y-3">
        <div className="font-medium">Admin actions</div>
        <form action={adminAssignRider} className="flex items-center gap-2">
          <input type="hidden" name="id" value={order._id.toString()} />
          <input type="text" name="rider" placeholder="Rider name" className="border rounded px-2 py-1 text-xs" />
          <button type="submit" className="px-2 py-1 rounded bg-zinc-900 text-white text-xs">Assign rider</button>
        </form>
        <div className="flex items-center gap-2">
          <form id="cancelForm" action={adminUpdateOrderStatus}>
            <input type="hidden" name="id" value={order._id.toString()} />
            <input type="hidden" name="status" value="cancelled" />
          </form>
          <ConfirmButton className="px-2 py-1 rounded bg-rose-600 text-white text-xs" message="Cancel this order? This will update the status to cancelled and notify history." formId="cancelForm">Cancel order</ConfirmButton>
        </div>
        <form action={adminUpdateOrderStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={order._id.toString()} />
          <select name="status" defaultValue={order.status} className="border rounded px-2 py-1 text-xs">
            {['processing','packed','assigned','shipped','delivered','cancelled','refunded'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="px-2 py-1 rounded bg-zinc-900 text-white text-xs">Update status</button>
        </form>
        <form action={adminRefundOrder} className="flex items-center gap-2" id="refundForm">
          <input type="hidden" name="id" value={order._id.toString()} />
          <input type="number" step="0.01" min="0" name="amount" placeholder="Amount" className="border rounded px-2 py-1 text-xs w-28" />
          <input type="text" name="reason" placeholder="Reason (optional)" className="border rounded px-2 py-1 text-xs w-56" />
          <ConfirmButton className="px-2 py-1 rounded bg-zinc-900 text-white text-xs" message="Issue a refund for the specified amount? This will be recorded in order history." formId="refundForm">Refund</ConfirmButton>
        </form>
      </div>
    </div>
  );
}
