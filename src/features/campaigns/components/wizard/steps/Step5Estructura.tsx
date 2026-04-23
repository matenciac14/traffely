"use client"

import { useState } from "react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import {
  OBJETIVOS_META, TIPOS_TRAFICO, NIVELES_CONCIENCIA, MOTIVOS,
  ANGULOS_BASE, NARRATIVAS_BASE, TIPOS_PIEZA, FORMATOS, ESTRUCTURAS_COPY,
  PUBLICOS, DURACIONES_VIDEO,
} from "../../../constants/campaign-data"
import type { Piece } from "../../../types"
import { cn } from "@/lib/utils"
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, AlertCircleIcon } from "lucide-react"

// ── Validation helper ────────────────────────────────────────────────────────

function getMissingFields(p: Piece): string[] {
  const missing: string[] = []
  if (!p.modelo) missing.push("modelo")
  if (!p.tipoPieza) missing.push("tipoPieza")
  if (!p.trafico) missing.push("trafico")
  if (!p.angulo) missing.push("angulo")
  if (!p.conciencia) missing.push("conciencia")
  if (!p.motivo) missing.push("motivo")
  if (!p.narrativa) missing.push("narrativa")
  if (!p.estructuraCopy) missing.push("estructuraCopy")
  if (!p.formato) missing.push("formato")
  const esVideo = p.tipoPieza?.toLowerCase().includes("video")
  if (esVideo && !p.duracion) missing.push("duracion")
  return missing
}

const FIELD_LABELS: Record<string, string> = {
  modelo: "Modelo",
  tipoPieza: "Tipo de pieza",
  trafico: "Tráfico",
  angulo: "Ángulo",
  conciencia: "Conciencia",
  motivo: "Motivo",
  narrativa: "Narrativa",
  estructuraCopy: "Estructura copy",
  formato: "Formato",
  duracion: "Duración",
}

// ── Piece editor ────────────────────────────────────────────────────────────

