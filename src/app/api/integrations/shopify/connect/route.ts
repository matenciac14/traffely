import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { randomBytes } from "crypto"
import { saveState } from "@/lib/integrations/shopify/state"

const SCOPES = "read_products"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const ws = await db.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: { shopifyEnabled: true },
  })
  if (!ws?.shopifyEnabled) {
    return NextResponse.json({ error: "Shopify no está habilitado para este workspace" }, { status: 503 })
  }

  const { shop } = await req.json() as { shop?: string }

  if (!shop || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return NextResponse.json(
      { error: "Dominio de Shopify inválido. Usa el formato: mitienda.myshopify.com" },
      { status: 400 }
    )
  }

  const state = randomBytes(16).toString("hex")
  await saveState(state, { shop, workspaceId: session.user.workspaceId })

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`
  const url = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

  return NextResponse.json({ url })
}
