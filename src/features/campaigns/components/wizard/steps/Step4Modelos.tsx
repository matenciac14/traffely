"use client"

import { useState, useEffect } from "react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import { PlusIcon, XIcon, PackageIcon, CheckIcon } from "lucide-react"
import ShopifyProductPicker from "../ShopifyProductPicker"
import type { ShopifyProductSimple } from "@/lib/integrations/shopify/client"
import { cn } from "@/lib/utils"

interface ProductoCatalogo {
  id: string
  nombre: string
  precioActual: number | null
  precioAntes: number | null
  descripcion: string | null
}

export default function Step4Modelos() {
  const {
    empresaId,
    productosCustom,
    productosSeleccionados,
    preciosProductos,
    updatePrecio,
    agregarProductoCustom,
    eliminarProductoCustom,
    toggleProducto,
  } = useCampaignWizard()

  const [input, setInput] = useState("")
  const [catalogo, setCatalogo] = useState<ProductoCatalogo[]>([])

  // Cargar catálogo de la empresa seleccionada
  useEffect(() => {
    if (!empresaId) { setCatalogo([]); return }
    fetch(`/api/empresas/${empresaId}/productos`)
      .then((r) => r.ok ? r.json() : { productos: [] })
      .then((d) => setCatalogo(d.productos ?? []))
      .catch(() => setCatalogo([]))
  }, [empresaId])

  function handleAdd() {
    const nombre = input.trim()
    if (!nombre || productosCustom.includes(nombre)) return
    agregarProductoCustom(nombre)
    setInput("")
  }

  function handleToggleCatalogo(producto: ProductoCatalogo) {
    const isSelected = productosSeleccionados.includes(producto.nombre)
    if (!isSelected) {
      // Pre-rellenar precios desde catálogo
      toggleProducto(producto.nombre)
      if (producto.precioActual) updatePrecio(producto.nombre, "ahora", String(Math.round(producto.precioActual)))
      if (producto.precioAntes) updatePrecio(producto.nombre, "antes", String(Math.round(producto.precioAntes)))
    } else {
      toggleProducto(producto.nombre)
    }
  }

  function handleShopifyVariants(product: ShopifyProductSimple) {
    for (const variant of product.variants) {
      const nombre = product.variants.length === 1
        ? product.title
        : `${product.title} — ${variant.title}`
      if (!productosCustom.includes(nombre)) agregarProductoCustom(nombre)
      if (variant.price) updatePrecio(nombre, "ahora", variant.price.replace(/[^0-9]/g, ""))
      if (variant.compareAtPrice) updatePrecio(nombre, "antes", variant.compareAtPrice.replace(/[^0-9]/g, ""))
    }
  }

  // Productos seleccionados (catálogo + custom) para mostrar precios
  const todosSeleccionados = productosSeleccionados.filter(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Catálogo de productos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona los productos de esta campaña con sus precios antes/después.
        </p>
      </div>

      {/* Catálogo de la empresa */}
      {catalogo.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Catálogo de la empresa
          </p>
          {catalogo.map((producto) => {
            const selected = productosSeleccionados.includes(producto.nombre)
            return (
              <button
                key={producto.id}
                onClick={() => handleToggleCatalogo(producto)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {selected && <CheckIcon className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{producto.nombre}</p>
                  {producto.descripcion && (
                    <p className="text-xs text-muted-foreground truncate">{producto.descripcion}</p>
                  )}
                </div>
                {(producto.precioActual || producto.precioAntes) && (
                  <div className="text-right flex-shrink-0">
                    {producto.precioAntes && (
                      <p className="text-xs text-muted-foreground line-through">
                        ${producto.precioAntes.toLocaleString("es-CO")}
                      </p>
                    )}
                    {producto.precioActual && (
                      <p className="text-sm font-semibold text-foreground">
                        ${producto.precioActual.toLocaleString("es-CO")}
                      </p>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Importar desde Shopify */}
      <ShopifyProductPicker
        mode="productos"
        onSelectProduct={() => {}}
        onSelectVariantsAsModelos={handleShopifyVariants}
      />

      {/* Agregar manualmente */}
      <div>
        {catalogo.length > 0 && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Agregar producto manual
          </p>
        )}
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
      </div>

      {/* Lista de precios para todos los seleccionados */}
      {todosSeleccionados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border text-center">
          <PackageIcon className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin productos seleccionados</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {catalogo.length > 0
              ? "Selecciona del catálogo o agrega uno manualmente"
              : "Escribe el nombre arriba o importa desde Shopify"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Precios en esta campaña
          </p>
          {todosSeleccionados.map((producto) => {
            const precios = preciosProductos[producto]
            const esCustom = productosCustom.includes(producto)
            return (
              <div
                key={producto}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{producto}</p>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground line-through">Antes $</span>
                      <input
                        type="text"
                        value={precios?.antes ?? ""}
                        onChange={(e) => updatePrecio(producto, "antes", e.target.value.replace(/\D/g, ""))}
                        placeholder="—"
                        className="w-24 h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">Ahora $</span>
                      <input
                        type="text"
                        value={precios?.ahora ?? ""}
                        onChange={(e) => updatePrecio(producto, "ahora", e.target.value.replace(/\D/g, ""))}
                        placeholder="Precio"
                        className="w-24 h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-right font-medium"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => esCustom ? eliminarProductoCustom(producto) : toggleProducto(producto)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {todosSeleccionados.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {todosSeleccionados.length} producto{todosSeleccionados.length !== 1 ? "s" : ""} en esta campaña
        </p>
      )}
    </div>
  )
}
