"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRightIcon, ChevronLeftIcon, UserIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_ORDER = ["PENDIENTE", "EN_PRODUCCION", "EN_REVISION", "APROBADO", "PUBLICADO"] as const
type TaskStatus = typeof STATUS_ORDER[number] | "RECHAZADO"

interface Member { id: string; name: string }

interface Props {
  id: string
  modelo: string | null
  tipoPieza: string | null
  formato: string | null
  taskStatus: string
  campaignName: string
  adSetNombre: string
  assignee: { id: string; name: string } | null
  members: Member[]
  canAdvance: boolean   // OWNER, CREATIVO, TRAFFICKER
  canAssign: boolean    // OWNER only
}

const NEXT_STATUS: Record<string, string> = {
  PENDIENTE:     "EN_PRODUCCION",
  EN_PRODUCCION: "EN_REVISION",
  EN_REVISION:   "APROBADO",
  APROBADO:      "PUBLICADO",
}

const PREV_STATUS: Record<string, string> = {
  EN_PRODUCCION: "PENDIENTE",
  EN_REVISION:   "EN_PRODUCCION",
  APROBADO:      "EN_REVISION",
  PUBLICADO:     "APROBADO",
}

export default function PieceCard({
  id, modelo, tipoPieza, formato, taskStatus,
  campaignName, adSetNombre, assignee, members, canAdvance, canAssign,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  async function patch(data: Record<string, unknown>) {
    setLoading(true)
    await fetch(`/api/pieces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setLoading(false)
    router.refresh()
  }

  const next = NEXT_STATUS[taskStatus]
  const prev = PREV_STATUS[taskStatus]
  const isFinal = taskStatus === "PUBLICADO" || taskStatus === "RECHAZADO"

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-3 space-y-2 transition-colors",
      loading && "opacity-60 pointer-events-none"
    )}>
      {/* Title */}
      <p className="text-xs font-semibold text-foreground leading-snug">
        {modelo || "Sin modelo"} · {tipoPieza || "Sin tipo"}
      </p>
      <p className="text-[11px] text-muted-foreground truncate">
        {campaignName} / {adSetNombre}
      </p>

      {/* Format badge */}
      {formato && (
        <span className="inline-block text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
          {formato}
        </span>
      )}

      {/* Assignee */}
      {canAssign ? (
        <div className="relative">
          {showAssign ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">Asignar a:</span>
                <button onClick={() => setShowAssign(false)} className="text-muted-foreground hover:text-foreground">
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
              <select
                autoFocus
                defaultValue={assignee?.id ?? ""}
                onChange={(e) => {
                  setShowAssign(false)
                  patch({ assigneeId: e.target.value || null })
                }}
                className="text-[10px] border border-input rounded px-1.5 py-1 bg-background w-full"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <UserIcon className="w-3 h-3" />
              {assignee ? assignee.name : "Sin asignar"}
            </button>
          )}
        </div>
      ) : (
        assignee && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            {assignee.name}
          </p>
        )
      )}

      {/* State actions */}
      {canAdvance && !isFinal && (
        <div className="flex gap-1 pt-0.5">
          {prev && (
            <button
              onClick={() => patch({ taskStatus: prev })}
              title="Retroceder estado"
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {next && (
            <button
              onClick={() => patch({ taskStatus: next })}
              className="flex-1 h-6 rounded text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
            >
              Avanzar <ChevronRightIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
