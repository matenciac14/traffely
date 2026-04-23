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
      adSets: {
        orderBy: { orden: "asc" },
        include: {
          pieces: {
            select: { id: true, taskStatus: true, estado: true, modelo: true, tipoPieza: true, assignee: { select: { id: true, name: true } } },
          },
        },
      },
      auditLogs: {
        orderBy: { createdAt: "asc" },
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
          tipo: wizardState.tipoCampana === "evergreen" ? "EVERGREEN" : "ESTACIONAL",
          eventoEstacional: wizardState.eventoEstacional === "__custom__"
            ? wizardState.eventoCustom
            : wizardState.eventoEstacional || null,
          currentStep: wizardState.currentStep,
          brief: wizardState.contextoCampana ? JSON.parse(JSON.stringify({
            contextoCampana: wizardState.contextoCampana,
            objetivoCampana: wizardState.objetivoCampana,
            publicoObjetivo: wizardState.publicoObjetivo,
            insightMensajeClave: wizardState.insightMensajeClave,
            propuestasValor: wizardState.propuestasValor,
            tonoYestilo: wizardState.tonoYestilo,
            llamadaAccion: wizardState.llamadaAccion,
            queNOhacer: wizardState.queNOhacer,
          })) : undefined,
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
          modelos: wizardState.modelosSeleccionados.length ? JSON.parse(JSON.stringify({
            seleccionados: wizardState.modelosSeleccionados,
            custom: wizardState.modelosCustom,
            precios: wizardState.preciosModelos,
            descripcion: wizardState.modelosDescripcion,
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
          tipo: wizardState.tipoCampana === "evergreen" ? "EVERGREEN" : "ESTACIONAL",
          eventoEstacional: wizardState.eventoEstacional === "__custom__"
            ? wizardState.eventoCustom
            : wizardState.eventoEstacional || null,
          currentStep: 7,
          promptMaestro,
          promptVersion: "v1.0",
          brief: JSON.parse(JSON.stringify({
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
          modelos: JSON.parse(JSON.stringify({
            seleccionados: wizardState.modelosSeleccionados,
            custom: wizardState.modelosCustom,
            precios: wizardState.preciosModelos,
            descripcion: wizardState.modelosDescripcion,
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

      // Materializar AdSets y Pieces (borrar los anteriores si existen)
      const existingAdSets = await db.adSet.findMany({ where: { campaignId: id }, select: { id: true } })
      if (existingAdSets.length === 0) {
        let adSetOrden = 0
        for (const campana of wizardState.campanas ?? []) {
          for (const conjunto of campana.conjuntos ?? []) {
            const adSet = await db.adSet.create({
              data: {
                campaignId: id,
                nombre: `${campana.nombre} · ${conjunto.nombre}`,
                publico: conjunto.publico || null,
                porcentajePresupuesto: conjunto.porcentaje || null,
                orden: adSetOrden++,
              },
            })
            let pieceOrden = 0
            for (const pieza of conjunto.piezas ?? []) {
              await db.piece.create({
                data: {
                  adSetId: adSet.id,
                  estado: pieza.estado === "reserva" ? "RESERVA" : "ACTIVA",
                  taskStatus: "PENDIENTE",
                  modelo: pieza.modelo || null,
                  tipoPieza: pieza.tipoPieza || null,
                  trafico: pieza.trafico || null,
                  angulo: pieza.angulo || null,
                  conciencia: pieza.conciencia || null,
                  motivo: pieza.motivo || null,
                  narrativa: pieza.narrativa || null,
                  estructuraCopy: pieza.estructuraCopy || null,
                  formato: pieza.formato || null,
                  duracion: pieza.duracion || null,
                  orden: pieceOrden++,
                },
              })
            }
          }
        }
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
      await db.campaign.update({ where: { id }, data: { status: newStatus } })
      await db.auditLog.create({
        data: {
          userId: session.user.id!,
          campaignId: id,
          action: "campaign.status",
          diff: { from: current.status, to: newStatus } as object,
        },
      })
      return NextResponse.json({ ok: true, status: newStatus })
    }

    if (action === "archive") {
      const current = await db.campaign.findUnique({
        where: { id, workspaceId: session.user.workspaceId },
        select: { isArchived: true },
      })
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })
      await db.campaign.update({ where: { id }, data: { isArchived: !current.isArchived } })
      await db.auditLog.create({
        data: {
          userId: session.user.id!,
          campaignId: id,
          action: current.isArchived ? "campaign.unarchive" : "campaign.archive",
          diff: {} as object,
        },
      })
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
        name: `${source.name} (copia)`,
        tipo: source.tipo,
        eventoEstacional: source.eventoEstacional,
        status: "DRAFT",
        brief: source.brief ?? undefined,
        oferta: source.oferta ?? undefined,
        modelos: source.modelos ?? undefined,
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
