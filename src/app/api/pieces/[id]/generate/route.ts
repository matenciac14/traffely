import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getAiClient, AI_MODEL, SYSTEM_PROMPT } from "@/lib/ai/client"
import { rateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"
import { decrypt } from "@/lib/utils/crypto"

function sanitize(text: string | null | undefined): string {
  if (!text) return ""
  return text.replace(/[`*_#\\]/g, (c) => `\\${c}`).slice(0, 2000)
}

interface EmpresaIdentidad {
  tono: string | null
  publicoObjetivo: string | null
  propuestasValor: string | null
  palabrasProhibidas: string | null
  instruccionesExtra: string | null
}

/** Construye el system prompt combinando SYSTEM_PROMPT base + identidad de empresa o aiProfile workspace */
function buildSystemPrompt(
  aiProfile: Record<string, string> | null,
  empresaIdentidad?: EmpresaIdentidad | null
): string {
  const sections: string[] = [SYSTEM_PROMPT]

  if (empresaIdentidad) {
    if (empresaIdentidad.tono?.trim())
      sections.push(`\n## TONO Y VOZ DE LA MARCA\n${empresaIdentidad.tono.trim()}`)
    if (empresaIdentidad.publicoObjetivo?.trim())
      sections.push(`\n## PÚBLICO OBJETIVO DEL CLIENTE\n${empresaIdentidad.publicoObjetivo.trim()}`)
    if (empresaIdentidad.propuestasValor?.trim())
      sections.push(`\n## PROPUESTAS DE VALOR FIJAS (incluir siempre que aplique)\n${empresaIdentidad.propuestasValor.trim()}`)
    if (empresaIdentidad.palabrasProhibidas?.trim())
      sections.push(`\n## PALABRAS/FRASES PROHIBIDAS\n${empresaIdentidad.palabrasProhibidas.trim()}`)
    if (empresaIdentidad.instruccionesExtra?.trim())
      sections.push(`\n## INSTRUCCIONES ADICIONALES\n${empresaIdentidad.instruccionesExtra.trim()}`)
  } else if (aiProfile) {
    // Fallback: perfil de IA legacy del workspace
    if (aiProfile.tonoMarca?.trim())
      sections.push(`\n## TONO Y VOZ DE LA MARCA\n${sanitize(aiProfile.tonoMarca)}`)
    if (aiProfile.publicoObjetivo?.trim())
      sections.push(`\n## PÚBLICO OBJETIVO\n${sanitize(aiProfile.publicoObjetivo)}`)
    if (aiProfile.propuestasValorFijas?.trim())
      sections.push(`\n## PROPUESTAS DE VALOR FIJAS\n${sanitize(aiProfile.propuestasValorFijas)}`)
    if (aiProfile.palabrasProhibidas?.trim())
      sections.push(`\n## PALABRAS/FRASES PROHIBIDAS\n${sanitize(aiProfile.palabrasProhibidas)}`)
    if (aiProfile.instruccionesExtra?.trim())
      sections.push(`\n## INSTRUCCIONES ADICIONALES\n${sanitize(aiProfile.instruccionesExtra)}`)
    if (aiProfile.descripcionEmpresa?.trim())
      sections.push(`\n## CONTEXTO DEL NEGOCIO\n${sanitize(aiProfile.descripcionEmpresa)}`)
  }

  return sections.join("\n")
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return new Response("No autorizado", { status: 401 })
  }

  const { id } = await params
  const workspaceId = session.user.workspaceId

  // Rate limit: 10 generaciones de IA por workspace por día
  const rl = await rateLimit(`ai_gen:${workspaceId}`, 10)
  if (!rl.allowed) {
    return new Response("Límite de generaciones IA alcanzado (10/día)", { status: 429 })
  }

  // Load piece con empresa.identidad cuando existe
  const piece = await db.piece.findFirst({
    where: { id, adSet: { campaign: { workspaceId } } },
    select: {
      id: true,
      modelo: true, tipoPieza: true, formato: true, duracion: true,
      angulo: true, trafico: true, conciencia: true, motivo: true,
      narrativa: true, estructuraCopy: true, carruselSlides: true,
      adSet: {
        select: {
          nombre: true,
          campaign: {
            select: {
              id: true,
              name: true,
              empresa: {
                select: {
                  nombre: true,
                  identidad: {
                    select: {
                      tono: true,
                      publicoObjetivo: true,
                      propuestasValor: true,
                      palabrasProhibidas: true,
                      instruccionesExtra: true,
                    },
                  },
                },
              },
              workspace: {
                select: { aiProfile: true, aiApiKey: true, aiProvider: true, globalAiEnabled: true },
              },
            },
          },
        },
      },
    },
  })

  if (!piece) {
    return new Response("Pieza no encontrada", { status: 404 })
  }

  const campaign = piece.adSet.campaign
  const empresaIdentidad = campaign.empresa?.identidad ?? null
  const aiProfile = campaign.workspace.aiProfile as Record<string, string> | null
  const encryptedKey = campaign.workspace.aiApiKey ?? null
  const workspaceAiKey = encryptedKey ? (() => { try { return decrypt(encryptedKey) } catch { return null } })() : null
  const canUseGlobalKey = !!campaign.workspace.globalAiEnabled && !!process.env.ANTHROPIC_API_KEY
  const resolvedKey = workspaceAiKey || (canUseGlobalKey ? process.env.ANTHROPIC_API_KEY : undefined)
  const hasApiKey = !!resolvedKey
  const aiClient = getAiClient(resolvedKey)

  const systemPrompt = buildSystemPrompt(aiProfile, empresaIdentidad)

  // Build user prompt con contexto de la pieza
  const empresaNombre = campaign.empresa?.nombre ?? null
  const pieceContext = [
    empresaNombre ? `Empresa/marca: ${sanitize(empresaNombre)}` : "",
    `Campaña: ${sanitize(campaign.name)}`,
    `Conjunto: ${sanitize(piece.adSet.nombre)}`,
    `Modelo/UGC: ${sanitize(piece.modelo)}`,
    `Tipo de pieza: ${sanitize(piece.tipoPieza)}`,
    `Formato: ${sanitize(piece.formato)}`,
    piece.duracion ? `Duración: ${sanitize(piece.duracion)}` : "",
    piece.angulo ? `Ángulo creativo: ${sanitize(piece.angulo)}` : "",
    piece.trafico ? `Tipo de tráfico: ${sanitize(piece.trafico)}` : "",
    piece.conciencia ? `Nivel de conciencia: ${sanitize(piece.conciencia)}` : "",
    piece.motivo ? `Motivo de compra: ${sanitize(piece.motivo)}` : "",
    piece.narrativa ? `Narrativa: ${sanitize(piece.narrativa)}` : "",
    piece.estructuraCopy ? `Estructura del copy: ${sanitize(piece.estructuraCopy)}` : "",
    piece.carruselSlides ? `Slides del carrusel: ${piece.carruselSlides}` : "",
  ].filter(Boolean).join("\n")

  const userPrompt = `Genera el guión y copy para esta pieza publicitaria de Meta Ads:

${pieceContext}

Responde con:

## GUIÓN
[El guión completo con indicaciones de escenas, diálogos o locución según el tipo de pieza]

## COPY
[El texto del anuncio: headline, cuerpo y CTA optimizados para Meta Ads]`

  // Mock if no API key
  if (!hasApiKey) {
    const mock = `## GUIÓN\n[MOCK] Guión generado para ${piece.modelo} - ${piece.tipoPieza}\n\n## COPY\n[MOCK] Copy generado para la pieza.`
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        for (const char of mock) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: char })}\n\n`))
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    })
  }

  // Real SSE with Claude
  let inputTokens = 0
  let outputTokens = 0
  let fullText = ""

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const claudeStream = aiClient.messages.stream({
          model: AI_MODEL,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        })

        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
          }
        }

        const finalMsg = await claudeStream.finalMessage()
        inputTokens = finalMsg.usage.input_tokens
        outputTokens = finalMsg.usage.output_tokens

        // Parse sections
        const guionMatch = fullText.match(/## GUIÓN\n([\s\S]*?)(?=## COPY|$)/)
        const copyMatch = fullText.match(/## COPY\n([\s\S]*)/)
        const guionGenerado = guionMatch?.[1]?.trim() ?? fullText
        const copyGenerado = copyMatch?.[1]?.trim() ?? null

        // Save to DB
        await db.piece.update({
          where: { id: piece.id },
          data: { guionGenerado, copyGenerado, aiGeneratedAt: new Date() },
        })

        // Track usage
        await db.aiUsage.create({
          data: {
            workspaceId,
            pieceId: piece.id,
            campaignId: campaign.id,
            inputTokens,
            outputTokens,
            model: AI_MODEL,
            action: "piece_generate",
            costUsd: (inputTokens * 5 + outputTokens * 25) / 1_000_000,
          },
        })

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (err) {
        logger.error("pieces/generate", err, { pieceId: id, workspaceId })
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Error al generar" })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  })
}
