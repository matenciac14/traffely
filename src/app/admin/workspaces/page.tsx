import Link from "next/link"
import { db } from "@/lib/db/prisma"
import { PlusIcon } from "lucide-react"

const BILLING_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  overdue: "Vencido",
}

export default async function WorkspacesPage() {
  const workspaces = await db.workspace.findMany({
    where: { isDeleted: false },
    include: { _count: { select: { users: true, campaigns: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""} registrados</p>
        </div>
        <Link
          href="/admin/workspaces/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo cliente
        </Link>
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
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campañas</th>
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
                    {BILLING_LABELS[ws.billingStatus] ?? ws.billingStatus}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-sm text-foreground">
                  ${ws.monthlyFee.toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-3.5 text-right text-muted-foreground">{ws._count.users}</td>
                <td className="px-4 py-3.5 text-right text-muted-foreground">{ws._count.campaigns}</td>
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
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No hay clientes registrados.{" "}
                  <Link href="/admin/workspaces/new" className="text-primary hover:underline">Crear el primero</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
