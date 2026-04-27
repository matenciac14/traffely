import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { decrypt } from "@/lib/utils/crypto"
import { getDownloadUrl } from "@/lib/s3/client"
import {
  getAccountInsights, getCampaignsInsights, getAudienceBreakdown, getDailyInsights,
} from "@/lib/meta-api"
import { logger } from "@/lib/logger"

// GET /api/metrics/empresa/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const { searchParams } = new URL(req.url)

  const defaultUntil = new Date().toISOString().slice(0, 10)
  const defaultSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const since = searchParams.get("since") ?? defaultSince
  const until = searchParams.get("until") ?? defaultUntil
  const dateRange = { since, until }

  const empresa = await db.empresa.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    select: {
      id: true,
      nombre: true,
      metaEnabled: true,
      metaAdAccountId: true,
      metaAccessToken: true,
      campaigns: {
        where: { isArchived: false },
        select: {
          id: true,
          name: true,
          status: true,
          adSets: {
            select: {
              pieces: {
                select: {
                  id: true,
                  taskStatus: true,
                  tipoPieza: true,
                  formato: true,
                  dueDate: true,
                  updatedAt: true,
                  guionGenerado: true,
                  copyGenerado: true,
                  archivoKey: true,
                  archivoUrl: true,
                  adUrl: true,
                  assignee: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // ── Producción metrics ────────────────────────────────────────────────────
  const allPieces = empresa.campaigns.flatMap(c =>
    c.adSets.flatMap(a => a.pieces.map(p => ({ ...p, campaignName: c.name, campaignId: c.id })))
  )
  const byStatus: Record<string, number> = {
    PENDIENTE: 0, EN_PRODUCCION: 0, EN_REVISION: 0, APROBADO: 0, PUBLICADO: 0, RECHAZADO: 0,
  }
  allPieces.forEach(p => { byStatus[p.taskStatus] = (byStatus[p.taskStatus] ?? 0) + 1 })

  const now = new Date()
  const overdueCount = allPieces.filter(p =>
    p.dueDate && new Date(p.dueDate) < now && !["APROBADO", "PUBLICADO"].includes(p.taskStatus)
  ).length
  const dueSoonCount = allPieces.filter(p => {
    if (!p.dueDate) return false
    const diff = (new Date(p.dueDate).getTime() - now.getTime()) / 86400000
    return diff >= 0 && diff <= 7 && !["APROBADO", "PUBLICADO"].includes(p.taskStatus)
  }).length

  const workloadMap = new Map<string, { id: string; name: string; total: number; byStatus: Record<string, number> }>()
  allPieces.forEach(p => {
    if (!p.assignee) return
    const w = workloadMap.get(p.assignee.id) ?? { id: p.assignee.id, name: p.assignee.name, total: 0, byStatus: {} }
    w.total++
    w.byStatus[p.taskStatus] = (w.byStatus[p.taskStatus] ?? 0) + 1
    workloadMap.set(p.assignee.id, w)
  })

  // Actividad reciente: últimas 10 piezas modificadas
  const recentActivity = [...allPieces]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map(p => ({
      pieceId: p.id,
      campaignName: p.campaignName,
      taskStatus: p.taskStatus,
      tipoPieza: p.tipoPieza,
      assigneeName: p.assignee?.name ?? null,
      updatedAt: p.updatedAt.toISOString(),
    }))

  const produccion = {
    campaignsTotal: empresa.campaigns.length,
    campaignsActive: empresa.campaigns.filter(c => ["DRAFT", "REVIEW", "APPROVED", "LIVE"].includes(c.status)).length,
    piezasTotal: allPieces.length,
    byStatus,
    withAi: allPieces.filter(p => p.guionGenerado || p.copyGenerado).length,
    overdueCount,
    dueSoonCount,
    workload: Array.from(workloadMap.values()).sort((a, b) => b.total - a.total),
    recentActivity,
  }

  // ── Creativos (piezas PUBLICADO con presigned URLs) ───────────────────────
  const publicadasRaw = allPieces.filter(p => p.taskStatus === "PUBLICADO")
  const creativos = await Promise.all(
    publicadasRaw.map(async p => ({
      id: p.id,
      campaignName: p.campaignName,
      campaignId: p.campaignId,
      tipoPieza: p.tipoPieza,
      formato: p.formato,
      assigneeName: p.assignee?.name ?? null,
      adUrl: p.adUrl,
      signedUrl: p.archivoKey ? await getDownloadUrl(p.archivoKey).catch(() => null) : null,
      archivoKey: p.archivoKey,
    }))
  )

  // ── Meta insights (solo si conectado) ────────────────────────────────────
  let meta = null
  if (empresa.metaEnabled && empresa.metaAdAccountId && empresa.metaAccessToken) {
    try {
      const token = decrypt(empresa.metaAccessToken)
      const [accountInsights, campaignsInsights, audienceAge, audienceDevice, audienceCountry, audiencePlacement, dailyInsights] = await Promise.all([
        getAccountInsights(empresa.metaAdAccountId, token, dateRange),
        getCampaignsInsights(empresa.metaAdAccountId, token, dateRange),
        getAudienceBreakdown(empresa.metaAdAccountId, token, dateRange, "age,gender"),
        getAudienceBreakdown(empresa.metaAdAccountId, token, dateRange, "device_platform"),
        getAudienceBreakdown(empresa.metaAdAccountId, token, dateRange, "country"),
        getAudienceBreakdown(empresa.metaAdAccountId, token, dateRange, "publisher_platform,platform_position"),
        getDailyInsights(empresa.metaAdAccountId, token, dateRange),
      ])
      meta = {
        accountInsights,
        campaignsInsights,
        audienceAge,
        audienceDevice,
        audienceCountry: audienceCountry.sort((a, b) => parseFloat(b.spend || "0") - parseFloat(a.spend || "0")).slice(0, 10),
        audiencePlacement,
        dailyInsights,
        dateRange,
      }
    } catch (err) {
      logger.error("metrics/meta", err, { empresaId: id })
      meta = { error: "No se pudo conectar con Meta API. Verifica el token." }
    }
  }

  return NextResponse.json({
    empresa: { id: empresa.id, nombre: empresa.nombre, metaEnabled: empresa.metaEnabled },
    produccion,
    creativos,
    meta,
  })
}
