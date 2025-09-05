"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Menu, Home, User, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardNavbar({ role, onMenuClick, label }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const rolePill = role === 'admin'
    ? 'bg-violet-100 text-violet-800'
    : role === 'rider'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-amber-100 text-amber-800';

  const pathname = usePathname();
  const currentLabel = label ?? (() => {
    if (!pathname) return 'Dashboard';
    const path = pathname.replace(/\/$/, '');
    const parts = path.split('/').filter(Boolean);

    const pretty = (seg) => (seg || 'dashboard')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());

    // If not under /dashboard, show last segment nicely formatted
    if (parts[0] !== 'dashboard') {
      return pretty(parts[parts.length - 1]);
    }

    // Under /dashboard
    const roleLeaves = new Set(['seller', 'rider', 'admin']);
    if (parts.length === 1) return 'Dashboard'; // /dashboard

    // /dashboard/{role}[/**]
    if (roleLeaves.has(parts[1])) {
      if (parts.length === 2) return 'Dashboard'; // /dashboard/{role}
      return pretty(parts[2]); // /dashboard/{role}/{section}
    }

    // /dashboard/{section}
    return pretty(parts[1]);
  })();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="w-full px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button className="md:hidden -ml-2 mr-1 rounded p-2 hover:bg-zinc-100" onClick={onMenuClick} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="hidden sm:inline text-base font-semibold">Roboshop</span>
            <span className="hidden sm:inline text-sm text-gray-500">/ {currentLabel}</span>
          </Link>
          <span className={`text-xs px-2 py-0.5 rounded capitalize ${rolePill}`}>{role}</span>
        </div>
        <div className="relative" ref={ref}>
          <button className="inline-flex items-center gap-2 rounded-full hover:bg-zinc-100 p-1 ring-1 ring-zinc-200" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}>
            {status === 'loading' ? (
              <span className="inline-flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-zinc-100" />
            ) : session?.user?.image ? (
              <Image src={session.user.image} alt="" width={28} height={28} className="rounded-full" />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">👤</span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-2 shadow-lg ring-1 ring-black/5">
              <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"><Home className="size-4" /> Back to store</Link>
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"><User className="size-4" /> My Profile</Link>
              <div className="mt-1 border-t" />
              <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"><Home className="size-4" /> Back to store</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
