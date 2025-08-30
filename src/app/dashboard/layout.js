export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }) {
    // Middleware handles auth/role. Keep shell lean here; nested layouts can add nav.
    return children;
}
