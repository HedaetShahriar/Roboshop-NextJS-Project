import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";

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

  return <DashboardShell role={role} nav={nav}>{children}</DashboardShell>;
}
