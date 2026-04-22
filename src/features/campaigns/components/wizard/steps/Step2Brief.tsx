"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"
import { EVENTOS_ESTACIONALES } from "../../../constants/campaign-data"
import { cn } from "@/lib/utils"

export default function Step2Brief() {
  const {
    tipoCampana, setTipoCampana,
    eventoEstacional, eventoCustom,
    nombreCampana,
    seleccionarEvento, setField,
  } = useCampaignWizard()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Brief de campaña</h2>
        <p className="text-sm text-muted-foreground mt-1">Define el tipo y nombre de tu campaña.</p>
      </div>

      {/* Tipo campaña */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Tipo de campaña</label>
        <div className="grid grid-cols-2 gap-3">
          {(["evergreen", "estacional"] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoCampana(tipo)}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                tipoCampana === tipo
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <p className="text-sm font-semibold capitalize text-foreground">{tipo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tipo === "evergreen"
                  ? "Corre todo el año sin fecha límite"
                  : "Ligada a un evento o fecha especial"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Evento estacional */}
      {tipoCampana === "estacional" && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Evento estacional</label>
          <div className="grid grid-cols-2 gap-2">
            {EVENTOS_ESTACIONALES.map((ev) => (
              <button
                key={ev.nombre}
                onClick={() => seleccionarEvento(ev.nombre)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all text-sm",
                  eventoEstacional === ev.nombre
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card hover:border-primary/40 text-foreground"
                )}
              >
                <span className="text-xs text-muted-foreground">{ev.mes} · </span>
                {ev.nombre}
              </button>
            ))}
            <button
              onClick={() => seleccionarEvento("__custom__")}
              className={cn(
                "p-3 rounded-lg border text-left transition-all text-sm",
                eventoEstacional === "__custom__"
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card hover:border-primary/40 text-foreground"
              )}
            >
              ✏️ Otro evento…
            </button>
          </div>

          {eventoEstacional === "__custom__" && (
            <input
              type="text"
              value={eventoCustom}
              onChange={(e) => setField("eventoCustom", e.target.value)}
              placeholder="Nombre del evento personalizado"
              className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>
      )}

      {/* Nombre campaña */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Nombre de la campaña</label>
        <input
          type="text"
          value={nombreCampana}
          onChange={(e) => setField("nombreCampana", e.target.value)}
          placeholder="Ej. Black Friday 2025 — NB 530"
          className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>
    </div>
  )
}
