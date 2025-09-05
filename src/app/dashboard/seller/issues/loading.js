'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
	return (
		<div className="space-y-4 p-2">
			<div className="h-7 w-40"><Skeleton className="h-7 w-40" /></div>
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="border rounded bg-white p-4 space-y-3">
					<div className="flex items-center justify-between gap-2">
						<Skeleton className="h-5 w-48" />
						<Skeleton className="h-6 w-24" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-4 w-56" />
					</div>
					<div className="space-y-1">
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-[90%]" />
						<Skeleton className="h-3 w-[80%]" />
					</div>
				</div>
			))}
		</div>
	)
}

