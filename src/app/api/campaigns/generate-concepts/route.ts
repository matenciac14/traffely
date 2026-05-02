import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getAiClient, AI_MODEL_FAST } from "@/lib/ai/client"
import { getActiveSystemPrompt } from "@/lib/ai/system-prompt"
import { decrypt } from "@/lib/utils/crypto"
import { rateLimit } from "@/lib/ratelimit"
import { logger } from "@/lib/logger"

interface EmpresaIdentidadFields {
  tono: string | null
  publicoObjetivo: string | null
  propuestasValor: string | null
  palabrasProhibidas: string | null
  instruccionesExtra: string | null
  contextoNegocio: string | null
  reglasLegales: string | null
  eventosKey: string | null
  // Fase 24
  industria: string | null
  modeloNegocio: string | null
  ticketPromedio: string | null
  cicloVenta: string | null
  temporadasClave: string | null
  metaPrincipal: string | null
}

function buildConceptsSystemPrompt(
  basePrompt: string,
  identidad: EmpresaIdentidadFields | null
): string {
  const sections: string[] = [
    basePrompt,
    "\nEres un estratega creativo experto en Meta Ads. Tu tarea es generar conceptos publicitarios estratégicos.",
  ]

  if (identidad) {
    if (identidad.industria?.trim())
      sections.push(`\n## INDUSTRIA Y CATEGORÍA\n${identidad.industria.trim()}`)
    if (identidad.modeloNegocio?.trim())
      sections.push(`\n## MODELO DE NEGOCIO\n${identidad.modeloNegocio.trim()}`)
    if (identidad.ticketPromedio?.trim())
      sections.push(`\n## TICKET PROMEDIO\n${identidad.ticketPromedio.trim()}`)
    if (identidad.cicloVenta?.trim())
      sections.push(`\n## CICLO DE VENTA\n${identidad.cicloVenta.trim()}`)
    if (identidad.temporadasClave?.trim())
      sections.push(`\n## TEMPORADAS Y MOMENTOS CLAVE\n${identidad.temporadasClave.trim()}`)
    if (identidad.metaPrincipal?.trim())
      sections.push(`\n## META PRINCIPAL DE CAMPAÑAS\n${identidad.metaPrincipal.trim()}`)
    if (identidad.contextoNegocio?.trim())
      sections.push(`\n## CONTEXTO DEL NEGOCIO\n${identidad.contextoNegocio.trim()}`)
    if (identidad.tono?.trim())
      sections.push(`\n## TONO Y VOZ DE LA MARCA\n${identidad.tono.trim()}`)
    if (identidad.publicoObjetivo?.trim())
      sections.push(`\n## PÚBLICO OBJETIVO DEL CLIENTE\n${identidad.publicoObjetivo.trim()}`)
    if (identidad.propuestasValor?.trim())
      sections.push(`\n## PROPUESTAS DE VALOR FIJAS (incluir siempre que aplique)\n${identidad.propuestasValor.trim()}`)
    if (identidad.palabrasProhibidas?.trim())
      sections.push(`\n## PALABRAS/FRASES PROHIBIDAS\n${identidad.palabrasProhibidas.trim()}`)
    if (identidad.reglasLegales?.trim())
      sections.push(`\n## REGLAS LEGALES Y RESTRICCIONES DE LA INDUSTRIA\n${identidad.reglasLegales.trim()}`)
    if (identidad.eventosKey?.trim())
      sections.push(`\n## EVENTOS Y FECHAS CLAVE DE LA EMPRESA\n${identidad.eventosKey.trim()}`)
    if (identidad.instruccionesExtra?.trim())
      sections.push(`\n## INSTRUCCIONES ADICIONALES\n${identidad.instruccionesExtra.trim()}`)
  }

  return sections.join("\n")
}

const FRAMEWORKS = ["AIDA", "PAS", "BAB", "FAB", "4U", "Storytelling", "Star-Story-Solution"]
const ANGULOS = ["Dolor", "Aspiracional", "Prueba social", "Urgencia", "Curiosidad", "Beneficio directo"]

function nanoid(prefix = "C") {
  return prefix + Math.random().toString(36).substring(2, 7).toUpperCase()
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const workspaceId = session.user.workspaceId

  // Rate limit: 10 generaciones de conceptos por workspace por día
  const rl = await rateLimit(`ai_concepts:${workspaceId}`, 10)
  if (!rl.allowed) {
    const resetIn = Math.ceil((rl.resetAt - Date.now()) / 1000 / 60)
    return NextResponse.json(
      { error: `Límite de generaciones alcanzado. Disponible en ${resetIn} minutos.` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const {
      empresaId,
      nombreCampana,
      tipoCampana,
      contextoCampana,
      objetivoCampana,
      publicoObjetivo,
      tipoOferta,
      contextoOferta,
    } = body

    // Load workspace for AI key
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { aiApiKey: true, aiProvider: true, globalAiEnabled: true },
    })

    const encryptedKey = workspace?.aiApiKey ?? null
    const workspaceAiKey = encryptedKey
      ? (() => { try { return decrypt(encryptedKey) } catch { return null } })()
      : null
    const canUseGlobalKey = !!workspace?.globalAiEnabled && !!process.env.ANTHROPIC_API_KEY
    const resolvedKey = workspaceAiKey || (canUseGlobalKey ? process.env.ANTHROPIC_API_KEY : undefined)

    // Load empresa identidad if available
    let empresaIdentidad: EmpresaIdentidadFields | null = null
    let empresaNombre: string | null = null
    if (empresaId) {
      const empresa = await db.empresa.findFirst({
        where: { id: empresaId, workspaceId },
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
              metaPrincipal: true,
            },
          },
        },
      })
      if (empresa) {
        empresaNombre = empresa.nombre
        empresaIdentidad = empresa.identidad
      }
    }

    const briefContext = [
      nombreCampana ? `Campaña: ${nombreCampana}` : "",
      tipoCampana ? `Tipo: ${tipoCampana}` : "",
      contextoCampana ? `Contexto: ${contextoCampana}` : "",
      objetivoCampana ? `Objetivo: ${objetivoCampana}` : "",
      publicoObjetivo ? `Público objetivo: ${publicoObjetivo}` : "",
      tipoOferta ? `Tipo de oferta: ${tipoOferta}` : "",
      contextoOferta ? `Oferta: ${contextoOferta}` : "",
    ].filter(Boolean).join("\n")

    const basePrompt = await getActiveSystemPrompt()
    const systemPrompt = buildConceptsSystemPrompt(basePrompt, empresaIdentidad)

    const userPrompt = `Genera exactamente 5 conceptos creativos para esta campaña de Meta Ads.

${empresaNombre ? `## EMPRESA\n${empresaNombre}\n` : ""}
## BRIEF DE CAMPAÑA
${briefContext}

