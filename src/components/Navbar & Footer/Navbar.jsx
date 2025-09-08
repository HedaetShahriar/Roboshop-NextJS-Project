'use client'

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingCart, CircleUser } from "lucide-react";
import { usePathname } from "next/navigation";
import { formatBDT } from "@/lib/currency";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const { data: session, status } = useSession();
  const { items, count, subtotal, removeItem, updateQty } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const menuRef = useRef(null);
  const cartRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (isDashboard) return; // skip listeners when hidden
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (cartRef.current && !cartRef.current.contains(e.target)) setCartOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isDashboard]);

  const [nav, setNav] = useState({ siteName: 'Roboshop', headerLinks: [
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ] });
  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const res = await fetch('/api/public/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!canceled) {
          const defaults = [
            { label: 'Products', href: '/products' },
            { label: 'About', href: '/about' },
            { label: 'Contact', href: '/contact' },
          ];
          let headerLinks = (data?.navigation?.headerLinks?.length ? data.navigation.headerLinks : defaults).slice(0, 10);
          // Ensure About/Contact exist even if settings omitted them (avoid duplicates by href)
          const have = new Set(headerLinks.map(l => (l.href || '').toLowerCase()));
          defaults.forEach(d => { if (!have.has((d.href || '').toLowerCase())) headerLinks.push(d); });

          setNav({
            siteName: data?.siteName || 'Roboshop',
            headerLinks,
            logoUrl: data?.branding?.logoUrl || '',
          });
        }
      } catch {}
    }
    load();
    return () => { canceled = true; };
  }, []);

  const NavLinks = () => (
    <>
      {nav.headerLinks.map((l, idx) => (
  <Link key={idx} href={l.href} className="px-3 py-2 rounded-md hover:bg-zinc-100">{l.label}</Link>
      ))}
    </>
  );

  if (isDashboard) return null;

  return (
  <nav className="sticky top-0 z-50 w-full border-b bg-background">
  <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <div className="md:hidden relative" ref={menuRef}>
              <button
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
                aria-label="Toggle navigation menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => { setMenuOpen(v => !v); setCartOpen(false); setProfileOpen(false); }}
              >
                {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
              {menuOpen && (
                <div role="menu" className="absolute mt-2 w-56 rounded-md border bg-white py-2 shadow-lg ring-1 ring-black/5">
                  <div className="px-2">
                    <NavLinks />
                  </div>
                </div>
              )}
            </div>

            {/* Logo */}
            <Link href="/" className="text-2xl font-bold inline-flex items-center gap-2 text-primary">
              {nav.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nav.logoUrl} alt={nav.siteName} className="h-7 w-auto" />
              ) : (
                <>🤖</>
              )}
              <span className="hidden sm:inline">{nav.siteName}</span>
            </Link>
          </div>

          {/* Center: desktop nav links */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavLinks />
          </div>

          {/* Right: cart + profile */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={cartRef}>
            {/* Cart trigger */}
            <button
              className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-accent"
              aria-label="Open cart"
              aria-haspopup="menu"
              aria-expanded={cartOpen}
              onClick={() => { setCartOpen(v => !v); setMenuOpen(false); setProfileOpen(false); }}
            >
              <ShoppingCart className="size-6" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            {cartOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-72 rounded-md border bg-background py-2 shadow-lg ring-1 ring-black/5">
                <div className="px-3 pb-2 max-h-80 overflow-auto">
                  {items.length === 0 ? (
                    <p className="text-sm text-zinc-500">Your cart is empty.</p>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((it) => (
                        <li key={it.id} className="flex items-center gap-3">
                          {it.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt="" className="h-10 w-10 rounded object-cover" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium line-clamp-1">{it.name}</div>
                            <div className="text-xs text-zinc-500">{formatBDT(it.price)}</div>
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) => updateQty(it.id, Number(e.target.value))}
                            className="w-14 rounded border px-2 py-1 text-sm"
                          />
                          <button className="text-xs text-destructive hover:underline" onClick={() => removeItem(it.id)}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Subtotal</span>
                  <span className="text-sm font-semibold">{formatBDT(subtotal)}</span>
                </div>
                <div className="px-3 pb-2">
                  <Link
                    href="/checkout"
                    className="block w-full text-center rounded-md bg-blue-600 text-white py-2 text-sm hover:bg-blue-700"
                    onClick={async (e) => {
                      setCartOpen(false);
                      // try to persist cart to DB; ignore failures
                      try {
                        await fetch('/api/cart', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ items, subtotal })
                        });
                      } catch {}
                    }}
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}

            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                className="inline-flex items-center gap-2 rounded-full hover:bg-accent p-1"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => { setProfileOpen(v => !v); setMenuOpen(false); setCartOpen(false); }}
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User Avatar'}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                    <CircleUser className="size-6" />
                  </span>
                )}
              </button>
              {profileOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-56 rounded-md border bg-background py-2 shadow-lg ring-1 ring-black/5">
                  {status === 'authenticated' ? (
                    <>
                      <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-accent" onClick={() => setProfileOpen(false)}>My Profile</Link>
                      {session?.user?.role && session.user.role !== 'customer' && (
                        <Link
                          href={session.user.role === 'seller' ? '/dashboard/seller' : session.user.role === 'rider' ? '/dashboard/rider' : '/dashboard/admin'}
                          className="block px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => setProfileOpen(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link href="/my-orders" className="block px-3 py-2 text-sm hover:bg-accent" onClick={() => setProfileOpen(false)}>My Orders</Link>
                      <div className="mt-1 border-t" />
                      <div className="px-2 pt-2">
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => { setProfileOpen(false); signOut(); }}>
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="px-2">
                      <Button className="w-full" onClick={() => { setProfileOpen(false); signIn(); }} disabled={status === 'loading'}>
                        {status === 'loading' ? '...' : 'Sign in'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}