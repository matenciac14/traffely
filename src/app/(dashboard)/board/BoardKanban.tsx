"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronRightIcon, ChevronLeftIcon, UserIcon, FilterIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import PieceDrawer from "./PieceDrawer"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Piece {
  id: string
  modelo: string | null
  tipoPieza: string | null
  formato: string | null
  taskStatus: string
  estado: string
  adSet: { nombre: string; campaign: { id: string; name: string } }
  assignee: { id: string; name: string } | null
}

interface Member { id: string; name: string; role: string }

interface Props {
  pieces: Piece[]
  members: Member[]
  currentUserId: string
  currentUserRole: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "PENDIENTE",     label: "Pendiente",     color: "bg-muted text-muted-foreground" },
  { key: "EN_PRODUCCION", label: "En producción", color: "bg-blue-50 text-blue-700" },
  { key: "EN_REVISION",   label: "En revisión",   color: "bg-amber-50 text-amber-700" },
  { key: "APROBADO",      label: "Aprobado",      color: "bg-emerald-50 text-emerald-700" },
  { key: "PUBLICADO",     label: "Publicado",     color: "bg-purple-50 text-purple-700" },
  { key: "RECHAZADO",     label: "Rechazado",     color: "bg-red-50 text-red-700" },
]

const NEXT_STATUS: Record<string, string> = {
  PENDIENTE: "EN_PRODUCCION", EN_PRODUCCION: "EN_REVISION",
  EN_REVISION: "APROBADO", APROBADO: "PUBLICADO",
}
const PREV_STATUS: Record<string, string> = {
  EN_PRODUCCION: "PENDIENTE", EN_REVISION: "EN_PRODUCCION",
  APROBADO: "EN_REVISION", PUBLICADO: "APROBADO",
}

