"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  XIcon, UserIcon, ChevronRightIcon, ChevronLeftIcon,
  SendIcon, FileTextIcon, MessageSquareIcon, ClockIcon,
  SparklesIcon, LinkIcon, Loader2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Comment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string }
}

interface PieceDetail {
  id: string
  modelo: string | null
  tipoPieza: string | null
  formato: string | null
  duracion: string | null
  angulo: string | null
  trafico: string | null
  conciencia: string | null
  motivo: string | null
  narrativa: string | null
  estructuraCopy: string | null
  estado: string
  taskStatus: string
  priority: string | null
  dueDate: string | null
  adUrl: string | null
  guionGenerado: string | null
  copyGenerado: string | null
  aiGeneratedAt: string | null
  archivoUrl: string | null
  adSet: { nombre: string; campaign: { id: string; name: string } }
  assignee: { id: string; name: string } | null
  comments: Comment[]
  updatedAt: string
}

interface Member { id: string; name: string; role: string }

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_ORDER = ["PENDIENTE", "EN_PRODUCCION", "EN_REVISION", "APROBADO", "PUBLICADO", "RECHAZADO"] as const

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PRODUCCION: "En producción",
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  PUBLICADO: "Publicado",
  RECHAZADO: "Rechazado",
}

const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "bg-muted text-muted-foreground",
  EN_PRODUCCION: "bg-blue-50 text-blue-700",
  EN_REVISION: "bg-amber-50 text-amber-700",
  APROBADO: "bg-emerald-50 text-emerald-700",
  PUBLICADO: "bg-purple-50 text-purple-700",
  RECHAZADO: "bg-red-50 text-red-700",
}

const NEXT_STATUS: Record<string, string> = {
  PENDIENTE: "EN_PRODUCCION",
  EN_PRODUCCION: "EN_REVISION",
  EN_REVISION: "APROBADO",
  APROBADO: "PUBLICADO",
}

const PREV_STATUS: Record<string, string> = {
  EN_PRODUCCION: "PENDIENTE",
  EN_REVISION: "EN_PRODUCCION",
  APROBADO: "EN_REVISION",
  PUBLICADO: "APROBADO",
}

// ─── Meta field helper ───────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-foreground font-medium">{value}</span>
    </div>
  )
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ")
  const ini = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].substring(0, 2)
  return (
    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-primary uppercase">{ini}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  pieceId: string | null
  members: Member[]
  currentUserId: string
  canAdvance: boolean
  canAssign: boolean
  onClose: () => void
}

type Tab = "detalles" | "comentarios"

