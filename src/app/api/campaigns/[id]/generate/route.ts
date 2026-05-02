import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getAiClient, AI_MODEL } from "@/lib/ai/client"
import { getActiveSystemPrompt } from "@/lib/ai/system-prompt"
import { rateLimit } from "@/lib/ratelimit"
import { decrypt } from "@/lib/utils/crypto"
import { logger } from "@/lib/logger"

interface EmpresaIdentidad {
  tono: string | null
  publicoObjetivo: string | null
  propuestasValor: string | null
  palabrasProhibidas: string | null
  instruccionesExtra: string | null
  contextoNegocio: string | null
  reglasLegales: string | null
  eventosKey: string | null
  industria: string | null
  modeloNegocio: string | null
  ticketPromedio: string | null
  cicloVenta: string | null
  temporadasClave: string | null
  equipoCreativo: string | null
  metaPrincipal: string | null
}

function buildSystemPrompt(
  basePrompt: string,
  aiProfile: Record<string, string> | null,
  empresaIdentidad?: EmpresaIdentidad | null,
  campaignOverrides?: { tono?: string; publicoObjetivo?: string }
): string {
  const sections: string[] = [basePrompt]

  // Identidad de empresa (Fase 12 — prioridad sobre aiProfile del workspace)
  if (empresaIdentidad) {
    if (empresaIdentidad.contextoNegocio?.trim())
      sections.push(`\n## CONTEXTO DEL NEGOCIO\n${empresaIdentidad.contextoNegocio.trim()}`)

    // Tono: brief de campaña gana sobre identidad de empresa (permite tono disruptivo por campaña)
    const tonoFinal = campaignOverrides?.tono?.trim() || empresaIdentidad.tono
    if (tonoFinal?.trim())
      sections.push(`\n## TONO Y VOZ DE LA MARCA\n${tonoFinal.trim()}`)

    // Público: brief de campaña puede segmentar diferente al público habitual de la marca
    const publicoFinal = campaignOverrides?.publicoObjetivo?.trim() || empresaIdentidad.publicoObjetivo
    if (publicoFinal?.trim())
      sections.push(`\n## PÚBLICO OBJETIVO DEL CLIENTE\n${publicoFinal.trim()}`)
    if (empresaIdentidad.propuestasValor?.trim())
      sections.push(`\n## PROPUESTAS DE VALOR FIJAS (incluir siempre que aplique)\n${empresaIdentidad.propuestasValor.trim()}`)
    if (empresaIdentidad.palabrasProhibidas?.trim())
      sections.push(`\n## PALABRAS/FRASES PROHIBIDAS\n${empresaIdentidad.palabrasProhibidas.trim()}`)
    if (empresaIdentidad.reglasLegales?.trim())
      sections.push(`\n## REGLAS LEGALES Y RESTRICCIONES DE LA INDUSTRIA\n${empresaIdentidad.reglasLegales.trim()}`)
    if (empresaIdentidad.eventosKey?.trim())
      sections.push(`\n## EVENTOS Y FECHAS CLAVE DE LA EMPRESA\n${empresaIdentidad.eventosKey.trim()}`)
    if (empresaIdentidad.industria?.trim())
      sections.push(`\n## INDUSTRIA Y CATEGORÍA\n${empresaIdentidad.industria.trim()}`)
    if (empresaIdentidad.modeloNegocio?.trim())
      sections.push(`\n## MODELO DE NEGOCIO\n${empresaIdentidad.modeloNegocio.trim()}`)
    if (empresaIdentidad.ticketPromedio?.trim())
      sections.push(`\n## TICKET PROMEDIO\n${empresaIdentidad.ticketPromedio.trim()}`)
    if (empresaIdentidad.cicloVenta?.trim())
      sections.push(`\n## CICLO DE VENTA\n${empresaIdentidad.cicloVenta.trim()}`)
    if (empresaIdentidad.temporadasClave?.trim())
      sections.push(`\n## TEMPORADAS Y MOMENTOS CLAVE\n${empresaIdentidad.temporadasClave.trim()}`)
    if (empresaIdentidad.metaPrincipal?.trim())
      sections.push(`\n## META PRINCIPAL DE CAMPAÑAS\n${empresaIdentidad.metaPrincipal.trim()}`)
    if (empresaIdentidad.instruccionesExtra?.trim())
      sections.push(`\n## INSTRUCCIONES ADICIONALES\n${empresaIdentidad.instruccionesExtra.trim()}`)
  } else if (aiProfile) {
    // Fallback: usar aiProfile del workspace (legacy)
    if (aiProfile.descripcionEmpresa?.trim())
      sections.push(`\n## CONTEXTO DEL CLIENTE\n${aiProfile.descripcionEmpresa.trim()}`)
    if (aiProfile.publicoObjetivo?.trim())
      sections.push(`\n## PÚBLICO OBJETIVO DEL CLIENTE\n${aiProfile.publicoObjetivo.trim()}`)
    if (aiProfile.tonoMarca?.trim())
      sections.push(`\n## TONO Y VOZ DE LA MARCA\n${aiProfile.tonoMarca.trim()}`)
    if (aiProfile.propuestasValorFijas?.trim())
      sections.push(`\n## PROPUESTAS DE VALOR FIJAS (incluir siempre que aplique)\n${aiProfile.propuestasValorFijas.trim()}`)
    if (aiProfile.palabrasProhibidas?.trim())
      sections.push(`\n## PALABRAS/FRASES PROHIBIDAS (adicionales)\n${aiProfile.palabrasProhibidas.trim()}`)
    if (aiProfile.instruccionesExtra?.trim())
      sections.push(`\n## INSTRUCCIONES ADICIONALES DEL CLIENTE\n${aiProfile.instruccionesExtra.trim()}`)
  }

  return sections.join("\n")
}

