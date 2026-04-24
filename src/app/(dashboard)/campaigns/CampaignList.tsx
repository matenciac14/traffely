"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  SearchIcon, FilterIcon, MoreHorizontalIcon,
  CopyIcon, ArchiveIcon, ArchiveRestoreIcon,
  ChevronRightIcon, XIcon, Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  name: string
  tipo: string
  eventoEstacional: string | null
  status: string
  isArchived: boolean
  createdAt: string | Date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presupuesto: any
  adSets: { pieces: { taskStatus: string }[] }[]
  createdBy: { name: string }
}

interface Props {
  campaigns: Campaign[]
  role: string
  archivedCount: number
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; class: string; dot: string }> = {
  DRAFT:    { label: "Borrador",    class: "bg-muted text-muted-foreground",   dot: "bg-muted-foreground" },
  REVIEW:   { label: "En revisión", class: "bg-amber-50 text-amber-700",       dot: "bg-amber-500" },
  APPROVED: { label: "Aprobada",    class: "bg-blue-50 text-blue-700",         dot: "bg-blue-500" },
  LIVE:     { label: "En vivo",     class: "bg-emerald-50 text-emerald-700",   dot: "bg-emerald-500 animate-pulse" },
  FINISHED: { label: "Finalizada",  class: "bg-purple-50 text-purple-700",     dot: "bg-purple-500" },
}

