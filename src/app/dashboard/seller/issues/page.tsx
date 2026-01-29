import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";
import { formatDateTime } from "@/lib/dates";
import ConfirmButton from "@/app/dashboard/admin/coupons/client/ConfirmButton";

export const dynamic = 'force-dynamic';

interface IssueMessage {
  by: string;
  text: string;
  at: Date;
}

interface OrderIssue {
  _id: ObjectId;
  subject: string;
  orderNumber: string;
  status: 'open' | 'in_progress' | 'resolved';
  category: string;
  messages: IssueMessage[];
  orderId: ObjectId;
  createdAt: Date;
}

// Safely render any dynamic value to avoid rendering objects as React children
const safeText = (val: unknown, { fallback = '-' }: { fallback?: string } = {}): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  // Handle Mongo ObjectId and Date
  if (val instanceof Date) return formatDateTime(val);
  if (val && typeof (val as { toString?: () => string }).toString === 'function' && (val as object).toString !== Object.prototype.toString) {
    try { return (val as { toString: () => string }).toString(); } catch {}
  }
  try { return JSON.stringify(val); } catch { return fallback; }
};

async function updateIssue(formData: FormData): Promise<void> {
  'use server';
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (role === 'customer') return;
  const id = formData.get('id') as string;
  const status = formData.get('status') as string | null;
  const message = formData.get('message') as string | null;
  const db = await getDb();
  const _id = new ObjectId(id);
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateDoc: any = { $set: { updatedAt: now } };
  if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
    updateDoc.$set.status = status;
  }
  if (message) {
    updateDoc.$push = { messages: { by: 'seller', text: message.toString().slice(0, 4000), at: now } };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection('order_issues') as any).updateOne({ _id }, updateDoc);
  if (updateDoc.$set.status === 'resolved') {
    try {
      const issue = await db.collection('order_issues').findOne({ _id });
      if (issue?.orderId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.collection('orders') as any).updateOne(
          { _id: issue.orderId },
          { $push: { history: { code: 'issue-resolved', label: 'Issue resolved', at: now } }, $set: { updatedAt: now } }
        );
      }
    } catch { }
  }
  revalidatePath('/dashboard/seller/issues');
}

export default async function IssuesDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

  const db = await getDb();
  const issues = await db.collection('order_issues').find({}).sort({ createdAt: -1 }).toArray() as unknown as OrderIssue[];

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Order Issues</h1>
      {issues.length === 0 ? (
        <div className="text-gray-600">No issues reported.</div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue._id?.toString?.() ?? String(issue._id)} className="border rounded bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{safeText(issue.subject)}</div>
                  <div className="text-xs text-gray-500">Order {safeText(issue.orderNumber)} • {formatDateTime(issue.createdAt)}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-sm ${issue.status === 'resolved' ? 'bg-green-100 text-green-800' : issue.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100'}`}>{safeText(issue.status)}</span>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="font-medium">Category: <span className="font-normal capitalize">{safeText(issue.category)}</span></div>
                <div className="mt-2 border rounded p-2 bg-zinc-50">
                  <div className="text-xs text-gray-500 mb-1">Conversation</div>
                  <ul className="space-y-1 max-h-48 overflow-auto pr-1">
                    {(Array.isArray(issue.messages) ? issue.messages : []).map((m, idx) => (
                      <li key={idx} className="text-sm"><span className="font-semibold capitalize">{safeText(m?.by)}</span>: {safeText(m?.text)} <span className="text-xs text-gray-500">• {formatDateTime(m?.at)}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <form action={updateIssue} className="mt-3 space-y-2" id={`issue-form-${issue._id?.toString?.() ?? String(issue._id)}`}>
                <input type="hidden" name="id" value={issue._id?.toString?.() ?? String(issue._id)} />
                <div className="flex flex-wrap items-center gap-2">
                  <select name="status" defaultValue={issue.status} className="border rounded px-2 py-1 text-sm">
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input name="message" placeholder="Reply (optional)" className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]" />
                  <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Update</button>
                  {issue.status !== 'resolved' && (
                    <ConfirmButton
                      className="px-3 py-1 rounded bg-emerald-600 text-white text-sm"
                      message="Close this issue as resolved?"
                      formId={`issue-form-${issue._id?.toString?.() ?? String(issue._id)}`}
                      hiddenFields={[{ name: 'status', value: 'resolved' }]}
                    >Mark resolved</ConfirmButton>
                  )}
                </div>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
