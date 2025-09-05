"use client";
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

// Reads the platform settings (public API) once and caches in memory for the session
let cached;
async function fetchSettings() {
  if (cached) return cached;
  try {
    const res = await fetch('/api/public/settings', { cache: 'no-store' });
    if (!res.ok) return (cached = null);
    const data = await res.json();
    cached = data;
    return data;
  } catch {
    cached = null;
    return null;
  }
}

export default function SmartLink({ prefetch: propPrefetch, children, ...rest }) {
  const [prefetch, setPrefetch] = useState(propPrefetch);
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (propPrefetch !== undefined) return; // Respect explicit prop
      const s = await fetchSettings();
      if (canceled) return;
      const mode = s?.performance?.prefetch || 'auto';
      // Map to Next.js Link prop: true | false | undefined
      if (mode === 'viewport') setPrefetch(true);
      else if (mode === 'off') setPrefetch(false);
      else setPrefetch(undefined);
    })();
    return () => { canceled = true; };
  }, [propPrefetch]);

  return (
    <NextLink prefetch={prefetch} {...rest}>
      {children}
    </NextLink>
  );
}
