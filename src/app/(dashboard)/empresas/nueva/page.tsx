"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, BuildingIcon } from "lucide-react"

const INDUSTRIAS = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "moda", label: "Moda" },
  { value: "belleza", label: "Belleza" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "restaurantes", label: "Restaurantes" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "servicios", label: "Servicios" },
  { value: "otro", label: "Otro" },
]

export default function NuevaEmpresaPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Step 1 — datos generales
  const [nombre, setNombre] = useState("")
  const [industria, setIndustria] = useState("")
  const [website, setWebsite] = useState("")
  const [descripcion, setDescripcion] = useState("")

  // Step 2 — identidad de marca
  const [tono, setTono] = useState("")
  const [publicoObjetivo, setPublicoObjetivo] = useState("")
  const [propuestasValor, setPropuestasValor] = useState("")
  const [palabrasProhibidas, setPalabrasProhibidas] = useState("")
  const [instruccionesExtra, setInstruccionesExtra] = useState("")

  async function handleStep1() {
    if (!nombre.trim()) { setError("El nombre es requerido"); return }
    setError("")
    setLoading(true)
    const res = await fetch("/api/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, industria, website, descripcion }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || "Error al crear empresa"); return }
    setEmpresaId(data.id)
    setStep(2)
  }

  async function handleStep2(skip = false) {
    if (!empresaId) return
    if (!skip) {
      setLoading(true)
      await fetch(`/api/empresas/${empresaId}/identidad`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tono, publicoObjetivo, propuestasValor, palabrasProhibidas, instruccionesExtra }),
      })
      setLoading(false)
    }
    router.push(`/empresas/${empresaId}`)
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
  const labelCls = "text-sm font-medium text-foreground"

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/empresas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Volver
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BuildingIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Nueva empresa</h1>
          <p className="text-sm text-muted-foreground">
            Paso {step} de 2 — {step === 1 ? "Datos generales" : "Identidad de marca"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
              step > s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{s}</div>
            {s < 2 && <div className={`h-px w-12 transition-colors ${step > s ? "bg-primary/40" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className={labelCls}>Nombre de la empresa <span className="text-destructive">*</span></label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Serrano Group, NB Running Colombia"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Industria</label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIAS.map((ind) => (
                <button
                  key={ind.value}
                  type="button"
                  onClick={() => setIndustria(ind.value === industria ? "" : ind.value)}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    industria === ind.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-muted/30 text-foreground hover:border-primary/40"
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Sitio web <span className="text-muted-foreground text-xs">(opcional)</span></label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://ejemplo.com"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿A qué se dedica esta empresa? ¿Qué vende?"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleStep1}
              disabled={loading}
              className="h-10 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Creando…" : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Identidad */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-foreground">
            <strong>¿Por qué esto importa?</strong> La identidad de marca alimenta la IA directamente. Con más contexto, los guiones y copys generados serán específicos para <strong>{nombre}</strong>, no genéricos.
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Tono y estilo de comunicación</label>
            <input type="text" value={tono} onChange={(e) => setTono(e.target.value)}
              placeholder="Ej. Cercano, aspiracional, sin tecnicismos — como hablarle a un amigo"
              className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Público objetivo habitual</label>
            <input type="text" value={publicoObjetivo} onChange={(e) => setPublicoObjetivo(e.target.value)}
              placeholder="Ej. Mujeres 25-40 años, NSE medio-alto, interesadas en moda premium"
              className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Propuestas de valor de la marca</label>
            <textarea value={propuestasValor} onChange={(e) => setPropuestasValor(e.target.value)}
              placeholder="Ej. Calidad premium sin marca premium, despacho gratis, asesoría personalizada"
              rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Palabras o frases prohibidas <span className="text-muted-foreground text-xs">(opcional)</span></label>
            <input type="text" value={palabrasProhibidas} onChange={(e) => setPalabrasProhibidas(e.target.value)}
              placeholder="Ej. barato, económico, oferta, imitación"
              className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Instrucciones extra para la IA <span className="text-muted-foreground text-xs">(opcional)</span></label>
            <textarea value={instruccionesExtra} onChange={(e) => setInstruccionesExtra(e.target.value)}
              placeholder="Ej. Siempre mencionar el tiempo de entrega. No comparar con competidores."
              rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleStep2(true)}
              className="h-10 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Completar después
            </button>
            <button
              onClick={() => handleStep2(false)}
              disabled={loading}
              className="h-10 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Guardando…" : "Crear empresa →"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
