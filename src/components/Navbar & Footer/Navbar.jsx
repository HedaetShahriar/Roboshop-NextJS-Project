'use client'

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          🤖 <span className="hidden sm:inline">Roboshop</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/products">Products</Link>
          </Button>
          {status === 'authenticated' ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/add-product">Add Product</Link>
              </Button>
              <Button onClick={() => signOut()}>Logout</Button>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User Avatar'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
            </>
          ) : (
            <Button onClick={() => signIn()} disabled={status === 'loading'}>
              {status === 'loading' ? '...' : 'Login'}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}