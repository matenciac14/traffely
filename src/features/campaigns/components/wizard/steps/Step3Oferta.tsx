"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"
import {
  OFERTAS_CONFIG,
  CHIPS_DETALLE_POR_OFERTA,
  CHIPS_PAGO,
  CHIPS_REGALO,
  CHIPS_GARANTIA,
  CHIPS_CAMBIOS,
  CHIPS_ENVIO,
} from "../../../constants/campaign-data"
import { cn } from "@/lib/utils"
import type { TipoOferta } from "../../../types"

type StringField = "ofertaMetodosPago" | "ofertaRegalo" | "ofertaGarantia" | "ofertaCambios" | "ofertaEnvio"

function ChipGroup({
  label,
  options,
  value,
  fieldKey,
  onToggle,
}: {
  label: string
  options: string[]
  value: string
  fieldKey: StringField
  onToggle: (field: StringField, val: string, current: string) => void
}) {
  const selected = value ? value.split(", ").filter(Boolean) : []

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(fieldKey, opt, value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              selected.includes(opt)
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Step3Oferta() {
  const {
    tipoOferta, setTipoOferta,
    contextoOferta,
    ofertaMetodosPago, ofertaRegalo, ofertaGarantia, ofertaCambios, ofertaEnvio,
    appendOfertaField, setField,
  } = useCampaignWizard()

  const chips = tipoOferta ? (CHIPS_DETALLE_POR_OFERTA[tipoOferta] ?? []) : []

  function toggleChip(field: StringField, val: string, current: string) {
    const parts = current ? current.split(", ").filter(Boolean) : []
    if (parts.includes(val)) {
      // Remove
      setField(field, parts.filter((p) => p !== val).join(", "))
    } else {
      appendOfertaField(field, val)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Oferta de la campaña</h2>
        <p className="text-sm text-muted-foreground mt-1">¿Con qué promoción vas a salir al mercado?</p>
      </div>

      {/* Tipo oferta */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Tipo de oferta</label>
        <div className="grid grid-cols-2 gap-2">
          {OFERTAS_CONFIG.map((oferta) => (
            <button
              key={oferta.val}
              onClick={() => setTipoOferta(oferta.val as TipoOferta)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all",
                tipoOferta === oferta.val
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <p className="text-base leading-none mb-1">{oferta.icon}</p>
              <p className="text-sm font-semibold text-foreground">{oferta.titulo}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{oferta.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chips sugerencia */}
      {chips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => setField("contextoOferta", c)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  contextoOferta === c
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detalle oferta */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Detalla tu oferta</label>
        <textarea
          value={contextoOferta}
          onChange={(e) => setField("contextoOferta", e.target.value)}
          placeholder="Ej. 30% OFF en toda la tienda + envío gratis desde $150.000"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        />
      </div>

      {/* Condiciones adicionales */}
      <div className="space-y-4 pt-2 border-t border-border">
        <p className="text-sm font-medium text-foreground">Condiciones adicionales</p>
        <ChipGroup label="Pagos" options={CHIPS_PAGO} value={ofertaMetodosPago} fieldKey="ofertaMetodosPago" onToggle={toggleChip} />
        <ChipGroup label="Regalo" options={CHIPS_REGALO} value={ofertaRegalo} fieldKey="ofertaRegalo" onToggle={toggleChip} />
        <ChipGroup label="Garantía" options={CHIPS_GARANTIA} value={ofertaGarantia} fieldKey="ofertaGarantia" onToggle={toggleChip} />
        <ChipGroup label="Cambios" options={CHIPS_CAMBIOS} value={ofertaCambios} fieldKey="ofertaCambios" onToggle={toggleChip} />
        <ChipGroup label="Envío" options={CHIPS_ENVIO} value={ofertaEnvio} fieldKey="ofertaEnvio" onToggle={toggleChip} />
      </div>
    </div>
  )
}
