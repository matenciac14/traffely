"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useCampaignWizard } from "../../../store/campaign-wizard"
import { BuildingIcon, PlusIcon, CheckIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
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
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!session?.user?.workspaceId) return
    setLoading(true)
    fetch("/api/empresas")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Empresa[]) => {
        setEmpresas(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session?.user?.workspaceId, refreshKey])

  function detectTipoProducto(industria: string | null): "fisico" | "digital" | "servicio" | "" {
    if (!industria) return ""
    const digitales = ["tecnologia", "educacion"]
    const servicios = ["servicios", "inmobiliaria", "salud"]
    if (digitales.includes(industria)) return "digital"
    if (servicios.includes(industria)) return "servicio"
    return "fisico"
  }

  function selectEmpresa(emp: Empresa) {
    setSelectedId(emp.id)
    setEmpresa(emp.nombre)
    setField("empresaId", emp.id)
    setField("empresaIndustria", emp.industria ?? "")
    setField("tipoProducto", detectTipoProducto(emp.industria))
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
          <div className="flex items-center justify-center gap-2">
            <Link
              href="/empresas/nueva"
              target="_blank"
              className="inline-flex items-center gap-1.5 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Crear empresa
            </Link>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-border text-xs font-medium text-muted-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCwIcon className="w-3.5 h-3.5" /> Actualizar
            </button>
          </div>
        </div>
      )}

      {!loading && empresas.length > 0 && (() => {
        const selectedEmp = empresas.find((e) => e.id === selectedId)
        const selectedCampos = selectedEmp ? [
          selectedEmp.identidad?.tono, selectedEmp.identidad?.publicoObjetivo,
          selectedEmp.identidad?.propuestasValor,
        ].filter(Boolean).length : 0

        return (
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
                    <p className={cn(
                      "text-xs mt-0.5",
                      campos === 0 ? "text-amber-600" : campos < 3 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      Identidad: {campos}/3 campos
                      {campos === 3 ? " ✓" : campos === 0 ? " — sin configurar" : " — incompleta"}
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

            {/* Warning: empresa seleccionada con identidad incompleta */}
            {selectedId && selectedCampos < 3 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-semibold">Identidad de marca incompleta</p>
                  <p className="mt-0.5 text-amber-700">
                    {selectedCampos === 0
                      ? "Esta empresa no tiene tono, público ni propuestas de valor configuradas. El output de IA será genérico."
                      : `Solo ${selectedCampos}/3 campos de identidad configurados. Completa la identidad en `}
                    {selectedCampos > 0 && (
                      <Link href={`/empresas`} target="_blank" className="underline font-medium">
                        Empresas
                      </Link>
                    )}
                    {selectedCampos === 0 && (
                      <> Configúrala en <Link href={`/empresas`} target="_blank" className="underline font-medium">Empresas</Link> para mejores resultados.</>
                    )}
                    {selectedCampos > 0 && " para mejores resultados."}
                  </p>
                </div>
              </div>
            )}

            {/* Crear nueva + Actualizar */}
            <div className="flex items-center gap-2">
              <Link
                href="/empresas/nueva"
                target="_blank"
                className="flex-1 flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <PlusIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Crear nueva empresa</p>
                  <p className="text-xs text-muted-foreground">Se abre en otra pestaña</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Actualizar lista de empresas"
                className="flex-shrink-0 p-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })()}

      {/* Fallback: entrada manual si no hay empresas */}
      {!loading && (
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            O ingresa el nombre manualmente:
          </p>
          <input
            type="text"
            value={selectedId ? "" : empresa}
            onChange={(e) => {
              setEmpresa(e.target.value)
              setSelectedId("")
              setField("empresaId", "")
            }}
            placeholder="Ej. Mi Empresa"
            className="w-full h-10 px-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          {!selectedId && empresa && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
              Sin empresa seleccionada — el brief no usará identidad de marca. La IA generará copy genérico.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
