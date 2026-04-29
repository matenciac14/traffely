"use client"

import { useState } from "react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import { PlusIcon, XIcon, PackageIcon } from "lucide-react"
import ShopifyProductPicker from "../ShopifyProductPicker"
import type { ShopifyProductSimple } from "@/lib/integrations/shopify/client"

export default function Step4Modelos() {
  const {
    modelosCustom,
    preciosModelos,
    updatePrecio,
    agregarModeloCustom,
    eliminarModeloCustom,
  } = useCampaignWizard()

  const [input, setInput] = useState("")

  function handleAdd() {
    const nombre = input.trim()
    if (!nombre || modelosCustom.includes(nombre)) return
    agregarModeloCustom(nombre)
    setInput("")
  }

  function handleShopifyVariants(product: ShopifyProductSimple) {
    for (const variant of product.variants) {
      const nombre = product.variants.length === 1
        ? product.title
        : `${product.title} — ${variant.title}`
      if (!modelosCustom.includes(nombre)) agregarModeloCustom(nombre)
      if (variant.price) updatePrecio(nombre, "ahora", variant.price.replace(/[^0-9]/g, ""))
      if (variant.compareAtPrice) updatePrecio(nombre, "antes", variant.compareAtPrice.replace(/[^0-9]/g, ""))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Catálogo de productos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Agrega los productos de esta campaña con sus precios antes/después.
        </p>
      </div>

      {/* Importar desde Shopify */}
      <ShopifyProductPicker
        mode="modelos"
        onSelectProduct={() => {}}
        onSelectVariantsAsModelos={handleShopifyVariants}
      />

      {/* Agregar manualmente */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nombre del producto…"
          className="flex-1 h-9 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <PlusIcon className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {/* Lista de productos */}
      {modelosCustom.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border text-center">
          <PackageIcon className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin productos aún</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Escribe el nombre arriba o importa desde Shopify</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modelosCustom.map((modelo) => {
            const precios = preciosModelos[modelo]
            return (
              <div
                key={modelo}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{modelo}</p>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground line-through">Antes $</span>
                      <input
                        type="text"
                        value={precios?.antes ?? ""}
                        onChange={(e) => updatePrecio(modelo, "antes", e.target.value.replace(/\D/g, ""))}
                        placeholder="—"
                        className="w-24 h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">Ahora $</span>
                      <input
                        type="text"
                        value={precios?.ahora ?? ""}
                        onChange={(e) => updatePrecio(modelo, "ahora", e.target.value.replace(/\D/g, ""))}
                        placeholder="Precio"
                        className="w-24 h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-right font-medium"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => eliminarModeloCustom(modelo)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {modelosCustom.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {modelosCustom.length} producto{modelosCustom.length !== 1 ? "s" : ""} en esta campaña
        </p>
      )}
    </div>
  )
}
