import { db } from "@/lib/db/prisma"

export default async function AiUsagePage() {
  const [aggregate, byWorkspace] = await Promise.all([
    db.aiUsage.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _count: { id: true },
    }),
    db.aiUsage.groupBy({
      by: ["workspaceId"],
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
  ])

  const workspaceIds = byWorkspace.map(b => b.workspaceId)
  const workspaces = workspaceIds.length > 0
    ? await db.workspace.findMany({ where: { id: { in: workspaceIds } }, select: { id: true, name: true } })
    : []
  const wsMap = Object.fromEntries(workspaces.map(w => [w.id, w.name]))

  const totalCost = aggregate._sum.costUsd ?? 0
  const totalTokens = (aggregate._sum.inputTokens ?? 0) + (aggregate._sum.outputTokens ?? 0)
  const totalCalls = aggregate._count.id

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Uso de IA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Consumo de Claude API por workspace</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tokens totales</p>
          <p className="text-2xl font-bold text-foreground">{totalTokens.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalCalls} llamadas</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Costo (USD)</p>
          <p className="text-2xl font-bold text-foreground">${totalCost.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pagado a Anthropic</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Margen estimado</p>
          <p className="text-2xl font-bold text-emerald-600">${(totalCost * 2).toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Markup 3x</p>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empresa</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Llamadas</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tokens</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Costo USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byWorkspace.map((b) => (
                <tr key={b.workspaceId} className="hover:bg-muted/20">
                  <td className="px-5 py-3.5 font-medium text-foreground">{wsMap[b.workspaceId] ?? b.workspaceId}</td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">{b._count.id}</td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground font-mono">
                    {((b._sum.inputTokens ?? 0) + (b._sum.outputTokens ?? 0)).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                    ${(b._sum.costUsd ?? 0).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
