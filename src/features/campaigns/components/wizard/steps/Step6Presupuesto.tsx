"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"
import { formatMoney, parseMoney } from "../../../lib/money"

export default function Step6Presupuesto() {
  const {
    presupuestoValor,
    fechaInicio, fechaFin, sinFechaFin,
    setField,
  } = useCampaignWizard()

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
