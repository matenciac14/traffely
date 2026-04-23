import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { ArrowLeftIcon } from "lucide-react"
import CampaignPromptActions from "./CampaignPromptActions"
import CampaignGenerateSection from "./CampaignGenerateSection"
import CampaignStatusBar from "./CampaignStatusBar"
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
            select: { id: true, taskStatus: true, estado: true, modelo: true, tipoPieza: true, formato: true, assignee: { select: { name: true } } },
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

  // Status history from audit log
  const statusHistory = campaign.auditLogs
    .filter((l) => l.action === "campaign.status")
    .map((l) => {
      const diff = l.diff as { from: string; to: string } | null
      return { from: diff?.from, to: diff?.to, by: l.user.name, at: l.createdAt }
    })

  const currentStepIdx = STATUS_ORDER.indexOf(campaign.status)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/campaigns" className="p-2 mt-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">{campaign.name}</h1>
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold", st.class)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
              {st.label}
            </span>
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ad Sets</p>
          <p className="text-xl font-bold text-foreground mt-1">{campaign.adSets.length}</p>
          <p className="text-[11px] text-muted-foreground">conjuntos de anuncios</p>
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
      </div>

      {/* Piece status breakdown */}
      {totalPieces > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Estado de piezas</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byStatus).filter(([, count]) => count > 0).map(([status, count]) => {
              const s = TASK_STATUS_STYLE[status]
              return (
                <span key={status} className={cn("px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5", s.color)}>
                  {s.label} <span className="font-bold">{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Ad sets breakdown */}
      {campaign.adSets.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Ad Sets</h2>
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
                    <div className="flex flex-wrap gap-1.5">
                      {adSet.pieces.map((p) => {
                        const ts = TASK_STATUS_STYLE[p.taskStatus]
                        return (
                          <span
                            key={p.id}
                            className={cn("px-2 py-1 rounded-md text-[10px] font-medium border border-transparent", ts.color)}
                            title={`${p.modelo ?? ""} · ${p.tipoPieza ?? ""}${p.assignee ? ` · ${p.assignee.name}` : ""}`}
                          >
                            {p.modelo ?? "?"} · {p.tipoPieza ?? "?"}
                          </span>
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

      {/* Brief */}
      {brief && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Brief</h2>
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

      {/* Generate with AI */}
      {campaign.promptMaestro && (
        <CampaignGenerateSection campaignId={campaign.id} campaignName={campaign.name} />
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

      {/* Prompt maestro */}
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
          <pre className="p-5 text-xs text-foreground font-mono leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
            {campaign.promptMaestro}
          </pre>
        </div>
      )}
    </div>
  )
}
