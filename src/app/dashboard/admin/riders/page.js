import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";

export default async function AdminRidersPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  const riders = await db.collection('users').find({ role: 'rider' }, { projection: { name: 1, email: 1 } }).toArray();
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Riders</h2>
      <p className="text-muted-foreground text-sm">Manage delivery riders.</p>
      <ul className="divide-y rounded border bg-white">
        {riders.map(r => (
          <li key={r._id.toString()} className="p-3 text-sm">
            <div className="font-medium">{r.name || 'Unnamed'}</div>
            <div className="text-xs text-muted-foreground">{r.email}</div>
          </li>
        ))}
        {riders.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">No riders found.</li>
        )}
      </ul>
    </div>
  );
}
