"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SparklesIcon, CheckIcon, XIcon, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Suggestion {
  pieceId: string
  modelo: string | null
  tipoPieza: string | null
  priority: string
  days: number
  notes: string
}

const PRIORITY_STYLE: Record<string, { label: string; color: string }> = {
  URGENTE: { label: "Urgente", color: "text-red-600 bg-red-50" },
  ALTA:    { label: "Alta",    color: "text-orange-600 bg-orange-50" },
  MEDIA:   { label: "Media",   color: "text-amber-600 bg-amber-50" },
  BAJA:    { label: "Baja",    color: "text-muted-foreground bg-muted" },
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

export default function CampaignWorkPlan({
  campaignId,
  briefGenerated,
  piecesCount,
}: {
  campaignId: string
  briefGenerated: boolean
  piecesCount: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!briefGenerated || piecesCount === 0) return null

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setSuggestions(null)
    setApplied(false)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/work-plan`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al generar plan")
      setSuggestions(data.suggestions)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!suggestions) return
    setApplying(true)
    const today = new Date()
    const workPlan = suggestions.map((s) => ({
      pieceId: s.pieceId,
      priority: s.priority,
      dueDate: addBusinessDays(today, s.days).toISOString(),
    }))
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply-work-plan", workPlan }),
      })
      if (!res.ok) throw new Error("Error al aplicar plan")
      setApplied(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aplicar")
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Plan de trabajo IA
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prioridad y días estimados de producción por pieza — generado por Claude
          </p>
        </div>
        {!applied && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            {loading ? "Generando…" : suggestions ? "Regenerar" : "Generar plan"}
          </button>
        )}
        {applied && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckIcon className="w-3.5 h-3.5" />
            Plan aplicado
          </span>
        )}
      </div>

      {error && (
        <div className="px-5 py-3 text-xs text-destructive flex items-center gap-2">
          <XIcon className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {suggestions && !applied && (
        <div className="divide-y divide-border">
          <div className="px-5 py-3 grid grid-cols-12 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-4">Pieza</span>
            <span className="col-span-2">Prioridad</span>
            <span className="col-span-1 text-center">Días</span>
            <span className="col-span-5">Justificación</span>
          </div>
          {suggestions.map((s) => {
            const pri = PRIORITY_STYLE[s.priority] ?? PRIORITY_STYLE.MEDIA
            return (
              <div key={s.pieceId} className="px-5 py-3 grid grid-cols-12 items-start gap-2 text-xs">
                <span className="col-span-4 text-foreground font-medium truncate">
                  {s.modelo ?? "—"} · {s.tipoPieza ?? "—"}
                </span>
                <span className="col-span-2">
                  <span className={cn("px-2 py-0.5 rounded-md font-semibold text-[11px]", pri.color)}>
                    {pri.label}
                  </span>
                </span>
                <span className="col-span-1 text-center text-muted-foreground font-mono">{s.days}d</span>
                <span className="col-span-5 text-muted-foreground">{s.notes}</span>
              </div>
            )
          })}
          <div className="px-5 py-4 flex items-center gap-3 bg-muted/30">
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              {applying ? "Aplicando…" : "Confirmar y aplicar"}
            </button>
            <button
              onClick={() => setSuggestions(null)}
              className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <p className="text-xs text-muted-foreground ml-auto">
              Calcula fechas límite desde hoy en días hábiles
            </p>
          </div>
        </div>
      )}

      {!suggestions && !loading && !error && (
        <div className="px-5 py-4 text-xs text-muted-foreground">
          Haz click en "Generar plan" para que Claude asigne prioridad y días estimados a cada pieza.
        </div>
      )}

      {loading && (
        <div className="px-5 py-4 text-xs text-muted-foreground animate-pulse">
          Claude está analizando las piezas y generando el plan…
        </div>
      )}
    </div>
  )
}
