'use client'

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { items, count, subtotal, removeItem, updateQty } = useCart();

  const NavLinks = () => (
    <>
      <Link href="/products" className="px-3 py-2 rounded-md hover:bg-zinc-100">Products</Link>
      {status === 'authenticated' && (
        <Link href="/dashboard/add-product" className="px-3 py-2 rounded-md hover:bg-zinc-100">Add Product</Link>
      )}
    </>
  );

  const dropdownRef = useRef(null); // mobile menu
  const cartRef = useRef(null); // cart dropdown (desktop)
  useEffect(() => {
    function onDocKey(e) {
      if (e.key === 'Escape') { setMenuOpen(false); setCartOpen(false); }
    }
    function onDocClick(e) {
      const clickedOutsideMenu = dropdownRef.current && !dropdownRef.current.contains(e.target);
      const clickedOutsideCart = cartRef.current && !cartRef.current.contains(e.target);
      if (menuOpen && clickedOutsideMenu) setMenuOpen(false);
      if (cartOpen && clickedOutsideCart) setCartOpen(false);
    }
    if (menuOpen || cartOpen) {
      document.addEventListener('keydown', onDocKey);
      document.addEventListener('click', onDocClick);
    }
    return () => {
      document.removeEventListener('keydown', onDocKey);
      document.removeEventListener('click', onDocClick);
    };
  }, [menuOpen, cartOpen]);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          🤖 <span className="hidden sm:inline">Roboshop</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <NavLinks />
          {/* Cart dropdown (desktop) */}
          <div className="relative" ref={cartRef}>
            <button
              className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-zinc-100"
              aria-label="Open cart"
              aria-haspopup="menu"
              aria-expanded={cartOpen}
              onClick={() => { setMenuOpen(false); setCartOpen(v => !v); }}
            >
              <ShoppingCart className="size-6" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            {cartOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-80 rounded-md border bg-white py-2 shadow-lg ring-1 ring-black/5">
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
                            <div className="text-xs text-zinc-500">${it.price.toFixed(2)}</div>
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) => updateQty(it.id, Number(e.target.value))}
                            className="w-14 rounded border px-2 py-1 text-sm"
                          />
                          <button className="text-xs text-red-600 hover:underline" onClick={() => removeItem(it.id)}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Subtotal</span>
                  <span className="text-sm font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="px-3 pb-2">
                  <Link href="/checkout" className="block w-full text-center rounded-md bg-blue-600 text-white py-2 text-sm hover:bg-blue-700" onClick={() => setCartOpen(false)}>
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
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
            <div role="menu" className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-2 shadow-lg ring-1 ring-black/5">
              {/* Cart summary (mobile) */}
              <div className="px-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="size-5" />
                      <span className="text-sm font-medium">Cart</span>
                    </div>
                    {count > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 max-h-64 overflow-auto">
                    {items.length === 0 ? (
                      <p className="text-xs text-zinc-500">Your cart is empty.</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((it) => (
                          <li key={it.id} className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {it.image && <img src={it.image} alt="" className="h-8 w-8 rounded object-cover" />}
                            <div className="flex-1">
                              <div className="text-xs font-medium line-clamp-1">{it.name}</div>
                              <div className="text-[11px] text-zinc-500">${it.price.toFixed(2)}</div>
                            </div>
                            <input
                              type="number"
                              min={1}
                              value={it.qty}
                              onChange={(e) => updateQty(it.id, Number(e.target.value))}
                              className="w-12 rounded border px-1 py-0.5 text-xs"
                            />
                            <button className="text-[11px] text-red-600 hover:underline" onClick={() => removeItem(it.id)}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-2">
                    <Link href="/checkout" className="block w-full text-center rounded-md bg-blue-600 text-white py-1.5 text-sm hover:bg-blue-700" onClick={() => setMenuOpen(false)}>
                      Checkout
                    </Link>
                  </div>
                </div>
              <div className="px-2">
                <NavLinks />
              </div>
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