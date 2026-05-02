"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon, Loader2Icon, RefreshCwIcon, DownloadIcon,
  AlertCircleIcon, CheckCircle2Icon, ClockIcon,
  UsersIcon, BrainCircuitIcon, TrendingUpIcon, ImageIcon, BarChart2Icon,
  ActivityIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { extractROAS, fmtCurrency, fmtNumber } from "@/lib/meta-api"
import type { MetaInsights, MetaCampaignInsights, AudienceBreakdownRow, DailyInsightsRow } from "@/lib/meta-api"
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"

type DatePreset = "7" | "30" | "90"
type TabKey = "produccion" | "creativos" | "meta" | "audiencias" | "analytics"

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "7 días",  value: "7" },
  { label: "30 días", value: "30" },
  { label: "90 días", value: "90" },
]

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PRODUCCION: "En producción", EN_REVISION: "En revisión",
  APROBADO: "Aprobado", PUBLICADO: "Publicado", RECHAZADO: "Rechazado",
}
const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-muted-foreground/30", EN_PRODUCCION: "bg-blue-400", EN_REVISION: "bg-amber-400",
  APROBADO: "bg-emerald-400", PUBLICADO: "bg-primary", RECHAZADO: "bg-destructive",
}

interface RecentActivity {
  pieceId: string
  campaignName: string
  taskStatus: string
  tipoPieza: string | null
  assigneeName: string | null
  updatedAt: string
}

interface ProduccionData {
  campaignsTotal: number
  campaignsActive: number
  piezasTotal: number
  byStatus: Record<string, number>
  withAi: number
  overdueCount: number
  dueSoonCount: number
  workload: { id: string; name: string; total: number; byStatus: Record<string, number> }[]
  recentActivity: RecentActivity[]
}

interface Creativo {
  id: string
  campaignName: string
  campaignId: string
  tipoPieza: string | null
  formato: string | null
  assigneeName: string | null
  adUrl: string | null
  signedUrl: string | null
  archivoKey: string | null
}

interface MetaData {
  accountInsights: MetaInsights | null
  campaignsInsights: MetaCampaignInsights[]
  audienceAge: AudienceBreakdownRow[]
  audienceDevice: AudienceBreakdownRow[]
  audienceCountry: AudienceBreakdownRow[]
  audiencePlacement: AudienceBreakdownRow[]
  dailyInsights: DailyInsightsRow[]
  dateRange: { since: string; until: string }
  error?: string
}

interface MetricsResponse {
  empresa: { id: string; nombre: string; metaEnabled: boolean }
  produccion: ProduccionData
  creativos: Creativo[]
  meta: MetaData | null
}

