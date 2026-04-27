import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { ArrowLeftIcon, LayoutGridIcon, PencilIcon } from "lucide-react"
import CampaignPromptActions from "./CampaignPromptActions"
import CampaignGenerateSection from "./CampaignGenerateSection"
import CampaignStatusBar from "./CampaignStatusBar"
import CampaignActions from "./CampaignActions"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, { label: string; class: string; dot: string }> = {
  DRAFT:    { label: "Borrador",    class: "bg-muted text-muted-foreground",     dot: "bg-muted-foreground" },
  REVIEW:   { label: "En revisión", class: "bg-amber-50 text-amber-700",         dot: "bg-amber-500" },
  APPROVED: { label: "Aprobada",    class: "bg-blue-50 text-blue-700",           dot: "bg-blue-500" },
  LIVE:     { label: "En vivo",     class: "bg-emerald-50 text-emerald-700",     dot: "bg-emerald-500" },
  FINISHED: { label: "Finalizada",  class: "bg-purple-50 text-purple-700",       dot: "bg-purple-500" },
}

const TASK_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  PENDIENTE:     { label: "Pendiente",     color: "bg-muted text-muted-foreground" },
  EN_PRODUCCION: { label: "En prod.",      color: "bg-blue-50 text-blue-700" },
  EN_REVISION:   { label: "En revisión",   color: "bg-amber-50 text-amber-700" },
  APROBADO:      { label: "Aprobado",      color: "bg-emerald-50 text-emerald-700" },
  PUBLICADO:     { label: "Publicado",     color: "bg-purple-50 text-purple-700" },
  RECHAZADO:     { label: "Rechazado",     color: "bg-red-50 text-red-700" },
}

const PRIORITY_STYLE: Record<string, { label: string; color: string }> = {
  BAJA:    { label: "Baja",    color: "text-muted-foreground" },
  MEDIA:   { label: "Media",   color: "text-amber-600" },
  ALTA:    { label: "Alta",    color: "text-orange-600" },
  URGENTE: { label: "Urgente", color: "text-red-600" },
}

