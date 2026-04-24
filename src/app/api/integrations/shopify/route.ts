import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const integration = await db.shopifyIntegration.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { shop: true, scope: true, isActive: true, lastSyncAt: true },
  })

  if (!integration || !integration.isActive) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    shop: integration.shop,
    scope: integration.scope,
    lastSyncAt: integration.lastSyncAt,
  })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    await db.shopifyIntegration.updateMany({
      where: { workspaceId: session.user.workspaceId },
      data: { isActive: false },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Shopify disconnect", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
