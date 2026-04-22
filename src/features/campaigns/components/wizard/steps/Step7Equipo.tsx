"use client"

import { useCampaignWizard } from "../../../store/campaign-wizard"
import { PlusIcon, TrashIcon } from "lucide-react"

export default function Step7Equipo() {
  const { equipo, agregarPersona, eliminarPersona, updatePersona } = useCampaignWizard()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Equipo de la campaña</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define quién recibe el prompt maestro y gestiona esta campaña.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_2fr_auto] gap-3 px-1 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rol</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
          <div className="w-8" />
        </div>

        {equipo.map((miembro, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center">
            <input
              type="text"
              value={miembro.rol}
              onChange={(e) => updatePersona(i, "rol", e.target.value)}
              placeholder="CEO"
              className="h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="email"
              value={miembro.email}
              onChange={(e) => updatePersona(i, "email", e.target.value)}
              placeholder="nombre@empresa.com"
              className="h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => eliminarPersona(i)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={agregarPersona}
          className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Agregar miembro
        </button>
      </div>
    </div>
  )
}
