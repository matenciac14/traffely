"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import { BuildingIcon, PlusIcon, CheckIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Empresa {
  id: string
  nombre: string
  industria: string | null
  identidad: {
    tono: string | null
    publicoObjetivo: string | null
    propuestasValor: string | null
    palabrasProhibidas: string | null
    instruccionesExtra: string | null
  } | null
}

const INDUSTRIAS: Record<string, string> = {
  ecommerce: "E-commerce", moda: "Moda", belleza: "Belleza",
  tecnologia: "Tecnología", restaurantes: "Restaurantes", salud: "Salud",
  educacion: "Educación", inmobiliaria: "Inmobiliaria", servicios: "Servicios", otro: "Otro",
}

export default function Step1Identificacion() {
  const { data: session } = useSession()
  const { empresa, empresaId, setEmpresa, setField } = useCampaignWizard()

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>(empresaId ?? "")

  useEffect(() => {
    if (!session?.user?.workspaceId) return
    fetch("/api/empresas")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Empresa[]) => {
        setEmpresas(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session?.user?.workspaceId])

  function selectEmpresa(emp: Empresa) {
    setSelectedId(emp.id)
    setEmpresa(emp.nombre)
    setField("empresaId", emp.id)
    // Pre-cargar identidad en campos del brief
    if (emp.identidad) {
      if (emp.identidad.tono) setField("tonoYestilo", emp.identidad.tono)
      if (emp.identidad.publicoObjetivo) setField("publicoObjetivo", emp.identidad.publicoObjetivo)
      if (emp.identidad.propuestasValor) setField("propuestasValor", emp.identidad.propuestasValor)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">¿Para qué empresa es esta campaña?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona una empresa para que la IA conozca su identidad de marca.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Cargando empresas…</p>
      )}

      {!loading && empresas.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl p-8 text-center">
          <BuildingIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Sin empresas registradas</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Crea una empresa primero para que la IA use su identidad de marca.
          </p>
          <Link
            href="/empresas/nueva"
            target="_blank"
            className="inline-flex items-center gap-1.5 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Crear empresa
          </Link>
        </div>
      )}

      {!loading && empresas.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {empresas.map((emp) => {
            const isSelected = selectedId === emp.id
            const campos = [
              emp.identidad?.tono, emp.identidad?.publicoObjetivo,
              emp.identidad?.propuestasValor,
            ].filter(Boolean).length
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => selectEmpresa(emp)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {/* Inicial */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {emp.nombre.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{emp.nombre}</p>
                  {emp.industria && (
                    <p className="text-xs text-muted-foreground">{INDUSTRIAS[emp.industria] ?? emp.industria}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Identidad: {campos}/3 campos configurados
                    {campos === 3 && " ✓"}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}

          {/* Crear nueva */}
          <Link
            href="/empresas/nueva"
            target="_blank"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <PlusIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Crear nueva empresa</p>
              <p className="text-xs text-muted-foreground">Se abre en otra pestaña</p>
            </div>
          </Link>
        </div>
      )}

      {/* Fallback: entrada manual si no hay empresas */}
      {!loading && (
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            O ingresa el nombre manualmente:
          </p>
          <input
            type="text"
            value={empresa}
            onChange={(e) => { setEmpresa(e.target.value); setSelectedId("") }}
            placeholder="Ej. Serrano Group"
            className="w-full h-10 px-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      )}
    </div>
  )
}
