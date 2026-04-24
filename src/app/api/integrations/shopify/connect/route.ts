import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { randomBytes } from "crypto"

const SCOPES = "read_products"

// In-memory state store — MVP (se limpia al reiniciar instancia)
const pendingStates = new Map<string, { shop: string; workspaceId: string; expiresAt: number }>()

export function getAndDeleteState(state: string) {
  const entry = pendingStates.get(state)
  pendingStates.delete(state)
  if (!entry || entry.expiresAt < Date.now()) return null
  return entry
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { shop } = await req.json() as { shop?: string }

  if (!shop || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return NextResponse.json({ error: "Dominio de Shopify inválido. Usa el formato: mitienda.myshopify.com" }, { status: 400 })
  }

  const state = randomBytes(16).toString("hex")
  pendingStates.set(state, {
    shop,
    workspaceId: session.user.workspaceId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  })

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`
  const url = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

  return NextResponse.json({ url })
}
