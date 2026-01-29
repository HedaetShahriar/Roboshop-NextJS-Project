import DashboardShell from "@/components/dashboard/Sidebar";
import { ReactNode } from "react";

export const dynamic = 'force-dynamic';

interface NavItem {
  href: string;
  label: string;
}

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const nav: NavItem[] = [
    { href: '/dashboard/seller', label: 'Overview' },
    { href: '/dashboard/seller/orders', label: 'Orders' },
    { href: '/dashboard/seller/issues', label: 'Issues' },
    { href: '/dashboard/seller/products', label: 'Products' },
    { href: '/dashboard/seller/add-product', label: 'Add Product' },
  ];
  return <DashboardShell role="seller" nav={nav}>{children}</DashboardShell>;
}
