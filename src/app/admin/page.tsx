import Link from "next/link"
import { db } from "@/lib/db/prisma"
import { BuildingIcon, UsersIcon, MegaphoneIcon, AlertCircleIcon, PlusIcon, TrendingUpIcon } from "lucide-react"

function StatCard({ label, value, sub, icon: Icon, href, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; href?: string; accent?: boolean
}) {
  const content = (
    <div className={`bg-card rounded-2xl border p-5 transition-all ${accent ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <Icon className="w-4 h-4" />
        </div>
        {href && <span className="text-xs text-primary font-medium">Ver →</span>}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default async function AdminPage() {
  const [
    workspaces,
    totalUsers,
    totalCampaigns,
    aiUsage,
  ] = await Promise.all([
    db.workspace.findMany({
      include: { _count: { select: { users: true, campaigns: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
    db.campaign.count(),
    db.aiUsage.aggregate({ _sum: { costUsd: true, inputTokens: true, outputTokens: true } }),
  ])

  const activeWorkspaces = workspaces.filter(w => w.isActive).length
  const mrr = workspaces.filter(w => w.isActive && w.billingStatus === "paid")
    .reduce((sum, w) => sum + w.monthlyFee, 0)
  const overdueCount = workspaces.filter(w => w.billingStatus === "overdue").length
  const totalAiCost = aiUsage._sum.costUsd ?? 0

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Panel de administración</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vista global del negocio Traffely</p>
        </div>
        <Link
          href="/admin/workspaces/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo cliente
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Empresas activas" value={activeWorkspaces} sub={`${workspaces.length} totales`} icon={BuildingIcon} href="/admin/workspaces" accent />
        <StatCard label="Usuarios" value={totalUsers} sub="sin contar admin" icon={UsersIcon} />
        <StatCard label="Campañas creadas" value={totalCampaigns} icon={MegaphoneIcon} />
        <StatCard label="MRR estimado" value={`$${mrr.toLocaleString("es-CO")}`} sub="solo cuentas paid" icon={TrendingUpIcon} />
      </div>

      {/* Alertas */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <AlertCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">{overdueCount} cuenta{overdueCount > 1 ? "s" : ""} con pago vencido</p>
            <p className="text-xs text-amber-700 mt-0.5">Revisa el estado de billing en la lista de clientes.</p>
          </div>
          <Link href="/admin/workspaces" className="ml-auto text-xs font-semibold text-amber-700 hover:underline">Ver →</Link>
        </div>
      )}

      {/* Empresas recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Clientes registrados</h2>
          <Link href="/admin/workspaces" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">MRR</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuarios</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/workspaces/${ws.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {ws.name}
                    </Link>
                    {(ws.city || ws.country) && (
                      <p className="text-xs text-muted-foreground">{[ws.city, ws.country].filter(Boolean).join(", ")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground capitalize">{ws.plan}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${
                      ws.billingStatus === "paid" ? "bg-emerald-50 text-emerald-700" :
                      ws.billingStatus === "overdue" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {ws.billingStatus === "paid" ? "Pagado" : ws.billingStatus === "overdue" ? "Vencido" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-foreground">
                    ${ws.monthlyFee.toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">{ws._count.users}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ws.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ws.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                      {ws.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {workspaces.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No hay clientes registrados aún.{" "}
                    <Link href="/admin/workspaces/new" className="text-primary hover:underline">Crear el primero</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Usage */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tokens IA consumidos</p>
          <p className="text-2xl font-bold text-foreground">{((aiUsage._sum.inputTokens ?? 0) + (aiUsage._sum.outputTokens ?? 0)).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total acumulado</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Costo IA (USD)</p>
          <p className="text-2xl font-bold text-foreground">${totalAiCost.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pagado a Anthropic</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Margen IA estimado</p>
          <p className="text-2xl font-bold text-emerald-600">${(totalAiCost * 2).toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Markup 3x sobre costo</p>
        </div>
      </div>
    </div>
  )
}
