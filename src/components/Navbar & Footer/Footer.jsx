'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (pathname?.startsWith('/dashboard')) return null;

    const [data, setData] = useState({ siteName: 'Roboshop', footerLinks: [], socialLinks: [] });
    useEffect(() => {
      let canceled = false;
      (async () => {
        try {
          const res = await fetch('/api/public/settings');
          if (!res.ok) return;
          const s = await res.json();
          if (!canceled) setData({
            siteName: s?.siteName || 'Roboshop',
            footerLinks: s?.navigation?.footerLinks || [],
            socialLinks: s?.navigation?.socialLinks || [],
          });
        } catch {}
      })();
      return () => { canceled = true; };
    }, []);
    return (
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xl font-bold">{data.siteName}</div>
              <p className="text-sm text-zinc-600 mt-2">Your one-stop shop for robotics parts!</p>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Explore</div>
              <ul className="space-y-2 text-sm">
                {(data.footerLinks || []).map((l, i) => (
                  <li key={i}><Link href={l.href} className="hover:underline">{l.label}</Link></li>
                ))}
                {(!data.footerLinks || data.footerLinks.length === 0) && (
                  <>
                    <li><Link href="/products" className="hover:underline">Products</Link></li>
                    <li><Link href="/about" className="hover:underline">About</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Follow</div>
              <ul className="space-y-2 text-sm">
                {(data.socialLinks || []).map((l, i) => (
                  <li key={i}><Link href={l.href} className="hover:underline">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 text-xs text-zinc-500">© {new Date().getFullYear()} {data.siteName}. All rights reserved.</div>
        </div>
      </footer>
    );
}