export default function PieceDrawer({ pieceId, members, currentUserId, canAdvance, canAssign, onClose }: Props) {
  const router = useRouter()
  const [piece, setPiece] = useState<PieceDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("detalles")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [streamedText, setStreamedText] = useState("")
  const [adUrlInput, setAdUrlInput] = useState("")
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Fetch piece details when opened
  useEffect(() => {
    if (!pieceId) { setPiece(null); setStreamedText(""); return }
    setLoading(true)
    fetch(`/api/pieces/${pieceId}`)
      .then((r) => r.json())
      .then((data) => {
        setPiece(data)
        setAdUrlInput(data.adUrl ?? "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [pieceId])

  // Scroll comments to bottom
  useEffect(() => {
    if (activeTab === "comentarios") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [piece?.comments, activeTab])

  async function patchPiece(data: Record<string, unknown>) {
    if (!piece) return
    setActionLoading(true)
    const res = await fetch(`/api/pieces/${piece.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setPiece((p) => p ? { ...p, ...updated } : p)
      router.refresh()
    }
    setActionLoading(false)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim() || !piece) return
    setSubmitting(true)
    const res = await fetch(`/api/pieces/${piece.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment.trim() }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setPiece((p) => p ? { ...p, comments: [...p.comments, newComment] } : p)
      setComment("")
    }
    setSubmitting(false)
  }

  async function generateContent() {
    if (!piece) return
    setGenerating(true)
    setStreamedText("")
    try {
      const res = await fetch(`/api/pieces/${piece.id}/generate`, { method: "POST" })
      if (!res.ok || !res.body) {
        setGenerating(false)
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              accumulated += parsed.text
              setStreamedText(accumulated)
            }
          } catch { /* ignore */ }
        }
      }
      // Refetch piece to get saved guion/copy
      const updated = await fetch(`/api/pieces/${piece.id}`).then((r) => r.json())
      setPiece(updated)
      setStreamedText("")
    } finally {
      setGenerating(false)
    }
  }

  async function saveAdUrl() {
    if (!piece) return
    await patchPiece({ adUrl: adUrlInput.trim() || null })
  }

  const isOpen = Boolean(pieceId)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl",
        "flex flex-col transition-transform duration-200",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Cargando pieza…</div>
          </div>
        )}

        {!loading && piece && (
          <>
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-b border-border px-5 py-4">
              {/* Breadcrumb */}
              <p className="text-[11px] text-muted-foreground mb-1.5">
                {piece.adSet.campaign.name} › {piece.adSet.nombre}
              </p>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground leading-snug">
                    {piece.modelo || "Sin modelo"} · {piece.tipoPieza || "Sin tipo"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Status badge */}
                    <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", STATUS_COLOR[piece.taskStatus])}>
                      {STATUS_LABEL[piece.taskStatus]}
                    </span>
                    {/* Estado (activa/reserva) */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-semibold",
                      piece.estado === "RESERVA" ? "bg-muted text-muted-foreground" : "bg-emerald-50 text-emerald-700"
                    )}>
                      {piece.estado === "RESERVA" ? "Reserva" : "Activa"}
                    </span>
                  </div>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Quick actions: status + assignee */}
              <div className="flex items-center gap-3 mt-3">
                {/* Status change */}
                {canAdvance && piece.taskStatus !== "PUBLICADO" && piece.taskStatus !== "RECHAZADO" && (
                  <div className="flex gap-1">
                    {PREV_STATUS[piece.taskStatus] && (
                      <button
                        onClick={() => patchPiece({ taskStatus: PREV_STATUS[piece.taskStatus] })}
                        disabled={actionLoading}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                        title="Retroceder"
                      >
                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {NEXT_STATUS[piece.taskStatus] && (
                      <button
                        onClick={() => patchPiece({ taskStatus: NEXT_STATUS[piece.taskStatus] })}
                        disabled={actionLoading}
                        className="h-7 px-3 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-40"
                      >
                        {STATUS_LABEL[NEXT_STATUS[piece.taskStatus]]}
                        <ChevronRightIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Assignee */}
                {canAssign ? (
                  <select
                    value={piece.assignee?.id ?? ""}
                    disabled={actionLoading}
                    onChange={(e) => patchPiece({ assigneeId: e.target.value || null })}
                    className="text-xs border border-input rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ml-auto"
                  >
                    <option value="">Sin asignar</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : piece.assignee ? (
                  <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
                    <Initials name={piece.assignee.name} />
                    {piece.assignee.name}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> Sin asignar
                  </span>
                )}
              </div>
            </div>

            {/* ── Tabs ────────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-b border-border px-5">
              <div className="flex gap-1">
                {([
                  { key: "detalles", label: "Detalles", icon: FileTextIcon },
                  { key: "comentarios", label: `Comentarios${piece.comments.length ? ` (${piece.comments.length})` : ""}`, icon: MessageSquareIcon },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                      activeTab === key
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab content ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* DETALLES */}
              {activeTab === "detalles" && (
                <div className="p-5 space-y-6">
                  {/* Meta fields */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Información de la pieza</h3>
                    <div className="space-y-2.5">
                      <MetaRow label="Formato" value={piece.formato} />
                      <MetaRow label="Duración" value={piece.duracion} />
                      <MetaRow label="Tipo de tráfico" value={piece.trafico} />
                      <MetaRow label="Ángulo" value={piece.angulo} />
                      <MetaRow label="Nivel conciencia" value={piece.conciencia} />
                      <MetaRow label="Motivo compra" value={piece.motivo} />
                      <MetaRow label="Narrativa" value={piece.narrativa} />
                      <MetaRow label="Estructura copy" value={piece.estructuraCopy} />
                    </div>
                  </div>

                  {/* AI Generate */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contenido generado por IA</h3>
                      <button
                        onClick={generateContent}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {generating ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                        {generating ? "Generando…" : "Generar con IA"}
                      </button>
                    </div>

                    {/* Streaming preview */}
                    {generating && streamedText && (
                      <pre className="text-xs text-foreground bg-muted/40 border border-border rounded-xl p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto mb-3">
                        {streamedText}
                      </pre>
                    )}

                    {!generating && piece.guionGenerado && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground">Guión</p>
                        <pre className="text-xs text-foreground bg-muted/40 border border-border rounded-xl p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {piece.guionGenerado}
                        </pre>
                      </div>
                    )}
                    {!generating && piece.copyGenerado && (
                      <div className="space-y-1.5 mt-3">
                        <p className="text-xs font-medium text-foreground">Copy</p>
                        <pre className="text-xs text-foreground bg-muted/40 border border-border rounded-xl p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {piece.copyGenerado}
                        </pre>
                      </div>
                    )}

                    {!generating && !piece.guionGenerado && !piece.copyGenerado && !streamedText && (
                      <p className="text-xs text-muted-foreground">Sin contenido generado. Haz clic en &quot;Generar con IA&quot;.</p>
                    )}
                  </div>

                  {/* adUrl — solo cuando está PUBLICADO */}
                  {piece.taskStatus === "PUBLICADO" && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Link del ad en Meta</h3>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center border border-input rounded-lg px-2.5 gap-1.5 bg-background">
                          <LinkIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <input
                            type="url"
                            value={adUrlInput}
                            onChange={(e) => setAdUrlInput(e.target.value)}
                            placeholder="https://facebook.com/ads/..."
                            className="flex-1 text-xs py-1.5 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <button
                          onClick={saveAdUrl}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      </div>
                      {piece.adUrl && (
                        <a href={piece.adUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1 text-[11px] text-primary hover:underline">
                          <LinkIcon className="w-3 h-3" /> Ver ad publicado
                        </a>
                      )}
                    </div>
                  )}

                  {/* File */}
                  {piece.archivoUrl && (
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Archivo creativo</h3>
                      <a
                        href={piece.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        Ver archivo
                      </a>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <ClockIcon className="w-3 h-3" />
                      Actualizado {new Date(piece.updatedAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              )}

              {/* COMENTARIOS */}
              {activeTab === "comentarios" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {piece.comments.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquareIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Sin comentarios aún.</p>
                        <p className="text-xs text-muted-foreground">Sé el primero en comentar.</p>
                      </div>
                    )}
                    {piece.comments.map((c) => {
                      const isMine = c.user.id === currentUserId
                      return (
                        <div key={c.id} className={cn("flex gap-2.5", isMine && "flex-row-reverse")}>
                          <Initials name={c.user.name} />
                          <div className={cn(
                            "max-w-[75%] space-y-1",
                            isMine && "items-end flex flex-col"
                          )}>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-foreground">{c.user.name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(c.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className={cn(
                              "px-3 py-2 rounded-xl text-xs text-foreground leading-relaxed",
                              isMine ? "bg-primary/10 rounded-tr-sm" : "bg-muted rounded-tl-sm"
                            )}>
                              {c.content}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Comment input */}
                  <form onSubmit={submitComment} className="flex-shrink-0 border-t border-border p-4 flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Escribe un comentario…"
                      disabled={submitting}
                      className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !comment.trim()}
                      className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