function PiezaEditor({ ci, cji, pi, showErrors }: { ci: number; cji: number; pi: number; showErrors: boolean }) {
  const { campanas, updatePiezaField, modelosSeleccionados, modelosCustom } = useCampaignWizard()
  const pieza = campanas[ci]?.conjuntos[cji]?.piezas[pi]
  if (!pieza) return null

  const esVideo = pieza.tipoPieza?.toLowerCase().includes("video")
  const missing = showErrors ? getMissingFields(pieza) : []

  const allModelos = [...modelosSeleccionados, ...modelosCustom]

  function setCustom(field: string, val: string) {
    updatePiezaField(ci, cji, pi, "_customs", { ...pieza._customs, [field]: val })
  }

  function fieldChips(
    label: string,
    fieldKey: keyof typeof pieza,
    options: readonly string[] | readonly { nombre: string; icon?: string; desc?: string }[],
    hasCustom?: string
  ) {
    type Item = { label: string; val: string; icon?: string; desc?: string }
    const isObjArr = options.length > 0 && typeof options[0] === "object"
    const items: Item[] = isObjArr
      ? (options as { nombre: string; icon?: string; desc?: string }[]).map((o) => ({ label: o.nombre, icon: o.icon, desc: o.desc, val: o.nombre }))
      : (options as string[]).map((o) => ({ label: o, val: o }))

    const current = pieza[fieldKey] as string
    const customVal = hasCustom ? (pieza._customs?.[hasCustom] ?? "") : ""
    const isMissing = missing.includes(fieldKey as string)

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isMissing ? "text-destructive" : "text-muted-foreground"
          )}>{label}</p>
          {isMissing && <AlertCircleIcon className="w-3 h-3 text-destructive" />}
        </div>
        <div className={cn("flex flex-wrap gap-1.5 p-2 rounded-lg transition-colors", isMissing && "bg-destructive/5 border border-destructive/20")}>
          {items.map((item) => (
            <button
              key={item.val}
              onClick={() => updatePiezaField(ci, cji, pi, fieldKey, item.val)}
              title={item.desc}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                current === item.val
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.label}
            </button>
          ))}
          {hasCustom && (
            <button
              onClick={() => updatePiezaField(ci, cji, pi, fieldKey, "__custom__")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                current === "__custom__"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              Otro…
            </button>
          )}
        </div>
        {current === "__custom__" && hasCustom && (
          <input
            type="text"
            value={customVal}
            onChange={(e) => setCustom(hasCustom, e.target.value)}
            placeholder="Escribe aquí…"
            className="w-full h-8 px-3 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-muted/40 rounded-xl border border-border">
      {/* Missing fields summary */}
      {showErrors && missing.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive">
          <AlertCircleIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Falta completar: <strong>{missing.map(f => FIELD_LABELS[f] ?? f).join(", ")}</strong></span>
        </div>
      )}

      {/* Estado */}
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-14">Estado</p>
        {(["activa", "reserva"] as const).map((e) => (
          <button
            key={e}
            onClick={() => updatePiezaField(ci, cji, pi, "estado", e)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize",
              pieza.estado === e
                ? e === "reserva" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            )}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Modelo — primer campo, usa los modelos del Paso 4 */}
      {allModelos.length > 0 && (() => {
        const isMissing = missing.includes("modelo")
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <p className={cn("text-xs font-semibold uppercase tracking-wide", isMissing ? "text-destructive" : "text-muted-foreground")}>Modelo</p>
              {isMissing && <AlertCircleIcon className="w-3 h-3 text-destructive" />}
            </div>
            <div className={cn("flex flex-wrap gap-1.5 p-2 rounded-lg transition-colors", isMissing && "bg-destructive/5 border border-destructive/20")}>
              {allModelos.map((m) => (
                <button
                  key={m}
                  onClick={() => updatePiezaField(ci, cji, pi, "modelo", m)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    pieza.modelo === m
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {fieldChips("Tipo de pieza", "tipoPieza", TIPOS_PIEZA, "tipoPieza")}
      {fieldChips("Tráfico", "trafico", TIPOS_TRAFICO)}
      {fieldChips("Ángulo", "angulo", ANGULOS_BASE, "angulo")}
      {fieldChips("Conciencia", "conciencia", NIVELES_CONCIENCIA)}
      {fieldChips("Motivo", "motivo", MOTIVOS)}
      {fieldChips("Narrativa", "narrativa", NARRATIVAS_BASE, "narrativa")}
      {fieldChips("Estructura copy", "estructuraCopy", ESTRUCTURAS_COPY.map((e) => e.nombre))}
      {fieldChips("Formato", "formato", FORMATOS)}

      {esVideo && (
        <div className="space-y-1.5">
          <p className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            missing.includes("duracion") ? "text-destructive" : "text-muted-foreground"
          )}>
            Duración {missing.includes("duracion") && <span className="inline-flex items-center gap-0.5"><AlertCircleIcon className="w-3 h-3" /></span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DURACIONES_VIDEO.map((d) => (
              <button
                key={d}
                onClick={() => updatePiezaField(ci, cji, pi, "duracion", d)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  pieza.duracion === d
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── AdSet row ───────────────────────────────────────────────────────────────

function ConjuntoRow({ ci, cji, showErrors }: { ci: number; cji: number; showErrors: boolean }) {
  const {
    campanas, tipoPresupuesto,
    eliminarConjunto, agregarPieza, eliminarPieza,
    updateConjunto,
  } = useCampaignWizard()
  const conjunto = campanas[ci]?.conjuntos[cji]

  // Auto-expand first incomplete pieza
  const firstIncompleteIdx = showErrors
    ? conjunto?.piezas.findIndex((p) => getMissingFields(p).length > 0) ?? -1
    : -1

  const [expandedPieza, setExpandedPieza] = useState<number | null>(
    firstIncompleteIdx >= 0 ? firstIncompleteIdx : null
  )

  if (!conjunto) return null

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide w-20 flex-shrink-0">
          Conjunto {cji + 1}
        </span>
        <select
          value={conjunto.publico}
          onChange={(e) => updateConjunto(ci, cji, { publico: e.target.value })}
          className="flex-1 h-8 px-2 rounded-lg border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">— Público —</option>
          {PUBLICOS.map((p) => <option key={p} value={p}>{p}</option>)}
          <option value="__custom__">Público personalizado…</option>
        </select>
        {tipoPresupuesto === "ABO" && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="number" min={0} max={100}
              value={conjunto.porcentaje}
              onChange={(e) => updateConjunto(ci, cji, { porcentaje: Number(e.target.value) })}
              className="w-14 h-8 px-2 text-xs text-center rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        )}
        <button
          onClick={() => eliminarConjunto(ci, cji)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {conjunto.publico === "__custom__" && (
        <div className="px-4 py-2 border-b border-border">
          <input
            type="text"
            value={conjunto.publicoCustom}
            onChange={(e) => updateConjunto(ci, cji, { publicoCustom: e.target.value })}
            placeholder="Describe el público personalizado"
            className="w-full h-8 px-3 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}

      {/* Piezas */}
      <div className="divide-y divide-border">
        {conjunto.piezas.map((pieza, pi) => {
          const piezaMissing = showErrors ? getMissingFields(pieza) : []
          const hasError = piezaMissing.length > 0
          return (
            <div key={pieza.id}>
              <div className="flex items-center gap-2 px-4 py-2.5">
                <button
                  onClick={() => setExpandedPieza(expandedPieza === pi ? null : pi)}
                  className="flex-1 flex items-center gap-2 text-left hover:text-primary transition-colors"
                >
                  <span className={cn(
                    "w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0",
                    pieza.estado === "reserva" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                  )}>
                    {pi + 1}
                  </span>
                  <span className="text-xs text-foreground flex-1">
                    {pieza.tipoPieza || "sin tipo"} · {pieza.angulo || "sin ángulo"} · <span className="capitalize">{pieza.estado}</span>
                  </span>
                  {hasError && (
                    <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                      <AlertCircleIcon className="w-3 h-3" />
                      {piezaMissing.length} campo{piezaMissing.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {expandedPieza === pi
                    ? <ChevronUpIcon className="w-3.5 h-3.5 ml-1 text-muted-foreground flex-shrink-0" />
                    : <ChevronDownIcon className="w-3.5 h-3.5 ml-1 text-muted-foreground flex-shrink-0" />
                  }
                </button>
                <button
                  onClick={() => eliminarPieza(ci, cji, pi)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
              {expandedPieza === pi && (
                <div className="px-4 pb-4">
                  <PiezaEditor ci={ci} cji={cji} pi={pi} showErrors={showErrors} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-4 py-2 border-t border-border flex gap-3">
        <button
          onClick={() => agregarPieza(ci, cji, "activa")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Pieza activa
        </button>
        <button
          onClick={() => agregarPieza(ci, cji, "reserva")}
          className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Reserva
        </button>
      </div>
    </div>
  )
}

// ── Main step ───────────────────────────────────────────────────────────────

export default function Step5Estructura() {
  const {
    objetivo, setField,
    tipoPresupuesto,
    autoMode, setAutoMode,
    autoCampanas, autoConjuntos, autoPiezasXConj, autoStep,
    campanas, agregarCampana, eliminarCampana,
    agregarConjunto, crearEstructuraAuto,
  } = useCampaignWizard()

  // Track if user has tried to advance (to show errors)
  const [triedNext, setTriedNext] = useState(false)

  // Expose setter so parent page can trigger it — via a custom event
  const handleTryNext = () => setTriedNext(true)

  const hasPiezaErrors = campanas.some(c =>
    c.conjuntos.some(cj => cj.piezas.some(p => getMissingFields(p).length > 0))
  )

  return (
    <div className="space-y-8" onClickCapture={() => {}}>
      <div>
        <h2 className="text-xl font-semibold text-foreground">Estructura Meta</h2>
        <p className="text-sm text-muted-foreground mt-1">Objetivo, presupuesto y estructura de campañas.</p>
      </div>

      {/* Objetivo */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Objetivo de campaña</label>
        <div className="grid grid-cols-3 gap-2">
          {OBJETIVOS_META.map((obj) => (
            <button
              key={obj.nombre}
              onClick={() => setField("objetivo", obj.nombre)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all",
                objetivo === obj.nombre
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <p className="text-sm font-semibold text-foreground leading-tight">{obj.nombre}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{obj.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tipo presupuesto */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Tipo de presupuesto</label>
        <div className="grid grid-cols-2 gap-3">
          {(["CBO", "ABO"] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setField("tipoPresupuesto", tipo)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                tipoPresupuesto === tipo
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <p className="text-sm font-bold text-foreground">{tipo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tipo === "CBO"
                  ? "Meta distribuye el presupuesto por campaña"
                  : "Tú controlas el % por conjunto de anuncios"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Auto mode + configuración */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Modo de creación</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { val: "quick", label: "Asistente rápido", desc: "Define campañas, conjuntos y piezas en segundos" },
            { val: "manual", label: "Manual", desc: "Construye la estructura tú mismo" },
          ] as const).map((mode) => (
            <button
              key={mode.val}
              onClick={() => setAutoMode(mode.val)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all",
                autoMode === mode.val
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <p className="text-sm font-semibold text-foreground">{mode.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
            </button>
          ))}
        </div>

        {autoMode === "quick" && (
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
            {([
              { tipo: "camp" as const, label: "Campañas", val: autoCampanas, min: 1, max: 5 },
              { tipo: "conj" as const, label: "Conjuntos por campaña", val: autoConjuntos, min: 1, max: 8 },
              { tipo: "pieza" as const, label: "Piezas por conjunto", val: autoPiezasXConj, min: 1, max: 12 },
            ]).map(({ tipo, label, val, min, max }) => (
              <div key={tipo} className="flex items-center gap-3">
                <span className="text-sm text-foreground flex-1">{label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => autoStep(tipo, -1)}
                    disabled={val <= min}
                    className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-sm hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">{val}</span>
                  <button
                    onClick={() => autoStep(tipo, 1)}
                    disabled={val >= max}
                    className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-sm hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={crearEstructuraAuto}
              className="w-full h-10 mt-1 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Generar estructura ({autoCampanas * autoConjuntos * autoPiezasXConj} piezas)
            </button>
          </div>
        )}
      </div>

      {/* Campaign tree */}
      {campanas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Campañas <span className="text-muted-foreground">({campanas.length})</span>
            </p>
            <button
              onClick={agregarCampana}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Campaña
            </button>
          </div>

          {campanas.map((campana, ci) => (
            <div key={campana.id} className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-muted/50 border-b border-border">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Campaña {ci + 1}</span>
                <span className="text-sm font-medium text-foreground flex-1 truncate">{campana.nombre}</span>
                {tipoPresupuesto === "ABO" && (
                  <span className="text-xs text-muted-foreground">
                    {campana.conjuntos.reduce((a, c) => a + (Number(c.porcentaje) || 0), 0)}%
                  </span>
                )}
                <button
                  onClick={() => eliminarCampana(ci)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-3">
                {campana.conjuntos.map((_, cji) => (
                  <ConjuntoRow key={cji} ci={ci} cji={cji} showErrors={triedNext} />
                ))}
                <button
                  onClick={() => agregarConjunto(ci)}
                  className="w-full h-9 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  + Conjunto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {campanas.length === 0 && autoMode === "manual" && (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">No hay campañas aún</p>
          <button
            onClick={agregarCampana}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            + Agregar campaña
          </button>
        </div>
      )}

      {/* Hidden trigger for parent to activate error mode */}
      <button
        id="step5-try-next"
        className="hidden"
        onClick={handleTryNext}
        aria-hidden
      />
    </div>
  )
}
