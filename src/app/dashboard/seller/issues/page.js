import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";
import { formatDateTime } from "@/lib/dates";
import DashboardPage from "@/components/dashboard/DashboardPage";

export const dynamic = 'force-dynamic';

export default async function IssuesDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

  const db = await getDb();
  const issues = await db.collection('order_issues').find({}).sort({ createdAt: -1 }).toArray();

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
    if (status && ['open','in_progress','resolved'].includes(status)) {
      updateDoc.$set.status = status;
    }
    if (message) {
      updateDoc.$push = { messages: { by: 'seller', text: message.toString().slice(0, 4000), at: now } };
    }
    await db.collection('order_issues').updateOne({ _id }, updateDoc);
    if (updateDoc.$set.status === 'resolved') {
      try {
        await db.collection('orders').updateOne(
          { _id: (await db.collection('order_issues').findOne({ _id })).orderId },
          { $push: { history: { code: 'issue-resolved', label: 'Issue resolved', at: now } }, $set: { updatedAt: now } }
        );
      } catch {}
    }
    revalidatePath('/dashboard/issues');
  }

  return (
    <DashboardPage container>
      <h1 className="text-2xl font-bold mb-6">Order Issues</h1>
      {issues.length === 0 ? (
        <div className="text-gray-600">No issues reported.</div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue._id.toString()} className="border rounded bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{issue.subject}</div>
                  <div className="text-xs text-gray-500">Order {issue.orderNumber} • {formatDateTime(issue.createdAt)}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-sm ${issue.status === 'resolved' ? 'bg-green-100 text-green-800' : issue.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100'}`}>{issue.status}</span>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="font-medium">Category: <span className="font-normal capitalize">{issue.category}</span></div>
                <div className="mt-2 border rounded p-2 bg-zinc-50">
                  <div className="text-xs text-gray-500 mb-1">Conversation</div>
                  <ul className="space-y-1 max-h-48 overflow-auto pr-1">
                    {issue.messages?.map((m, idx) => (
                      <li key={idx} className="text-sm"><span className="font-semibold capitalize">{m.by}</span>: {m.text} <span className="text-xs text-gray-500">• {formatDateTime(m.at)}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <form action={updateIssue} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={issue._id.toString()} />
                <div className="flex flex-wrap items-center gap-2">
                  <select name="status" defaultValue={issue.status} className="border rounded px-2 py-1 text-sm">
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input name="message" placeholder="Reply (optional)" className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]" />
                  <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Update</button>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
