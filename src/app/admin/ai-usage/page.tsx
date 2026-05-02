import { db } from "@/lib/db/prisma"
import Link from "next/link"

const ACTION_LABELS: Record<string, string> = {
  generate_brief: "Brief completo",
  piece_generate: "Por pieza",
  generate_concepts: "Conceptos",
  work_plan: "Plan de trabajo",
}

export default async function AiUsagePage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [aggregate, aggregateMonth, byWorkspaceAllTime, byWorkspaceMonth, byAction] = await Promise.all([
    db.aiUsage.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _count: { id: true },
    }),
    db.aiUsage.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { costUsd: true },
      _count: { id: true },
    }),
    db.aiUsage.groupBy({
      by: ["workspaceId"],
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
    db.aiUsage.groupBy({
      by: ["workspaceId"],
      where: { createdAt: { gte: monthStart } },
      _sum: { costUsd: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
    db.aiUsage.groupBy({
      by: ["action"],
      _sum: { costUsd: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
  ])

  // Merge all workspace IDs from both queries
  const allWsIds = [...new Set([
    ...byWorkspaceAllTime.map(b => b.workspaceId),
    ...byWorkspaceMonth.map(b => b.workspaceId),
  ])]
  const workspaces = allWsIds.length > 0
    ? await db.workspace.findMany({ where: { id: { in: allWsIds } }, select: { id: true, name: true } })
    : []
  const wsMap = Object.fromEntries(workspaces.map(w => [w.id, w.name]))
  const monthMap = Object.fromEntries(byWorkspaceMonth.map(b => [b.workspaceId, b]))

  // Merge: all-time rows enriched with this-month cost
  const byWorkspace = byWorkspaceAllTime.map(b => ({
    ...b,
    monthCost: monthMap[b.workspaceId]?._sum.costUsd ?? 0,
    monthCalls: monthMap[b.workspaceId]?._count.id ?? 0,
  }))

  const totalCost = aggregate._sum.costUsd ?? 0
  const monthCost = aggregateMonth._sum.costUsd ?? 0
  const totalTokens = (aggregate._sum.inputTokens ?? 0) + (aggregate._sum.outputTokens ?? 0)
  const totalCalls = aggregate._count.id

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Uso de IA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Consumo de Claude API por workspace</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Este mes</p>
          <p className="text-2xl font-bold text-foreground">${monthCost.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{aggregateMonth._count.id} llamadas</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total acumulado</p>
          <p className="text-2xl font-bold text-foreground">${totalCost.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalTokens.toLocaleString()} tokens · {totalCalls} llamadas</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cobro estimado (3x)</p>
          <p className="text-2xl font-bold text-emerald-600">${(totalCost * 3).toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Margen ~$${(totalCost * 2).toFixed(4)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Por tipo de acción</p>
          <div className="space-y-1">
            {byAction.map(a => (
              <div key={a.action} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{ACTION_LABELS[a.action] ?? a.action}</span>
                <span className="font-mono font-semibold text-foreground">${(a._sum.costUsd ?? 0).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Por workspace</h2>
        </div>
        {byWorkspace.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Sin registros de uso aún. Los datos aparecerán cuando los clientes usen la generación IA.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workspace</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Este mes (llamadas)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wide font-bold">Costo este mes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total acumulado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tokens totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byWorkspace.map((b) => (
                <tr key={b.workspaceId} className="hover:bg-muted/20">
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    <Link href={`/admin/workspaces/${b.workspaceId}`} className="hover:text-primary transition-colors">
                      {wsMap[b.workspaceId] ?? b.workspaceId}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">{b.monthCalls}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                    ${b.monthCost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-muted-foreground">
                    ${(b._sum.costUsd ?? 0).toFixed(4)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                    {((b._sum.inputTokens ?? 0) + (b._sum.outputTokens ?? 0)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td className="px-5 py-3 text-xs font-semibold text-muted-foreground">TOTAL</td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">{aggregateMonth._count.id}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-primary">${monthCost.toFixed(4)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">${totalCost.toFixed(4)}</td>
                <td className="px-5 py-3 text-right font-mono text-muted-foreground">{totalTokens.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
