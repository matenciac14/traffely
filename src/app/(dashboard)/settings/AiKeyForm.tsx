"use client"

import { useState, useEffect } from "react"
import { KeyRoundIcon, EyeIcon, EyeOffIcon, CheckIcon, Loader2Icon, TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-api03-..." },
  { id: "openai",    label: "OpenAI (GPT-4)",    placeholder: "sk-proj-..." },
  { id: "gemini",    label: "Google Gemini",      placeholder: "AIza..." },
] as const

type Provider = typeof PROVIDERS[number]["id"]

export default function AiKeyForm() {
  const [provider, setProvider] = useState<Provider | "">("")
  const [key, setKey] = useState("")
  const [maskedKey, setMaskedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/workspace/ai-key")
      .then((r) => r.json())
      .then((data) => {
        if (data.aiProvider) setProvider(data.aiProvider as Provider)
        if (data.aiApiKeyMasked) setMaskedKey(data.aiApiKeyMasked)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!provider) return
    setSaving(true)
    await fetch("/api/workspace/ai-key", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider: provider || null, aiApiKey: key || null }),
    })
    setSaving(false)
    setSaved(true)
    if (key) setMaskedKey(`${"•".repeat(Math.max(0, key.length - 6))}${key.slice(-6)}`)
    setKey("")
    setTimeout(() => setSaved(false), 2000)
  }

  async function remove() {
    if (!confirm("¿Eliminar la API key configurada?")) return
    setSaving(true)
    await fetch("/api/workspace/ai-key", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider: null, aiApiKey: null }),
    })
    setProvider("")
    setMaskedKey(null)
    setKey("")
    setSaving(false)
  }

  const currentProvider = PROVIDERS.find((p) => p.id === provider)

  if (loading) return <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Cargando…</div>

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">¿Por qué configurar tu propia API key?</p>
        <p className="text-blue-700 leading-relaxed">
          Por defecto, Traffely usa su propia clave de IA. Si configuras la tuya, las generaciones se cobran
          directamente a tu cuenta del proveedor — útil si ya tienes créditos o precios negociados.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <KeyRoundIcon className="w-4 h-4 text-muted-foreground" />
          API Key de IA
        </h2>

        {/* Provider selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Proveedor</p>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  provider === p.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key input */}
        {provider && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {maskedKey ? "Reemplazar clave actual" : "API Key"}
            </p>
            {maskedKey && (
              <div className="flex items-center gap-2 mb-3 bg-muted/60 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-muted-foreground flex-1">{maskedKey}</span>
                <button
                  onClick={remove}
                  disabled={saving}
                  className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                  title="Eliminar key"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={currentProvider?.placeholder ?? ""}
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {maskedKey ? "La key existente se usa si no ingresas una nueva." : "La key se guarda en tu workspace, no compartida con otros."}
          </p>
          <button
            onClick={save}
            disabled={saving || !provider || saved}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-colors",
              saved
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            )}
          >
            {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : saved ? <CheckIcon className="w-4 h-4" /> : null}
            {saved ? "Guardado" : saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">Nota de seguridad:</span> La clave se almacena en tu workspace. En una versión futura
        estará cifrada con AES-256. Por ahora, usa una clave con permisos mínimos necesarios y rótala periódicamente.
      </div>
    </div>
  )
}
