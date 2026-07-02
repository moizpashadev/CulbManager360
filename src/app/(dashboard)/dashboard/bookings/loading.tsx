import { Skeleton } from "@/components/skeleton"

export default function BookingsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <div className="flex border-b border-border">
          <Skeleton className="m-3 h-8 w-24 rounded-md" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 border-l border-border p-3">
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex border-b border-border last:border-0">
            <div className="w-24 border-r border-border p-3">
              <Skeleton className="h-3 w-14" />
            </div>
            {[0, 1, 2].map((j) => (
              <div key={j} className="flex-1 border-l border-border p-2">
                {i % 3 === 0 && j === 1 && (
                  <Skeleton className="h-10 w-full rounded-md" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
