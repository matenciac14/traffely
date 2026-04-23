import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getAiClient, AI_MODEL, SYSTEM_PROMPT } from "@/lib/ai/client"
import { rateLimit } from "@/lib/ratelimit"

function buildSystemPrompt(aiProfile: Record<string, string> | null): string {
  if (!aiProfile) return SYSTEM_PROMPT

  const sections: string[] = [SYSTEM_PROMPT]

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
      select: { id: true, promptMaestro: true },
    }),
    db.workspace.findUnique({
      where: { id: session.user.workspaceId },
      select: { aiProfile: true, aiApiKey: true },
    }),
  ])

  if (!campaign?.promptMaestro) {
    return new Response(JSON.stringify({ error: "No hay prompt maestro generado" }), { status: 400 })
  }

  // Rate limit: 10 generaciones IA por workspace cada 24h
  const rl = rateLimit(`ai_gen:${session.user.workspaceId}`, 10)
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

  const workspaceAiKey = workspace?.aiApiKey ?? null
  const hasApiKey = !!(workspaceAiKey || process.env.ANTHROPIC_API_KEY)

  // Fallback mock si no hay API key
  if (!hasApiKey) {
    return new Response(mockStream(campaign.promptMaestro), { headers: ssHeaders })
  }

  const aiClient = getAiClient(workspaceAiKey)
  const aiProfile = workspace?.aiProfile as Record<string, string> | null
  const systemPrompt = buildSystemPrompt(aiProfile)
  const workspaceId = session.user.workspaceId

  const stream = aiClient.messages.stream({
    model: AI_MODEL,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: campaign.promptMaestro }],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let inputTokens = 0
      let outputTokens = 0

      try {
        for await (const event of stream) {
          if (event.type === "message_start") {
            inputTokens = event.message.usage.input_tokens
          }
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
          if (event.type === "message_delta") {
            outputTokens = event.usage.output_tokens
          }
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
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
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
