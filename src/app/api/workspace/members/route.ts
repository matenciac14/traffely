import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { logger } from "@/lib/logger"

const ALLOWED_ROLES = ["CREATIVO", "TRAFFICKER", "VIEWER"] as const

function isOwner(role: string | undefined) {
  return role === "OWNER" || role === "SUPER_ADMIN"
}

const inviteSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(ALLOWED_ROLES),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId || !isOwner(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const members = await db.user.findMany({
    where: { workspaceId: session.user.workspaceId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !isOwner(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { name, email, password, role } = parsed.data

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashed,
        role,
        workspaceId: session.user.workspaceId,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id!,
        action: "member.invite",
        diff: { invitedUserId: user.id, role, workspaceId: session.user.workspaceId },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    logger.error("workspace/members POST", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
