"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontalIcon, PowerIcon, CheckCircleIcon, TrashIcon, ToggleRightIcon, SparklesIcon } from "lucide-react"

interface Props {
  workspaceId: string
  isActive: boolean
  billingStatus: string
  metaEnabled: boolean
  globalAiEnabled: boolean
}

export default function WorkspaceActions({ workspaceId, isActive, billingStatus, metaEnabled, globalAiEnabled }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function action(type: "toggle" | "billing" | "delete" | "meta" | "globalAi", value?: string) {
    setLoading(true)
    setOpen(false)

    if (type === "delete") {
      const ok = confirm("¿Eliminar este workspace permanentemente? Esta acción no se puede deshacer.")
      if (!ok) { setLoading(false); return }
    }

    await fetch(`/api/admin/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: type, value }),
    })

    setLoading(false)
    if (type === "delete") {
      router.push("/admin")
    } else {
      router.refresh()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreHorizontalIcon className="w-4 h-4" />
        Acciones
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-52 bg-card rounded-xl border border-border shadow-lg z-20 py-1">
            <button
              onClick={() => action("toggle")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <PowerIcon className="w-4 h-4" />
              {isActive ? "Desactivar cuenta" : "Activar cuenta"}
            </button>
            <button
              onClick={() => action("billing", billingStatus === "paid" ? "pending" : "paid")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Marcar como {billingStatus === "paid" ? "pendiente" : "pagado"}
            </button>
            <button
              onClick={() => action("meta")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <ToggleRightIcon className="w-4 h-4" />
              Meta Ads: {metaEnabled ? "desactivar" : "activar"}
            </button>
            <button
              onClick={() => action("globalAi")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              IA global: {globalAiEnabled ? "desactivar" : "activar"}
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => action("delete")}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Eliminar workspace
            </button>
          </div>
        </>
      )}
    </div>
  )
}
