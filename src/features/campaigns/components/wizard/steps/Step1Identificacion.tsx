"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"

export default function Step1Identificacion() {
  const { empresa, setEmpresa } = useCampaignWizard()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">¿Para qué empresa es esta campaña?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Este nombre aparecerá en el prompt maestro y en todos los documentos generados.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Nombre de la empresa</label>
        <input
          type="text"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Ej. Serrano Group"
          autoFocus
          className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>
    </div>
  )
}
