import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { invalidateSystemPromptCache } from "@/lib/ai/system-prompt"
import { logger } from "@/lib/logger"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ version: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { version } = await params
  const versionNum = parseInt(version)
  if (isNaN(versionNum)) return NextResponse.json({ error: "Versión inválida" }, { status: 400 })

  try {
    const aiCore = await db.aiCore.findFirst({ where: { isActive: true } })
    if (!aiCore) return NextResponse.json({ error: "No hay AI Core activo" }, { status: 404 })

    const targetVersion = await db.aiCoreVersion.findFirst({
      where: { aiCoreId: aiCore.id, version: versionNum },
    })
    if (!targetVersion) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 })

    // Guardar la versión actual antes de restaurar
    await db.aiCoreVersion.create({
      data: { aiCoreId: aiCore.id, systemPrompt: aiCore.systemPrompt, version: aiCore.version },
    })

    const restored = await db.aiCore.update({
      where: { id: aiCore.id },
      data: { systemPrompt: targetVersion.systemPrompt, version: aiCore.version + 1 },
      include: { versions: { orderBy: { version: "desc" }, take: 20 } },
    })

    invalidateSystemPromptCache()
    return NextResponse.json(restored)
  } catch (err) {
    logger.error("POST /api/admin/ai-core/versions/[version]/restore", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
