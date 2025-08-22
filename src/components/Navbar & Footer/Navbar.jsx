'use client'

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/products" className="px-3 py-2 rounded-md hover:bg-zinc-100">Products</Link>
      {status === 'authenticated' && (
        <Link href="/dashboard/add-product" className="px-3 py-2 rounded-md hover:bg-zinc-100">Add Product</Link>
      )}
    </>
  );

  const dropdownRef = useRef(null);
  useEffect(() => {
    function onDocKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('keydown', onDocKey);
      document.addEventListener('click', onDocClick);
    }
    return () => {
      document.removeEventListener('keydown', onDocKey);
      document.removeEventListener('click', onDocClick);
    };
  }, [menuOpen]);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          🤖 <span className="hidden sm:inline">Roboshop</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavLinks />
          {status === 'authenticated' ? (
            <div className="flex items-center gap-3">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User Avatar'}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <Button size="sm" variant="outline" onClick={() => signOut()}>Logout</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => signIn()} disabled={status === 'loading'}>
              {status === 'loading' ? '...' : 'Login'}
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden relative" ref={dropdownRef}>
          <button
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-zinc-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-2 shadow-lg ring-1 ring-black/5"
            >
              <NavLinks />
              <div className="mt-2 border-t" />
              {status === 'authenticated' ? (
                <div className="px-2 pt-2 flex items-center gap-3">
                  {session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User Avatar'}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  )}
                  <Button className="flex-1" variant="outline" onClick={() => { setMenuOpen(false); signOut(); }}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="px-2 pt-2">
                  <Button className="w-full" onClick={() => { setMenuOpen(false); signIn(); }} disabled={status === 'loading'}>
                    {status === 'loading' ? '...' : 'Login'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}