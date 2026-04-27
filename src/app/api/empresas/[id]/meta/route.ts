import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { encrypt } from "@/lib/utils/crypto"
import { testMetaConnection } from "@/lib/meta-api"
import { logger } from "@/lib/logger"
import { z } from "zod"

const connectSchema = z.object({
  adAccountId: z.string().min(1).max(50),
  accessToken: z.string().min(1).max(500),
})

// POST /api/empresas/[id]/meta — conectar Meta Ads
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const body = await req.json()
  const parse = connectSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "ID de cuenta y token son requeridos" }, { status: 400 })
  }
  const { adAccountId, accessToken } = parse.data

  const empresa = await db.empresa.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
  })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  try {
    // Probar conexión con Meta antes de guardar
    const accountInfo = await testMetaConnection(adAccountId.trim(), accessToken.trim())

    await db.empresa.update({
      where: { id },
      data: {
        metaAdAccountId: adAccountId.trim(),
        metaAccessToken: encrypt(accessToken.trim()),
        metaEnabled: true,
        metaTokenExpiresAt: null, // System User Token no expira
      },
    })

    return NextResponse.json({
      ok: true,
      accountName: accountInfo.name,
      currency: accountInfo.currency,
      timezone: accountInfo.timezone_name,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Meta"
    logger.error("meta/connect", err, { empresaId: id })
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// DELETE /api/empresas/[id]/meta — desconectar Meta Ads
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const empresa = await db.empresa.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
  })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  await db.empresa.update({
    where: { id },
    data: {
      metaAdAccountId: null,
      metaAccessToken: null,
      metaTokenExpiresAt: null,
      metaEnabled: false,
    },
  })

  return NextResponse.json({ ok: true })
}
