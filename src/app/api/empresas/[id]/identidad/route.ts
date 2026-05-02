import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"

// GET /api/empresas/[id]/identidad
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const empresa = await db.empresa.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    include: { identidad: true },
  })
  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(empresa.identidad)
}

// PATCH /api/empresas/[id]/identidad — upsert identidad de marca
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const role = session.user.role ?? ""
  if (!["OWNER", "SUPER_ADMIN"].includes(role)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params
  const empresa = await db.empresa.findUnique({ where: { id, workspaceId: session.user.workspaceId } })
  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const {
    tono, publicoObjetivo, propuestasValor, palabrasProhibidas, instruccionesExtra, colores, tipografias,
    contextoNegocio, reglasLegales, eventosKey,
    industria, modeloNegocio, ticketPromedio, cicloVenta, temporadasClave, equipoCreativo, metaPrincipal,
  } = body

  const trim = (v: string | undefined) => (v !== undefined ? (v?.trim() || null) : undefined)

  const identidad = await db.empresaIdentidad.upsert({
    where: { empresaId: id },
    create: {
      empresaId: id,
      tono: tono?.trim() || null,
      publicoObjetivo: publicoObjetivo?.trim() || null,
      propuestasValor: propuestasValor?.trim() || null,
      palabrasProhibidas: palabrasProhibidas?.trim() || null,
      instruccionesExtra: instruccionesExtra?.trim() || null,
      colores: colores?.trim() || null,
      tipografias: tipografias?.trim() || null,
      contextoNegocio: contextoNegocio?.trim() || null,
      reglasLegales: reglasLegales?.trim() || null,
      eventosKey: eventosKey?.trim() || null,
      industria: industria?.trim() || null,
      modeloNegocio: modeloNegocio?.trim() || null,
      ticketPromedio: ticketPromedio?.trim() || null,
      cicloVenta: cicloVenta?.trim() || null,
      temporadasClave: temporadasClave?.trim() || null,
      equipoCreativo: equipoCreativo?.trim() || null,
      metaPrincipal: metaPrincipal?.trim() || null,
    },
    update: {
      tono: trim(tono),
      publicoObjetivo: trim(publicoObjetivo),
      propuestasValor: trim(propuestasValor),
      palabrasProhibidas: trim(palabrasProhibidas),
      instruccionesExtra: trim(instruccionesExtra),
      colores: trim(colores),
      tipografias: trim(tipografias),
      contextoNegocio: trim(contextoNegocio),
      reglasLegales: trim(reglasLegales),
      eventosKey: trim(eventosKey),
      industria: trim(industria),
      modeloNegocio: trim(modeloNegocio),
      ticketPromedio: trim(ticketPromedio),
      cicloVenta: trim(cicloVenta),
      temporadasClave: trim(temporadasClave),
      equipoCreativo: trim(equipoCreativo),
      metaPrincipal: trim(metaPrincipal),
    },
  })

  return NextResponse.json(identidad)
}
