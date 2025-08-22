import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28 flex flex-col items-center text-center gap-6">
      <span className="inline-flex items-center justify-center rounded-full bg-red-50 text-red-600 size-16">
        <CircleAlert className="size-8" />
      </span>
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-zinc-600">The page you’re looking for doesn’t exist or may have moved.</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    </div>
  );
}
