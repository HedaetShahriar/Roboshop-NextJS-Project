import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { formatDateTime } from "@/lib/dates";

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  const limit = Math.min(200, Math.max(20, Number(searchParams?.limit || 100)));
  const logs = await db.collection('audit_logs').find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return (
    <div className="space-y-3 min-h-0 flex flex-col">
      <h2 className="text-xl font-semibold">Activity</h2>
      <div className="rounded border bg-white overflow-auto">
        <table className="min-w-full table-auto text-xs">
          <thead className="sticky top-0 bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Scope</th>
              <th className="px-3 py-2 font-medium">Count</th>
              <th className="px-3 py-2 font-medium">Params</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id.toString()} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                <td className="px-3 py-2">{l.userEmail}</td>
                <td className="px-3 py-2">{l.type}</td>
                <td className="px-3 py-2">{l.action}</td>
                <td className="px-3 py-2">{l.scope}</td>
                <td className="px-3 py-2">{l.idsCount ?? (Array.isArray(l.ids) ? l.ids.length : 0)}</td>
                <td className="px-3 py-2 max-w-[520px]">
                  <pre className="whitespace-pre-wrap break-words text-[10px] leading-tight">{JSON.stringify(l.params || {}, null, 0)}</pre>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-3 text-muted-foreground">No activity yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
