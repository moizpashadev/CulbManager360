import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { ArrowLeft } from "lucide-react"
import { CardActions } from "./card-actions"

type Props = { params: { id: string } }

export default async function MemberCardPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    select: { id: true, firstName: true, lastName: true, phone: true },
  })
  if (!member) notFound()

  const memberName = `${member.firstName} ${member.lastName}`
  const imagePath = `/api/members/${member.id}/card-image`

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/dashboard/members/${member.id}`}>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Membership Card</h1>
          <p className="text-sm text-muted-foreground">Download or send it straight to {memberName}&apos;s WhatsApp</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePath}
          alt={`Membership card for ${memberName}`}
          className="w-full max-w-xs rounded-2xl border border-border shadow-lg"
        />
        <CardActions memberName={memberName} memberPhone={member.phone} imagePath={imagePath} />
      </div>
    </div>
  )
}
