import { Skeleton } from "@/components/skeleton"

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="mb-1 h-7 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="p-6">
              <div className="flex h-32 items-end gap-1">
                {Array.from({ length: 14 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 animate-pulse rounded-t bg-muted"
                    style={{ height: `${20 + Math.random() * 70}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <Skeleton className="h-4 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between border-b border-border px-6 py-3 last:border-0">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
