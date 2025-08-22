import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    notFound();
  }

  const client = await clientPromise;
  const db = client.db("roboshop");
  let order;
  try {
    const doc = await db.collection("orders").findOne({ _id: new ObjectId(id), userId: session.user.email });
    if (!doc) return notFound();
    order = { ...doc, _id: doc._id.toString() };
  } catch (e) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        <Link href="/my-orders" className="text-blue-600 hover:underline text-sm">Back to orders</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Status</div>
              <div className="px-2 py-1 rounded bg-zinc-100 text-sm">{order.status}</div>
            </div>
            <div className="mt-3 text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleString()}</div>
          </div>

          <div className="bg-white border rounded p-4">
            <div className="font-semibold mb-3">Items</div>
            <ul className="divide-y">
              {order.items.map((it, idx) => (
                <li key={idx} className="py-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.image && <img src={it.image} alt="" className="h-12 w-12 rounded object-cover" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium line-clamp-1">{it.name}</div>
                    <div className="text-xs text-gray-500">Qty: {it.qty} · ${Number(it.price).toFixed(2)}</div>
                  </div>
                  <div className="text-sm font-semibold">${(Number(it.price) * Number(it.qty)).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border rounded p-4">
            <div className="font-semibold mb-2">Shipping Address</div>
            <div className="text-sm text-gray-700">
              <div>{order.contact?.fullName}</div>
              <div>{order.shippingAddress?.address1}{order.shippingAddress?.address2 ? `, ${order.shippingAddress.address2}` : ""}</div>
              <div>{order.shippingAddress?.area ? `${order.shippingAddress.area}, ` : ""}{order.shippingAddress?.city}</div>
              <div>{order.shippingAddress?.country} {order.shippingAddress?.postalCode}</div>
              {order.shippingAddress?.notes && <div className="mt-1 text-gray-500">Notes: {order.shippingAddress.notes}</div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded p-4">
            <div className="font-semibold mb-3">Summary</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.amounts?.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="text-red-600">- ${Number(order.amounts?.discount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${Number(order.amounts?.shipping || 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>${Number(order.amounts?.total || 0).toFixed(2)}</span></div>
            </div>
            <div className="mt-3 text-xs text-gray-600">Paid via {order.payment?.method?.toUpperCase() || "N/A"}</div>
            {order.payment?.bkashNumber && (
              <div className="text-xs text-gray-600">bKash: {order.payment.bkashNumber} · Txn: {order.payment.bkashTxnId}</div>
            )}
            {order.payment?.cardLast4 && (
              <div className="text-xs text-gray-600">Card: **** **** **** {order.payment.cardLast4}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
