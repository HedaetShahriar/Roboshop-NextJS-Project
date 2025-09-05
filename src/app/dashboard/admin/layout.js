import DashboardShell from "@/components/dashboard/Sidebar";

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }) {
  const nav = [
  { href: '/dashboard/admin', label: 'Overview' },
  { href: '/dashboard/admin/orders', label: 'Orders' },
  { href: '/dashboard/admin/products', label: 'Products' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/issues', label: 'Issues' },
  { href: '/dashboard/admin/riders', label: 'Riders' },
  { href: '/dashboard/admin/coupons', label: 'Coupons' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
  { href: '/dashboard/admin/activity', label: 'Activity' },
  ];
  return <DashboardShell role="admin" nav={nav}>{children}</DashboardShell>;
}
