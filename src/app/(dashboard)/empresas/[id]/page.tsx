"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon, BuildingIcon, PencilIcon, CheckIcon, XIcon,
  MegaphoneIcon, GlobeIcon, Trash2Icon, BrainCircuitIcon, PackageIcon, PlusIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MetaConnectionCard from "./MetaConnectionCard"

const INDUSTRIAS: Record<string, string> = {
  ecommerce: "E-commerce", moda: "Moda", belleza: "Belleza",
  tecnologia: "Tecnología", restaurantes: "Restaurantes", salud: "Salud",
  educacion: "Educación", inmobiliaria: "Inmobiliaria", servicios: "Servicios", otro: "Otro",
}

const STATUS_STYLE: Record<string, { label: string; dot: string }> = {
  DRAFT:    { label: "Borrador",    dot: "bg-muted-foreground" },
  REVIEW:   { label: "En revisión", dot: "bg-amber-500" },
  APPROVED: { label: "Aprobada",    dot: "bg-blue-500" },
  LIVE:     { label: "En vivo",     dot: "bg-emerald-500" },
  FINISHED: { label: "Finalizada",  dot: "bg-purple-500" },
}

interface EmpresaIdentidad {
  tono: string | null; publicoObjetivo: string | null; propuestasValor: string | null
  palabrasProhibidas: string | null; instruccionesExtra: string | null
  colores: string | null; tipografias: string | null
  contextoNegocio: string | null; reglasLegales: string | null; eventosKey: string | null
  industria: string | null; modeloNegocio: string | null; ticketPromedio: string | null
  cicloVenta: string | null; temporadasClave: string | null; equipoCreativo: string | null
  metaPrincipal: string | null
}

interface Producto {
  id: string; nombre: string; sku: string | null; descripcion: string | null
  precioActual: number | null; precioAntes: number | null; isActive: boolean
}

interface EmpresaData {
  id: string; nombre: string; industria: string | null; website: string | null
  descripcion: string | null; logo: string | null; isActive: boolean
  metaEnabled: boolean; metaAdAccountId: string | null
  identidad: EmpresaIdentidad | null
  _count: { campaigns: number }
  campaigns: { id: string; name: string; status: string; createdAt: string }[]
}

