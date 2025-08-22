import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

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
        <div className="space-y-8">
          {/* Ongoing */}
          {list.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Ongoing</h2>
              <div className="space-y-4">
                {list.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').map((o) => (
                  <div key={o._id} className="border rounded-md p-4 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">Order {o.orderNumber}</div>
                        <div className="text-sm text-gray-500">{new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(o.createdAt))}</div>
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
                    <div className="mt-3 flex items-center gap-3">
                      <Link href={`/my-orders/${o._id}`} className="text-blue-600 hover:underline text-sm">View details</Link>
                      {o.status === 'processing' && (
                        <form
                          action={async () => {
                            'use server';
                            const session = await getServerSession(authOptions);
                            if (!session?.user?.email) return;
                            const client = await clientPromise;
                            const db = client.db('roboshop');
                            const doc = await db.collection('orders').findOne({ _id: new ObjectId(o._id), userId: session.user.email });
                            if (!doc || doc.status !== 'processing') return;
                            await db.collection('orders').updateOne({ _id: doc._id }, { $set: { status: 'cancelled', updatedAt: new Date() }, $push: { history: { code: 'cancelled', label: 'Order cancelled', at: new Date() } } });
                            revalidatePath('/my-orders');
                          }}
                          id={`cancel-order-form-${o._id}`}
                        >
                          <ConfirmSubmit
                            formId={`cancel-order-form-${o._id}`}
                            triggerText="Cancel"
                            title="Cancel this order?"
                            description="This cannot be undone."
                            confirmText="Yes, cancel"
                            cancelText="Keep order"
                            triggerVariant="destructive"
                            confirmVariant="destructive"
                            size="sm"
                          />
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {list.filter((o) => o.status === 'delivered').length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Completed</h2>
              <div className="space-y-4">
                {list.filter((o) => o.status === 'delivered').map((o) => (
                  <div key={o._id} className="border rounded-md p-4 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">Order {o.orderNumber}</div>
                        <div className="text-sm text-gray-500">{new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(o.createdAt))}</div>
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
                    <div className="mt-3 flex items-center gap-3">
                      <Link href={`/my-orders/${o._id}`} className="text-blue-600 hover:underline text-sm">View details</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cancelled */}
          {list.filter((o) => o.status === 'cancelled').length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Cancelled</h2>
              <div className="space-y-4">
                {list.filter((o) => o.status === 'cancelled').map((o) => (
                  <div key={o._id} className="border rounded-md p-4 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">Order {o.orderNumber}</div>
                        <div className="text-sm text-gray-500">{new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(o.createdAt))}</div>
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
                    <div className="mt-3 flex items-center gap-3">
                      <Link href={`/my-orders/${o._id}`} className="text-blue-600 hover:underline text-sm">View details</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
