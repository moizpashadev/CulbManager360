import { Skeleton } from "@/components/skeleton"

export default function MembersLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-3">
          <div className="grid grid-cols-5 gap-4">
            {["Member", "Branch", "Plan", "Status", ""].map((h) => (
              <Skeleton key={h} className="h-3 w-16" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-3 last:border-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-7 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
