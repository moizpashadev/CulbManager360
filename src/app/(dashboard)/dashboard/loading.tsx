import { SkeletonCard } from "@/components/skeleton"
import { Skeleton } from "@/components/skeleton"

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <Skeleton className="h-4 w-40" />
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between border-b border-border px-6 py-3 last:border-0">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
