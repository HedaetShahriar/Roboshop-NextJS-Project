import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminIssuesPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  const openIssues = await db.collection('order_issues').find({ status: { $ne: 'resolved' } }).sort({ createdAt: -1 }).limit(50).toArray();
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Order Issues</h2>
      <p className="text-muted-foreground text-sm">Open and in-progress issues across the platform.</p>
      <ul className="divide-y rounded border bg-white">
        {openIssues.map(i => (
          <li key={i._id.toString()} className="p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{i.subject}</div>
              <div className="text-xs text-muted-foreground">Order {i.orderNumber}</div>
            </div>
            <Link href={`/dashboard/admin/issues/${i._id.toString()}`} className="text-xs text-primary hover:underline">Open →</Link>
          </li>
        ))}
        {openIssues.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">No open issues.</li>
        )}
      </ul>
    </div>
  );
}
