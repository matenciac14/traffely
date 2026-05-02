"use client"

import { useState, useEffect } from "react"
import { ChevronDownIcon, ChevronUpIcon, BuildingIcon } from "lucide-react"
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

interface EmpresaIdentidadSnippet {
  tono: string | null
  publicoObjetivo: string | null
  propuestasValor: string | null
  palabrasProhibidas: string | null
}

function Chips({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs border transition-all",
            value === opt
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const OBJETIVOS = ["Aumentar ventas", "Generar leads", "Brand awareness", "Retención de clientes", "Lanzamiento de producto", "Tráfico al sitio web"]
const TONOS = ["Cercano y amigable", "Aspiracional", "Profesional", "Divertido", "Urgente / FOMO", "Inspiracional", "Directo al grano"]
const CTAS = ["Compra ahora", "Ver colección", "Obtén el tuyo", "Conoce más", "Regístrate gratis", "Aprovecha la oferta", "Agenda tu cita"]

const EDADES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55+"]
const GENEROS = ["Hombres", "Mujeres", "Todos"]

export default function Step2Brief() {
  const {
    empresaId, empresa: empresaNombre,
    tipoCampana, setTipoCampana,
    eventoEstacional, eventoCustom,
    nombreCampana,
    contextoCampana, objetivoCampana, publicoObjetivo,
    insightMensajeClave, propuestasValor, tonoYestilo,
    llamadaAccion, queNOhacer,
    seleccionarEvento, setField,
  } = useCampaignWizard()

  // Público objetivo — estado local desglosado
  const [edadesSelected, setEdadesSelected] = useState<string[]>([])
  const [generoSelected, setGeneroSelected] = useState("")
  const [publicoCustom, setPublicoCustom] = useState("")

  // Identidad de empresa cargada
  const [identidad, setIdentidad] = useState<EmpresaIdentidadSnippet | null>(null)
  const [overridesOpen, setOverridesOpen] = useState(false)

  // Modo ligero: cuando hay empresa con identidad, solo mostramos campos campaign-specific
  const modoLigero = !!empresaId && !!identidad

  useEffect(() => {
    if (!empresaId) { setIdentidad(null); return }
    fetch(`/api/empresas/${empresaId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const id = data?.identidad as EmpresaIdentidadSnippet | null
        setIdentidad(id)
        if (!id) return
        // Pre-fill solo si el campo está vacío
        if (id.publicoObjetivo && !publicoObjetivo) setField("publicoObjetivo", id.publicoObjetivo)
        if (id.tono && !tonoYestilo) setField("tonoYestilo", id.tono)
        if (id.propuestasValor && !propuestasValor) setField("propuestasValor", id.propuestasValor)
        if (id.palabrasProhibidas && !queNOhacer) setField("queNOhacer", id.palabrasProhibidas)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  function buildPublico(edades: string[], genero: string, custom: string) {
    const parts: string[] = []
    if (genero) parts.push(genero)
    if (edades.length) parts.push(edades.join(", ") + " años")
    if (custom.trim()) parts.push(custom.trim())
    setField("publicoObjetivo", parts.join(" · "))
  }

  function toggleEdad(edad: string) {
    const next = edadesSelected.includes(edad)
      ? edadesSelected.filter((e) => e !== edad)
      : [...edadesSelected, edad]
    setEdadesSelected(next)
    buildPublico(next, generoSelected, publicoCustom)
  }

  function selectGenero(g: string) {
    const next = generoSelected === g ? "" : g
    setGeneroSelected(next)
    buildPublico(edadesSelected, next, publicoCustom)
  }

  function handlePublicoCustom(v: string) {
    setPublicoCustom(v)
    buildPublico(edadesSelected, generoSelected, v)
  }

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
          placeholder="Ej. Black Friday 2025 — Producto estrella"
          className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </Field>

      {/* ── Contexto estratégico ─────────────────────────────────── */}
      <div className="pt-2 border-t border-border space-y-5">

        {/* MODO LIGERO: empresa con identidad cargada */}
        {modoLigero ? (
          <>
            {/* Banner identidad empresa */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <BuildingIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary">{empresaNombre} — perfil de IA cargado</p>
                {identidad?.tono && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">Tono: {identidad.tono}</p>
                )}
                {identidad?.publicoObjetivo && (
                  <p className="text-xs text-muted-foreground truncate">Público: {identidad.publicoObjetivo}</p>
                )}
              </div>
            </div>

            {/* Campos campaign-specific (prominentes) */}
            <Field label="Contexto de la campaña" hint="opcional">
              <textarea
                value={contextoCampana}
                onChange={(e) => setField("contextoCampana", e.target.value)}
                placeholder="¿Qué está pasando en el negocio? ¿Por qué esta campaña ahora? Ej. 'Lanzamiento de nueva línea, queremos aumentar participación de mercado'"
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
              />
            </Field>

            <Field label="Objetivo de la campaña" hint="opcional">
              <input
                type="text"
                value={objetivoCampana}
                onChange={(e) => setField("objetivoCampana", e.target.value)}
                placeholder="Ej. Aumentar ventas online 30% en mayo, generar 500 leads"
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Chips options={OBJETIVOS} value={objetivoCampana} onSelect={(v) => setField("objetivoCampana", v)} />
            </Field>

            <Field label="Insight o mensaje clave" hint="opcional">
              <input
                type="text"
                value={insightMensajeClave}
                onChange={(e) => setField("insightMensajeClave", e.target.value)}
                placeholder="Ej. 'El cliente sabe cuándo encontró exactamente lo que estaba buscando'"
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
              <Chips options={CTAS} value={llamadaAccion} onSelect={(v) => setField("llamadaAccion", v)} />
            </Field>

            {/* Overrides colapsables */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setOverridesOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <span>Ajustar tono, público o restricciones para esta campaña</span>
                {overridesOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>

              {overridesOpen && (
                <div className="border-t border-border p-4 space-y-4">
                  <p className="text-xs text-muted-foreground">Estos campos sobreescriben el perfil de la empresa solo para esta campaña.</p>

                  <Field label="Público objetivo (override)" hint="opcional">
                    <div className="space-y-2.5">
                      <div className="flex gap-2">
                        {GENEROS.map((g) => (
                          <button key={g} type="button" onClick={() => selectGenero(g)}
                            className={cn("px-3 py-1.5 rounded-lg text-xs border font-medium transition-all",
                              generoSelected === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {EDADES.map((e) => (
                          <button key={e} type="button" onClick={() => toggleEdad(e)}
                            className={cn("px-2.5 py-1 rounded-full text-xs border transition-all",
                              edadesSelected.includes(e) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                            {e}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={publicoCustom} onChange={(e) => handlePublicoCustom(e.target.value)}
                        placeholder="Detalle adicional: NSE, ubicación, intereses…"
                        className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                      {publicoObjetivo && (
                        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">→ {publicoObjetivo}</p>
                      )}
                    </div>
                  </Field>

                  <Field label="Tono y estilo (override)" hint="opcional">
                    <input type="text" value={tonoYestilo} onChange={(e) => setField("tonoYestilo", e.target.value)}
                      placeholder="Ej. Más urgente que el tono habitual de la marca"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                    <Chips options={TONOS} value={tonoYestilo} onSelect={(v) => setField("tonoYestilo", v)} />
                  </Field>

                  <Field label="Propuestas de valor (override)" hint="opcional">
                    <textarea value={propuestasValor} onChange={(e) => setField("propuestasValor", e.target.value)}
                      placeholder="Solo si quieres destacar algo específico de esta campaña"
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
                  </Field>

                  <Field label="Qué NO hacer en esta campaña" hint="opcional">
                    <input type="text" value={queNOhacer} onChange={(e) => setField("queNOhacer", e.target.value)}
                      placeholder="Restricciones adicionales para esta campaña específica"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                  </Field>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Todos los campos son opcionales — puedes continuar y la IA usará el perfil de {empresaNombre}.
            </p>
          </>
        ) : (
          /* MODO COMPLETO: sin empresa seleccionada */
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">Contexto estratégico</p>
              <p className="text-xs text-muted-foreground mt-0.5">Todos los campos son opcionales — mientras más completes, mejor será el brief de IA.</p>
            </div>

            <Field label="Contexto de la campaña" hint="opcional">
              <textarea
                value={contextoCampana}
                onChange={(e) => setField("contextoCampana", e.target.value)}
                placeholder="¿Qué está pasando en el negocio? ¿Por qué esta campaña ahora?"
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
              />
            </Field>

            <Field label="Objetivo de la campaña" hint="opcional">
              <input type="text" value={objetivoCampana} onChange={(e) => setField("objetivoCampana", e.target.value)}
                placeholder="Ej. Aumentar ventas online 30% en mayo, generar 500 leads"
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
              <Chips options={OBJETIVOS} value={objetivoCampana} onSelect={(v) => setField("objetivoCampana", v)} />
            </Field>

            <Field label="Público objetivo" hint="opcional">
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  {GENEROS.map((g) => (
                    <button key={g} type="button" onClick={() => selectGenero(g)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs border font-medium transition-all",
                        generoSelected === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                      {g}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EDADES.map((e) => (
                    <button key={e} type="button" onClick={() => toggleEdad(e)}
                      className={cn("px-2.5 py-1 rounded-full text-xs border transition-all",
                        edadesSelected.includes(e) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
                      {e}
                    </button>
                  ))}
                </div>
                <input type="text" value={publicoCustom} onChange={(e) => handlePublicoCustom(e.target.value)}
                  placeholder="Detalle adicional: NSE, ubicación, intereses, etc."
                  className="w-full h-9 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                {publicoObjetivo && (
                  <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">→ {publicoObjetivo}</p>
                )}
              </div>
            </Field>

            <Field label="Insight o mensaje clave" hint="opcional">
              <input type="text" value={insightMensajeClave} onChange={(e) => setField("insightMensajeClave", e.target.value)}
                placeholder="Ej. 'El cliente sabe cuándo encontró exactamente lo que estaba buscando'"
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
            </Field>

            <Field label="Propuestas de valor de la marca" hint="opcional">
              <textarea value={propuestasValor} onChange={(e) => setField("propuestasValor", e.target.value)}
                placeholder="Ej. Calidad premium, servicio personalizado, garantía, envío rápido, precio justo"
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tono y estilo" hint="opcional">
                <input type="text" value={tonoYestilo} onChange={(e) => setField("tonoYestilo", e.target.value)}
                  placeholder="Ej. Cercano, aspiracional, sin tecnicismos"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                <Chips options={TONOS} value={tonoYestilo} onSelect={(v) => setField("tonoYestilo", v)} />
              </Field>

              <Field label="Llamada a la acción (CTA)" hint="opcional">
                <input type="text" value={llamadaAccion} onChange={(e) => setField("llamadaAccion", e.target.value)}
                  placeholder="Ej. Compra ahora, Obtén el tuyo"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                <Chips options={CTAS} value={llamadaAccion} onSelect={(v) => setField("llamadaAccion", v)} />
              </Field>
            </div>

            <Field label="Qué NO hacer / palabras prohibidas" hint="opcional">
              <input type="text" value={queNOhacer} onChange={(e) => setField("queNOhacer", e.target.value)}
                placeholder="Ej. No mencionar precio antes de mostrar el producto, evitar 'barato'"
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
            </Field>
          </>
        )}
      </div>
    </div>
  )
}
