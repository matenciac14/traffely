"use client"

import { useState } from "react"
import { ShoppingBagIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react"
import type { ShopifyProductSimple } from "@/lib/integrations/shopify/client"
import { cn } from "@/lib/utils"

interface Props {
  onSelectProduct: (product: ShopifyProductSimple) => void
  onSelectVariantsAsModelos?: (product: ShopifyProductSimple) => void
  mode: "product" | "modelos" // product = Step3, modelos = Step4
}

export default function ShopifyProductPicker({ onSelectProduct, onSelectVariantsAsModelos, mode }: Props) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<ShopifyProductSimple[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  async function load() {
    if (products) { setOpen(true); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/shopify/products")
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al cargar productos")
        return
      }
      const data = await res.json() as { products: ShopifyProductSimple[] }
      setProducts(data.products)
      setOpen(true)
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  const filtered = products?.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <button
        onClick={open ? () => setOpen(false) : load}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <ShoppingBagIcon className="w-4 h-4 text-[#96bf48]" />
        {mode === "product" ? "Importar producto desde Shopify" : "Importar modelos desde Shopify"}
        {loading && <span className="ml-auto text-xs text-muted-foreground animate-pulse">Cargando…</span>}
        {!loading && (open ? <ChevronUpIcon className="ml-auto w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="ml-auto w-4 h-4 text-muted-foreground" />)}
      </button>

      {error && (
        <div className="px-4 pb-3 text-xs text-destructive">{error} — ¿Tienes Shopify conectado en Configuración?</div>
      )}

      {open && products && (
        <div className="border-t border-border">
          {/* Búsqueda */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-input bg-background">
              <SearchIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto…"
                className="flex-1 text-xs bg-transparent focus:outline-none"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <XIcon className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-xs text-center text-muted-foreground">
                {products.length === 0 ? "No hay productos activos en la tienda." : "Sin resultados para esa búsqueda."}
              </p>
            )}
            {filtered.map((product) => (
              <div key={product.id} className="px-3 py-2.5 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-3">
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground">{product.vendor} · {product.variants.length} variante{product.variants.length !== 1 ? "s" : ""}</p>
                    {product.variants[0] && (
                      <p className="text-xs text-primary font-medium mt-0.5">
                        ${parseFloat(product.variants[0].price).toLocaleString("es-CO")}
                        {product.variants[0].compareAtPrice && (
                          <span className="ml-1.5 line-through text-muted-foreground">
                            ${parseFloat(product.variants[0].compareAtPrice).toLocaleString("es-CO")}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {mode === "product" && (
                      <button
                        onClick={() => { onSelectProduct(product); setOpen(false) }}
                        className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                          "border-primary bg-primary/10 text-primary hover:bg-primary/20")}
                      >
                        Usar
                      </button>
                    )}
                    {mode === "modelos" && onSelectVariantsAsModelos && (
                      <button
                        onClick={() => { onSelectVariantsAsModelos(product); setOpen(false) }}
                        className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                          "border-primary bg-primary/10 text-primary hover:bg-primary/20")}
                      >
                        Importar variantes
                      </button>
                    )}
                  </div>
                </div>

                {/* Variantes expandidas si hay más de 1 */}
                {product.variants.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1 pl-13">
                    {product.variants.slice(0, 6).map((v) => (
                      <span key={v.id} className="px-1.5 py-0.5 rounded text-[10px] bg-muted border border-border text-muted-foreground">
                        {v.title}
                      </span>
                    ))}
                    {product.variants.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">+{product.variants.length - 6} más</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
