'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <footer className="bg-zinc-900 text-zinc-400 py-8 mt-auto">
      <div className="container mx-auto text-center">
        <p className="mb-4">© {new Date().getFullYear()} Md. Hedaet Shahriar Himon. All rights reserved.</p>
        <nav className="flex justify-center items-center gap-4 text-sm">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/products" className="hover:text-white transition-colors">Products</Link>
          {session && (
            <Link href="/dashboard/add-product" className="hover:text-white transition-colors">Add Product</Link>
          )}
        </nav>
      </div>
    </footer>
  );
}