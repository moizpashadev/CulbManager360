import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total]
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total]
  return [1, "…", current - 1, current, current + 1, "…", total]
}

export function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null

  const pages = getPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-1 border-t border-border px-6 py-4">
      <Link
        href={page > 1 ? buildHref(page - 1) : "#"}
        aria-disabled={page === 1}
        className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
          page === 1
            ? "pointer-events-none border-border/40 text-muted-foreground/40"
            : "border-border bg-white text-foreground hover:bg-muted/40"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm transition-colors ${
              p === page
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-foreground hover:bg-muted/40"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={page < totalPages ? buildHref(page + 1) : "#"}
        aria-disabled={page === totalPages}
        className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
          page === totalPages
            ? "pointer-events-none border-border/40 text-muted-foreground/40"
            : "border-border bg-white text-foreground hover:bg-muted/40"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>

      <span className="ml-2 text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
    </div>
  )
}
