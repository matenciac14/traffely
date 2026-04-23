"use client"

import { useState } from "react"
import { CheckIcon, LinkIcon } from "lucide-react"

interface Props {
  initialAccountId: string | null
}

export default function MetaAccountForm({ initialAccountId }: Props) {
  const [accountId, setAccountId] = useState(initialAccountId ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/workspace/meta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metaAdAccountId: accountId.trim() || null }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      const data = await res.json()
      setError(data.error ?? "Error al guardar")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Coming soon banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-800">Integración Meta Ads — Fase 7 (próximamente)</p>
        <p className="text-xs text-amber-700 mt-1">
          La conexión completa con Meta Marketing API estará disponible en la siguiente fase.
          Por ahora puedes registrar tu Ad Account ID para tenerlo listo al momento de la integración.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Meta Ad Account</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Puedes encontrar tu Ad Account ID en el Business Manager de Meta → Configuración de empresa → Cuentas publicitarias.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ad Account ID
          </label>
          <div className="flex items-center border border-input rounded-lg px-3 gap-2 bg-background">
            <LinkIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="act_123456789"
              className="flex-1 text-sm py-2.5 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground font-mono"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Formato: act_XXXXXXXXX</p>
        </div>

        <div className="bg-muted/40 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lo que viene en Fase 7</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {[
              "Conexión OAuth con Meta Business Manager",
              "Lanzar campañas directamente desde Traffely",
              "Sincronizar estado de anuncios desde Meta",
              "Métricas en tiempo real: ROAS, CPC, CPM, conversiones",
              "Gestión de presupuesto y pausado desde el dashboard",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saved ? <><CheckIcon className="w-3.5 h-3.5" /> Guardado</> : saving ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  )
}
