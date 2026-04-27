import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { BarChart2Icon, BuildingIcon, MegaphoneIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react"

export default async function MetricsPage() {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")
  if (!["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) redirect("/campaigns")

  const empresas = await db.empresa.findMany({
    where: { workspaceId: session.user.workspaceId, isActive: true },
    select: {
      id: true,
      nombre: true,
      industria: true,
      metaEnabled: true,
      campaigns: {
        where: { isArchived: false },
        select: {
          id: true,
          status: true,
          adSets: {
            select: {
              pieces: {
                select: { taskStatus: true, dueDate: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // Agregar workspace-level stats
  const allPieces = empresas.flatMap(e => e.campaigns.flatMap(c => c.adSets.flatMap(a => a.pieces)))
  const now = new Date()

  const workspaceStats = {
    empresasTotal: empresas.length,
    campanasActivas: empresas.flatMap(e => e.campaigns).filter(c => ["DRAFT", "REVIEW", "APPROVED", "LIVE"].includes(c.status)).length,
    piezasTotal: allPieces.length,
    piezasPublicadas: allPieces.filter(p => p.taskStatus === "PUBLICADO").length,
    overdueTotal: allPieces.filter(p =>
      p.dueDate && new Date(p.dueDate) < now && !["APROBADO", "PUBLICADO"].includes(p.taskStatus)
    ).length,
  }

  const empresaStats = empresas.map(e => {
    const pieces = e.campaigns.flatMap(c => c.adSets.flatMap(a => a.pieces))
    const active = e.campaigns.filter(c => ["DRAFT", "REVIEW", "APPROVED", "LIVE"].includes(c.status)).length
    const done = pieces.filter(p => ["APROBADO", "PUBLICADO"].includes(p.taskStatus)).length
    const overdue = pieces.filter(p =>
      p.dueDate && new Date(p.dueDate) < now && !["APROBADO", "PUBLICADO"].includes(p.taskStatus)
    ).length
    const pct = pieces.length > 0 ? Math.round(done / pieces.length * 100) : 0
    return { ...e, piezasTotal: pieces.length, campanasActivas: active, overdueCount: overdue, completedPct: pct }
  })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart2Icon className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">Métricas</h1>
          <p className="text-sm text-muted-foreground">Producción y rendimiento por empresa</p>
        </div>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Empresas activas",  value: workspaceStats.empresasTotal, icon: BuildingIcon },
          { label: "Campañas en curso", value: workspaceStats.campanasActivas, icon: MegaphoneIcon },
          { label: "Piezas publicadas", value: workspaceStats.piezasPublicadas, icon: CheckCircle2Icon },
          { label: "Con retraso",       value: workspaceStats.overdueTotal, icon: AlertCircleIcon, alert: workspaceStats.overdueTotal > 0 },
        ].map(({ label, value, icon: Icon, alert }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${alert && value > 0 ? "text-destructive" : "text-foreground"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Cards por empresa */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Por empresa</h2>
        {empresaStats.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <BuildingIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sin empresas activas. Crea una empresa primero.</p>
            <Link href="/empresas/nueva"
              className="inline-flex mt-4 h-8 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg items-center hover:opacity-90 transition-opacity">
              Crear empresa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {empresaStats.map((e) => (
              <Link key={e.id} href={`/metrics/empresa/${e.id}`}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{e.nombre.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.industria ?? "Sin industria"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.metaEnabled && (
                      <span className="w-5 h-5 rounded bg-[#1877F2] flex items-center justify-center text-white text-[9px] font-bold">f</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Producción completada</span>
                    <span className="font-mono font-semibold text-foreground">{e.completedPct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${e.completedPct}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Campañas", value: e.campanasActivas },
                    { label: "Piezas",   value: e.piezasTotal },
                    { label: "Retrasos", value: e.overdueCount },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className={`text-base font-bold ${label === "Retrasos" && value > 0 ? "text-destructive" : "text-foreground"}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
