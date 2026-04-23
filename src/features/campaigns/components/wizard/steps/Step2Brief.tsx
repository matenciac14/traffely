"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"
import { EVENTOS_ESTACIONALES } from "../../../constants/campaign-data"
import { cn } from "@/lib/utils"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function Step2Brief() {
  const {
    tipoCampana, setTipoCampana,
    eventoEstacional, eventoCustom,
    nombreCampana,
    contextoCampana, objetivoCampana, publicoObjetivo,
    insightMensajeClave, propuestasValor, tonoYestilo,
    llamadaAccion, queNOhacer,
    seleccionarEvento, setField,
  } = useCampaignWizard()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Brief de campaña</h2>
        <p className="text-sm text-muted-foreground mt-1">Define el tipo, nombre y contexto estratégico de la campaña.</p>
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
      <Field label="Nombre de la campaña">
        <input
          type="text"
          value={nombreCampana}
          onChange={(e) => setField("nombreCampana", e.target.value)}
          placeholder="Ej. Black Friday 2025 — NB 530"
          className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </Field>

      {/* ── Contexto estratégico ─────────────────────────────────── */}
      <div className="pt-2 border-t border-border space-y-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Contexto estratégico</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mientras más completes estos campos, mejor será el brief generado por IA. Todos son opcionales.
          </p>
        </div>

        <Field label="Contexto de la campaña" hint="opcional">
          <textarea
            value={contextoCampana}
            onChange={(e) => setField("contextoCampana", e.target.value)}
            placeholder="¿Qué está pasando en el negocio? ¿Por qué esta campaña ahora? Ej. 'Lanzamiento de nueva línea running, necesitamos posicionarla contra Nike Free'"
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
          />
        </Field>

        <Field label="Objetivo de la campaña" hint="opcional">
          <input
            type="text"
            value={objetivoCampana}
            onChange={(e) => setField("objetivoCampana", e.target.value)}
            placeholder="Ej. Aumentar ventas online 30% en mayo, generar 500 leads para evento presencial"
            className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Público objetivo" hint="opcional">
          <input
            type="text"
            value={publicoObjetivo}
            onChange={(e) => setField("publicoObjetivo", e.target.value)}
            placeholder="Ej. Hombres 25-40 años, runners recreativos, NSE medio-alto, Bogotá"
            className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Insight o mensaje clave" hint="opcional">
          <input
            type="text"
            value={insightMensajeClave}
            onChange={(e) => setField("insightMensajeClave", e.target.value)}
            placeholder="Ej. 'El runner sabe que el equipo correcto marca la diferencia antes de salir'"
            className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Propuestas de valor de la marca" hint="opcional">
          <textarea
            value={propuestasValor}
            onChange={(e) => setField("propuestasValor", e.target.value)}
            placeholder="Ej. Autenticidad, comunidad runner, calidad premium sin marca premium, asesoría personalizada"
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tono y estilo" hint="opcional">
            <input
              type="text"
              value={tonoYestilo}
              onChange={(e) => setField("tonoYestilo", e.target.value)}
              placeholder="Ej. Cercano, aspiracional, sin tecnicismos"
              className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>

          <Field label="Llamada a la acción (CTA)" hint="opcional">
            <input
              type="text"
              value={llamadaAccion}
              onChange={(e) => setField("llamadaAccion", e.target.value)}
              placeholder="Ej. Compra ahora, Obtén el tuyo"
              className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        </div>

        <Field label="Qué NO hacer / palabras prohibidas" hint="opcional">
          <input
            type="text"
            value={queNOhacer}
            onChange={(e) => setField("queNOhacer", e.target.value)}
            placeholder="Ej. No mencionar precio antes de mostrar el producto, evitar 'barato', no comparar con Adidas"
            className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      </div>
    </div>
  )
}
