import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function AdminIssueDetail({ params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  let issueId;
  try { issueId = new ObjectId(params.id); } catch { return notFound(); }
  const issue = await db.collection('order_issues').findOne({ _id: issueId });
  if (!issue) return notFound();

  async function updateStatus(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return;
    const status = String(formData.get('status') || 'open');
    const db = await getDb();
    await db.collection('order_issues').updateOne({ _id: issueId }, { $set: { status, updatedAt: new Date() } });
    redirect(`/dashboard/admin/issues/${params.id}`);
  }
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Issue: {issue.subject}</h2>
      <div className="rounded border bg-white p-4 text-sm space-y-2">
        <div><span className="text-muted-foreground">Order:</span> #{issue.orderNumber}</div>
        <div><span className="text-muted-foreground">Status:</span> {issue.status}</div>
        {issue.customerEmail ? <div><span className="text-muted-foreground">Customer:</span> {issue.customerEmail}</div> : null}
        {issue.description ? <div className="whitespace-pre-wrap border-t pt-2">{issue.description}</div> : null}
        <form action={updateStatus} className="pt-2 flex items-center gap-2">
          <select name="status" defaultValue={issue.status} className="border rounded px-2 py-1 text-xs">
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button type="submit" className="px-2 py-1 rounded bg-zinc-900 text-white text-xs">Update</button>
        </form>
      </div>
    </div>
  );
}
