import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";
import { formatDateTime } from "@/lib/dates";
import { Inbox } from "lucide-react";
import FiltersClient from "./FiltersClient";
import ConversationLazy from "./ConversationLazy";

export const dynamic = 'force-dynamic';

export default async function IssuesDashboardPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

  // Filters and pagination from URL
  const search = (searchParams?.search || searchParams?.q || '').toString().trim();
  const status = (searchParams?.status || '').toString().trim();
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(searchParams?.pageSize || '20', 10) || 20));

  const query = {};
  if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { orderNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const db = await getDb();
  const total = await db.collection('order_issues').countDocuments(query);

  // Status counts for tabs (based on same search q, but without status filter)
  const queryWithoutStatus = { ...query };
  delete queryWithoutStatus.status;
  const countsAgg = await db.collection('order_issues').aggregate([
    { $match: queryWithoutStatus },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).toArray();
  const counts = countsAgg.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});
  const cursor = db
    .collection('order_issues')
    .find(query, {
      projection: { // limit fields and slice messages to reduce payload
        subject: 1,
        orderNumber: 1,
        status: 1,
        category: 1,
        createdAt: 1,
        updatedAt: 1,
        messages: { $slice: -20 },
      }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  const issues = await cursor.toArray();

  async function updateIssue(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (role === 'customer') return;
    const id = formData.get('id');
    const status = formData.get('status');
    const message = formData.get('message');
    const db = await getDb();
    const _id = new ObjectId(id);
    const now = new Date();
    const updateDoc = { $set: { updatedAt: now } };
    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      updateDoc.$set.status = status;
    }
    if (message) {
      updateDoc.$push = { messages: { by: 'seller', text: message.toString().slice(0, 4000), at: now } };
    }
    await db.collection('order_issues').updateOne({ _id }, updateDoc);
    if (updateDoc.$set.status === 'resolved') {
      try {
        const issueDoc = await db.collection('order_issues').findOne({ _id }, { projection: { orderId: 1 } });
        if (issueDoc?.orderId) {
          await db.collection('orders').updateOne(
            { _id: issueDoc.orderId },
            { $push: { history: { code: 'issue-resolved', label: 'Issue resolved', at: now } }, $set: { updatedAt: now } }
          );
        }
      } catch { }
    }
    // Revalidate seller issues path (not the generic dashboard)
    revalidatePath('/dashboard/seller/issues');
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Order Issues</h1>

      {/* Quick status tabs */}
      <div className=" mb-3 flex items-center gap-2">
        {[
          { label: 'All', value: '', tone: 'border' },
          { label: 'Open', value: 'open', tone: 'bg-red-50 text-red-700 border-red-200' },
          { label: 'In progress', value: 'in_progress', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Resolved', value: 'resolved', tone: 'bg-green-50 text-green-700 border-green-200' },
        ].map((t) => {
          const params = new URLSearchParams({ search, status: t.value, pageSize: String(pageSize), page: '1' });
          const isActive = (status || '') === (t.value || '');
          const count = t.value ? (counts[t.value] || 0) : total;
          return (
            <a
              key={t.value || 'all'}
              href={`?${params.toString()}`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${isActive ? t.tone : 'hover:bg-zinc-50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{t.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/70' : 'bg-zinc-100 text-zinc-700'}`}>{count}</span>
            </a>
          );
        })}
      </div>

      {/* Filters client bar */}
      <FiltersClient defaultSearch={search} defaultStatus={status} defaultPageSize={pageSize} />

      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-10 text-center text-gray-600 bg-white">
          <Inbox className="h-10 w-10 text-gray-400 mb-2" aria-hidden />
          <p className="font-medium">No issues found</p>
          <p className="text-sm text-gray-500">Try adjusting filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-2">Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}</div>
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue._id.toString()}
                className="border rounded-lg bg-white p-4"
                style={{ contentVisibility: 'auto', containIntrinsicSize: '300px' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold truncate" title={issue.subject}>{issue.subject}</div>
                    <div className="text-xs text-gray-500">Order <span className="font-mono text-xs bg-zinc-50 border px-1 rounded" aria-label="Order number">{issue.orderNumber}</span> • {formatDateTime(issue.createdAt)}</div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${issue.status === 'resolved' ? 'bg-green-100 text-green-800' : issue.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{issue.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <div className="font-medium">Category: <span className="font-normal capitalize">{issue.category}</span></div>
                  <ConversationLazy messages={issue.messages} />
                </div>
                <form action={updateIssue} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={issue._id.toString()} />
                  <div className="flex flex-wrap items-center gap-2">
                    <select name="status" defaultValue={issue.status} className="border rounded px-2 py-1 text-sm">
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <input name="message" placeholder="Reply (optional)" aria-label="Reply" className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]" />
                    <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Update</button>
                  </div>
                </form>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <nav className="mt-6 flex items-center justify-between text-sm">
            <a
              className={`px-3 py-2 border rounded ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              href={`?${new URLSearchParams({ search, status, pageSize: String(pageSize), page: String(Math.max(1, page - 1)) }).toString()}`}
              aria-disabled={page <= 1}
            >
              Previous
            </a>
            <div className="text-xs text-gray-500">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
            <a
              className={`px-3 py-2 border rounded ${page * pageSize >= total ? 'pointer-events-none opacity-50' : ''}`}
              href={`?${new URLSearchParams({ search, status, pageSize: String(pageSize), page: String(page + 1) }).toString()}`}
              aria-disabled={page * pageSize >= total}
            >
              Next
            </a>
          </nav>
        </>
      )}
    </>
  );
}
