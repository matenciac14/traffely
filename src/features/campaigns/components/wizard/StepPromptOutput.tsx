"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useCampaignWizard } from "../../store/campaign-wizard"
import { generarPromptMaestro } from "../../lib/prompt-generator"
import { CopyIcon, CheckIcon, DownloadIcon, ArrowRightIcon, SparklesIcon } from "lucide-react"
import type { CampaignWizardState } from "../../types"

// Brief completeness check
const BRIEF_FIELDS: { key: keyof CampaignWizardState; label: string }[] = [
  { key: "contextoCampana", label: "Contexto" },
  { key: "objetivoCampana", label: "Objetivo" },
  { key: "publicoObjetivo", label: "Público" },
  { key: "insightMensajeClave", label: "Insight" },
  { key: "propuestasValor", label: "Propuestas de valor" },
  { key: "tonoYestilo", label: "Tono y estilo" },
  { key: "llamadaAccion", label: "CTA" },
  { key: "queNOhacer", label: "Qué NO hacer" },
]

export default function StepPromptOutput({ onComplete, draftId }: { onComplete?: () => void; draftId?: string | null }) {
  const state = useCampaignWizard()
  const { reset } = useCampaignWizard()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(true)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const savedRef = useRef(false)

  const prompt = generarPromptMaestro(state)

  const stateAsRecord = state as unknown as Record<string, unknown>
  const filledFields = BRIEF_FIELDS.filter(f => !!stateAsRecord[f.key])
  const emptyFields = BRIEF_FIELDS.filter(f => !stateAsRecord[f.key])
  const completeness = filledFields.length
  const isComplete = completeness === BRIEF_FIELDS.length

  // Save to DB once on mount
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    const save = draftId
      ? fetch(`/api/campaigns/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", wizardState: state }),
        })
      : fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        })

    save
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al guardar")
        const data = await res.json()
        setSavedId(draftId ?? data.id)
        onComplete?.()
      })
      .catch(() => setSaveError("No se pudo guardar en la base de datos"))
      .finally(() => setSaving(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([prompt], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prompt-${state.nombreCampana || "campaña"}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleGoToCampaign() {
    reset()
    if (savedId) router.push(`/campaigns/${savedId}`)
    else router.push("/campaigns")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Prompt maestro listo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tu campaña está guardada. Desde la vista de campaña puedes generar el brief creativo completo con IA.
          </p>
        </div>

        {/* Save status */}
        <div className="flex-shrink-0 text-right">
          {saving && (
            <span className="text-xs text-muted-foreground animate-pulse">Guardando campaña…</span>
          )}
          {!saving && savedId && (
            <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>
          )}
          {!saving && saveError && (
            <span className="text-xs text-destructive">{saveError}</span>
          )}
        </div>
      </div>

      {/* Brief completeness */}
      <div className={`rounded-xl border p-4 space-y-3 ${isComplete ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className={`w-4 h-4 ${isComplete ? "text-emerald-600" : "text-amber-600"}`} />
            <span className={`text-sm font-semibold ${isComplete ? "text-emerald-800" : "text-amber-800"}`}>
              Completitud del brief: {completeness}/{BRIEF_FIELDS.length} campos
            </span>
          </div>
          <div className="h-1.5 w-24 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${(completeness / BRIEF_FIELDS.length) * 100}%` }}
            />
          </div>
        </div>
        {!isComplete && (
          <div>
            <p className={`text-xs ${isComplete ? "text-emerald-700" : "text-amber-700"}`}>
              Mayor contexto = mejor output de IA. Campos vacíos:{" "}
              <span className="font-medium">{emptyFields.map(f => f.label).join(", ")}</span>
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Puedes volver al paso 2 para completarlos antes de generar el brief con Claude.
            </p>
          </div>
        )}
        {isComplete && (
          <p className="text-xs text-emerald-700">Brief completo — Claude tendrá todo el contexto para generar un brief de alta calidad.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleGoToCampaign}
          disabled={saving}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <SparklesIcon className="w-4 h-4" />
          {saving ? "Guardando…" : "Ir a la campaña y generar brief"}
          {!saving && <ArrowRightIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-emerald-600" /> : <CopyIcon className="w-4 h-4" />}
          {copied ? "Copiado" : "Copiar prompt"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          .md
        </button>
        <div className="w-full text-xs text-muted-foreground">
          {prompt.length.toLocaleString("es-CO")} caracteres
        </div>
      </div>

      {/* Prompt preview */}
      <pre className="p-5 rounded-xl border border-border bg-card text-xs text-foreground font-mono leading-relaxed overflow-auto max-h-[55vh] whitespace-pre-wrap break-words">
        {prompt}
      </pre>
    </div>
  )
}
