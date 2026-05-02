import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getAiClient, AI_MODEL_FAST } from "@/lib/ai/client"
import { decrypt } from "@/lib/utils/crypto"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/ratelimit"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const workspaceId = session.user.workspaceId

  // Rate limit: 5 planes de trabajo por workspace por día
  const rl = await rateLimit(`ai_workplan:${workspaceId}`, 5)
  if (!rl.allowed) {
    const resetIn = Math.ceil((rl.resetAt - Date.now()) / 1000 / 60)
    return NextResponse.json(
      { error: `Límite de planes de trabajo alcanzado. Disponible en ${resetIn} minutos.` },
      { status: 429 }
    )
  }

  try {
    const campaign = await db.campaign.findUnique({
      where: { id, workspaceId },
      select: {
        id: true,
        name: true,
        brief: true,
        presupuesto: true,
        empresa: { select: { nombre: true } },
        adSets: {
          orderBy: { orden: "asc" },
          include: {
            pieces: {
              orderBy: { orden: "asc" },
              select: {
                id: true,
                modelo: true,
                tipoPieza: true,
                angulo: true,
                estructuraCopy: true,
                formato: true,
                duracion: true,
              },
            },
          },
        },
        workspace: { select: { aiApiKey: true, globalAiEnabled: true } },
      },
    })

    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const allPieces = campaign.adSets.flatMap((as) => as.pieces)
    if (allPieces.length === 0) {
      return NextResponse.json({ error: "No hay piezas en esta campaña" }, { status: 400 })
    }

    const encryptedKey = campaign.workspace?.aiApiKey ?? null
    const workspaceAiKey = encryptedKey
      ? (() => { try { return decrypt(encryptedKey) } catch { return null } })()
      : null
    const canUseGlobalKey = !!campaign.workspace?.globalAiEnabled && !!process.env.ANTHROPIC_API_KEY
    const resolvedKey = workspaceAiKey || (canUseGlobalKey ? process.env.ANTHROPIC_API_KEY : undefined)

    // Mock si no hay API key
    if (!resolvedKey) {
      const MOCK_PRIORITIES = ["ALTA", "ALTA", "MEDIA", "MEDIA", "BAJA"]
      const suggestions = allPieces.map((p, i) => ({
        pieceId: p.id,
        modelo: p.modelo,
        tipoPieza: p.tipoPieza,
        priority: MOCK_PRIORITIES[i % MOCK_PRIORITIES.length] as string,
        days: p.tipoPieza?.toLowerCase().includes("video") ? 5 : 3,
        notes: "Estimación automática (sin IA activa).",
      }))
      return NextResponse.json({ suggestions })
    }

    const briefData = campaign.brief as Record<string, string> | null
    const presupuesto = campaign.presupuesto as Record<string, string> | null

    const piecesList = allPieces
      .map((p, i) =>
        `${i}. ${p.modelo ?? "—"} · ${p.tipoPieza ?? "—"} · ${p.formato ?? "—"}` +
        `${p.angulo ? ` · Ángulo: ${p.angulo}` : ""}` +
        `${p.estructuraCopy ? ` · Framework: ${p.estructuraCopy}` : ""}` +
        `${p.duracion ? ` · ${p.duracion}` : ""}`
      )
      .join("\n")

    const userPrompt = `Eres un director creativo que debe estimar el plan de trabajo de producción de piezas publicitarias para Meta Ads.

Campaña: ${campaign.name}
Empresa: ${campaign.empresa?.nombre ?? "—"}
Objetivo: ${briefData?.objetivoCampana ?? "—"}
Fecha inicio: ${presupuesto?.fechaInicio ?? "—"}
Fecha fin: ${presupuesto?.sinFechaFin === "true" ? "Sin fecha fin (evergreen)" : (presupuesto?.fechaFin ?? "—")}

PIEZAS (índice 0..${allPieces.length - 1}):
${piecesList}

Para cada pieza asigna:
- priority: URGENTE | ALTA | MEDIA | BAJA (según complejidad: video=alta, imagen simple=baja, carrusel=media)
- days: días hábiles de producción (video 15-30s: 3-5d, video 30-60s: 5-7d, imagen: 1-2d, carrusel: 2-3d)
- notes: una frase corta justificando la prioridad

Responde ÚNICAMENTE con JSON válido sin texto adicional:
[
  { "idx": 0, "priority": "ALTA", "days": 4, "notes": "..." }
]`

    const aiClient = getAiClient(resolvedKey)
    const response = await aiClient.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 1500,
      messages: [{ role: "user", content: userPrompt }],
    })

    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") throw new Error("Respuesta vacía")

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("Formato de respuesta inválido")

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      idx: number
      priority: string
      days: number
      notes: string
    }>

    const suggestions = parsed
      .map((item) => {
        const piece = allPieces[item.idx]
        if (!piece) return null
        return {
          pieceId: piece.id,
          modelo: piece.modelo,
          tipoPieza: piece.tipoPieza,
          priority: item.priority,
          days: item.days,
          notes: item.notes,
        }
      })
      .filter(Boolean)

    // Track AI usage
    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    await db.aiUsage.create({
      data: {
        workspaceId,
        campaignId: id,
        inputTokens,
        outputTokens,
        model: AI_MODEL_FAST,
        action: "work_plan",
        costUsd: (inputTokens * 5 + outputTokens * 25) / 1_000_000,
      },
    })

    return NextResponse.json({ suggestions })
  } catch (err) {
    logger.error("POST /api/campaigns/[id]/work-plan", err)
    return NextResponse.json({ error: "Error al generar plan de trabajo" }, { status: 500 })
  }
}
