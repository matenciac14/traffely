"use client"

import { AlertTriangleIcon } from "lucide-react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import { formatMoney, parseMoney } from "../../../lib/money"

// Meta best practice: mínimo ~$15 USD por ad set/día para que el algoritmo optimice
const MIN_POR_ADSET_DIARIO_COP = 60_000 // ~$15 USD

export default function Step6Presupuesto() {
  const {
    presupuestoValor,
    presupuestoModo,
    fechaInicio, fechaFin, sinFechaFin,
    tipoPresupuesto,
    campanas,
    setField,
  } = useCampaignWizard()

  // Calcular advertencia de budget sufficiency
  const totalAdSets = campanas.reduce((a, c) => a + c.conjuntos.length, 0)
  const budget = parseInt(presupuestoValor || "0")
  const budgetDiario = presupuestoModo === "mensual" ? Math.round(budget / 30) : budget
  const budgetPorAdSet = totalAdSets > 0 ? Math.round(budgetDiario / totalAdSets) : 0
  const budgetWarning =
    totalAdSets > 0 &&
    budget > 0 &&
    tipoPresupuesto === "ABO" &&
    budgetPorAdSet < MIN_POR_ADSET_DIARIO_COP

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Presupuesto y fechas</h2>
        <p className="text-sm text-muted-foreground mt-1">Define cuánto invertir y en qué periodo.</p>
      </div>

      {/* Presupuesto */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Presupuesto total (COP)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">$</span>
          <input
            type="text"
            value={presupuestoValor ? formatMoney(presupuestoValor) : ""}
            onChange={(e) => setField("presupuestoValor", parseMoney(e.target.value))}
            placeholder="0"
            className="w-full h-11 pl-8 pr-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm text-right font-mono"
          />
        </div>
        {presupuestoValor && (
          <p className="text-xs text-muted-foreground text-right">COP {formatMoney(presupuestoValor)}</p>
        )}
      </div>

      {/* Fechas */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Fecha de inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setField("fechaInicio", e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Fecha de fin</label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sinFechaFin}
                onChange={(e) => setField("sinFechaFin", e.target.checked)}
                className="w-4 h-4 rounded border-input accent-primary"
              />
              Sin fecha fin (evergreen)
            </label>
          </div>
          {!sinFechaFin && (
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setField("fechaFin", e.target.value)}
              min={fechaInicio}
              className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          )}
        </div>
      </div>

      {/* Budget sufficiency warning */}
      {budgetWarning && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
          <AlertTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-800">Presupuesto bajo por conjunto (Meta best practice)</p>
            <p className="text-xs text-amber-700">
              Con {totalAdSets} ad set{totalAdSets !== 1 ? "s" : ""} en ABO, cada uno recibiría ~COP {formatMoney(String(budgetPorAdSet))}/día.
              {" "}Meta recomienda mínimo COP {formatMoney(String(MIN_POR_ADSET_DIARIO_COP))}/día por ad set para salir de la fase de aprendizaje.
              Considera aumentar el presupuesto o reducir la cantidad de conjuntos.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {presupuestoValor && fechaInicio && (
        <div className="p-4 rounded-xl bg-accent/50 border border-accent">
          <p className="text-sm font-semibold text-accent-foreground mb-1">Resumen</p>
          <p className="text-xs text-muted-foreground">
            COP {formatMoney(presupuestoValor)} ·{" "}
            {new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
            {" → "}
            {sinFechaFin
              ? "Sin fecha fin"
              : fechaFin
                ? new Date(fechaFin + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                : "…"}
          </p>
        </div>
      )}
    </div>
  )
}
