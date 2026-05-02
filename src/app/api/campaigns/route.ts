import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { generarPromptMaestro } from "@/features/campaigns/lib/prompt-generator"
import { logger } from "@/lib/logger"
import type { CampaignWizardState } from "@/features/campaigns/types"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (!session.user.workspaceId) {
    return NextResponse.json({ error: "Sin workspace" }, { status: 403 })
  }

  try {
    const wizardState: CampaignWizardState = await req.json()

    const promptMaestro = generarPromptMaestro(wizardState)

    const campaign = await db.campaign.create({
      data: {
        workspaceId: session.user.workspaceId,
        createdById: session.user.id,
        name: wizardState.nombreCampana || "Sin nombre",
        empresaId: wizardState.empresaId || null,
        tipo: wizardState.tipoCampana === "evergreen" ? "EVERGREEN" : "ESTACIONAL",
        eventoEstacional: wizardState.eventoEstacional === "__custom__"
          ? wizardState.eventoCustom
          : wizardState.eventoEstacional || null,
        status: "DRAFT",
        brief: {
          empresa: wizardState.empresa,
          contextoCampana: wizardState.contextoCampana,
          objetivoCampana: wizardState.objetivoCampana,
          publicoObjetivo: wizardState.publicoObjetivo,
          insightMensajeClave: wizardState.insightMensajeClave,
          propuestasValor: wizardState.propuestasValor,
          tonoYestilo: wizardState.tonoYestilo,
          llamadaAccion: wizardState.llamadaAccion,
          queNOhacer: wizardState.queNOhacer,
        },
        oferta: {
          tipoOferta: wizardState.tipoOferta,
          otraOferta: wizardState.otraOferta,
          contextoOferta: wizardState.contextoOferta,
          metodosPago: wizardState.ofertaMetodosPago,
          regalo: wizardState.ofertaRegalo,
          garantia: wizardState.ofertaGarantia,
          cambios: wizardState.ofertaCambios,
          envio: wizardState.ofertaEnvio,
        },
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
        presupuesto: {
          modo: wizardState.presupuestoModo,
          valor: wizardState.presupuestoValor,
          fechaInicio: wizardState.fechaInicio,
          fechaFin: wizardState.fechaFin,
          sinFechaFin: wizardState.sinFechaFin,
        },
        equipo: JSON.parse(JSON.stringify(wizardState.equipo)),
        promptMaestro,
        promptVersion: "v1.0",
      },
    })

    // Materializar AdSets y Pieces — batch paralelo
    let adSetOrden = 0
    const adSetJobs = (wizardState.campanas ?? []).flatMap((campana) =>
      (campana.conjuntos ?? []).map((conjunto) => ({ campana, conjunto, orden: adSetOrden++ }))
    )
    await Promise.all(
      adSetJobs.map(({ campana, conjunto, orden }) =>
        db.adSet.create({
          data: {
            campaignId: campaign.id,
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

    // Save selected conceptos — batch
    if (wizardState.conceptos?.length) {
      await db.concepto.createMany({
        data: wizardState.conceptos.map((c, i) => ({
          campaignId: campaign.id,
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

    return NextResponse.json({ id: campaign.id })
  } catch (err) {
    logger.error("POST /api/campaigns", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// Create empty draft
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const { name } = await req.json().catch(() => ({ name: "Sin nombre" }))
    const campaign = await db.campaign.create({
      data: {
        workspaceId: session.user.workspaceId,
        createdById: session.user.id,
        name: name || "Sin nombre",
        tipo: "EVERGREEN",
        status: "DRAFT",
      },
    })
    return NextResponse.json({ id: campaign.id })
  } catch (err) {
    logger.error("PUT /api/campaigns", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const campaigns = await db.campaign.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      tipo: true,
      eventoEstacional: true,
      status: true,
      createdAt: true,
      _count: { select: { adSets: true } },
    },
  })

  return NextResponse.json(campaigns)
}
