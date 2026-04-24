"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveIcon, ArchiveRestoreIcon, Trash2Icon, MoreHorizontalIcon } from "lucide-react"

interface Props {
  campaignId: string
  isArchived: boolean
  canManage: boolean
}

export default function CampaignActions({ campaignId, isArchived, canManage }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!canManage) return null

  async function handleArchive() {
    setLoading(true)
    setOpen(false)
    await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    })
    router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta campaña permanentemente? Esta acción no se puede deshacer.")) return
    setLoading(true)
    setOpen(false)
    await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" })
    router.push("/campaigns")
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
      >
        <MoreHorizontalIcon className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-border bg-card shadow-lg py-1 overflow-hidden">
            <button
              onClick={handleArchive}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {isArchived
                ? <><ArchiveRestoreIcon className="w-4 h-4 text-muted-foreground" /> Desarchivar</>
                : <><ArchiveIcon className="w-4 h-4 text-muted-foreground" /> Archivar</>
              }
            </button>
            <div className="h-px bg-border mx-3 my-1" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2Icon className="w-4 h-4" />
              Eliminar campaña
            </button>
          </div>
        </>
      )}
    </div>
  )
}
