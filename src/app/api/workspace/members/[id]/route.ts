import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"

function isOwner(role: string | undefined) {
  return role === "OWNER" || role === "SUPER_ADMIN"
}

const ALLOWED_ROLES = ["CREATIVO", "TRAFFICKER", "VIEWER"] as const

const patchSchema = z.object({
  role: z.enum(ALLOWED_ROLES).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId || !isOwner(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes modificar tu propio rol" }, { status: 400 })
  }

  const target = await db.user.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
    select: { id: true, role: true, name: true },
  })
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "No puedes modificar a otro propietario" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const data: Record<string, unknown> = {}
    if (parsed.data.role !== undefined) data.role = parsed.data.role
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id!,
        action: "member.update",
        diff: { targetUserId: id, workspaceId: session.user.workspaceId } as object,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    logger.error("workspace/members/[id] PATCH", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId || !isOwner(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })
  }

  const target = await db.user.findFirst({
    where: { id, workspaceId: session.user.workspaceId },
    select: { id: true, role: true, name: true },
  })
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "No puedes eliminar a un propietario" }, { status: 403 })
  }

  await db.user.update({
    where: { id },
    data: { workspaceId: null, isActive: false },
  })

  await db.auditLog.create({
    data: {
      userId: session.user.id!,
      action: "member.remove",
      diff: { removedUserId: id, workspaceId: session.user.workspaceId },
    },
  })

  return NextResponse.json({ ok: true })
}
