"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"
import { MODELOS_BASE } from "../../../constants/campaign-data"
import { cn } from "@/lib/utils"

export default function Step4Modelos() {
  const {
    modelosSeleccionados, toggleModelo,
    preciosModelos, updatePrecio,
  } = useCampaignWizard()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Catálogo de modelos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona los modelos que participan en esta campaña y asigna sus precios.
        </p>
      </div>

      <div className="space-y-2">
        {MODELOS_BASE.map((modelo) => {
          const selected = modelosSeleccionados.includes(modelo)
          const precios = preciosModelos[modelo]

          return (
            <div
              key={modelo}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border-2 transition-all",
                selected ? "border-primary bg-accent/30" : "border-border bg-card hover:border-border/80"
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleModelo(modelo)}
                className={cn(
                  "w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                  selected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                )}
              >
                {selected && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Label + prices */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => toggleModelo(modelo)}
                  className={cn(
                    "text-sm font-medium text-left",
                    selected ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {modelo}
                </button>

                {selected && (
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground line-through">Antes $</span>
                      <input
                        type="text"
                        value={precios?.antes ?? ""}
                        onChange={(e) => updatePrecio(modelo, "antes", e.target.value.replace(/\D/g, ""))}
                        placeholder="—"
                        className="w-24 h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground font-medium">Ahora $</span>
                      <input
                        type="text"
                        value={precios?.ahora ?? ""}
                        onChange={(e) => updatePrecio(modelo, "ahora", e.target.value.replace(/\D/g, ""))}
                        placeholder="Precio"
                        className="w-24 h-7 px-2 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-right font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {modelosSeleccionados.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {modelosSeleccionados.length} modelo{modelosSeleccionados.length !== 1 ? "s" : ""} seleccionado{modelosSeleccionados.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
