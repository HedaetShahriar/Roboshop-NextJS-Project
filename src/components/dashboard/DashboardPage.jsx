export default function DashboardPage({ children, className = "", container = false }) {
  // Standardize vertical spacing across dashboard pages to match seller overview
  // Note: horizontal padding comes from DashboardShell <main> (p-4). We avoid extra px here.
  const base = `py-4 md:py-6 space-y-6 ${className}`;
  return (
    <div className={container ? `container mx-auto ${base}` : base}>
      {children}
    </div>
  );
}
