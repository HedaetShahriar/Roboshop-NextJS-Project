import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { revalidatePath } from "next/cache";

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

  // Fetch issues for this order (customer view)
  const issues = await db
    .collection('order_issues')
    .find({ orderId: new ObjectId(order._id) })
    .sort({ createdAt: -1 })
    .toArray();
  const issueList = issues.map((i) => ({ ...i, _id: i._id.toString(), orderId: i.orderId.toString() }));

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
              {(() => {
                const s = order.status;
                const cls = s === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : s === 'delivered'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800';
                return <div className={`px-2 py-1 rounded text-sm capitalize ${cls}`}>{s}</div>;
              })()}
            </div>
            {/* Timeline */}
            {(() => {
              const history = (order.history && order.history.length > 0)
                ? [...order.history]
                : [{ code: 'placed', label: 'Order placed', at: order.createdAt }];
              // Ensure a cancelled step exists for legacy orders
              if (order.status === 'cancelled' && !history.some((h) => h.code === 'cancelled')) {
                history.push({ code: 'cancelled', label: 'Order cancelled', at: order.updatedAt || order.createdAt });
              }
              history.sort((a, b) => new Date(a.at) - new Date(b.at));
              const formatDate = (d) => new Intl.DateTimeFormat('en-US', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit'
              }).format(new Date(d));
              return (
                <div className="mt-4">
                  <ol className="relative border-s border-gray-200 ms-3">
                    {history.map((h, idx) => {
                      const isLast = idx === history.length - 1;
                      const dotClass = h.code === 'cancelled'
                        ? 'bg-red-600'
                        : h.code === 'delivered'
                        ? 'bg-green-600'
                        : isLast
                        ? 'bg-blue-600'
                        : 'bg-gray-300';
                      const labelClass = h.code === 'cancelled' ? 'text-red-700' : h.code === 'delivered' ? 'text-green-700' : 'text-gray-900';
                      const label = h.label || (h.code ? h.code.replace(/-/g, ' ') : 'Updated');
                      return (
                        <li key={idx} className="mb-6 ms-4">
                          <span className={`absolute -start-1.5 flex h-3 w-3 rounded-full ring-2 ring-white ${dotClass}`}></span>
                          <h3 className={`text-sm font-semibold capitalize ${labelClass}`}>{label}</h3>
                          <time className="block text-xs text-gray-500">{formatDate(h.at)}</time>
                        </li>
                      );
                    })}
                  </ol>
                  {order.status === 'cancelled' && (() => {
                    const last = history[history.length - 1];
                    const cancelledAt = last?.code === 'cancelled' ? last.at : order.updatedAt || order.createdAt;
                    return (
                      <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 inline-block">
                        Cancelled on {formatDate(cancelledAt)}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
            {order.status === 'processing' && (
              <form
                action={async () => {
                  'use server';
                  const session = await getServerSession(authOptions);
                  if (!session?.user?.email) return;
                  const client = await clientPromise;
                  const db = client.db('roboshop');
                  const doc = await db.collection('orders').findOne({ _id: new ObjectId(order._id), userId: session.user.email });
                  if (!doc || doc.status !== 'processing') return;
                  await db.collection('orders').updateOne({ _id: doc._id }, { $set: { status: 'cancelled', updatedAt: new Date() }, $push: { history: { code: 'cancelled', label: 'Order cancelled', at: new Date() } } });
                  revalidatePath(`/my-orders/${order._id}`);
                }}
                id="cancel-order-form"
              >
                <div className="mt-4">
                  <ConfirmSubmit
                    formId="cancel-order-form"
                    triggerText="Cancel Order"
                    title="Cancel this order?"
                    description="If you cancel, this action cannot be undone."
                    confirmText="Yes, cancel"
                    cancelText="Keep order"
                    triggerVariant="destructive"
                    confirmVariant="destructive"
                    size="sm"
                    className="text-sm"
                  />
                </div>
              </form>
            )}
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

          {/* Order Help */}
          <div className="bg-white border rounded p-4">
            <div className="font-semibold mb-3">Order help</div>
            {issueList.length === 0 ? (
              <ReportIssueForm orderId={order._id} />
            ) : (
              <div className="space-y-4">
                {issueList.map((iss) => (
                  <div key={iss._id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{iss.subject || 'Order issue'}</div>
                      <span className={`px-2 py-1 rounded text-xs capitalize ${iss.status === 'resolved' ? 'bg-green-100 text-green-800' : iss.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100'}`}>{iss.status}</span>
                    </div>
                    <div className="text-xs text-gray-500">Opened on {new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iss.createdAt))}</div>
                    <div className="mt-2 border rounded p-2 bg-zinc-50">
                      <div className="text-xs text-gray-500 mb-1">Conversation</div>
                      <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                        {iss.messages?.map((m, idx) => (
                          <li key={idx} className="text-sm"><span className="font-semibold capitalize">{m.by}</span>: {m.text} <span className="text-xs text-gray-500">• {new Date(m.at).toLocaleString()}</span></li>
                        ))}
                      </ul>
                    </div>
                    {iss.status !== 'resolved' && (
                      <AddIssueMessageForm issueId={iss._id} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Server Components helper forms
async function ReportIssueForm({ orderId }) {
  async function createIssue(data) {
    'use server';
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return;
    const client = await clientPromise;
    const db = client.db('roboshop');
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId), userId: session.user.email });
    if (!order) return;
    const now = new Date();
    const doc = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: session.user.email,
      category: (data.get('category') || 'other').toString(),
      subject: (data.get('subject') || 'Order issue').toString().slice(0, 120),
      description: (data.get('description') || '').toString().slice(0, 2000),
      status: 'open',
      messages: [{ by: 'customer', text: (data.get('description') || '').toString().slice(0, 2000), at: now }],
      createdAt: now,
      updatedAt: now,
    };
    if (!doc.description) return;
    // Prevent duplicate open issues per order
    const existing = await db.collection('order_issues').findOne({ orderId: order._id, status: { $in: ['open','in_progress'] } });
    if (!existing) {
      await db.collection('order_issues').insertOne(doc);
      await db.collection('orders').updateOne({ _id: order._id }, { $push: { history: { code: 'issue-opened', label: 'Issue reported', at: now } }, $set: { updatedAt: now } });
    }
    revalidatePath(`/my-orders/${orderId}`);
  }
  return (
    <form action={createIssue} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select name="category" className="border rounded px-2 py-2 w-full text-sm">
            <option value="wrong_item">Wrong item received</option>
            <option value="damaged">Item damaged</option>
            <option value="late_delivery">Late delivery</option>
            <option value="payment">Payment issue</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Subject</label>
          <input name="subject" placeholder="Brief summary" className="border rounded px-2 py-2 w-full text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea name="description" rows={3} placeholder="Describe the issue" className="border rounded px-2 py-2 w-full text-sm" />
      </div>
      <div>
        <Button type="submit" className="text-sm">Submit issue</Button>
      </div>
    </form>
  );
}

async function AddIssueMessageForm({ issueId }) {
  async function addMessage(data) {
    'use server';
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return;
    const client = await clientPromise;
    const db = client.db('roboshop');
    const _id = new ObjectId(issueId);
    const issue = await db.collection('order_issues').findOne({ _id });
    if (!issue || issue.userId !== session.user.email) return;
    const text = (data.get('message') || '').toString().slice(0, 2000);
    if (!text) return;
    const now = new Date();
    await db.collection('order_issues').updateOne({ _id }, { $push: { messages: { by: 'customer', text, at: now } }, $set: { updatedAt: now } });
    revalidatePath(`/my-orders/${issue.orderId.toString()}`);
  }
  return (
    <form action={addMessage} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="issueId" value={issueId} />
      <input name="message" placeholder="Add a message" className="border rounded px-2 py-2 text-sm flex-1 min-w-[200px]" />
      <Button type="submit" size="sm">Send</Button>
    </form>
  );
}
