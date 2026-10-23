import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MemberPageHeader } from "@/components/member-page-header"
import { Calendar, Grid3x3, ChevronRight, CalendarCheck } from "lucide-react"

export default function PortalBookPage() {
  return (
    <div className="space-y-6">
      <MemberPageHeader icon={CalendarCheck} title="Book" description="Reserve a class or a court" />

      <div className="space-y-3">
        <Link href="/portal/classes">
          <Card className="transition-colors hover:border-primary/40 hover:bg-primary/5">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Classes</p>
                <p className="text-xs text-muted-foreground">Book a spot in an upcoming group class</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/courts">
          <Card className="transition-colors hover:border-primary/40 hover:bg-primary/5">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Grid3x3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Courts</p>
                <p className="text-xs text-muted-foreground">Reserve a time slot on a court</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