function Initials({ name }: { name: string }) {
  const p = name.trim().split(" ")
  const ini = p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0].substring(0, 2)
  return (
    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-[9px] font-bold text-primary uppercase">{ini}</span>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PieceCard({
  piece, canAdvance, canAssign, members, onOpen,
}: {
  piece: Piece
  canAdvance: boolean
  canAssign: boolean
  members: Member[]
  onOpen: (id: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  async function patch(data: Record<string, unknown>, e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await fetch(`/api/pieces/${piece.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setLoading(false)
    router.refresh()
  }

  const next = NEXT_STATUS[piece.taskStatus]
  const prev = PREV_STATUS[piece.taskStatus]
  const isFinal = piece.taskStatus === "PUBLICADO" || piece.taskStatus === "RECHAZADO"

  return (
    <div
      onClick={() => onOpen(piece.id)}
      className={cn(
        "bg-card border border-border rounded-xl p-3 space-y-2 cursor-pointer",
        "hover:border-primary/40 hover:shadow-sm transition-all",
        loading && "opacity-60 pointer-events-none"
      )}
    >
      <p className="text-xs font-semibold text-foreground leading-snug">
        {piece.modelo || "Sin modelo"} · {piece.tipoPieza || "Sin tipo"}
      </p>
      <p className="text-[11px] text-muted-foreground truncate">
        {piece.adSet.campaign.name} / {piece.adSet.nombre}
      </p>
      {piece.formato && (
        <span className="inline-block text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
          {piece.formato}
        </span>
      )}

      {/* Assignee */}
      {canAssign ? (
        showAssign ? (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <select
              autoFocus
              defaultValue={piece.assignee?.id ?? ""}
              onChange={(e) => { setShowAssign(false); patch({ assigneeId: e.target.value || null }, e as unknown as React.MouseEvent) }}
              className="text-[10px] border border-input rounded px-1.5 py-1 bg-background flex-1"
            >
              <option value="">Sin asignar</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <button onClick={(e) => { e.stopPropagation(); setShowAssign(false) }}><XIcon className="w-3 h-3 text-muted-foreground" /></button>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setShowAssign(true) }} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            {piece.assignee ? <><Initials name={piece.assignee.name} />{piece.assignee.name}</> : <><UserIcon className="w-3 h-3" />Sin asignar</>}
          </button>
        )
      ) : piece.assignee ? (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Initials name={piece.assignee.name} />
          {piece.assignee.name}
        </div>
      ) : null}

      {/* State buttons */}
      {canAdvance && !isFinal && (
        <div className="flex gap-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
          {prev && (
            <button onClick={(e) => patch({ taskStatus: prev }, e)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {next && (
            <button onClick={(e) => patch({ taskStatus: next }, e)} className="flex-1 h-6 rounded text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
              Avanzar <ChevronRightIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Filters bar ──────────────────────────────────────────────────────────────

function FiltersBar({
  campaigns, members, filterCampaign, filterAssignee, filterEstado,
  onCampaign, onAssignee, onEstado,
}: {
  campaigns: { id: string; name: string }[]
  members: Member[]
  filterCampaign: string
  filterAssignee: string
  filterEstado: string
  onCampaign: (v: string) => void
  onAssignee: (v: string) => void
  onEstado: (v: string) => void
}) {
  const active = filterCampaign || filterAssignee || filterEstado

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card/50 flex-shrink-0 flex-wrap">
      <FilterIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />

      <select value={filterCampaign} onChange={(e) => onCampaign(e.target.value)}
        className="text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="">Todas las campañas</option>
        {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select value={filterAssignee} onChange={(e) => onAssignee(e.target.value)}
        className="text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="">Todos los miembros</option>
        <option value="unassigned">Sin asignar</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      <select value={filterEstado} onChange={(e) => onEstado(e.target.value)}
        className="text-xs border border-input rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
        <option value="">Activas + reservas</option>
        <option value="ACTIVA">Solo activas</option>
        <option value="RESERVA">Solo reservas</option>
      </select>

      {active && (
        <button onClick={() => { onCampaign(""); onAssignee(""); onEstado("") }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
          <XIcon className="w-3 h-3" /> Limpiar
        </button>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BoardKanban({ pieces, members, currentUserId, currentUserRole }: Props) {
  const [openPieceId, setOpenPieceId] = useState<string | null>(null)
  const [filterCampaign, setFilterCampaign] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("")
  const [filterEstado, setFilterEstado] = useState("")

  const canAdvance = ["OWNER", "SUPER_ADMIN", "CREATIVO", "TRAFFICKER"].includes(currentUserRole)
  const canAssign = ["OWNER", "SUPER_ADMIN"].includes(currentUserRole)

  // Unique campaigns for filter
  const campaigns = useMemo(() => {
    const map = new Map<string, string>()
    pieces.forEach((p) => map.set(p.adSet.campaign.id, p.adSet.campaign.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [pieces])

  // Filtered pieces
  const filtered = useMemo(() => {
    return pieces.filter((p) => {
      if (filterCampaign && p.adSet.campaign.id !== filterCampaign) return false
      if (filterAssignee === "unassigned" && p.assignee) return false
      if (filterAssignee && filterAssignee !== "unassigned" && p.assignee?.id !== filterAssignee) return false
      if (filterEstado && p.estado !== filterEstado) return false
      return true
    })
  }, [pieces, filterCampaign, filterAssignee, filterEstado])

  const byStatus = Object.fromEntries(COLUMNS.map((c) => [c.key, [] as Piece[]]))
  for (const p of filtered) byStatus[p.taskStatus]?.push(p)

  const enProduccion = filtered.filter((p) => p.taskStatus === "EN_PRODUCCION").length
  const enRevision = filtered.filter((p) => p.taskStatus === "EN_REVISION").length
  const aprobadas = filtered.filter((p) => p.taskStatus === "APROBADO").length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} piezas</p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><span className="font-semibold text-blue-600">{enProduccion}</span> en prod.</span>
            <span><span className="font-semibold text-amber-600">{enRevision}</span> en revisión</span>
            <span><span className="font-semibold text-emerald-600">{aprobadas}</span> aprobadas</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FiltersBar
        campaigns={campaigns}
        members={members}
        filterCampaign={filterCampaign}
        filterAssignee={filterAssignee}
        filterEstado={filterEstado}
        onCampaign={setFilterCampaign}
        onAssignee={setFilterAssignee}
        onEstado={setFilterEstado}
      />

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full px-6 py-4" style={{ minWidth: `${COLUMNS.length * 224}px` }}>
          {COLUMNS.map((col) => {
            const cards = byStatus[col.key] ?? []
            return (
              <div key={col.key} className="flex flex-col w-52 flex-shrink-0 h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("px-2.5 py-0.5 rounded-md text-xs font-semibold", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">{cards.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {cards.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl h-16 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Vacío</span>
                    </div>
                  )}
                  {cards.map((p) => (
                    <PieceCard
                      key={p.id}
                      piece={p}
                      canAdvance={canAdvance}
                      canAssign={canAssign}
                      members={members}
                      onOpen={setOpenPieceId}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Piece Drawer */}
      <PieceDrawer
        pieceId={openPieceId}
        members={members}
        currentUserId={currentUserId}
        canAdvance={canAdvance}
        canAssign={canAssign}
        onClose={() => setOpenPieceId(null)}
      />
    </div>
  )
}
