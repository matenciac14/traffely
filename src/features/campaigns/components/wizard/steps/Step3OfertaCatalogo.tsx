"use client"

// Paso 3 del wizard — Oferta & Catálogo (fusión de Steps 3 y 4 anteriores)
// Renderiza ambos componentes en secuencia con un separador visual.

import Step3Oferta from "./Step3Oferta"
import Step4Modelos from "./Step4Modelos"

export default function Step3OfertaCatalogo() {
  return (
    <div className="space-y-10">
      <Step3Oferta />
      <div className="border-t border-border pt-8">
        <Step4Modelos />
      </div>
    </div>
  )
}
