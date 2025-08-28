"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, Package, MessageSquare, PlusSquare, Bike, Shield, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { usePathname } from "next/navigation";
import DashboardNavbar from "./DashboardNavbar";

const iconFor = (label) => {
  const key = (label || '').toLowerCase();
  if (key.includes('overview')) return LayoutDashboard;
  if (key.includes('order')) return Package;
  if (key.includes('issue')) return MessageSquare;
  if (key.includes('add')) return PlusSquare;
  if (key.includes('rider')) return Bike;
  if (key.includes('admin')) return Shield;
  return LayoutDashboard;
};

export default function DashboardShell({ role, nav, children }) {
  const [open, setOpen] = useState(false); // mobile drawer
  // Sidebar expanded state for md and above (desktop collapsible too)
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  const pretty = (seg) => (seg || 'dashboard')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

  // Prefer matching a nav link to derive label, otherwise fallback to pathname parsing
  const derivedLabel = (() => {
    if (Array.isArray(nav)) {
      const found = nav.find((l) => l.href === pathname);
      if (found?.label) return found.label;
    }
    if (!pathname) return 'Dashboard';
    const path = pathname.replace(/\/$/, '');
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'dashboard') return pretty(parts[parts.length - 1]);
    const roleLeaves = new Set(['seller', 'rider', 'admin']);
    if (parts.length === 1) return 'Dashboard';
    if (roleLeaves.has(parts[1])) {
      if (parts.length === 2) return 'Dashboard';
      return pretty(parts[2]);
    }
    return pretty(parts[1]);
  })();

  return (
    <div className="min-h-dvh bg-zinc-50">
  <DashboardNavbar role={role} label={derivedLabel} onMenuClick={() => setOpen(true)} />

  {/* Layout area below sticky header (h-14). Fix height to viewport under header. */}
  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] h-[calc(100dvh-3.5rem-1px)]">
        {/* Mobile overlay */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
        )}

    {/* Sidebar: mobile drawer, md+ collapsible/expandable */}
    <aside
          className={
            [
              // Base positioning
      "z-50 md:z-auto",
              // Mobile: off-canvas
      "fixed md:sticky top-14 left-0 md:top-14 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] md:self-start w-60",
              "bg-white border-r",
              // Transition for mobile
              open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
              // md+ width based on expanded state
              expanded ? "md:w-60" : "md:w-16",
              "transition-transform"
            ].join(' ')
          }
        >
          <nav className="h-full overflow-y-auto py-2">
            <div
              className={[
                "hidden md:grid items-center text-xs uppercase tracking-wide text-gray-500",
                expanded ? "grid-cols-[1fr_auto] px-3" : "grid-cols-[1fr_auto] px-2"
              ].join(' ')}
            >
              <span className="truncate">Menu</span>
              {/* md+ collapse/expand toggle */}
              <button
                type="button"
                className="justify-self-end hidden md:inline-flex items-center rounded p-1 hover:bg-zinc-100 shrink-0"
                aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                onClick={() => setExpanded(v => !v)}
              >
                {expanded ? <PanelLeftClose className="size-4 shrink-0" /> : <PanelLeftOpen className="size-4 shrink-0" />}
              </button>
            </div>
            <ul className="space-y-1 p-2 md:p-1">
              {nav.map((l) => {
                const Icon = iconFor(l.label);
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={[
                        "flex items-center gap-3 rounded px-3 py-2 text-sm",
                        active ? "bg-zinc-900 text-white hover:bg-zinc-900" : "hover:bg-zinc-50"
                      ].join(' ')}
                    >
                      <Icon className={[
                        "size-4 shrink-0",
                        active ? "text-white" : "text-gray-700"
                      ].join(' ')} />
                      <span className={[
                        open ? "inline" : "hidden",   // mobile: show when drawer is open
                        expanded ? "md:inline" : "md:hidden" // md+ toggle by expand state
                      ].join(' ')}>
                        {l.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

  {/* Main content fills height; children control their own scroll. */}
  <main className="h-full p-4 overflow-hidden flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
