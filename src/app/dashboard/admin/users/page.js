import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import { revalidatePath } from "next/cache";
import PaginationServer from "@/components/dashboard/shared/table/PaginationServer";

function getPageAndSize(sp) {
  const page = Math.max(1, parseInt(sp?.page || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(sp?.pageSize || '20', 10) || 20));
  return { page, pageSize };
}

export default async function AdminUsersPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const db = await getDb();
  const q = (searchParams?.q || '').toString().trim();
  const roleFilter = (searchParams?.role || '').toString().trim();
  const suspended = (searchParams?.s || '').toString().trim(); // '', 'yes', 'no'
  const fromStr = (searchParams?.from || '').toString();
  const toStr = (searchParams?.to || '').toString();
  const sortKey = (searchParams?.sort || 'newest').toString();
  const { page, pageSize } = getPageAndSize(searchParams || {});

  const query = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  if (roleFilter) query.role = roleFilter;
  if (suspended === 'yes') query.suspended = true;
  if (suspended === 'no') query.$or = [...(query.$or || []), { suspended: { $exists: false } }, { suspended: false }];
  if (fromStr || toStr) {
    const createdAt = {};
    if (fromStr) createdAt.$gte = new Date(fromStr);
    if (toStr) createdAt.$lte = new Date(toStr);
    query.createdAt = createdAt;
  }

  async function updateUserRole(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return;
    const id = formData.get('id');
    const newRole = formData.get('role');
    const db = await getDb();
    if (!['customer','seller','rider','admin'].includes(String(newRole))) return;
  const { ObjectId } = await import('mongodb');
  await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { role: newRole } });
    revalidatePath('/dashboard/admin/users');
  }

  async function toggleSuspend(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return;
    const id = formData.get('id');
    const suspend = formData.get('suspend') === '1';
    const db = await getDb();
  const { ObjectId } = await import('mongodb');
  await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { suspended: suspend } });
    revalidatePath('/dashboard/admin/users');
  }

  async function bulkUsers(formData) {
    'use server';
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return;
    const action = formData.get('bulkAction');
    const ids = formData.getAll('ids');
    const db = await getDb();
  const { ObjectId } = await import('mongodb');
  const objectIds = ids.filter(Boolean).map((id) => new ObjectId(String(id)));
    if (objectIds.length === 0) return;
    if (action === 'suspend') {
      await db.collection('users').updateMany({ _id: { $in: objectIds } }, { $set: { suspended: true } });
    } else if (action === 'unsuspend') {
      await db.collection('users').updateMany({ _id: { $in: objectIds } }, { $set: { suspended: false } });
    } else if (action?.startsWith('role:')) {
      const role = action.split(':')[1];
      if (['customer','seller','rider','admin'].includes(role)) {
        await db.collection('users').updateMany({ _id: { $in: objectIds } }, { $set: { role } });
      }
    }
    revalidatePath('/dashboard/admin/users');
  }

  const total = await db.collection('users').countDocuments(query);
  const sort = sortKey === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const users = await db.collection('users')
    .find(query, { projection: { name: 1, email: 1, role: 1, suspended: 1, createdAt: 1 } })
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const basePath = '/dashboard/admin/users';
  const queryBase = {
    q: q || undefined,
    role: roleFilter || undefined,
    s: suspended || undefined,
    from: fromStr || undefined,
    to: toStr || undefined,
    sort: sortKey !== 'newest' ? sortKey : undefined,
    pageSize: pageSize !== 20 ? String(pageSize) : undefined,
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Users</h2>
  <form className="flex flex-wrap items-center gap-2" method="GET" action={basePath}>
        <input name="q" defaultValue={q} placeholder="Search name or email" className="border rounded px-2 py-1 text-sm" />
        <select name="role" defaultValue={roleFilter} className="border rounded px-2 py-1 text-sm">
          <option value="">Any role</option>
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
          <option value="rider">Rider</option>
          <option value="admin">Admin</option>
        </select>
        <select name="s" defaultValue={suspended} className="border rounded px-2 py-1 text-sm">
          <option value="">Any status</option>
          <option value="yes">Suspended</option>
          <option value="no">Active</option>
        </select>
        <input type="date" name="from" defaultValue={fromStr} className="border rounded px-2 py-1 text-sm" />
        <input type="date" name="to" defaultValue={toStr} className="border rounded px-2 py-1 text-sm" />
        <select name="sort" defaultValue={sortKey} className="border rounded px-2 py-1 text-sm">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <select name="pageSize" defaultValue={String(pageSize)} className="border rounded px-2 py-1 text-sm">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <button type="submit" className="px-3 py-1 rounded bg-zinc-900 text-white text-sm">Apply</button>
      </form>

      <form action={bulkUsers} className="space-y-2">
        <div className="flex items-center gap-2">
          <select name="bulkAction" className="border rounded px-2 py-1 text-sm">
            <option value="">Bulk actions…</option>
            <option value="suspend">Suspend</option>
            <option value="unsuspend">Unsuspend</option>
            <option value="role:customer">Set role: Customer</option>
            <option value="role:seller">Set role: Seller</option>
            <option value="role:rider">Set role: Rider</option>
            <option value="role:admin">Set role: Admin</option>
          </select>
          <button type="submit" className="px-3 py-1 rounded border bg-white text-sm">Apply</button>
        </div>
        <ul className="divide-y rounded border bg-white">
          {users.map(u => (
            <li key={u._id.toString()} className="p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="ids" value={u._id.toString()} aria-label={`Select ${u.email}`} />
                  <div>
                    <div className="font-medium">{u.name || 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={updateUserRole} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={u._id.toString()} />
                    <select name="role" defaultValue={u.role} className="border rounded px-2 py-1 text-xs">
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="rider">Rider</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="px-2 py-1 rounded bg-zinc-100 text-xs">Change</button>
                  </form>
                  <form action={toggleSuspend}>
                    <input type="hidden" name="id" value={u._id.toString()} />
                    <input type="hidden" name="suspend" value={u.suspended ? '0' : '1'} />
                    <button type="submit" className={`px-2 py-1 rounded text-xs ${u.suspended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.suspended ? 'Unsuspend' : 'Suspend'}</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
          {users.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">No users found.</li>
          )}
        </ul>
      </form>

      <div>
        <PaginationServer basePath={basePath} total={total} page={page} pageSize={pageSize} query={queryBase} />
      </div>
    </div>
  );
}
