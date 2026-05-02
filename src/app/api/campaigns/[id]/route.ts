import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { generarPromptMaestro } from "@/features/campaigns/lib/prompt-generator"
import { logger } from "@/lib/logger"
import type { CampaignWizardState } from "@/features/campaigns/types"

const VALID_STATUSES = ["DRAFT", "REVIEW", "APPROVED", "LIVE", "FINISHED"] as const
type CampaignStatus = typeof VALID_STATUSES[number]

// Status transitions: who can move to what
const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT:    ["REVIEW"],
  REVIEW:   ["DRAFT", "APPROVED"],
  APPROVED: ["REVIEW", "LIVE"],
  LIVE:     ["APPROVED", "FINISHED"],
  FINISHED: ["LIVE"],
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const campaign = await db.campaign.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    include: {
      empresa: { select: { id: true, nombre: true } },
      adSets: {
        orderBy: { orden: "asc" },
        include: {
          pieces: {
            select: { id: true, taskStatus: true, estado: true, modelo: true, tipoPieza: true, assignee: { select: { id: true, name: true } } },
          },
        },
      },
      conceptos: {
        orderBy: { orden: "asc" },
        select: { nombre: true, hipotesis: true, anguloMensajeria: true, frameworkCopy: true, direccionVisual: true, isSelected: true, orden: true },
      },
      auditLogs: {
        orderBy: { createdAt: "asc" },
        take: 50,
        select: { action: true, diff: true, createdAt: true, user: { select: { name: true } } },
      },
      createdBy: { select: { id: true, name: true } },
    },
  })
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(campaign)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const campaign = await db.campaign.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    select: { id: true },
  })
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const { action, wizardState } = body as { action?: string; wizardState?: CampaignWizardState }

    if (action === "autosave" && wizardState) {
      await db.campaign.update({
        where: { id },
        data: {
          name: wizardState.nombreCampana || "Sin nombre",
          empresaId: wizardState.empresaId || null,
          tipo: wizardState.tipoCampana === "evergreen" ? "EVERGREEN" : "ESTACIONAL",
          eventoEstacional: wizardState.eventoEstacional === "__custom__"
            ? wizardState.eventoCustom
            : wizardState.eventoEstacional || null,
          currentStep: Math.min(wizardState.currentStep, 7),
          brief: JSON.parse(JSON.stringify({
            empresa: wizardState.empresa,
            contextoCampana: wizardState.contextoCampana,
            objetivoCampana: wizardState.objetivoCampana,
            publicoObjetivo: wizardState.publicoObjetivo,
            insightMensajeClave: wizardState.insightMensajeClave,
            propuestasValor: wizardState.propuestasValor,
            tonoYestilo: wizardState.tonoYestilo,
            llamadaAccion: wizardState.llamadaAccion,
            queNOhacer: wizardState.queNOhacer,
          })),
          oferta: wizardState.tipoOferta ? JSON.parse(JSON.stringify({
            tipoOferta: wizardState.tipoOferta,
            otraOferta: wizardState.otraOferta,
            contextoOferta: wizardState.contextoOferta,
            metodosPago: wizardState.ofertaMetodosPago,
            regalo: wizardState.ofertaRegalo,
            garantia: wizardState.ofertaGarantia,
            cambios: wizardState.ofertaCambios,
            envio: wizardState.ofertaEnvio,
          })) : undefined,
          productos: wizardState.productosSeleccionados.length ? JSON.parse(JSON.stringify({
            seleccionados: wizardState.productosSeleccionados,
            custom: wizardState.productosCustom,
            precios: wizardState.preciosProductos,
            descripcion: wizardState.productosDescripcion,
          })) : undefined,
          estructura: wizardState.objetivo ? JSON.parse(JSON.stringify({
            objetivo: wizardState.objetivo,
            tipoPresupuesto: wizardState.tipoPresupuesto,
            campanas: wizardState.campanas,
          })) : undefined,
          presupuesto: wizardState.presupuestoValor ? JSON.parse(JSON.stringify({
            modo: wizardState.presupuestoModo,
            valor: wizardState.presupuestoValor,
            fechaInicio: wizardState.fechaInicio,
            fechaFin: wizardState.fechaFin,
            sinFechaFin: wizardState.sinFechaFin,
          })) : undefined,
          equipo: wizardState.equipo.length ? JSON.parse(JSON.stringify(wizardState.equipo)) : undefined,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "complete" && wizardState) {
      const promptMaestro = generarPromptMaestro(wizardState)

      await db.campaign.update({
        where: { id },
        data: {
          name: wizardState.nombreCampana || "Sin nombre",
          empresaId: wizardState.empresaId || null,
          tipo: wizardState.tipoCampana === "evergreen" ? "EVERGREEN" : "ESTACIONAL",
          eventoEstacional: wizardState.eventoEstacional === "__custom__"
            ? wizardState.eventoCustom
            : wizardState.eventoEstacional || null,
          currentStep: 5,
          promptMaestro,
          promptVersion: "v1.0",
          brief: JSON.parse(JSON.stringify({
            empresa: wizardState.empresa,
            contextoCampana: wizardState.contextoCampana,
            objetivoCampana: wizardState.objetivoCampana,
            publicoObjetivo: wizardState.publicoObjetivo,
            insightMensajeClave: wizardState.insightMensajeClave,
            propuestasValor: wizardState.propuestasValor,
            tonoYestilo: wizardState.tonoYestilo,
            llamadaAccion: wizardState.llamadaAccion,
            queNOhacer: wizardState.queNOhacer,
          })),
          oferta: JSON.parse(JSON.stringify({
            tipoOferta: wizardState.tipoOferta,
            otraOferta: wizardState.otraOferta,
            contextoOferta: wizardState.contextoOferta,
            metodosPago: wizardState.ofertaMetodosPago,
            regalo: wizardState.ofertaRegalo,
            garantia: wizardState.ofertaGarantia,
            cambios: wizardState.ofertaCambios,
            envio: wizardState.ofertaEnvio,
          })),
          productos: JSON.parse(JSON.stringify({
            seleccionados: wizardState.productosSeleccionados,
            custom: wizardState.productosCustom,
            precios: wizardState.preciosProductos,
            descripcion: wizardState.productosDescripcion,
          })),
          estructura: JSON.parse(JSON.stringify({
            objetivo: wizardState.objetivo,
            tipoPresupuesto: wizardState.tipoPresupuesto,
            campanas: wizardState.campanas,
          })),
          presupuesto: JSON.parse(JSON.stringify({
            modo: wizardState.presupuestoModo,
            valor: wizardState.presupuestoValor,
            fechaInicio: wizardState.fechaInicio,
            fechaFin: wizardState.fechaFin,
            sinFechaFin: wizardState.sinFechaFin,
          })),
          equipo: JSON.parse(JSON.stringify(wizardState.equipo)),
        },
      })

      // Guardar conceptos creativos seleccionados — batch
      if (wizardState.conceptos?.length) {
        const existingConceptos = await db.concepto.count({ where: { campaignId: id } })
        if (existingConceptos === 0) {
          await db.concepto.createMany({
            data: wizardState.conceptos.map((c, i) => ({
              campaignId: id,
              nombre: c.nombre,
              hipotesis: c.hipotesis || null,
              anguloMensajeria: c.anguloMensajeria || null,
              frameworkCopy: c.frameworkCopy || null,
              direccionVisual: c.direccionVisual || null,
              isSelected: c.isSelected,
              orden: i,
            })),
          })
        }
      }

      // Materializar AdSets y Pieces — batch paralelo
      const existingAdSets = await db.adSet.count({ where: { campaignId: id } })
      if (existingAdSets === 0) {
        let adSetOrden = 0
        const adSetJobs = (wizardState.campanas ?? []).flatMap((campana) =>
          (campana.conjuntos ?? []).map((conjunto) => ({ campana, conjunto, orden: adSetOrden++ }))
        )
        await Promise.all(
          adSetJobs.map(({ campana, conjunto, orden }) =>
            db.adSet.create({
              data: {
                campaignId: id,
                nombre: `${campana.nombre} · ${conjunto.nombre}`,
                publico: conjunto.publico || null,
                porcentajePresupuesto: conjunto.porcentaje || null,
                orden,
                pieces: {
                  createMany: {
                    data: (conjunto.piezas ?? []).map((pieza, pieceOrden) => ({
                      estado: pieza.estado === "reserva" ? "RESERVA" : "ACTIVA",
                      taskStatus: "PENDIENTE",
                      modelo: pieza.producto || null,
                      tipoPieza: pieza.tipoPieza || null,
                      trafico: pieza.trafico || null,
                      angulo: pieza.angulo || null,
                      conciencia: pieza.conciencia || null,
                      motivo: pieza.motivo || null,
                      narrativa: pieza.narrativa || null,
                      estructuraCopy: pieza.estructuraCopy || null,
                      formato: pieza.formato || null,
                      duracion: pieza.duracion || null,
                      orden: pieceOrden,
                    })),
                  },
                },
              },
            })
          )
        )
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "status") {
      const { status: newStatus } = body as { status: CampaignStatus }
      if (!VALID_STATUSES.includes(newStatus)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
      }
      const current = await db.campaign.findUnique({
        where: { id, workspaceId: session.user.workspaceId },
        select: { status: true },
      })
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })
      const allowed = STATUS_TRANSITIONS[current.status as CampaignStatus]
      if (!allowed.includes(newStatus)) {
        return NextResponse.json({ error: `No se puede pasar de ${current.status} a ${newStatus}` }, { status: 400 })
      }
      await db.$transaction([
        db.campaign.update({ where: { id }, data: { status: newStatus } }),
        db.auditLog.create({
          data: {
            userId: session.user.id!,
            campaignId: id,
            action: "campaign.status",
            diff: { from: current.status, to: newStatus } as object,
          },
        }),
      ])
      return NextResponse.json({ ok: true, status: newStatus })
    }

    if (action === "apply-work-plan") {
      const { workPlan } = body as { workPlan: Array<{ pieceId: string; priority: string; dueDate?: string }> }
      if (!Array.isArray(workPlan) || workPlan.length === 0) {
        return NextResponse.json({ error: "workPlan inválido" }, { status: 400 })
      }
      const pieceIds = workPlan.map((p) => p.pieceId)
      const validPieces = await db.piece.findMany({
        where: { id: { in: pieceIds }, adSet: { campaignId: id } },
        select: { id: true },
      })
      const validIds = new Set(validPieces.map((p) => p.id))
      await db.$transaction(
        workPlan
          .filter((p) => validIds.has(p.pieceId))
          .map((p) =>
            db.piece.update({
              where: { id: p.pieceId },
              data: {
                priority: p.priority ?? undefined,
                dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
              },
            })
          )
      )
      return NextResponse.json({ ok: true, updated: validPieces.length })
    }

    if (action === "archive") {
      const current = await db.campaign.findUnique({
        where: { id, workspaceId: session.user.workspaceId },
        select: { isArchived: true },
      })
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })
      await db.$transaction([
        db.campaign.update({ where: { id }, data: { isArchived: !current.isArchived } }),
        db.auditLog.create({
          data: {
            userId: session.user.id!,
            campaignId: id,
            action: current.isArchived ? "campaign.unarchive" : "campaign.archive",
            diff: {} as object,
          },
        }),
      ])
      return NextResponse.json({ ok: true, isArchived: !current.isArchived })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (err) {
    logger.error("PATCH /api/campaigns/[id]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const { action } = await req.json()

  if (action === "duplicate") {
    const source = await db.campaign.findUnique({
      where: { id, workspaceId: session.user.workspaceId },
    })
    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const copy = await db.campaign.create({
      data: {
        workspaceId: source.workspaceId,
        createdById: session.user.id!,
        empresaId: source.empresaId ?? null,
        name: `${source.name} (copia)`,
        tipo: source.tipo,
        eventoEstacional: source.eventoEstacional,
        status: "DRAFT",
        brief: source.brief ?? undefined,
        oferta: source.oferta ?? undefined,
        productos: source.productos ?? undefined,
        estructura: source.estructura ?? undefined,
        presupuesto: source.presupuesto ?? undefined,
        equipo: source.equipo ?? undefined,
        promptMaestro: source.promptMaestro,
        promptVersion: source.promptVersion,
      },
    })
    return NextResponse.json({ id: copy.id })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  const campaign = await db.campaign.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    select: { id: true },
  })
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    await db.campaign.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("DELETE /api/campaigns/[id]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
