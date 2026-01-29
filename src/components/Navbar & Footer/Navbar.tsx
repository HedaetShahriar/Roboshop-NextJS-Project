"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useCallback } from "react";
import { Menu, X, ShoppingCart, CircleUser, Search, Phone, Mail } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { formatBDT } from "@/lib/currency";

interface NavLink {
  label: string;
  href: string;
}

interface NavState {
  siteName: string;
  headerLinks: NavLink[];
  logoUrl?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname?.startsWith("/dashboard");
  const { data: session, status } = useSession();
  const { items, count, subtotal, removeItem, updateQty } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicking outside to close menus
  const onDocClick = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
    if (cartRef.current && !cartRef.current.contains(target)) setCartOpen(false);
    if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
  }, []);

  useEffect(() => {
    if (isDashboard) return;
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isDashboard, onDocClick]);

  const [nav, setNav] = useState<NavState>({
    siteName: "Roboshop",
    headerLinks: [
      { label: "Products", href: "/products" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  });

  // Load Settings
  useEffect(() => {
    let canceled = false;
    async function load(): Promise<void> {
      try {
        const res = await fetch("/api/public/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (!canceled) {
          const defaults: NavLink[] = [
            { label: "Products", href: "/products" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ];
          
          const headerLinks: NavLink[] = (data?.navigation?.headerLinks?.length
            ? data.navigation.headerLinks
            : defaults
          ).slice(0, 10);

          // Merge defaults if not present (logic preserved from original)
          const have = new Set(headerLinks.map((l: NavLink) => (l.href || "").toLowerCase()));
          defaults.forEach((d) => {
            if (!have.has((d.href || "").toLowerCase())) headerLinks.push(d);
          });

          setNav({
            siteName: data?.siteName || "Roboshop",
            headerLinks,
            logoUrl: data?.branding?.logoUrl || "",
          });
        }
      } catch {
        /* ignore */
      }
    }
    load();
    return () => { canceled = true; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMenuOpen(false); // Close mobile menu if open
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      // Sync cart with database before navigation
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, subtotal }),
      });
      setCartOpen(false);
      router.push("/checkout");
    } catch (error) {
      console.error("Failed to sync cart", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // NavLinks Component
  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {nav.headerLinks.map((l, idx) => (
        <Link
          key={idx}
          href={l.href}
          onClick={onNavigate}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            pathname === l.href
              ? "text-blue-600"
              : "text-gray-700 hover:text-blue-600"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </>
  );

  if (isDashboard || !mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex h-9 items-center justify-between text-xs">
            <div className="hidden sm:flex items-center gap-4 text-gray-600">
              <a href="tel:+8801700000000" className="flex items-center gap-1 hover:text-blue-600">
                <Phone className="size-3" />
                <span>+880 1700-000000</span>
              </a>
              <a href="mailto:info@roboshop.com" className="flex items-center gap-1 hover:text-blue-600">
                <Mail className="size-3" />
                <span>info@roboshop.com</span>
              </a>
            </div>
            <div className="flex items-center gap-4 text-gray-600 ml-auto">
              {status === "authenticated" ? (
                <>
                  <Link href="/my-orders" className="hover:text-blue-600">Track Order</Link>
                  {session?.user?.role && session.user.role !== "customer" && (
                    <Link
                      href={
                        session.user.role === "seller"
                          ? "/dashboard/seller"
                          : session.user.role === "rider"
                            ? "/dashboard/rider"
                            : "/dashboard/admin"
                      }
                      className="hover:text-blue-600"
                    >
                      Dashboard
                    </Link>
                  )}
                </>
              ) : (
                <button onClick={() => signIn()} className="hover:text-blue-600">
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: mobile menu + logo */}
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <div className="lg:hidden relative" ref={menuRef}>
                <button
                  className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setCartOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
                {menuOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <div className="px-2 flex flex-col">
                      <NavLinks onNavigate={() => setMenuOpen(false)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Logo */}
              <Link
                href="/"
                className="text-xl font-bold inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                {nav.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nav.logoUrl}
                    alt={nav.siteName}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">R</span>
                    </div>
                    <span className="hidden sm:inline text-gray-900">{nav.siteName}</span>
                  </div>
                )}
              </Link>
            </div>

            {/* Center: Search bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full h-10 pl-4 pr-12 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-10 px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="size-5" />
                </button>
              </div>
            </form>

            {/* Right: nav links + cart + profile */}
            <div className="flex items-center gap-1">
              <div className="hidden lg:flex items-center">
                <NavLinks />
              </div>

              {/* Cart */}
              <div className="relative" ref={cartRef}>
                <button
                  className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                  onClick={() => {
                    setCartOpen((v) => !v);
                    setMenuOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  <ShoppingCart className="size-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
                {cartOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white py-2 shadow-xl z-50">
                    <div className="px-4 pb-2 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Shopping Cart</h3>
                    </div>
                    <div className="px-4 py-2 max-h-80 overflow-auto">
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">Your cart is empty</p>
                      ) : (
                        <ul className="space-y-3">
                          {items.map((it) => (
                            <li key={it.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                              {it.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={it.image}
                                  alt=""
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">{it.name}</div>
                                <div className="text-sm text-blue-600 font-semibold">{formatBDT(it.price)}</div>
                              </div>
                              <input
                                type="number"
                                min={1}
                                value={it.qty}
                                onChange={(e) => updateQty(it.id, Number(e.target.value))}
                                className="w-14 rounded-lg border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                                onClick={() => removeItem(it.id)}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {items.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
                          <span className="text-sm font-medium text-gray-600">Subtotal</span>
                          <span className="text-lg font-bold text-blue-600">{formatBDT(subtotal)}</span>
                        </div>
                        <div className="px-4 pb-2">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                          >
                            {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  className="inline-flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 text-gray-600 hover:text-blue-600"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setMenuOpen(false);
                    setCartOpen(false);
                  }}
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-blue-100"
                    />
                  ) : (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-2 ring-gray-200">
                      <CircleUser className="size-5" />
                    </span>
                  )}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-xl z-50">
                    {status === "authenticated" ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                        </div>
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600" onClick={() => setProfileOpen(false)}>
                          My Profile
                        </Link>
                        <Link href="/my-orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600" onClick={() => setProfileOpen(false)}>
                          My Orders
                        </Link>
                        {session?.user?.role && session.user.role !== "customer" && (
                          <Link
                            href={session.user.role === "seller" ? "/dashboard/seller" : session.user.role === "rider" ? "/dashboard/rider" : "/dashboard/admin"}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                            onClick={() => setProfileOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        <div className="mt-1 border-t border-gray-100" />
                        <div className="px-3 pt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            onClick={() => { setProfileOpen(false); signOut(); }}
                          >
                            Sign Out
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-2">
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setProfileOpen(false); signIn(); }} disabled={status === "loading"}>
                          {status === "loading" ? "..." : "Sign In"}
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-2">
                          New customer?{" "}
                          <Link href="/register" className="text-blue-600 hover:underline" onClick={() => setProfileOpen(false)}>
                            Register here
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile search */}
      <div className="md:hidden px-4 py-2 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full h-10 pl-4 pr-12 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" className="absolute right-0 top-0 h-10 px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors">
            <Search className="size-5" />
          </button>
        </form>
      </div>
    </header>
  );
}