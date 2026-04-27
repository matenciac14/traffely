const SHOPIFY_API_VERSION = "2024-01"

export interface ShopifyVariant {
  id: string
  title: string
  price: string
  compare_at_price: string | null
  sku: string | null
  inventory_quantity: number
}

export interface ShopifyProduct {
  id: string
  title: string
  body_html: string
  vendor: string
  status: string
  variants: ShopifyVariant[]
  images: { src: string; position: number }[]
}

export interface ShopifyProductSimple {
  id: string
  title: string
  description: string
  vendor: string
  image?: string
  variants: {
    id: string
    title: string
    price: string
    compareAtPrice?: string
    sku?: string
  }[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
}

export async function getShopifyProducts(
  shop: string,
  accessToken: string,
): Promise<ShopifyProductSimple[]> {
  const allProducts: ShopifyProduct[] = []
  let nextUrl: string | null =
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products.json?status=active&limit=250`

  while (nextUrl) {
    const currentUrl = nextUrl
    nextUrl = null

    const response: Response = await fetch(currentUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Shopify API error ${response.status}: ${text}`)
    }

    const data = await response.json() as { products: ShopifyProduct[] }
    allProducts.push(...data.products)

    // Pagination via Link header
    const linkHeader: string | null = response.headers.get("Link")
    const nextMatch: RegExpMatchArray | null = linkHeader?.match(/<([^>]+)>;\s*rel="next"/) ?? null
    if (nextMatch) nextUrl = nextMatch[1]
  }

  return allProducts
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: String(p.id),
      title: p.title,
      description: stripHtml(p.body_html),
      vendor: p.vendor,
      image: p.images.sort((a, b) => a.position - b.position)[0]?.src,
      variants: p.variants.map((v) => ({
        id: String(v.id),
        title: v.title,
        price: v.price,
        compareAtPrice: v.compare_at_price ?? undefined,
        sku: v.sku ?? undefined,
      })),
    }))
}
