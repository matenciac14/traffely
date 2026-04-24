import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.SHOPIFY_API_SECRET!

/** Valida el HMAC que Shopify envía en el callback OAuth */
export function validateShopifyHmac(params: URLSearchParams): boolean {
  const hmac = params.get("hmac")
  if (!hmac) return false

  const filtered = new URLSearchParams()
  for (const [key, value] of params.entries()) {
    if (key !== "hmac") filtered.append(key, value)
  }

  // Ordenar alfabéticamente
  const sorted = [...filtered.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&")

  const digest = createHmac("sha256", SECRET).update(sorted).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(hmac))
  } catch {
    return false
  }
}
