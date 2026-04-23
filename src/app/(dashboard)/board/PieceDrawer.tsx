"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  XIcon, UserIcon, ChevronRightIcon, ChevronLeftIcon,
  SendIcon, FileTextIcon, MessageSquareIcon, ClockIcon,
  SparklesIcon, LinkIcon, Loader2Icon, UploadIcon, CheckCircleIcon, Trash2Icon,
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
  archivoKey: string | null
  archivoSignedUrl: string | null
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

// ─── File type helper ────────────────────────────────────────────────────────

function getFileType(url: string): "image" | "video" | "other" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image"
  if (["mp4", "mov", "webm"].includes(ext)) return "video"
  return "other"
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
  canDelete: boolean
  onClose: () => void
}

type Tab = "detalles" | "comentarios"

export default function PieceDrawer({ pieceId, members, currentUserId, canAdvance, canAssign, canDelete, onClose }: Props) {
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
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !piece) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // 1. Get presigned URL
      const res = await fetch(`/api/pieces/${piece.id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? "Error al preparar upload")
        return
      }
      const { uploadUrl, key, archivoUrl } = await res.json()

      // 2. Upload directly to S3
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error(`S3 error ${xhr.status}`))
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.send(file)
      })

      // 3. Save URL to piece
      await patchPiece({ archivoUrl, archivoKey: key })
      setPiece((p) => p ? { ...p, archivoUrl } : p)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir archivo")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function deleteArchivoFile() {
    if (!piece || !confirm("¿Eliminar el archivo creativo?")) return
    setDeleting(true)
    const res = await fetch(`/api/pieces/${piece.id}/file`, { method: "DELETE" })
    if (res.ok) {
      setPiece((p) => p ? { ...p, archivoUrl: null, archivoKey: null, archivoSignedUrl: null } : p)
      router.refresh()
    }
    setDeleting(false)
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

                  {/* File upload */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Archivo creativo</h3>

                    {piece.archivoUrl ? (
                      <div className="space-y-2">
                        {/* Inline preview usando URL firmada (bucket privado) */}
                        {piece.archivoSignedUrl && getFileType(piece.archivoUrl) === "image" && (
                          <img
                            src={piece.archivoSignedUrl}
                            alt="Preview"
                            className="max-h-48 w-full object-contain rounded-lg border border-border"
                          />
                        )}
                        {piece.archivoSignedUrl && getFileType(piece.archivoUrl) === "video" && (
                          <video
                            src={piece.archivoSignedUrl}
                            controls
                            className="w-full rounded-lg max-h-48"
                          />
                        )}
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
                          <a
                            href={piece.archivoSignedUrl ?? piece.archivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:underline"
                          >
                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            Ver archivo subido
                          </a>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading || deleting}
                              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Reemplazar
                            </button>
                            {canDelete && (
                              <button
                                onClick={deleteArchivoFile}
                                disabled={deleting || uploading}
                                className="text-[11px] text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                {deleting ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <Trash2Icon className="w-3 h-3" />}
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2Icon className="w-5 h-5 text-primary animate-spin" />
                            <span className="text-xs text-muted-foreground">{uploadProgress}% subido…</span>
                          </>
                        ) : (
                          <>
                            <UploadIcon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Subir archivo creativo</span>
                            <span className="text-[10px] text-muted-foreground/60">JPG, PNG, MP4, MOV, PDF · máx 200MB</span>
                          </>
                        )}
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    {uploading && uploadProgress > 0 && (
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

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
