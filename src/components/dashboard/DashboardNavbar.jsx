"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function DashboardNavbar({ role }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-lg font-semibold">Dashboard</Link>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 capitalize">{role}</span>
        </div>
        <div className="relative" ref={ref}>
          <button className="inline-flex items-center gap-2 rounded-full hover:bg-zinc-100 p-1" onClick={() => setOpen(v => !v)}>
            {session?.user?.image ? (
              <Image src={session.user.image} alt="" width={28} height={28} className="rounded-full" />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">👤</span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-2 shadow-lg ring-1 ring-black/5">
              <Link href="/" className="block px-3 py-2 text-sm hover:bg-zinc-50">Back to store</Link>
              <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-zinc-50">My Profile</Link>
              <div className="mt-1 border-t" />
              <button className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-50" onClick={() => signOut()}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
