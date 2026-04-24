import { NextResponse } from "next/server"
import { db } from "@/lib/db/prisma"
import { encrypt } from "@/lib/utils/crypto"
import { validateShopifyHmac } from "@/lib/integrations/shopify/hmac"
import { getAndDeleteState } from "../connect/route"
import { logger } from "@/lib/logger"

const APP_URL = process.env.NEXTAUTH_URL!

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get("state") ?? ""
  const code = searchParams.get("code") ?? ""
  const shop = searchParams.get("shop") ?? ""

  // 1. Validar HMAC
  if (!validateShopifyHmac(searchParams)) {
    return NextResponse.redirect(`${APP_URL}/settings?shopify=error&reason=hmac`)
  }

  // 2. Validar y consumir state
  const entry = getAndDeleteState(state)
  if (!entry || entry.shop !== shop) {
    return NextResponse.redirect(`${APP_URL}/settings?shopify=error&reason=state`)
  }

  try {
    // 3. Intercambiar code → access_token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`)
    }

    const { access_token, scope } = await tokenRes.json() as { access_token: string; scope: string }

    // 4. Guardar en DB con token cifrado
    await db.shopifyIntegration.upsert({
      where: { workspaceId: entry.workspaceId },
      create: {
        workspaceId: entry.workspaceId,
        shop,
        accessToken: encrypt(access_token),
        scope,
        isActive: true,
      },
      update: {
        shop,
        accessToken: encrypt(access_token),
        scope,
        isActive: true,
      },
    })

    return NextResponse.redirect(`${APP_URL}/settings?shopify=connected`)
  } catch (err) {
    logger.error("Shopify OAuth callback", err)
    return NextResponse.redirect(`${APP_URL}/settings?shopify=error&reason=token`)
  }
}
