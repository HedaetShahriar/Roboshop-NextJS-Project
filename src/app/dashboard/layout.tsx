import { ReactNode } from "react";

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    // Middleware handles auth/role. Keep shell lean here; nested layouts can add nav.
    return children;
}
