import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { invalidateSystemPromptCache } from "@/lib/ai/system-prompt"
import { SYSTEM_PROMPT } from "@/lib/ai/client"
import { logger } from "@/lib/logger"

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const aiCore = await db.aiCore.findFirst({
    where: { isActive: true },
    include: { versions: { orderBy: { version: "desc" }, take: 20 } },
  })

  if (!aiCore) {
    // Sin AiCore en DB — devuelve el prompt hardcodeado para que la UI lo muestre pre-cargado
    return NextResponse.json({ id: null, systemPrompt: SYSTEM_PROMPT, version: 0, versions: [], isFallback: true })
  }

  return NextResponse.json(aiCore)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  try {
    const { systemPrompt } = await req.json()
    if (!systemPrompt?.trim()) return NextResponse.json({ error: "systemPrompt requerido" }, { status: 400 })

    const existing = await db.aiCore.findFirst({ where: { isActive: true } })

    if (existing) {
      // Guardar versión anterior antes de actualizar
      await db.aiCoreVersion.create({
        data: {
          aiCoreId: existing.id,
          systemPrompt: existing.systemPrompt,
          version: existing.version,
        },
      })
      const updated = await db.aiCore.update({
        where: { id: existing.id },
        data: { systemPrompt: systemPrompt.trim(), version: existing.version + 1 },
        include: { versions: { orderBy: { version: "desc" }, take: 20 } },
      })
      invalidateSystemPromptCache()
      return NextResponse.json(updated)
    } else {
      // Primer AiCore — crear uno nuevo
      const created = await db.aiCore.create({
        data: { systemPrompt: systemPrompt.trim(), version: 1, isActive: true },
        include: { versions: { orderBy: { version: "desc" }, take: 20 } },
      })
      invalidateSystemPromptCache()
      return NextResponse.json(created)
    }
  } catch (err) {
    logger.error("PATCH /api/admin/ai-core", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
