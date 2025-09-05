import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

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
    </div>
  );
}
