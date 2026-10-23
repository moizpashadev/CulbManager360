import type { LucideIcon } from "lucide-react"

export function MemberPageHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