function EditableField({
  label, value, placeholder, multiline = false, onSave,
}: {
  label: string; value: string; placeholder: string; multiline?: boolean
  onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className={cn("text-sm", value ? "text-foreground" : "text-muted-foreground/50 italic")}>
            {value || placeholder}
          </p>
        </div>
        <button onClick={() => { setDraft(value); setEditing(true) }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all mt-0.5">
          <PencilIcon className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {multiline ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      ) : (
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
          className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      )}
      <div className="flex gap-2 mt-2">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1 h-7 px-2.5 text-xs bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50">
          <CheckIcon className="w-3 h-3" /> {saving ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={() => setEditing(false)}
          className="flex items-center gap-1 h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-md border border-border">
          <XIcon className="w-3 h-3" /> Cancelar
        </button>
      </div>
    </div>
  )
}

export default function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [productos, setProductos] = useState<Producto[]>([])
  const [nuevoProducto, setNuevoProducto] = useState("")
  const [addingProducto, setAddingProducto] = useState(false)

  const loadEmpresa = useCallback(async () => {
    const res = await fetch(`/api/empresas/${id}`)
    if (res.ok) setEmpresa(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { loadEmpresa() }, [loadEmpresa])

  const loadProductos = useCallback(async () => {
    const res = await fetch(`/api/empresas/${id}/productos`)
    if (res.ok) {
      const d = await res.json()
      setProductos(d.productos ?? [])
    }
  }, [id])

  useEffect(() => { loadProductos() }, [loadProductos])

  async function handleAddProducto() {
    if (!nuevoProducto.trim()) return
    setAddingProducto(true)
    await fetch(`/api/empresas/${id}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoProducto.trim() }),
    })
    setNuevoProducto("")
    setAddingProducto(false)
    await loadProductos()
  }

  async function handleDeleteProducto(productoId: string) {
    await fetch(`/api/empresas/${id}/productos/${productoId}`, { method: "DELETE" })
    await loadProductos()
  }

  async function patchEmpresa(data: object) {
    await fetch(`/api/empresas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    })
    await loadEmpresa()
  }

  async function patchIdentidad(data: object) {
    await fetch(`/api/empresas/${id}/identidad`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    })
    await loadEmpresa()
  }

  async function handleDelete() {
    if (!confirm(`¿Desactivar la empresa "${empresa?.nombre}"? Sus campañas no se eliminarán.`)) return
    await fetch(`/api/empresas/${id}`, { method: "DELETE" })
    router.push("/empresas")
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando…</div>
  if (!empresa) return <div className="p-8 text-sm text-destructive">Empresa no encontrada.</div>

  const id5 = empresa.identidad
  const identidadPct = Math.round(
    [id5?.tono, id5?.publicoObjetivo, id5?.propuestasValor, id5?.palabrasProhibidas,
     id5?.instruccionesExtra, id5?.contextoNegocio, id5?.reglasLegales, id5?.eventosKey,
     id5?.industria, id5?.modeloNegocio, id5?.ticketPromedio, id5?.cicloVenta,
     id5?.temporadasClave, id5?.equipoCreativo, id5?.metaPrincipal]
      .filter(Boolean).length / 15 * 100
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/empresas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Volver a Empresas
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {empresa.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={empresa.logo} alt={empresa.nombre} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary">{empresa.nombre.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">{empresa.nombre}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            {empresa.industria && (
              <span className="text-xs text-muted-foreground">{INDUSTRIAS[empresa.industria] ?? empresa.industria}</span>
            )}
            {empresa.website && (
              <a href={empresa.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <GlobeIcon className="w-3 h-3" />
                {empresa.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MegaphoneIcon className="w-3 h-3" /> {empresa._count.campaigns} campaña{empresa._count.campaigns !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <button onClick={handleDelete}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
          title="Desactivar empresa">
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Datos generales ───────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BuildingIcon className="w-4 h-4 text-muted-foreground" /> Datos generales
          </h2>

          <EditableField label="Nombre" value={empresa.nombre} placeholder="Nombre de la empresa"
            onSave={(v) => patchEmpresa({ nombre: v })} />

          <EditableField label="Descripción" value={empresa.descripcion ?? ""} placeholder="Sin descripción"
            multiline onSave={(v) => patchEmpresa({ descripcion: v })} />

          <EditableField label="Sitio web" value={empresa.website ?? ""} placeholder="https://ejemplo.com"
            onSave={(v) => patchEmpresa({ website: v })} />
        </div>

        {/* ── Identidad de marca ────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BrainCircuitIcon className="w-4 h-4 text-muted-foreground" /> Identidad IA
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${identidadPct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{identidadPct}%</span>
            </div>
          </div>

          <EditableField label="Tono y estilo" value={id5?.tono ?? ""} placeholder="Sin definir"
            onSave={(v) => patchIdentidad({ tono: v })} />

          <EditableField label="Público objetivo habitual" value={id5?.publicoObjetivo ?? ""} placeholder="Sin definir"
            onSave={(v) => patchIdentidad({ publicoObjetivo: v })} />

          <EditableField label="Propuestas de valor" value={id5?.propuestasValor ?? ""} placeholder="Sin definir"
            multiline onSave={(v) => patchIdentidad({ propuestasValor: v })} />

          <EditableField label="Palabras prohibidas" value={id5?.palabrasProhibidas ?? ""} placeholder="Sin restricciones"
            onSave={(v) => patchIdentidad({ palabrasProhibidas: v })} />

          <EditableField label="Instrucciones extra para la IA" value={id5?.instruccionesExtra ?? ""} placeholder="Sin instrucciones adicionales"
            multiline onSave={(v) => patchIdentidad({ instruccionesExtra: v })} />

          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contexto avanzado</p>

            <EditableField label="Contexto del negocio" value={id5?.contextoNegocio ?? ""}
              placeholder="Cómo funciona el negocio, ciclo de compra, canal de ventas, diferenciadores clave…"
              multiline onSave={(v) => patchIdentidad({ contextoNegocio: v })} />

            <EditableField label="Reglas legales y restricciones" value={id5?.reglasLegales ?? ""}
              placeholder="Palabras o afirmaciones prohibidas por regulación, cuidados de la industria…"
              multiline onSave={(v) => patchIdentidad({ reglasLegales: v })} />

            <EditableField label="Eventos clave del año" value={id5?.eventosKey ?? ""}
              placeholder="Black Friday, temporada escolar, primas junio/diciembre, lanzamiento de producto…"
              multiline onSave={(v) => patchIdentidad({ eventosKey: v })} />
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contexto de negocio</p>

            <EditableField label="Industria (para IA)" value={id5?.industria ?? ""}
              placeholder="Moda — calzado premium colombiano, Belleza — cosméticos naturales para mujeres…"
              onSave={(v) => patchIdentidad({ industria: v })} />

            <EditableField label="Modelo de negocio" value={id5?.modeloNegocio ?? ""}
              placeholder="B2C ecommerce propio, B2B con distribuidores, marketplace, suscripción…"
              onSave={(v) => patchIdentidad({ modeloNegocio: v })} />

            <EditableField label="Ticket promedio" value={id5?.ticketPromedio ?? ""}
              placeholder="$80.000–$250.000 COP, $30–$80 USD, varía por temporada…"
              onSave={(v) => patchIdentidad({ ticketPromedio: v })} />

            <EditableField label="Ciclo de venta" value={id5?.cicloVenta ?? ""}
              placeholder="Inmediato (impulso), 1–3 días (investigación), 1–2 semanas (comparación)…"
              onSave={(v) => patchIdentidad({ cicloVenta: v })} />

            <EditableField label="Temporadas clave" value={id5?.temporadasClave ?? ""}
              placeholder="Diciembre y junio (primas), día de la madre, temporada escolar enero…"
              multiline onSave={(v) => patchIdentidad({ temporadasClave: v })} />

            <EditableField label="Equipo creativo disponible" value={id5?.equipoCreativo ?? ""}
              placeholder="2 creativos UGC, 1 editor video, sin equipo propio (subcontratan)…"
              onSave={(v) => patchIdentidad({ equipoCreativo: v })} />

            <EditableField label="Meta principal de campañas" value={id5?.metaPrincipal ?? ""}
              placeholder="Ventas directas, generación de leads, awareness de marca, tráfico a tienda…"
              onSave={(v) => patchIdentidad({ metaPrincipal: v })} />
          </div>
        </div>
      </div>

      {/* ── Meta Ads ─────────────────────────────────────────────────── */}
      <MetaConnectionCard
        empresaId={empresa.id}
        initialConnected={empresa.metaEnabled}
        initialAccountName={null}
        initialAdAccountId={empresa.metaAdAccountId}
      />

      {/* ── Catálogo de productos ────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-muted-foreground" /> Catálogo de productos
          </h2>
          <span className="text-xs text-muted-foreground">{productos.length} producto{productos.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={nuevoProducto}
            onChange={(e) => setNuevoProducto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProducto()}
            placeholder="Nombre del producto…"
            className="flex-1 h-8 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAddProducto}
            disabled={!nuevoProducto.trim() || addingProducto}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>

        {productos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin productos en el catálogo. Los productos aquí estarán disponibles en el wizard de campañas.
          </p>
        ) : (
          <div className="space-y-1.5">
            {productos.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-background">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.nombre}</p>
                  {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                </div>
                {(p.precioActual || p.precioAntes) && (
                  <div className="text-right flex-shrink-0">
                    {p.precioAntes && (
                      <p className="text-xs text-muted-foreground line-through">
                        ${p.precioAntes.toLocaleString("es-CO")}
                      </p>
                    )}
                    {p.precioActual && (
                      <p className="text-xs font-semibold text-foreground">
                        ${p.precioActual.toLocaleString("es-CO")}
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleDeleteProducto(p.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Campañas recientes ───────────────────────────────────────── */}
      {empresa.campaigns.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Campañas recientes</h2>
            <Link href={`/campaigns?empresa=${empresa.id}`} className="text-xs text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {empresa.campaigns.map((c) => {
              const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.DRAFT
              return (
                <Link key={c.id} href={`/campaigns/${c.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{st.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {empresa.campaigns.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <MegaphoneIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin campañas aún para esta empresa.</p>
          <Link href="/campaigns/new"
            className="inline-flex items-center gap-1.5 mt-3 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Crear campaña
          </Link>
        </div>
      )}
    </div>
  )
}
