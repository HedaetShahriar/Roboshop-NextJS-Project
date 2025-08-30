import DashboardShell from "@/components/dashboard/Sidebar";

export const dynamic = 'force-dynamic';

export default function SellerLayout({ children }) {
  const nav = [
    { href: '/dashboard/seller', label: 'Overview' },
    { href: '/dashboard/seller/orders', label: 'Orders' },
    { href: '/dashboard/seller/issues', label: 'Issues' },
    { href: '/dashboard/seller/products', label: 'Products' },
    { href: '/dashboard/seller/add-product', label: 'Add Product' },
  ];
  return <DashboardShell role="seller" nav={nav}>{children}</DashboardShell>;
}
