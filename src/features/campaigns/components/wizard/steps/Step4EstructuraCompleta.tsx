"use client"

// Paso 4 del wizard — Conceptos (opcional) + Estructura de campañas
// Los conceptos son colapsables — el usuario puede saltarlos y definir la
// estructura directamente. La sección de Estructura sí es obligatoria.

import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from "lucide-react"
import Step3Conceptos from "./Step3Conceptos"
import Step5Estructura from "./Step5Estructura"

export default function Step4EstructuraCompleta() {
  const [conceptosOpen, setConceptosOpen] = useState(false)

  return (
    <div className="space-y-8">
      {/* Conceptos creativos — opcional, colapsable */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setConceptosOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SparklesIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Conceptos creativos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Opcional — la IA genera ángulos y frameworks creativos para orientar las piezas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              OPCIONAL
            </span>
            {conceptosOpen
              ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
              : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {conceptosOpen && (
          <div className="border-t border-border px-5 py-6">
            <Step3Conceptos />
          </div>
        )}
      </div>

      {/* Estructura de campañas — obligatoria */}
      <Step5Estructura />
    </div>
  )
}