const STATUS_NEXT: Record<string, string> = {
  DRAFT: "REVIEW", REVIEW: "APPROVED", APPROVED: "LIVE", LIVE: "FINISHED",
}
const STATUS_NEXT_LABEL: Record<string, string> = {
  DRAFT: "Enviar a revisión", REVIEW: "Aprobar", APPROVED: "Activar", LIVE: "Finalizar",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pieceProgress(adSets: Campaign["adSets"]) {
  const all = adSets.flatMap((a) => a.pieces)
  const done = all.filter((p) => ["APROBADO", "PUBLICADO"].includes(p.taskStatus)).length
  return { total: all.length, done }
}

function formatBudget(presupuesto: Campaign["presupuesto"]): string {
  if (!presupuesto?.valor) return "—"
  return `$${Number(presupuesto.valor).toLocaleString("es-CO")} COP`
}

function formatDates(presupuesto: Campaign["presupuesto"]): string {
  if (!presupuesto?.fechaInicio) return "—"
  const start = new Date(presupuesto.fechaInicio).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
  const end = presupuesto.sinFechaFin
    ? "∞"
    : presupuesto.fechaFin
    ? new Date(presupuesto.fechaFin).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
    : "?"
  return `${start} → ${end}`
}

// ─── Actions menu ─────────────────────────────────────────────────────────────

function ActionsMenu({ campaign, canManage }: { campaign: Campaign; canManage: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const nextStatus = STATUS_NEXT[campaign.status]

  async function patch(body: object) {
    setLoading(true)
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function duplicate() {
    setLoading(true)
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" }),
    })
    const data = await res.json()
    setLoading(false)
    setOpen(false)
    if (data.id) router.push(`/campaigns/${data.id}`)
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta campaña permanentemente? Esta acción no se puede deshacer.")) return
    setLoading(true)
    setOpen(false)
    await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.preventDefault(); setOpen(!open) }}
        disabled={loading}
        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        <MoreHorizontalIcon className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-52 bg-card border border-border rounded-xl shadow-xl py-1.5 overflow-hidden">
            {/* Avanzar estado */}
            {canManage && !campaign.isArchived && nextStatus && (
              <button
                onClick={() => patch({ action: "status", status: nextStatus })}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
              >
                <ChevronRightIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {STATUS_NEXT_LABEL[campaign.status]}
              </button>
            )}

            {/* Duplicar */}
            <button
              onClick={duplicate}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
            >
              <CopyIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              Duplicar campaña
            </button>

            {/* Archivar / Desarchivar */}
            {canManage && (
              <button
                onClick={() => patch({ action: "archive" })}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors text-left border-t border-border mt-1 pt-2 text-muted-foreground hover:text-foreground"
              >
                {campaign.isArchived
                  ? <><ArchiveRestoreIcon className="w-3.5 h-3.5 flex-shrink-0" /> Desarchivar</>
                  : <><ArchiveIcon className="w-3.5 h-3.5 flex-shrink-0" /> Archivar</>
                }
              </button>
            )}

            {/* Eliminar — solo OWNER/SUPER_ADMIN */}
            {canManage && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/5 transition-colors text-left border-t border-border mt-1 pt-2"
              >
                <Trash2Icon className="w-3.5 h-3.5 flex-shrink-0" />
                Eliminar campaña
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

function CampaignTable({ campaigns, canManage }: { campaigns: Campaign[]; canManage: boolean }) {
  if (campaigns.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No hay campañas en esta vista.
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-visible">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[17%]" />
          <col className="w-[14%]" />
          <col className="w-[11%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaña</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Presupuesto</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vuelo</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Piezas</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {campaigns.map((c) => {
            const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.DRAFT
            const { total, done } = pieceProgress(c.adSets)
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <tr key={c.id} className={cn("transition-colors", c.isArchived ? "opacity-60" : "hover:bg-muted/20")}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/campaigns/${c.id}`} className="font-medium text-foreground hover:text-primary transition-colors truncate block">
                      {c.name}
                    </Link>
                    {c.isArchived && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                        Archivada
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {c.tipo === "EVERGREEN" ? "Evergreen" : "Estacional"}
                    {c.eventoEstacional ? ` · ${c.eventoEstacional}` : ""}
                    {" · "}{c.createdBy.name}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap", st.class)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", st.dot)} />
                    {st.label}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm text-foreground font-medium">
                  {formatBudget(c.presupuesto)}
                </td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDates(c.presupuesto)}
                </td>
                <td className="px-4 py-3.5">
                  {total === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{pct}%</span>
                        <span className="text-[11px] text-muted-foreground">{done}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-primary")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-center">
                    <ActionsMenu campaign={c} canManage={canManage} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CampaignList({ campaigns, role, archivedCount }: Props) {
  const [tab, setTab] = useState<"activas" | "archivadas">("activas")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTipo, setFilterTipo] = useState("")

  const canManage = ["OWNER", "SUPER_ADMIN"].includes(role)

  const active = useMemo(() => campaigns.filter((c) => !c.isArchived), [campaigns])
  const archived = useMemo(() => campaigns.filter((c) => c.isArchived), [campaigns])

  const filtered = useMemo(() => {
    const base = tab === "activas" ? active : archived
    return base.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (filterTipo && c.tipo !== filterTipo) return false
      return true
    })
  }, [tab, active, archived, search, filterStatus, filterTipo])

  const hasFilters = search || filterStatus || filterTipo

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setTab("activas")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "activas" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Activas
          <span className={cn("ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold", tab === "activas" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            {active.length}
          </span>
        </button>
        <button
          onClick={() => setTab("archivadas")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "archivadas" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Archivadas
          {archivedCount > 0 && (
            <span className={cn("ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold", tab === "archivadas" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 border border-input rounded-lg px-3 h-9 bg-background flex-1 min-w-48">
          <SearchIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar campaña…"
            className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <FilterIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-input rounded-lg px-2.5 h-9 bg-background focus:outline-none text-foreground"
          >
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="REVIEW">En revisión</option>
            <option value="APPROVED">Aprobada</option>
            <option value="LIVE">En vivo</option>
            <option value="FINISHED">Finalizada</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="text-xs border border-input rounded-lg px-2.5 h-9 bg-background focus:outline-none text-foreground"
          >
            <option value="">Todos los tipos</option>
            <option value="EVERGREEN">Evergreen</option>
            <option value="ESTACIONAL">Estacional</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterTipo("") }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors h-9 px-2"
            >
              <XIcon className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      <CampaignTable campaigns={filtered} canManage={canManage} />

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {tab === "activas" ? active.length : archived.length} campañas
        {tab === "activas" && " · Dot verde parpadeando = En vivo"}
      </p>
    </div>
  )
}
