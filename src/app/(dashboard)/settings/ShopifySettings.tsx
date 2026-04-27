"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ShoppingBagIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon, UnplugIcon, ExternalLinkIcon } from "lucide-react"

interface ShopifyStatus {
  connected: boolean
  shop?: string
  scope?: string
  lastSyncAt?: string | null
}

export default function ShopifySettings() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<ShopifyStatus | null>(null)
  const [shopInput, setShopInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Leer resultado del callback OAuth
  useEffect(() => {
    const shopifyParam = searchParams.get("shopify")
    if (shopifyParam === "connected") {
      setSuccessMsg("Shopify conectado correctamente.")
      router.replace("/settings?tab=shopify")
    } else if (shopifyParam === "error") {
      setError("Error al conectar con Shopify. Inténtalo de nuevo.")
      router.replace("/settings?tab=shopify")
    }
  }, [searchParams, router])

  useEffect(() => {
    fetch("/api/integrations/shopify")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }, [])

  async function handleConnect() {
    setError(null)
    let shop = shopInput.trim().toLowerCase()
    if (!shop.includes(".myshopify.com")) shop = `${shop}.myshopify.com`

    setConnecting(true)
    try {
      const res = await fetch("/api/integrations/shopify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      window.location.href = data.url
    } catch {
      setError("Error de red. Inténtalo de nuevo.")
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar Shopify? No se eliminarán datos de campañas existentes.")) return
    setDisconnecting(true)
    try {
      await fetch("/api/integrations/shopify", { method: "DELETE" })
      setStatus({ connected: false })
      setSuccessMsg(null)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground animate-pulse p-5">Cargando…</div>

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-[#96bf48]/10 flex items-center justify-center">
          <ShoppingBagIcon className="w-4 h-4 text-[#96bf48]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Shopify</p>
          <p className="text-xs text-muted-foreground">Importa tu catálogo de productos al wizard de campañas</p>
        </div>
        {status?.connected && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Conectado
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {!status?.connected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conecta tu tienda para importar productos directamente en el wizard. Solo necesitamos permisos de lectura.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dominio de tu tienda</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shopInput}
                  onChange={(e) => setShopInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  placeholder="mitienda.myshopify.com"
                  className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleConnect}
                  disabled={!shopInput.trim() || connecting}
                  className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {connecting ? "Redirigiendo…" : "Conectar"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Serás redirigido a Shopify para autorizar el acceso.</p>
            </div>

            {/* Qué se importa */}
            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Qué se importa</p>
              {[
                "Nombre y descripción del producto",
                "Variantes (tallas, colores, referencias)",
                "Precios (precio actual y precio tachado)",
                "Imagen principal del producto",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <p className="text-xs text-muted-foreground/70 pt-1">No se accede a pedidos, clientes ni datos financieros.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tienda</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-sm text-foreground font-mono">{status.shop}</p>
                  <a
                    href={`https://${status.shop}/admin`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Último acceso</p>
                <p className="text-sm text-foreground mt-1">
                  {status.lastSyncAt
                    ? new Date(status.lastSyncAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "Nunca"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Permisos</p>
                <p className="text-sm text-foreground mt-1 font-mono">{status.scope}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/50 text-xs text-emerald-700">
              <RefreshCwIcon className="w-3.5 h-3.5 flex-shrink-0" />
              Los productos se cargan en tiempo real desde Shopify cada vez que los usas en el wizard. Sin sincronización en segundo plano.
            </div>

            {/* Zona peligro */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
              >
                <UnplugIcon className="w-4 h-4" />
                {disconnecting ? "Desconectando…" : "Desconectar Shopify"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
