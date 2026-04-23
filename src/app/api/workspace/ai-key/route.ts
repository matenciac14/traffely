import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { encrypt, decrypt } from "@/lib/utils/crypto"

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

  let maskedKey: string | null = null
  if (workspace?.aiApiKey) {
    const decrypted = decrypt(workspace.aiApiKey)
    maskedKey = `****${decrypted.slice(-4)}`
  }

  return NextResponse.json({
    hasKey: !!workspace?.aiApiKey,
    maskedKey,
    aiProvider: workspace?.aiProvider ?? null,
  })
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
        ...(aiApiKey !== null && aiApiKey.trim() !== "" ? { aiApiKey: encrypt(aiApiKey.trim()) } : {}),
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