## INSTRUCCIONES
- Cada concepto debe tener un ángulo diferente para maximizar el A/B testing
- Los ángulos disponibles son: ${ANGULOS.join(", ")}
- Los frameworks disponibles son: ${FRAMEWORKS.join(", ")}
- El nombre de cada concepto debe ser memorable y específico (no genérico)
- La hipótesis debe explicar por qué este concepto va a funcionar con este público

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, en este formato exacto:
[
  {
    "nombre": "Nombre memorable del concepto",
    "hipotesis": "Por qué va a funcionar con este público específico (1-2 oraciones)",
    "anguloMensajeria": "uno de los ángulos disponibles",
    "frameworkCopy": "uno de los frameworks disponibles",
    "direccionVisual": "Dirección visual concreta: qué se ve, qué colores, qué mood (1 oración)"
  }
]`

    // Mock if no API key
    if (!resolvedKey) {
      const mockConceptos = [
        {
          id: nanoid(),
          nombre: "El Problema que No Sabías que Tenías",
          hipotesis: "Activar el dolor latente genera urgencia inmediata en audiencias que aún no consideran comprar.",
          anguloMensajeria: "Dolor",
          frameworkCopy: "PAS",
          direccionVisual: "Fondo oscuro, close-up de problema visual, transición a solución luminosa.",
          isSelected: false,
        },
        {
          id: nanoid(),
          nombre: "La Vida Después de la Decisión",
          hipotesis: "Mostrar el resultado aspiracional antes del proceso reduce la fricción de compra.",
          anguloMensajeria: "Aspiracional",
          frameworkCopy: "BAB",
          direccionVisual: "Lifestyle premium, colores cálidos, protagonista seguro y satisfecho.",
          isSelected: false,
        },
        {
          id: nanoid(),
          nombre: "Lo Que Dicen los que Ya lo Tienen",
          hipotesis: "La prueba social de personas similares al buyer persona es el trigger más efectivo en frío.",
          anguloMensajeria: "Prueba social",
          frameworkCopy: "AIDA",
          direccionVisual: "UGC style, cámara casual, texto overlay con métricas reales.",
          isSelected: false,
        },
        {
          id: nanoid(),
          nombre: "Solo Quedan 48 Horas",
          hipotesis: "El FOMO temporal convierte indecisos en compradores cuando el precio es el obstáculo.",
          anguloMensajeria: "Urgencia",
          frameworkCopy: "4U",
          direccionVisual: "Countdown visual, colores de alerta (rojo/naranja), typografía bold.",
          isSelected: false,
        },
        {
          id: nanoid(),
          nombre: "El Secreto que Cambia Todo",
          hipotesis: "La curiosidad baja el costo por clic y genera audiencias de mayor calidad en TOFU.",
          anguloMensajeria: "Curiosidad",
          frameworkCopy: "Star-Story-Solution",
          direccionVisual: "Open loop visual, elemento misterioso revelado, reveal satisfactorio.",
          isSelected: false,
        },
      ]
      return NextResponse.json({ conceptos: mockConceptos })
    }

    // Real Claude call
    const aiClient = getAiClient(resolvedKey)
    const response = await aiClient.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    // Track AI usage
    await db.aiUsage.create({
      data: {
        workspaceId,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: AI_MODEL_FAST,
        action: "generate_concepts",
        costUsd: (response.usage.input_tokens * 5 + response.usage.output_tokens * 25) / 1_000_000,
      },
    }).catch((err) => { logger.error("generate-concepts/aiUsage", err, { workspaceId }) })

    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Respuesta vacía del modelo")
    }

    // Parse JSON from response
    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("Formato de respuesta inválido")

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      nombre: string
      hipotesis: string
      anguloMensajeria: string
      frameworkCopy: string
      direccionVisual: string
    }>

    const conceptos = parsed.map((c) => ({
      id: nanoid(),
      nombre: c.nombre ?? "",
      hipotesis: c.hipotesis ?? "",
      anguloMensajeria: c.anguloMensajeria ?? "",
      frameworkCopy: c.frameworkCopy ?? "",
      direccionVisual: c.direccionVisual ?? "",
      isSelected: false,
    }))

    return NextResponse.json({ conceptos })
  } catch (err) {
    logger.error("POST /api/campaigns/generate-concepts", err)
    return NextResponse.json({ error: "Error al generar conceptos" }, { status: 500 })
  }
}
