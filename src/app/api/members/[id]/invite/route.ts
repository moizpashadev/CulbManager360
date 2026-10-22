import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { sendInviteEmail } from "@/lib/member-auth/send-invite-email"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, props: Params) {
  const params = await props.params
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  if (!member.email) {
    return NextResponse.json({ error: "This member has no email on file" }, { status: 400 })
  }

  // If they already have a portal account (e.g. standalone signup), link
  // them immediately — otherwise the link happens automatically the first
  // time they verify an OTP with this email.
  const account = await prisma.memberAccount.findUnique({ where: { email: member.email } })
  if (account) {
    await prisma.memberGymLink.upsert({
      where: {
        accountId_tenantId_memberId: {
          accountId: account.id,
          tenantId: member.tenantId,
          memberId: member.id,
        },
      },
      update: {},
      create: {
        accountId: account.id,
        tenantId: member.tenantId,
        memberId: member.id,
        status: "ACTIVE",
      },
    })
  }

  await sendInviteEmail(member.email, member.firstName, session.tenantName)

  return NextResponse.json({ ok: true, alreadyLinked: !!account })
}
