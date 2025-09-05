'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-28 mt-2" />
            <Skeleton className="h-10 w-24 mt-4" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0,1].map((i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
