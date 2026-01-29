import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  const rowCount = 10;
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      {/* Header skeleton (filters area) */}
      <div className="shrink-0">
        <div className="rounded-md border bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-40" />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton: mobile cards and desktop table */}
      <div className="min-h-0 flex-1 flex flex-col gap-2">
        {/* Mobile skeleton list */}
        <div className="sm:hidden space-y-2 overflow-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-md border bg-white p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <div className="mt-1"><Skeleton className="h-3 w-28" /></div>
                  <div className="mt-1"><Skeleton className="h-3 w-40" /></div>
                  <div className="mt-1"><Skeleton className="h-3 w-24" /></div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table skeleton with sticky header */}
        <div className="hidden sm:block min-h-0 flex-1 overflow-auto rounded border bg-white">
          <table className="min-w-full table-auto text-xs sm:text-sm">
            <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
              <tr className="text-left">
                <th className="px-1 py-2 text-[11px] text-muted-foreground">
                  <div className="h-6 w-6 rounded border bg-white" />
                </th>
                <th className="px-2 py-2 font-medium text-right w-[1%] whitespace-nowrap">#</th>
                <th className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Info</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Added</th>
                <th className="px-3 py-2 font-medium text-right">Price</th>
                <th className="px-3 py-2 font-medium text-center">Stock</th>
                <th className="px-3 py-2 font-medium text-center">Rating</th>
                <th className="px-2 sm:px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <tr key={i} className="border-t odd:bg-zinc-50/40">
                  <td className="px-1 py-2">
                    <div className="h-5 w-5 rounded border bg-white" />
                  </td>
                  <td className="px-2 py-2 text-right w-[1%] whitespace-nowrap text-[11px] text-muted-foreground">
                    <Skeleton className="h-4 w-6 ml-auto" />
                  </td>
                  <td className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2 w-[64px]">
                    <Skeleton className="h-10 w-10" />
                  </td>
                  <td className="pl-1 sm:pl-2 pr-2 sm:pr-3 py-2">
                    <Skeleton className="h-4 w-48" />
                    <div className="mt-1"><Skeleton className="h-3 w-24" /></div>
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-28" />
                    <div className="mt-1"><Skeleton className="h-3 w-20" /></div>
                  </td>
                  <td className="px-3 py-2">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right">
                    <Skeleton className="h-7 w-16 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer chips skeleton */}
      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap pb-1">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-6 w-48 rounded-full" />
      </div>
    </div>
  );
}
