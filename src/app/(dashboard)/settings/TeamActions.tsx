"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TrashIcon, PowerIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const ROLES = ["CREATIVO", "TRAFFICKER", "VIEWER"] as const
type Role = typeof ROLES[number]

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  CREATIVO: "Creativo",
  TRAFFICKER: "Trafficker",
  VIEWER: "Viewer",
}

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(role: Role) {
    setLoading(true)
    await fetch(`/api/workspace/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    setLoading(false)
    router.refresh()
  }

  if (currentRole === "OWNER") {
    return <span className="text-xs text-muted-foreground">{ROLE_LABELS.OWNER}</span>
  }

  return (
    <select
      defaultValue={currentRole}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="text-xs border border-input rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  )
}

export function ToggleActive({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await fetch(`/api/workspace/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isActive ? "Desactivar" : "Activar"}
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50",
        isActive
          ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
          : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
      )}
    >
      <PowerIcon className="w-3.5 h-3.5" />
    </button>
  )
}

export function RemoveMember({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("¿Eliminar este miembro del workspace?")) return
    setLoading(true)
    await fetch(`/api/workspace/members/${userId}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar"
      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <TrashIcon className="w-3.5 h-3.5" />
    </button>
  )
}
