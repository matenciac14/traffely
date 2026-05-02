"use client"

import { useState } from "react"
import { SparklesIcon, CheckIcon, ChevronRightIcon } from "lucide-react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import { cn } from "@/lib/utils"
import type { ConceptoWizard } from "../../../types"

const ANGULO_COLORS: Record<string, string> = {
  "Dolor": "bg-red-100 text-red-700 border-red-200",
  "Aspiracional": "bg-purple-100 text-purple-700 border-purple-200",
  "Prueba social": "bg-blue-100 text-blue-700 border-blue-200",
  "Urgencia": "bg-orange-100 text-orange-700 border-orange-200",
  "Curiosidad": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Beneficio directo": "bg-green-100 text-green-700 border-green-200",
}

function AnguloChip({ angulo }: { angulo: string }) {
  const color = ANGULO_COLORS[angulo] ?? "bg-muted text-muted-foreground border-border"
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", color)}>
      {angulo}
    </span>
  )
}

function FrameworkChip({ fw }: { fw: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
      {fw}
    </span>
  )
}

function ConceptoCard({
  concepto,
  onToggle,
}: {
  concepto: ConceptoWizard
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all",
        concepto.isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          concepto.isSelected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30"
        )}>
          {concepto.isSelected && <CheckIcon className="w-3 h-3 text-white" />}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">{concepto.nombre}</p>

          <p className="text-xs text-muted-foreground leading-relaxed">{concepto.hipotesis}</p>

          <div className="flex flex-wrap gap-1.5">
            {concepto.anguloMensajeria && <AnguloChip angulo={concepto.anguloMensajeria} />}
            {concepto.frameworkCopy && <FrameworkChip fw={concepto.frameworkCopy} />}
          </div>

          {concepto.direccionVisual && (
            <p className="text-[11px] text-muted-foreground/70 italic border-l-2 border-border pl-2">
              {concepto.direccionVisual}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export default function Step3Conceptos() {
  const {
    empresaId,
    nombreCampana,
    tipoCampana,
    contextoCampana,
    objetivoCampana,
    publicoObjetivo,
    tipoOferta,
    contextoOferta,
    conceptos,
    setConceptos,
    toggleConcepto,
  } = useCampaignWizard()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCount = conceptos.filter((c) => c.isSelected).length

  async function handleGenerar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/campaigns/generate-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          nombreCampana,
          tipoCampana,
          contextoCampana,
          objetivoCampana,
          publicoObjetivo,
          tipoOferta,
          contextoOferta,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Error al generar conceptos")
      }
      const { conceptos: generated } = await res.json()
      setConceptos(generated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Conceptos Creativos</h2>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            Opcional
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Claude genera 3–5 conceptos estratégicos basados en tu brief. Selecciona los que quieras ejecutar — las piezas heredarán el concepto elegido.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGenerar}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold transition-all",
          loading
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:opacity-90"
        )}
      >
        <SparklesIcon className={cn("w-4 h-4", loading && "animate-pulse")} />
        {loading ? "Generando conceptos…" : conceptos.length > 0 ? "Regenerar conceptos" : "Generar conceptos con IA"}
      </button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {conceptos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {conceptos.length} conceptos generados
            </p>
            {selectedCount > 0 && (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {conceptos.map((concepto) => (
              <ConceptoCard
                key={concepto.id}
                concepto={concepto}
                onToggle={() => toggleConcepto(concepto.id)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <ChevronRightIcon className="w-3.5 h-3.5" />
            <span>Puedes continuar sin seleccionar ninguno — los conceptos son opcionales.</span>
          </div>
        </div>
      )}

      {conceptos.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <SparklesIcon className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Genera conceptos o salta este paso — es 100% opcional.
          </p>
        </div>
      )}
    </div>
  )
}
