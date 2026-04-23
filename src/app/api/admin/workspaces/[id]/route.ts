import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const adminId = session.user.id!

  try {
    const { action, value } = await req.json()

    if (action === "toggle") {
      const ws = await db.workspace.findUnique({ where: { id, isDeleted: false } })
      if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })
      await db.workspace.update({ where: { id }, data: { isActive: !ws.isActive } })
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: `workspace.${ws.isActive ? "deactivate" : "activate"}`,
          diff: { workspaceId: id, wasActive: ws.isActive },
        },
      })
    }

    if (action === "billing") {
      await db.workspace.update({ where: { id }, data: { billingStatus: value } })
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: "workspace.billing",
          diff: { workspaceId: id, billingStatus: value },
        },
      })
    }

    if (action === "meta") {
      const ws = await db.workspace.findUnique({ where: { id, isDeleted: false } })
      if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })
      await db.workspace.update({ where: { id }, data: { metaEnabled: !ws.metaEnabled } })
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: `workspace.meta.${ws.metaEnabled ? "disable" : "enable"}`,
          diff: { workspaceId: id } as object,
        },
      })
    }

    if (action === "delete") {
      // Soft delete
      await db.workspace.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date(), isActive: false },
      })
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: "workspace.delete",
          diff: { workspaceId: id },
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("admin/workspaces/[id]", err, { workspaceId: id })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
