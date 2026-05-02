import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getAiClient, AI_MODEL_FAST } from "@/lib/ai/client"
import { getActiveSystemPrompt } from "@/lib/ai/system-prompt"
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

/** Construye el system prompt combinando SYSTEM_PROMPT base + identidad de empresa o aiProfile workspace.
 *  campaignOverrides permite que el brief de la campaña sobreescriba valores de EmpresaIdentidad
 *  (e.g. tono disruptivo diferente al perfil base de la marca). */
function buildSystemPrompt(
  basePrompt: string,
  aiProfile: Record<string, string> | null,
  empresaIdentidad?: EmpresaIdentidad | null,
  campaignOverrides?: { tono?: string; publicoObjetivo?: string }
): string {
  const sections: string[] = [basePrompt]

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

  // Rate limit: 30 generaciones de IA por pieza por workspace por día
  const rl = await rateLimit(`ai_piece:${workspaceId}`, 30)
  if (!rl.allowed) {
    return new Response("Límite de generaciones IA alcanzado (30/día)", { status: 429 })
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
              brief: true,
              conceptos: {
                where: { isSelected: true },
                select: { nombre: true, hipotesis: true, anguloMensajeria: true, frameworkCopy: true, direccionVisual: true },
                orderBy: { orden: "asc" },
              },
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
                      contextoNegocio: true,
                      reglasLegales: true,
                      eventosKey: true,
                      industria: true,
                      modeloNegocio: true,
                      ticketPromedio: true,
                      cicloVenta: true,
                      temporadasClave: true,
                      equipoCreativo: true,
                      metaPrincipal: true,
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
  const selectedConceptos = campaign.conceptos ?? []
  const empresaIdentidad = campaign.empresa?.identidad ?? null
  const aiProfile = campaign.workspace.aiProfile as Record<string, string> | null
  const encryptedKey = campaign.workspace.aiApiKey ?? null
  const workspaceAiKey = encryptedKey ? (() => { try { return decrypt(encryptedKey) } catch { return null } })() : null
  const canUseGlobalKey = !!campaign.workspace.globalAiEnabled && !!process.env.ANTHROPIC_API_KEY
  const resolvedKey = workspaceAiKey || (canUseGlobalKey ? process.env.ANTHROPIC_API_KEY : undefined)
  const hasApiKey = !!resolvedKey
  const aiClient = getAiClient(resolvedKey)

  // Extraer overrides del brief de campaña: ganan sobre EmpresaIdentidad para permitir tono disruptivo
  const briefData = campaign.brief as Record<string, string> | null
  const campaignOverrides = {
    tono: briefData?.tonoYestilo || undefined,
    publicoObjetivo: briefData?.publicoObjetivo || undefined,
  }
  const basePrompt = await getActiveSystemPrompt()
  const systemPrompt = buildSystemPrompt(basePrompt, aiProfile, empresaIdentidad, campaignOverrides)

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

  // Include selected conceptos if any
  const conceptosBlock = selectedConceptos.length > 0
    ? `\n## CONCEPTOS CREATIVOS SELECCIONADOS (heredar enfoque y dirección)\n${selectedConceptos.map((c, i) =>
        `${i + 1}. **${c.nombre}**\n   Hipótesis: ${c.hipotesis ?? ""}\n   Ángulo: ${c.anguloMensajeria ?? ""}\n   Framework: ${c.frameworkCopy ?? ""}\n   Visual: ${c.direccionVisual ?? ""}`
      ).join("\n")}`
    : ""

  // Copy framework descriptions for prompt injection
  const FRAMEWORK_DESC: Record<string, string> = {
    "PAS":        "Problema → Agitación → Solución + CTA",
    "AIDA":       "Atención → Interés → Deseo → Acción",
    "FAB":        "Features → Advantages → Benefits + CTA",
    "BAB":        "Before (situación actual) → After (situación deseada) → Bridge (cómo llegar) + CTA",
    "4U":         "Útil + Urgente + Único + Ultra-específico en headline y copy",
    "Storytelling": "Personaje → Conflicto → Transformación → CTA",
    "Star-Story-Solution": "Presenta al protagonista (Star) → Narra el conflicto (Story) → Revela la solución (Solution) + CTA",
  }

  const frameworkKey = sanitize(piece.estructuraCopy)
  const frameworkDesc = FRAMEWORK_DESC[frameworkKey] ?? null
  const frameworkBlock = frameworkDesc
    ? `\n## FRAMEWORK DE COPY OBLIGATORIO: ${frameworkKey}\nEstructura: ${frameworkDesc}\nAplica esta estructura EXACTAMENTE en el guión y en ambas variantes de copy.`
    : ""

  // Platform safe zones for image brief
  const esStory = piece.formato?.toLowerCase().includes("story") || piece.formato?.toLowerCase().includes("reels")
  const safeZoneNota = esStory
    ? "Safe zone: mantener contenido crítico entre Y:150px y Y:1470px (evitar top/bottom 15%)"
    : "Safe zone: mantener texto/logo fuera del 30% inferior (reserve para CTA overlay)"

  const userPrompt = `Genera el guión, copy y brief de imagen para esta pieza publicitaria de Meta Ads.
${frameworkBlock}
${conceptosBlock}

## CONTEXTO DE LA PIEZA
${pieceContext}

## REGLAS DE CALIDAD OBLIGATORIAS
- El headline debe tener una palabra de gancho en las primeras 3 palabras
- Primary Text óptimo: máximo 125 caracteres (nunca superar 2200)
- Headline: máximo 40 caracteres
- Descripción: máximo 30 caracteres
- CTA: verbo de acción + beneficio (ej: "Descúbrelo gratis", "Consigue el tuyo")
- Hook: el ángulo declarado debe aparecer en los primeros 5 segundos (video) o en el primer elemento visual (imagen)
- Genera 2 variantes de copy (A/B) con distintos ángulos o registros de voz

Responde con estas secciones exactas:

## GUIÓN
[Guión completo con estructura según framework. Para video: tiempos por escena (HOOK 0-5s / Desarrollo / CTA). Para imagen/carrusel: brief visual de lo que debe verse en cada frame]

## COPY — VARIANTE A
**Primary Text** (≤125 chars optimal):
[copy completo, listo para publicar]

**Headline** (≤40 chars):
[headline con gancho en primeras 3 palabras]

**Descripción** (≤30 chars):
[descripción]

**CTA sugerido**: [acción]

## COPY — VARIANTE B
**Primary Text** (≤125 chars optimal):
[segunda variante con distinto ángulo o registro de voz]

**Headline** (≤40 chars):
[headline alternativo]

**Descripción** (≤30 chars):
[descripción]

**CTA sugerido**: [acción]

## IMAGE GENERATION BRIEF
**Prompt** (máx 80 palabras, sin texto ni nombres de fuentes):
[composición, colores hex, mood, metáfora visual, iluminación]

**Dimensiones**: [ej: 1080×1350px]
**Aspect ratio**: [ej: 4:5]
**Modo**: [Product / Portrait / UI-Web / Abstract / Landscape]
**${safeZoneNota}**`

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
          model: AI_MODEL_FAST,
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
        const guionMatch = fullText.match(/## GUIÓN\n([\s\S]*?)(?=## COPY|## IMAGE GENERATION BRIEF|$)/)
        const copyAMatch = fullText.match(/## COPY — VARIANTE A\n([\s\S]*?)(?=## COPY — VARIANTE B|## IMAGE GENERATION BRIEF|$)/)
        const copyBMatch = fullText.match(/## COPY — VARIANTE B\n([\s\S]*?)(?=## IMAGE GENERATION BRIEF|$)/)
        const imageBriefMatch = fullText.match(/## IMAGE GENERATION BRIEF\n([\s\S]*)/)

        const guionGenerado = guionMatch?.[1]?.trim() ?? fullText
        const varA = copyAMatch?.[1]?.trim() ?? null
        const varB = copyBMatch?.[1]?.trim() ?? null
        const imageBriefGenerado = imageBriefMatch?.[1]?.trim() ?? null
        const copyGenerado = [
          varA ? `### VARIANTE A\n${varA}` : null,
          varB ? `### VARIANTE B\n${varB}` : null,
        ].filter(Boolean).join("\n\n") || null

        // Save to DB
        await db.piece.update({
          where: { id: piece.id },
          data: { guionGenerado, copyGenerado, imageBriefGenerado, aiGeneratedAt: new Date() },
        })

        // Track usage
        await db.aiUsage.create({
          data: {
            workspaceId,
            pieceId: piece.id,
            campaignId: campaign.id,
            inputTokens,
            outputTokens,
            model: AI_MODEL_FAST,
            action: "piece_generate",
            costUsd: (inputTokens * 5 + outputTokens * 25) / 1_000_000,
          },
        })

      } catch (err) {
        logger.error("pieces/generate", err, { pieceId: id, workspaceId })
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Error al generar" })}\n\n`))
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  })
}
