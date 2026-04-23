import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"

const ALLOWED_PROVIDERS = ["anthropic", "openai", "gemini"] as const

const patchSchema = z.object({
  aiProvider: z.enum(ALLOWED_PROVIDERS).nullable(),
  aiApiKey: z.string().max(200).nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const workspace = await db.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: { aiProvider: true, aiApiKey: true },
  })

  // Mask the key — only return last 6 chars
  const masked = workspace?.aiApiKey
    ? `${"•".repeat(Math.max(0, workspace.aiApiKey.length - 6))}${workspace.aiApiKey.slice(-6)}`
    : null

  return NextResponse.json({ aiProvider: workspace?.aiProvider ?? null, aiApiKeyMasked: masked })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 422 })
    }

    const { aiProvider, aiApiKey } = parsed.data

    await db.workspace.update({
      where: { id: session.user.workspaceId },
      data: {
        aiProvider: aiProvider ?? null,
        // Only update key if a new one was provided (non-empty string)
        ...(aiApiKey !== null && aiApiKey.trim() !== "" ? { aiApiKey: aiApiKey.trim() } : {}),
        // If provider is null, clear the key too
        ...(aiProvider === null ? { aiApiKey: null } : {}),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("workspace/ai-key PATCH", err, { workspaceId: session.user.workspaceId })
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
