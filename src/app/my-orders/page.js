import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">My Orders</h1>
        <p>Please <Link href="/login" className="text-blue-600 underline">login</Link> to view your orders.</p>
      </div>
    );
  }

  const client = await clientPromise;
  const db = client.db("roboshop");
  const orders = await db
    .collection("orders")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  const list = orders.map((o) => ({ ...o, _id: o._id.toString() }));

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {list.length === 0 ? (
        <div className="text-gray-600">
          <p>You have no orders yet.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700">Go to Home</Link>
            <Link href="/products" className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-zinc-50">Browse Products</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((o) => (
            <div key={o._id} className="border rounded-md p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">Order {o.orderNumber}</div>
                  <div className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm">
                  <span className="px-2 py-1 rounded bg-zinc-100">{o.status}</span>
                </div>
              </div>
              <div className="mt-3 text-sm flex flex-wrap items-center gap-4">
                <div>Items: {o.items?.reduce((n, it) => n + (it.qty || 0), 0)}</div>
                <div>Total: <span className="font-semibold">${Number(o.amounts?.total || 0).toFixed(2)}</span></div>
                {o.promoCode && <div>Promo: {o.promoCode}</div>}
              </div>
              <div className="mt-3">
                <Link href={`/my-orders/${o._id}`} className="text-blue-600 hover:underline text-sm">View details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
