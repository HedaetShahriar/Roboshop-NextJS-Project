import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role === 'customer') return notFound();

  const linksByRole = {
    seller: [
  { href: '/dashboard/seller', label: 'Overview' },
      { href: '/dashboard/orders', label: 'Orders' },
      { href: '/dashboard/issues', label: 'Issues' },
      { href: '/dashboard/add-product', label: 'Add Product' },
    ],
    rider: [
      { href: '/dashboard/rider', label: 'Overview' },
    ],
    admin: [
      { href: '/dashboard/admin', label: 'Overview' },
    ],
  };

  const nav = linksByRole[role] || linksByRole.seller;

  return (
    <div className="min-h-dvh bg-zinc-50">
      <DashboardNavbar role={role} />
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="md:sticky md:top-16 self-start">
          <nav className="rounded border bg-white p-2">
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500">Navigation</div>
            <ul className="space-y-1">
              {nav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded px-3 py-2 text-sm hover:bg-zinc-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="min-h-[70vh]">
          {children}
        </main>
      </div>
    </div>
  );
}
