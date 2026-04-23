"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, Loader2Icon, CopyIcon, ArchiveIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_ORDER = [
  { key: "DRAFT",    label: "Borrador" },
  { key: "REVIEW",   label: "En revisión" },
  { key: "APPROVED", label: "Aprobada" },
  { key: "LIVE",     label: "En vivo" },
  { key: "FINISHED", label: "Finalizada" },
]

const STATUS_NEXT: Record<string, string> = {
  DRAFT: "REVIEW", REVIEW: "APPROVED", APPROVED: "LIVE", LIVE: "FINISHED",
}
const STATUS_PREV: Record<string, string> = {
  REVIEW: "DRAFT", APPROVED: "REVIEW", LIVE: "APPROVED",
}
const NEXT_ACTION_LABEL: Record<string, string> = {
  DRAFT: "Enviar a revisión",
  REVIEW: "Aprobar campaña",
  APPROVED: "Activar en Meta",
  LIVE: "Marcar finalizada",
}

interface Props {
  campaignId: string
  currentStatus: string
  canManage: boolean
}

export default function CampaignStatusBar({ campaignId, currentStatus, canManage }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const currentIdx = STATUS_ORDER.findIndex((s) => s.key === currentStatus)
  const nextStatus = STATUS_NEXT[currentStatus]
  const prevStatus = STATUS_PREV[currentStatus]

  async function changeStatus(status: string) {
    setLoading(true)
    await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status }),
    })
    setLoading(false)
    router.refresh()
  }

  async function duplicate() {
    setLoading(true)
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.id) router.push(`/campaigns/${data.id}`)
  }

  async function archive() {
    setLoading(true)
    await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    })
    setLoading(false)
    router.push("/campaigns")
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-1">
        {STATUS_ORDER.map((step, i) => {
          const isDone = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  isDone ? "bg-primary border-primary text-primary-foreground" :
                  isCurrent ? "border-primary text-primary bg-primary/10" :
                  "border-border text-muted-foreground bg-background"
                )}>
                  {isDone ? <CheckIcon className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                </div>
                <span className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  isCurrent ? "text-foreground" : isDone ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={cn(
                  "h-0.5 w-12 sm:w-20 mx-1 mb-5 rounded-full transition-all flex-shrink-0",
                  i < currentIdx ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      {canManage && (
        <div className="flex items-center gap-2 flex-wrap">
          {prevStatus && (
            <button
              onClick={() => changeStatus(prevStatus)}
              disabled={loading}
              className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              ← Retroceder
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => changeStatus(nextStatus)}
              disabled={loading}
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2Icon className="w-3 h-3 animate-spin" /> : null}
              {NEXT_ACTION_LABEL[currentStatus] ?? "Avanzar"}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={duplicate}
              disabled={loading}
              className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <CopyIcon className="w-3 h-3" /> Duplicar
            </button>
            <button
              onClick={archive}
              disabled={loading}
              className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <ArchiveIcon className="w-3 h-3" /> Archivar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
