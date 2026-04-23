import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { decrypt } from "@/lib/utils/crypto"
import { getShopifyProducts } from "@/lib/integrations/shopify/client"
import { logger } from "@/lib/logger"

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const integration = await db.shopifyIntegration.findUnique({
    where: { workspaceId: session.user.workspaceId },
    select: { shop: true, accessToken: true, isActive: true },
  })

  if (!integration?.isActive) {
    return NextResponse.json({ error: "Shopify no conectado" }, { status: 400 })
  }

  try {
    const accessToken = decrypt(integration.accessToken)
    const products = await getShopifyProducts(integration.shop, accessToken)

    // Actualizar lastSyncAt
    await db.shopifyIntegration.update({
      where: { workspaceId: session.user.workspaceId },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({ products })
  } catch (err) {
    logger.error("Shopify fetch products", err)
    return NextResponse.json({ error: "Error al conectar con Shopify" }, { status: 500 })
  }
}