function KpiCard({ label, value, sub, alert = false, delta }: { label: string; value: string | number; sub?: string; alert?: boolean; delta?: number | null }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
      {delta != null && (
        <p className={`text-xs mt-0.5 font-medium ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {Math.abs(delta)}% vs período anterior
        </p>
      )}
      {sub && delta == null && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function pctDelta(curr: string | null | undefined, prev: string | null | undefined): number | null {
  const c = parseFloat(curr || "0")
  const p = parseFloat(prev || "0")
  if (p === 0) return null
  return Math.round((c - p) / p * 100)
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return "ahora"
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} días`
}

function exportCsv(data: MetaCampaignInsights[], empresaNombre: string) {
  const headers = ["Campaña", "Gasto", "Impresiones", "Clicks", "CTR", "CPC", "ROAS"]
  const rows = data.map(c => [
    c.campaign_name,
    c.spend,
    c.impressions,
    c.clicks,
    parseFloat(c.ctr || "0").toFixed(2) + "%",
    c.cpc,
    extractROAS(c.purchase_roas),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `metricas-${empresaNombre.toLowerCase().replace(/\s+/g, "-")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function EmpresaDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<TabKey>("produccion")
  const [preset, setPreset] = useState<DatePreset>("30")
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [prevData, setPrevData] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCampaign, setFilterCampaign] = useState("")
  const [filterTipo, setFilterTipo] = useState("")

  const dateRangeParams = useCallback(() => {
    const until = new Date().toISOString().slice(0, 10)
    const since = new Date(Date.now() - parseInt(preset) * 86400000).toISOString().slice(0, 10)
    return `since=${since}&until=${until}`
  }, [preset])

  const prevDateRangeParams = useCallback(() => {
    const days = parseInt(preset)
    const until = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
    const since = new Date(Date.now() - days * 2 * 86400000).toISOString().slice(0, 10)
    return `since=${since}&until=${until}`
  }, [preset])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, prevRes] = await Promise.all([
        fetch(`/api/metrics/empresa/${id}?${dateRangeParams()}`),
        fetch(`/api/metrics/empresa/${id}?${prevDateRangeParams()}`),
      ])
      if (!res.ok) { setError("Error al cargar métricas"); return }
      setData(await res.json() as MetricsResponse)
      if (prevRes.ok) setPrevData(await prevRes.json() as MetricsResponse)
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }, [id, dateRangeParams, prevDateRangeParams])

  useEffect(() => { load() }, [load])
  useEffect(() => { setFilterCampaign(""); setFilterTipo("") }, [data])

  const prod = data?.produccion
  const meta = data?.meta
  const prevMeta = prevData?.meta
  const creativos = data?.creativos ?? []
  const metaEnabled = data?.empresa?.metaEnabled ?? false

  const creativoCampaigns = useMemo(() => {
    const seen = new Set<string>()
    return creativos.filter(c => { if (seen.has(c.campaignId)) return false; seen.add(c.campaignId); return true })
  }, [creativos])

  const creativoTipos = useMemo(() => (
    [...new Set(creativos.map(c => c.tipoPieza).filter(Boolean))] as string[]
  ), [creativos])

  const filteredCreativos = useMemo(() => creativos.filter(c => {
    if (filterCampaign && c.campaignId !== filterCampaign) return false
    if (filterTipo && c.tipoPieza !== filterTipo) return false
    return true
  }), [creativos, filterCampaign, filterTipo])

  const tabs: { key: TabKey; label: string }[] = [
    { key: "produccion", label: "Producción" },
    { key: "creativos",  label: `Creativos${creativos.length > 0 ? ` (${creativos.length})` : ""}` },
    ...(metaEnabled ? [
      { key: "meta" as TabKey,       label: "Meta Ads" },
      { key: "audiencias" as TabKey, label: "Audiencias" },
      { key: "analytics" as TabKey,  label: "Analytics" },
    ] : []),
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/metrics" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{data?.empresa?.nombre ?? "Cargando…"}</h1>
            <p className="text-sm text-muted-foreground">Dashboard de métricas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {PRESETS.map(p => (
              <button key={p.value} onClick={() => setPreset(p.value)}
                className={cn("h-7 px-3 text-xs font-medium rounded-md transition-colors",
                  preset === p.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50">
            <RefreshCwIcon className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-sm text-destructive">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
        {!metaEnabled && (
          <Link href={`/empresas/${id}`}
            className="ml-auto px-4 py-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap">
            + Conectar Meta Ads
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Cargando métricas…</span>
        </div>
      )}

      {/* ── TAB: Producción ─────────────────────────────────────────────── */}
      {!loading && tab === "produccion" && prod && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Campañas activas" value={prod.campaignsActive} sub={`de ${prod.campaignsTotal} total`} />
            <KpiCard label="Piezas totales" value={prod.piezasTotal} />
            <KpiCard label="Con IA generada" value={prod.withAi} sub={`${prod.piezasTotal > 0 ? Math.round(prod.withAi / prod.piezasTotal * 100) : 0}% del total`} />
            <KpiCard label="Con retraso" value={prod.overdueCount} sub={prod.dueSoonCount > 0 ? `${prod.dueSoonCount} vencen esta semana` : undefined} alert={prod.overdueCount > 0} />
          </div>

          {/* Estado de piezas */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4 text-muted-foreground" />
              Estado de piezas
            </h2>
            <div className="space-y-3">
              {Object.entries(prod.byStatus).map(([status, count]) => {
                const pct = prod.piezasTotal > 0 ? Math.round(count / prod.piezasTotal * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{STATUS_LABELS[status] ?? status}</span>
                      <span className="font-mono font-semibold text-foreground">{count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${STATUS_COLORS[status] ?? "bg-primary"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Workload del equipo */}
          {prod.workload.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-muted-foreground" />
                Carga del equipo
              </h2>
              <div className="space-y-3">
                {prod.workload.map(member => {
                  const active = (member.byStatus.EN_PRODUCCION ?? 0) + (member.byStatus.EN_REVISION ?? 0)
                  const load = member.total > 5 ? "high" : member.total > 3 ? "med" : "low"
                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-primary">{member.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground">{active} activas · {member.total} asignadas</p>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold",
                        load === "high" ? "bg-destructive/10 text-destructive" :
                        load === "med"  ? "bg-amber-50 text-amber-700" :
                                          "bg-emerald-50 text-emerald-700")}>
                        {load === "high" ? "Alta" : load === "med" ? "Media" : "Baja"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actividad reciente */}
          {prod.recentActivity.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                Actividad reciente
              </h2>
              <div className="space-y-2">
                {prod.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                      STATUS_COLORS[a.taskStatus] ?? "bg-muted-foreground/30")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {a.tipoPieza ?? "Pieza"} — <span className="text-muted-foreground">{a.campaignName}</span>
                      </p>
                      {a.assigneeName && (
                        <p className="text-[11px] text-muted-foreground">{a.assigneeName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {STATUS_LABELS[a.taskStatus] ?? a.taskStatus}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(a.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Creativos ──────────────────────────────────────────────── */}
      {!loading && tab === "creativos" && (
        <div className="space-y-4">
          {/* Filtros */}
          {creativos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <select value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}
                className="h-8 px-3 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option value="">Todas las campañas</option>
                {creativoCampaigns.map(c => (
                  <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>
                ))}
              </select>
              {creativoTipos.length > 1 && (
                <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                  className="h-8 px-3 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none">
                  <option value="">Todos los tipos</option>
                  {creativoTipos.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
              {(filterCampaign || filterTipo) && (
                <button onClick={() => { setFilterCampaign(""); setFilterTipo("") }}
                  className="h-8 px-3 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  Limpiar filtros
                </button>
              )}
              {(filterCampaign || filterTipo) && (
                <span className="h-8 flex items-center text-xs text-muted-foreground">
                  {filteredCreativos.length} de {creativos.length}
                </span>
              )}
            </div>
          )}

          {filteredCreativos.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {creativos.length === 0 ? "Sin piezas publicadas aún." : "Sin resultados para los filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCreativos.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                  {/* Preview */}
                  <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative">
                    {c.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.signedUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                    )}
                    {c.adUrl && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary/90 text-primary-foreground text-[10px] font-semibold rounded">
                        En Meta
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground truncate">{c.tipoPieza ?? "Pieza"}{c.formato ? ` · ${c.formato}` : ""}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.campaignName}</p>
                    <div className="flex items-center justify-between pt-1">
                      {c.assigneeName && (
                        <span className="text-[10px] text-muted-foreground">{c.assigneeName}</span>
                      )}
                      {c.adUrl && (
                        <a href={c.adUrl} target="_blank" rel="noreferrer"
                          className="text-[10px] text-primary hover:underline ml-auto">
                          Ver en Meta →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Meta Ads ────────────────────────────────────────────────── */}
      {!loading && tab === "meta" && (
        <div className="space-y-6">
          {meta?.error ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              {meta.error}
              <Link href={`/empresas/${id}`} className="ml-auto text-xs underline">Actualizar token</Link>
            </div>
          ) : meta ? (
            <>
              {/* KPIs de cuenta */}
              {meta.accountInsights && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <KpiCard label="Gasto total" value={fmtCurrency(meta.accountInsights.spend)}
                      delta={pctDelta(meta.accountInsights.spend, prevMeta?.accountInsights?.spend)} />
                    <KpiCard label="Impresiones" value={fmtNumber(meta.accountInsights.impressions)}
                      delta={pctDelta(meta.accountInsights.impressions, prevMeta?.accountInsights?.impressions)} />
                    <KpiCard label="Clicks" value={fmtNumber(meta.accountInsights.clicks)}
                      delta={pctDelta(meta.accountInsights.clicks, prevMeta?.accountInsights?.clicks)} />
                    <KpiCard label="ROAS" value={extractROAS(meta.accountInsights.purchase_roas)}
                      delta={(() => {
                        const curr = parseFloat(extractROAS(meta.accountInsights?.purchase_roas).replace("x", "")) || 0
                        const prev = parseFloat(extractROAS(prevMeta?.accountInsights?.purchase_roas).replace("x", "")) || 0
                        return prev > 0 ? Math.round((curr - prev) / prev * 100) : null
                      })()} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <KpiCard label="CTR" value={`${parseFloat(meta.accountInsights.ctr || "0").toFixed(2)}%`}
                      delta={pctDelta(meta.accountInsights.ctr, prevMeta?.accountInsights?.ctr)} />
                    <KpiCard label="CPC promedio" value={fmtCurrency(meta.accountInsights.cpc)}
                      delta={pctDelta(meta.accountInsights.cpc, prevMeta?.accountInsights?.cpc) != null
                        ? -(pctDelta(meta.accountInsights.cpc, prevMeta?.accountInsights?.cpc) ?? 0)
                        : null} />
                  </div>
                  {prevMeta?.accountInsights && (
                    <p className="text-[11px] text-muted-foreground -mt-2">
                      Comparando vs período anterior ({prevMeta.dateRange?.since ?? ""} → {prevMeta.dateRange?.until ?? ""})
                    </p>
                  )}
                </>
              )}

              {/* Tabla campañas + export */}
              {meta.campaignsInsights.length > 0 && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Campañas</h2>
                    <span className="text-xs text-muted-foreground ml-1">{meta.dateRange.since} → {meta.dateRange.until}</span>
                    <button onClick={() => exportCsv(meta.campaignsInsights, data?.empresa?.nombre ?? "empresa")}
                      className="ml-auto flex items-center gap-1 h-7 px-2.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      <DownloadIcon className="w-3 h-3" /> CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          {["Campaña", "Gasto", "Impresiones", "Clicks", "CTR", "CPC", "ROAS"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {meta.campaignsInsights.map(c => {
                          const roas = extractROAS(c.purchase_roas)
                          const roasNum = parseFloat(roas.replace("x", "")) || 0
                          return (
                            <tr key={c.campaign_id} className="hover:bg-muted/20">
                              <td className="px-4 py-3 font-medium text-foreground max-w-48 truncate">{c.campaign_name}</td>
                              <td className="px-4 py-3 font-mono text-sm">{fmtCurrency(c.spend)}</td>
                              <td className="px-4 py-3 font-mono text-sm">{fmtNumber(c.impressions)}</td>
                              <td className="px-4 py-3 font-mono text-sm">{fmtNumber(c.clicks)}</td>
                              <td className="px-4 py-3 font-mono text-sm">{parseFloat(c.ctr || "0").toFixed(2)}%</td>
                              <td className="px-4 py-3 font-mono text-sm">{fmtCurrency(c.cpc)}</td>
                              <td className="px-4 py-3">
                                <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold",
                                  roasNum >= 4 ? "bg-emerald-50 text-emerald-700" :
                                  roasNum >= 2 ? "bg-amber-50 text-amber-700" :
                                  roasNum > 0  ? "bg-destructive/10 text-destructive" : "text-muted-foreground")}>
                                  {roas}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!meta.accountInsights && meta.campaignsInsights.length === 0 && (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                  <TrendingUpIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Sin datos de Meta para el período seleccionado.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <p className="text-sm text-muted-foreground">Meta Ads no conectado.</p>
              <Link href={`/empresas/${id}`}
                className="inline-flex mt-4 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg items-center hover:opacity-90 transition-opacity">
                Conectar ahora
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Audiencias ─────────────────────────────────────────────── */}
      {!loading && tab === "audiencias" && (
        <div className="space-y-6">
          {meta?.error ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              {meta.error}
            </div>
          ) : meta ? (
            <>
              {/* Age/Gender */}
              {meta.audienceAge.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Edad y género</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Edad", "Género", "Gasto", "Impresiones", "Clicks"].map(h => (
                            <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {meta.audienceAge.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="py-2.5 pr-4 text-foreground font-medium">{row.age ?? "—"}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground capitalize">{row.gender ?? "—"}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmtCurrency(row.spend)}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmtNumber(row.impressions)}</td>
                            <td className="py-2.5 font-mono">{fmtNumber(row.clicks)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Device breakdown */}
              {meta.audienceDevice.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Dispositivos</h2>
                  <div className="space-y-3">
                    {meta.audienceDevice.map((row, i) => {
                      const totalImpr = meta.audienceDevice.reduce((s, r) => s + parseFloat(r.impressions || "0"), 0)
                      const pct = totalImpr > 0 ? Math.round(parseFloat(row.impressions || "0") / totalImpr * 100) : 0
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground capitalize">{row.device_platform ?? "Otro"}</span>
                            <span className="font-mono font-semibold text-foreground">{fmtNumber(row.impressions)} imp. <span className="text-muted-foreground">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Placement performance */}
              {meta.audiencePlacement.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Placement</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Plataforma", "Placement", "Gasto", "Impresiones", "Clicks"].map(h => (
                            <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {meta.audiencePlacement.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="py-2.5 pr-4 text-foreground capitalize">{row.publisher_platform ?? "—"}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground capitalize">{(row.platform_position ?? "—").replace(/_/g, " ")}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmtCurrency(row.spend)}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmtNumber(row.impressions)}</td>
                            <td className="py-2.5 font-mono">{fmtNumber(row.clicks)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top países */}
              {meta.audienceCountry.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-4">Top 10 países</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["País", "Gasto", "Impresiones", "Clicks"].map(h => (
                            <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {meta.audienceCountry.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="py-2.5 pr-4 text-foreground font-medium uppercase">{row.country ?? "—"}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmtCurrency(row.spend)}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmtNumber(row.impressions)}</td>
                            <td className="py-2.5 font-mono">{fmtNumber(row.clicks)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {meta.audienceAge.length === 0 && meta.audienceDevice.length === 0 && (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                  <BrainCircuitIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Sin datos de audiencia para el período seleccionado.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ── TAB: Analytics ──────────────────────────────────────────────── */}
      {!loading && tab === "analytics" && (
        <div className="space-y-6">
          {meta?.error ? (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
              {meta.error}
            </div>
          ) : meta?.dailyInsights && meta.dailyInsights.length > 0 ? (
            <>
              {/* Daily Spend vs ROAS */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <BarChart2Icon className="w-4 h-4 text-muted-foreground" />
                  Gasto diario vs ROAS
                </h2>
                <p className="text-xs text-muted-foreground mb-4">{meta.dateRange.since} → {meta.dateRange.until}</p>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={meta.dailyInsights.map(d => ({
                    date: d.date_start.slice(5), // MM-DD
                    spend: parseFloat(d.spend || "0"),
                    roas: parseFloat(extractROAS(d.purchase_roas).replace("x", "")) || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={v => `$${v}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={v => `${v}x`} />
                    <Tooltip
                      formatter={(value, name) => {
                        const n = typeof value === "number" ? value : parseFloat(String(value)) || 0
                        return name === "spend" ? [`$${n.toFixed(0)}`, "Gasto"] : [`${n.toFixed(2)}x`, "ROAS"]
                      }}
                      labelFormatter={l => `Fecha: ${l}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend formatter={v => v === "spend" ? "Gasto" : "ROAS"} />
                    <Bar yAxisId="left" dataKey="spend" fill="hsl(var(--primary))" opacity={0.8} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="roas" stroke="#10b981" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* ROAS por campaña */}
              {meta.campaignsInsights.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4 text-muted-foreground" />
                    ROAS por campaña
                  </h2>
                  <div className="space-y-3">
                    {[...meta.campaignsInsights]
                      .sort((a, b) => {
                        const ra = parseFloat(extractROAS(a.purchase_roas).replace("x", "")) || 0
                        const rb = parseFloat(extractROAS(b.purchase_roas).replace("x", "")) || 0
                        return rb - ra
                      })
                      .map(c => {
                        const roas = extractROAS(c.purchase_roas)
                        const roasNum = parseFloat(roas.replace("x", "")) || 0
                        const maxRoas = Math.max(...meta.campaignsInsights.map(x =>
                          parseFloat(extractROAS(x.purchase_roas).replace("x", "")) || 0
                        ), 1)
                        const pct = Math.round(roasNum / maxRoas * 100)
                        return (
                          <div key={c.campaign_id}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground truncate max-w-48">{c.campaign_name}</span>
                              <span className={cn("font-mono font-semibold",
                                roasNum >= 4 ? "text-emerald-600" : roasNum >= 2 ? "text-amber-600" : "text-destructive")}>
                                {roas}
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full",
                                roasNum >= 4 ? "bg-emerald-400" : roasNum >= 2 ? "bg-amber-400" : "bg-destructive")}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  {/* Leyenda */}
                  <div className="flex gap-4 mt-4 pt-3 border-t border-border">
                    {[
                      { color: "bg-emerald-400", label: "Top performer ≥4x" },
                      { color: "bg-amber-400",   label: "Promedio 2–4x" },
                      { color: "bg-destructive",  label: "Bajo <2x" },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${l.color}`} />
                        <span className="text-[10px] text-muted-foreground">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <BarChart2Icon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {!meta ? "Meta Ads no conectado." : "Sin datos diarios para el período seleccionado."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
