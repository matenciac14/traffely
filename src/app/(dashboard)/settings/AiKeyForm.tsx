"use client"

import { useState, useEffect } from "react"
import { KeyRoundIcon, EyeIcon, EyeOffIcon, CheckIcon, Loader2Icon, TrashIcon, ShieldCheckIcon, AlertCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-api03-..." },
  { id: "openai",    label: "OpenAI (GPT-4)",     placeholder: "sk-proj-..." },
  { id: "gemini",    label: "Google Gemini",       placeholder: "AIza..." },
] as const

type Provider = typeof PROVIDERS[number]["id"]

export default function AiKeyForm() {
  const [provider, setProvider]     = useState<Provider | "">("")
  const [key, setKey]               = useState("")
  const [hasKey, setHasKey]         = useState(false)
  const [maskedKey, setMaskedKey]   = useState<string | null>(null)
  const [showKey, setShowKey]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [loading, setLoading]       = useState(true)
  const [replacing, setReplacing]   = useState(false)

  useEffect(() => {
    fetch("/api/workspace/ai-key")
      .then((r) => r.json())
      .then((data) => {
        if (data.aiProvider) setProvider(data.aiProvider as Provider)
        if (data.maskedKey)  setMaskedKey(data.maskedKey)   // campo correcto
        setHasKey(!!data.hasKey)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!provider || !key.trim()) return
    setSaving(true)
    await fetch("/api/workspace/ai-key", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider: provider, aiApiKey: key.trim() }),
    })
    setMaskedKey(`****${key.trim().slice(-4)}`)
    setHasKey(true)
    setKey("")
    setReplacing(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function remove() {
    if (!confirm("¿Eliminar la API key configurada? La generación de IA dejará de funcionar hasta configurar una nueva.")) return
    setSaving(true)
    await fetch("/api/workspace/ai-key", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiProvider: null, aiApiKey: null }),
    })
    setProvider("")
    setMaskedKey(null)
    setHasKey(false)
    setKey("")
    setReplacing(false)
    setSaving(false)
  }

  const currentProvider = PROVIDERS.find((p) => p.id === provider)

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
      <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> Cargando…
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Banner: key ya configurada ─────────────────────────────── */}
      {hasKey && !replacing && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">API key configurada</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Proveedor: <span className="font-medium">{PROVIDERS.find(p => p.id === provider)?.label ?? provider}</span>
                {maskedKey && <> · Clave: <span className="font-mono">{maskedKey}</span></>}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Las generaciones de IA se cobran a tu cuenta del proveedor.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setReplacing(true)}
                className="h-7 px-3 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                Reemplazar
              </button>
              <button
                onClick={remove}
                disabled={saving}
                className="h-7 px-3 text-xs font-medium bg-white border border-emerald-200 text-destructive rounded-lg hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner: sin key ─────────────────────────────────────────── */}
      {!hasKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Sin API key configurada</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              La generación de IA no funcionará hasta que configures tu clave. Configura tu clave de Anthropic, OpenAI o Gemini.
            </p>
          </div>
        </div>
      )}

      {/* ── Formulario: nueva key o reemplazo ───────────────────────── */}
      {(!hasKey || replacing) && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRoundIcon className="w-4 h-4 text-muted-foreground" />
              {replacing ? "Reemplazar API key" : "Configurar API key"}
            </h2>
            {replacing && (
              <button onClick={() => { setReplacing(false); setKey("") }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
            )}
          </div>

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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">API Key</p>
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

          {/* Save */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Cifrada con AES-256-GCM. No se comparte con otros workspaces.
            </p>
            <button
              onClick={save}
              disabled={saving || !provider || !key.trim() || saved}
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
      )}

    </div>
  )
}
