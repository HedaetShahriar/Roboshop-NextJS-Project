"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28 flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center justify-center rounded-full bg-amber-50 text-amber-700 size-16">
            <AlertTriangle className="size-8" />
          </span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-zinc-600">An unexpected error occurred. You can try again or go back home.</p>
            {process.env.NODE_ENV !== "production" && (
              <pre className="mt-4 max-w-full overflow-auto rounded bg-zinc-100 p-3 text-left text-xs text-zinc-700">
                {String(error?.message || error)}
              </pre>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
