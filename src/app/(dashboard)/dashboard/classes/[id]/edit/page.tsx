import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { ClassEditForm } from "./class-edit-form"

type Props = { params: { id: string } }

export default async function EditClassPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const [cls, trainers] = await Promise.all([
    prisma.classSchedule.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    }),
    prisma.staff.findMany({
      where: { tenantId: session.tenantId, role: "TRAINER", isActive: true },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  if (!cls) notFound()

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/classes">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Edit Class</h1>
      </div>
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <ClassEditForm
          classId={cls.id}
          trainers={trainers}
          defaultValues={{
            title: cls.title,
            description: cls.description ?? "",
            instructorId: cls.instructorId ?? "",
            dayOfWeek: String(cls.dayOfWeek),
            startTime: cls.startTime,
            endTime: cls.endTime,
            capacity: String(cls.capacity),
            isActive: cls.isActive,
          }}
        />
      </div>
    </div>
  )
}
