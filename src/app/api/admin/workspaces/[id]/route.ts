import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"
import { z } from "zod"

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  plan: z.string().optional(),
  setupFee: z.number().min(0).optional(),
  monthlyFee: z.number().min(0).optional(),
  billingStatus: z.enum(["pending", "paid", "overdue"]).optional(),
  notes: z.string().max(2000).optional(),
  billingPlan: z.string().max(100).optional(),
  billingCycle: z.enum(["monthly", "annual"]).optional(),
  nextBillingDate: z.string().optional(),
  isDeleted: z.boolean().optional(),
  // action-based fields (existing pattern)
  action: z.string().optional(),
  value: z.unknown().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const adminId = session.user.id!

  try {
    const body = await req.json()
    const result = updateWorkspaceSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Datos inválidos", details: result.error.flatten() }, { status: 400 })
    }
    const { action, value } = result.data

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
      const billingStatus = String(value)
      await db.workspace.update({ where: { id }, data: { billingStatus } })
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: "workspace.billing",
          diff: { workspaceId: id, billingStatus } as object,
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

    if (action === "globalAi") {
      const ws = await db.workspace.findUnique({ where: { id, isDeleted: false } })
      if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 })
      await db.workspace.update({ where: { id }, data: { globalAiEnabled: !ws.globalAiEnabled } })
      await db.auditLog.create({
        data: {
          userId: adminId,
          action: `workspace.globalAi.${ws.globalAiEnabled ? "disable" : "enable"}`,
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