const STATUS_ORDER = ["DRAFT", "REVIEW", "APPROVED", "LIVE", "FINISHED"]

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  const { id } = await params
  const campaign = await db.campaign.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    include: {
      adSets: {
        orderBy: { orden: "asc" },
        include: {
          pieces: {
            select: {
              id: true,
              taskStatus: true,
              estado: true,
              modelo: true,
              tipoPieza: true,
              formato: true,
              priority: true,
              dueDate: true,
              guionGenerado: true,
              copyGenerado: true,
              assignee: { select: { id: true, name: true } },
            },
            orderBy: { orden: "asc" },
          },
        },
      },
      auditLogs: {
        orderBy: { createdAt: "asc" },
        select: { action: true, diff: true, createdAt: true, user: { select: { name: true } } },
      },
      createdBy: { select: { name: true } },
    },
  })

  if (!campaign) notFound()

  const role = session.user.role ?? "VIEWER"
  const canManage = ["OWNER", "SUPER_ADMIN"].includes(role)

  const st = STATUS_STYLE[campaign.status] ?? STATUS_STYLE.DRAFT
  const brief = campaign.brief as Record<string, string> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presupuesto = campaign.presupuesto as Record<string, any> | null

  const allPieces = campaign.adSets.flatMap((a) => a.pieces)
  const totalPieces = allPieces.length
  const donePieces = allPieces.filter((p) => ["APROBADO", "PUBLICADO"].includes(p.taskStatus)).length
  const pct = totalPieces > 0 ? Math.round((donePieces / totalPieces) * 100) : 0

  // Piece count by status
  const byStatus = Object.fromEntries(
    ["PENDIENTE", "EN_PRODUCCION", "EN_REVISION", "APROBADO", "PUBLICADO", "RECHAZADO"].map((s) => [
      s, allPieces.filter((p) => p.taskStatus === s).length,
    ])
  )

  // AI content stats
  const piecesWithAI = allPieces.filter((p) => p.guionGenerado || p.copyGenerado).length

  // Status history from audit log
  const statusHistory = campaign.auditLogs
    .filter((l) => l.action === "campaign.status")
    .map((l) => {
      const diff = l.diff as { from: string; to: string } | null
      return { from: diff?.from, to: diff?.to, by: l.user.name, at: l.createdAt }
    })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/campaigns" className="p-2 mt-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground flex-1">{campaign.name}</h1>
            <CampaignActions campaignId={campaign.id} isArchived={campaign.isArchived} canManage={canManage} />
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold", st.class)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
              {st.label}
            </span>
            {campaign.status === "DRAFT" && !campaign.promptMaestro && canManage && (
              <Link
                href={`/campaigns/new?resume=${campaign.id}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <PencilIcon className="w-3 h-3" />
                Continuar editando
              </Link>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {campaign.tipo === "EVERGREEN" ? "Evergreen" : "Estacional"}
            {campaign.eventoEstacional ? ` · ${campaign.eventoEstacional}` : ""}
            {" · Creada por "}{campaign.createdBy.name}
            {" · "}{new Date(campaign.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Status stepper + actions */}
      <CampaignStatusBar
        campaignId={campaign.id}
        currentStatus={campaign.status}
        canManage={canManage}
      />

      {/* KPIs row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Presupuesto</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {presupuesto?.valor ? `$${Number(presupuesto.valor).toLocaleString("es-CO")}` : "—"}
          </p>
          {presupuesto?.valor && <p className="text-[11px] text-muted-foreground">COP · {String(presupuesto.modo ?? "")}</p>}
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vuelo</p>
          <p className="text-sm font-semibold text-foreground mt-1">
            {presupuesto?.fechaInicio
              ? new Date(String(presupuesto.fechaInicio)).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
              : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {presupuesto?.sinFechaFin ? "Sin fecha fin" : presupuesto?.fechaFin
              ? `→ ${new Date(String(presupuesto.fechaFin)).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}`
              : ""}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Piezas listas</p>
          <p className="text-xl font-bold text-foreground mt-1">{donePieces}<span className="text-sm font-normal text-muted-foreground">/{totalPieces}</span></p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Con IA</p>
          <p className="text-xl font-bold text-foreground mt-1">{piecesWithAI}<span className="text-sm font-normal text-muted-foreground">/{totalPieces}</span></p>
          <p className="text-[11px] text-muted-foreground">guión/copy generado</p>
        </div>
      </div>

      {/* Brief generado por IA — siempre visible si existe promptMaestro */}
      {campaign.promptMaestro && (
        <CampaignGenerateSection
          campaignId={campaign.id}
          campaignName={campaign.name}
          initialBrief={campaign.briefGenerado}
          generatedAt={campaign.briefGeneradoAt}
        />
      )}

      {/* Tareas del equipo */}
      {campaign.adSets.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Tareas del equipo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {Object.entries(byStatus).filter(([, c]) => c > 0).map(([s, c]) => {
                  const st = TASK_STATUS_STYLE[s]
                  return `${c} ${st.label.toLowerCase()}`
                }).join(" · ")}
              </p>
            </div>
            <Link
              href="/board"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <LayoutGridIcon className="w-3.5 h-3.5" />
              Ver board
            </Link>
          </div>
          <div className="divide-y divide-border">
            {campaign.adSets.map((adSet) => {
              const adTotal = adSet.pieces.length
              const adDone = adSet.pieces.filter((p) => ["APROBADO", "PUBLICADO"].includes(p.taskStatus)).length
              return (
                <div key={adSet.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{adSet.nombre}</p>
                      {adSet.porcentajePresupuesto && (
                        <p className="text-xs text-muted-foreground mt-0.5">{adSet.porcentajePresupuesto}% del presupuesto</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{adDone}/{adTotal} listas</span>
                      {adTotal > 0 && (
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", adDone === adTotal ? "bg-emerald-500" : "bg-primary")}
                            style={{ width: `${adTotal > 0 ? Math.round((adDone / adTotal) * 100) : 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {adSet.pieces.length > 0 && (
                    <div className="space-y-2">
                      {adSet.pieces.map((p) => {
                        const ts = TASK_STATUS_STYLE[p.taskStatus]
                        const pri = p.priority ? PRIORITY_STYLE[p.priority] : null
                        const hasAI = !!(p.guionGenerado || p.copyGenerado)
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-xs"
                          >
                            {/* Status badge */}
                            <span className={cn("px-2 py-0.5 rounded-md font-semibold flex-shrink-0", ts.color)}>
                              {ts.label}
                            </span>

                            {/* Piece name */}
                            <span className="flex-1 min-w-0 font-medium text-foreground truncate">
                              {p.modelo ?? "—"} · {p.tipoPieza ?? "—"}
                              {p.formato && <span className="text-muted-foreground"> · {p.formato}</span>}
                            </span>

                            {/* AI indicator */}
                            {hasAI && (
                              <span className="text-primary flex-shrink-0" title="Guión/copy IA generado">✦</span>
                            )}

                            {/* Priority */}
                            {pri && (
                              <span className={cn("flex-shrink-0 font-semibold", pri.color)}>{pri.label}</span>
                            )}

                            {/* Due date */}
                            {p.dueDate && (
                              <span className="text-muted-foreground flex-shrink-0">
                                {new Date(p.dueDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                              </span>
                            )}

                            {/* Assignee */}
                            {p.assignee ? (
                              <span
                                className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 uppercase"
                                title={p.assignee.name}
                              >
                                {p.assignee.name.charAt(0)}
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center flex-shrink-0 text-muted-foreground">
                                ?
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Brief estratégico */}
      {brief && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Brief estratégico</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {(
              [
                ["Objetivo", brief.objetivoCampana],
                ["Público", brief.publicoObjetivo],
                ["Tono y estilo", brief.tonoYestilo],
                ["CTA", brief.llamadaAccion],
                ["Insight", brief.insightMensajeClave],
                ["Propuestas de valor", brief.propuestasValor],
              ] as [string, string | undefined][]
            ).filter(([, v]) => v).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="mt-0.5 text-foreground text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status history */}
      {statusHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Historial de estado</h2>
          <div className="space-y-3">
            {statusHistory.map((h, i) => {
              const toSt = STATUS_STYLE[h.to ?? ""] ?? STATUS_STYLE.DRAFT
              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground w-32 flex-shrink-0">
                    {new Date(h.at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-md font-semibold", toSt.class)}>{toSt.label}</span>
                  <span className="text-muted-foreground">por {h.by}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Prompt maestro (colapsado al final) */}
      {campaign.promptMaestro && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Prompt maestro</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {campaign.promptMaestro.length.toLocaleString("es-CO")} caracteres · {campaign.promptVersion}
              </p>
            </div>
            <CampaignPromptActions prompt={campaign.promptMaestro} name={campaign.name} />
          </div>
          <pre className="p-5 text-xs text-foreground font-mono leading-relaxed overflow-auto max-h-[40vh] whitespace-pre-wrap break-words">
            {campaign.promptMaestro}
          </pre>
        </div>
      )}
    </div>
  )
}
