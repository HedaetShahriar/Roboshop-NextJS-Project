"use client";
import NextLink, { type LinkProps } from "next/link";
import { useEffect, useState, type ReactNode } from "react";

interface Settings {
  performance?: {
    prefetch?: "auto" | "viewport" | "off";
  };
}

// Reads the platform settings (public API) once and caches in memory for the session
let cached: Settings | null | undefined;

async function fetchSettings(): Promise<Settings | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch("/api/public/settings", { cache: "no-store" });
    if (!res.ok) return (cached = null);
    const data = await res.json();
    cached = data;
    return data;
  } catch {
    cached = null;
    return null;
  }
}

interface SmartLinkProps extends Omit<LinkProps, "prefetch"> {
  prefetch?: boolean;
  children?: ReactNode;
  className?: string;
}

export default function SmartLink({
  prefetch: propPrefetch,
  children,
  ...rest
}: SmartLinkProps) {
  const [prefetch, setPrefetch] = useState<boolean | undefined>(propPrefetch);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (propPrefetch !== undefined) return; // Respect explicit prop
      const s = await fetchSettings();
      if (canceled) return;
      const mode = s?.performance?.prefetch || "auto";
      // Map to Next.js Link prop: true | false | undefined
      if (mode === "viewport") setPrefetch(true);
      else if (mode === "off") setPrefetch(false);
      else setPrefetch(undefined);
    })();
    return () => {
      canceled = true;
    };
  }, [propPrefetch]);

  return (
    <NextLink prefetch={prefetch} {...rest}>
      {children}
    </NextLink>
  );
}
