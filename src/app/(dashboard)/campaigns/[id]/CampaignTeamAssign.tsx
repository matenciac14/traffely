"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserIcon } from "lucide-react"

interface Member {
  id: string
  name: string
  role: string
  isActive: boolean
}

interface FlatPiece {
  id: string
  modelo: string | null
  tipoPieza: string | null
  adSetNombre: string
  assigneeId: string | null
  assigneeName: string | null
}

export default function CampaignTeamAssign({ pieces }: { pieces: FlatPiece[] }) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [assignees, setAssignees] = useState<Record<string, string>>(() =>
    Object.fromEntries(pieces.filter((p) => p.assigneeId).map((p) => [p.id, p.assigneeId!]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => {
    fetch("/api/workspace/members")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Member[]) => setMembers(data.filter((m) => m.isActive && m.role === "CREATIVO")))
      .catch(() => {})
  }, [])

  async function handleAssign(pieceId: string, userId: string) {
    setSaving((s) => ({ ...s, [pieceId]: true }))
    setAssignees((a) => ({ ...a, [pieceId]: userId }))
    try {
      await fetch(`/api/pieces/${pieceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: userId || null }),
      })
      router.refresh()
    } catch {
      // revert on error
      setAssignees((a) => {
        const prev = { ...a }
        delete prev[pieceId]
        return prev
      })
    } finally {
      setSaving((s) => ({ ...s, [pieceId]: false }))
    }
  }

  async function handleBulkAssign(userId: string) {
    if (!userId) return
    const unassigned = pieces.filter((p) => !assignees[p.id])
    if (unassigned.length === 0) return
    setBulkSaving(true)
    const updates = Object.fromEntries(unassigned.map((p) => [p.id, userId]))
    setAssignees((a) => ({ ...a, ...updates }))
    await Promise.all(
      unassigned.map((p) =>
        fetch(`/api/pieces/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeId: userId }),
        })
      )
    )
    setBulkSaving(false)
    router.refresh()
  }

  if (pieces.length === 0) return null

  // Group by adSet
  const byAdSet: Record<string, FlatPiece[]> = {}
  for (const p of pieces) {
    if (!byAdSet[p.adSetNombre]) byAdSet[p.adSetNombre] = []
    byAdSet[p.adSetNombre].push(p)
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <UserIcon className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Asignación de equipo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Asigna creativos a cada pieza para que aparezcan en su board
          </p>
        </div>
      </div>

      {members.length === 0 && (
        <div className="px-5 py-4 text-xs text-muted-foreground">
          No hay creativos activos en este workspace. Invita uno desde Configuración → Equipo.
        </div>
      )}

      {members.length > 0 && pieces.filter((p) => !assignees[p.id]).length > 0 && (
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex-shrink-0">
            Asignar {pieces.filter((p) => !assignees[p.id]).length} sin asignar a:
          </span>
          <select
            defaultValue=""
            disabled={bulkSaving}
            onChange={(e) => handleBulkAssign(e.target.value)}
            className="flex-1 h-7 px-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">— Selecciona creativo —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {bulkSaving && (
            <span className="text-[10px] text-muted-foreground animate-pulse flex-shrink-0">guardando…</span>
          )}
        </div>
      )}

      {members.length > 0 && (
        <div className="divide-y divide-border">
          {Object.entries(byAdSet).map(([adSetNombre, adSetPieces]) => (
            <div key={adSetNombre} className="px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {adSetNombre}
              </p>
              <div className="space-y-2">
                {adSetPieces.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 text-xs">
                    <span className="flex-1 min-w-0 text-foreground font-medium truncate">
                      {p.modelo ?? "—"} · {p.tipoPieza ?? "—"}
                    </span>
                    <select
                      value={assignees[p.id] ?? ""}
                      disabled={saving[p.id]}
                      onChange={(e) => handleAssign(p.id, e.target.value)}
                      className="h-7 px-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">Sin asignar</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {saving[p.id] && (
                      <span className="text-[10px] text-muted-foreground animate-pulse">guardando…</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
