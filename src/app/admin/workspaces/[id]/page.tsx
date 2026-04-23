import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db/prisma"
import { ArrowLeftIcon } from "lucide-react"
import WorkspaceActions from "./WorkspaceActions"

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario", CREATIVO: "Creativo", TRAFFICKER: "Trafficker", VIEWER: "Viewer",
}

const BILLING_LABELS: Record<string, string> = {
  pending: "Pendiente", paid: "Pagado", overdue: "Vencido",
}

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const workspace = await db.workspace.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { campaigns: true } },
    },
    // metaEnabled is included by default in the model
  })

  if (!workspace) notFound()

  const totalRevenue = workspace.setupFee + (workspace.monthlyFee * 12)

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin" className="p-2 mt-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">{workspace.name}</h1>
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${workspace.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {workspace.isActive ? "Activo" : "Inactivo"}
            </span>
            {workspace.metaEnabled && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                Meta Ads ✓
              </span>
            )}
            {workspace.globalAiEnabled && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-50 text-violet-700">
                IA global ✓
              </span>
            )}
          </div>
          {(workspace.city || workspace.country) && (
            <p className="text-sm text-muted-foreground mt-0.5">{[workspace.city, workspace.country].filter(Boolean).join(", ")}</p>
          )}
        </div>
        <WorkspaceActions workspaceId={workspace.id} isActive={workspace.isActive} billingStatus={workspace.billingStatus} metaEnabled={workspace.metaEnabled} globalAiEnabled={workspace.globalAiEnabled} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Plan", value: workspace.plan },
          { label: "Billing", value: BILLING_LABELS[workspace.billingStatus] ?? workspace.billingStatus },
          { label: "Mensualidad", value: `$${workspace.monthlyFee.toLocaleString("es-CO")}` },
          { label: "Campañas", value: workspace._count.campaigns },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-lg font-bold text-foreground mt-1 capitalize">{value}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {workspace.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Nota interna</p>
          <p className="text-sm text-amber-900">{workspace.notes}</p>
        </div>
      )}

      {/* Users */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Usuarios ({workspace.users.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rol</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workspace.users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20">
                <td className="px-5 py-3.5 font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`text-xs font-medium ${user.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue summary */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Resumen financiero</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Setup fee (one-time)</span>
            <span className="font-mono font-semibold">${workspace.setupFee.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mensualidad</span>
            <span className="font-mono font-semibold">${workspace.monthlyFee.toLocaleString("es-CO")}/mes</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-2">
            <span className="font-medium text-foreground">LTV estimado (1 año)</span>
            <span className="font-mono font-bold text-primary">${totalRevenue.toLocaleString("es-CO")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