function mockStream(promptMaestro: string): ReadableStream {
  const encoder = new TextEncoder()
  const banner = `> ⚠️ Modo sin IA activo — ANTHROPIC_API_KEY no configurada.\n> Este es el prompt maestro generado localmente para usar en Claude.ai o cualquier LLM.\n\n---\n\n`
  const full = banner + promptMaestro

  return new ReadableStream({
    async start(controller) {
      // Simulate streaming word by word
      const words = full.split(" ")
      for (const word of words) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + " ", mock: true })}\n\n`))
        await new Promise((r) => setTimeout(r, 8))
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })
  }

  const { id } = await params

  const [campaign, workspace] = await Promise.all([
    db.campaign.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
      select: {
        id: true, promptMaestro: true, empresaId: true, brief: true,
        empresa: { include: { identidad: true } },
        conceptos: {
          where: { isSelected: true },
          select: { nombre: true, hipotesis: true, anguloMensajeria: true, frameworkCopy: true, direccionVisual: true },
          orderBy: { orden: "asc" },
        },
      },
    }),
    db.workspace.findUnique({
      where: { id: session.user.workspaceId },
      select: { aiProfile: true, aiApiKey: true, globalAiEnabled: true },
    }),
  ])

  if (!campaign?.promptMaestro) {
    return new Response(JSON.stringify({ error: "No hay prompt maestro generado" }), { status: 400 })
  }

  // Rate limit: 3 brief completos por workspace cada 24h (call pesado — genera copy de todas las piezas)
  const rl = await rateLimit(`ai_brief:${session.user.workspaceId}`, 3)
  if (!rl.allowed) {
    const resetIn = Math.ceil((rl.resetAt - Date.now()) / 1000 / 60)
    return new Response(
      JSON.stringify({ error: `Límite de generaciones alcanzado. Disponible en ${resetIn} minutos.` }),
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  const ssHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  }

  const encryptedKey = workspace?.aiApiKey ?? null
  const workspaceAiKey = encryptedKey ? (() => { try { return decrypt(encryptedKey) } catch { return null } })() : null
  const canUseGlobalKey = !!workspace?.globalAiEnabled && !!process.env.ANTHROPIC_API_KEY
  const resolvedKey = workspaceAiKey || (canUseGlobalKey ? process.env.ANTHROPIC_API_KEY : undefined)
  const hasApiKey = !!resolvedKey

  // Fallback mock si no hay API key
  if (!hasApiKey) {
    return new Response(mockStream(campaign.promptMaestro), { headers: ssHeaders })
  }

  const aiClient = getAiClient(resolvedKey)
  const aiProfile = workspace?.aiProfile as Record<string, string> | null
  const empresaIdentidad = campaign.empresa?.identidad ?? null
  // Extraer overrides del brief de campaña: ganan sobre EmpresaIdentidad para permitir tono disruptivo
  const briefData = campaign.brief as Record<string, string> | null
  const campaignOverrides = {
    tono: briefData?.tonoYestilo || undefined,
    publicoObjetivo: briefData?.publicoObjetivo || undefined,
  }
  const basePrompt = await getActiveSystemPrompt()
  let systemPrompt = buildSystemPrompt(basePrompt, aiProfile, empresaIdentidad, campaignOverrides)

  // Inyectar conceptos creativos seleccionados en el system prompt (fuente de verdad: DB)
  const selectedConceptos = campaign.conceptos ?? []
  if (selectedConceptos.length > 0) {
    const conceptosBlock = `\n## CONCEPTOS CREATIVOS SELECCIONADOS (guían TODA la campaña)\nCada pieza del brief DEBE alinearse con alguno de estos conceptos:\n${selectedConceptos.map((c, i) =>
      `${i + 1}. **${c.nombre}**: ${c.hipotesis ?? ""} | Ángulo: ${c.anguloMensajeria ?? ""} | Framework: ${c.frameworkCopy ?? ""} | Visual: ${c.direccionVisual ?? ""}`
    ).join("\n")}`
    systemPrompt += conceptosBlock
  }

  const workspaceId = session.user.workspaceId

  const stream = aiClient.messages.stream({
    model: AI_MODEL,
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: campaign.promptMaestro }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let inputTokens = 0
      let outputTokens = 0
      let fullText = ""

      try {
        for await (const event of stream) {
          if (event.type === "message_start") {
            inputTokens = event.message.usage.input_tokens
          }
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
          if (event.type === "message_delta") {
            outputTokens = event.usage.output_tokens
          }
        }

        // Save generated brief to DB
        await db.campaign.update({
          where: { id },
          data: { briefGenerado: fullText, briefGeneradoAt: new Date() },
        })

        // Auto-populate Pieces from brief JSON (pipeline unification)
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const briefData = JSON.parse(jsonMatch[0]) as {
              piezas?: Array<{
                primaryText?: string
                headline?: string
                descripcion?: string
                varianteB_primaryText?: string
                varianteB_headline?: string
                guionResumen?: string
                imageBrief?: string
              }>
            }
            if (Array.isArray(briefData.piezas) && briefData.piezas.length > 0) {
              // Load pieces in creation order (adSet.orden → piece.orden)
              const adSets = await db.adSet.findMany({
                where: { campaignId: id },
                orderBy: { orden: "asc" },
                include: { pieces: { orderBy: { orden: "asc" }, select: { id: true } } },
              })
              const dbPieces = adSets.flatMap((as) => as.pieces)

              const now = new Date()
              for (let i = 0; i < Math.min(dbPieces.length, briefData.piezas.length); i++) {
                const p = briefData.piezas[i]
                const varA = [
                  p.primaryText ? `**Primary Text**: ${p.primaryText}` : null,
                  p.headline ? `**Headline**: ${p.headline}` : null,
                  p.descripcion ? `**Descripción**: ${p.descripcion}` : null,
                ].filter(Boolean).join("\n")
                const varB = p.varianteB_primaryText ? [
                  `**Primary Text**: ${p.varianteB_primaryText}`,
                  p.varianteB_headline ? `**Headline**: ${p.varianteB_headline}` : null,
                ].filter(Boolean).join("\n") : null

                const copyGenerado = [
                  varA ? `### VARIANTE A\n${varA}` : null,
                  varB ? `### VARIANTE B\n${varB}` : null,
                ].filter(Boolean).join("\n\n") || null

                await db.piece.update({
                  where: { id: dbPieces[i].id },
                  data: {
                    guionGenerado: p.guionResumen ?? null,
                    copyGenerado,
                    imageBriefGenerado: p.imageBrief ?? null,
                    aiGeneratedAt: now,
                  },
                })
              }
            }
          }
        } catch (parseErr) {
          logger.error("generate/auto-populate-pieces", parseErr, { campaignId: id })
        }

        // Track cost ($5/1M input, $25/1M output — Opus 4.6)
        const costUsd = (inputTokens * 5 + outputTokens * 25) / 1_000_000
        await db.aiUsage.create({
          data: {
            workspaceId,
            campaignId: id,
            inputTokens,
            outputTokens,
            model: AI_MODEL,
            action: "generate_brief",
            costUsd,
          },
        })

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (err) {
        // API error → fallback to mock
        const isMissingKey = err instanceof Error && err.message.includes("401")
        if (isMissingKey || err instanceof Error && err.message.includes("authentication")) {
          const mockReadable = mockStream(campaign.promptMaestro ?? "")
          const reader = mockReadable.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              controller.enqueue(value)
            }
          } finally {
            reader.cancel()
          }
        } else {
          const msg = err instanceof Error ? err.message : "Error generando"
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, { headers: ssHeaders })
}
