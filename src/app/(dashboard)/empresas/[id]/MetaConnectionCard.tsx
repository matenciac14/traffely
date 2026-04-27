"use client"

import { useState } from "react"
import { CheckCircleIcon, Loader2Icon, LinkIcon, Unlink2Icon, ExternalLinkIcon, AlertCircleIcon } from "lucide-react"

interface Props {
  empresaId: string
  initialConnected: boolean
  initialAccountName?: string | null
  initialAdAccountId?: string | null
}

export default function MetaConnectionCard({
  empresaId, initialConnected, initialAccountName, initialAdAccountId,
}: Props) {
  const [connected, setConnected] = useState(initialConnected)
  const [accountName, setAccountName] = useState(initialAccountName ?? null)
  const [adAccountId, setAdAccountId] = useState(initialAdAccountId ?? "")
  const [showForm, setShowForm] = useState(false)

  const [accountInput, setAccountInput] = useState(initialAdAccountId ?? "")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    if (!accountInput.trim() || !token.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/empresas/${empresaId}/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId: accountInput.trim(), accessToken: token.trim() }),
      })
      const data = await res.json() as { ok?: boolean; accountName?: string; error?: string }
      if (!res.ok) { setError(data.error ?? "Error al conectar"); return }
      setConnected(true)
      setAccountName(data.accountName ?? null)
      setAdAccountId(accountInput.trim())
      setShowForm(false)
      setToken("")
    } catch {
      setError("Error de red — intenta de nuevo")
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar Meta Ads de esta empresa? Las métricas históricas dejarán de estar disponibles.")) return
    setLoading(true)
    try {
      await fetch(`/api/empresas/${empresaId}/meta`, { method: "DELETE" })
      setConnected(false)
      setAccountName(null)
      setAdAccountId("")
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-[#1877F2] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">f</span>
          Meta Ads
        </h2>
        {connected && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Conectado
          </span>
        )}
      </div>

      {/* Estado: conectado */}
      {connected && !showForm && (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-0.5">
            <p className="text-xs font-semibold text-emerald-800">{accountName ?? "Cuenta conectada"}</p>
            <p className="text-xs text-emerald-700 font-mono">{adAccountId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(true); setAccountInput(adAccountId) }}
              className="h-8 px-3 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Actualizar token
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-1.5 h-8 px-3 text-xs text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/5 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <Unlink2Icon className="w-3.5 h-3.5" />}
              Desconectar
            </button>
          </div>
        </>
      )}

      {/* Estado: no conectado o actualizando token */}
      {(!connected || showForm) && (
        <>
          {!connected && (
            <p className="text-xs text-muted-foreground">
              Conecta la cuenta publicitaria de Meta para ver ROAS, spend y CTR en el dashboard de métricas.
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                ID de cuenta publicitaria
              </label>
              <input
                type="text"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder="act_XXXXXXXXXXXXXXXXX"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Encuéntralo en Meta Business Suite → Configuración → Cuentas publicitarias
              </p>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Access Token (System User)
              </label>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                rows={3}
                placeholder="EAAxxxxxxxxxxxxxxxx…"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <a
                href="https://business.facebook.com/settings/system-users"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
              >
                <ExternalLinkIcon className="w-3 h-3" />
                Obtener en Meta Business Settings → System Users
              </a>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <AlertCircleIcon className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={loading || !accountInput.trim() || !token.trim()}
              className="flex items-center gap-1.5 h-8 px-4 text-xs bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading
                ? <><Loader2Icon className="w-3.5 h-3.5 animate-spin" /> Verificando…</>
                : <><LinkIcon className="w-3.5 h-3.5" /> Conectar y verificar</>
              }
            </button>
            {showForm && (
              <button
                onClick={() => { setShowForm(false); setToken(""); setError(null) }}
                className="h-8 px-3 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
