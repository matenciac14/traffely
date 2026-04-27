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
  const { tono, publicoObjetivo, propuestasValor, palabrasProhibidas, instruccionesExtra, colores, tipografias } = body

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
    },
    update: {
      tono: tono !== undefined ? (tono?.trim() || null) : undefined,
      publicoObjetivo: publicoObjetivo !== undefined ? (publicoObjetivo?.trim() || null) : undefined,
      propuestasValor: propuestasValor !== undefined ? (propuestasValor?.trim() || null) : undefined,
      palabrasProhibidas: palabrasProhibidas !== undefined ? (palabrasProhibidas?.trim() || null) : undefined,
      instruccionesExtra: instruccionesExtra !== undefined ? (instruccionesExtra?.trim() || null) : undefined,
      colores: colores !== undefined ? (colores?.trim() || null) : undefined,
      tipografias: tipografias !== undefined ? (tipografias?.trim() || null) : undefined,
    },
  })

  return NextResponse.json(identidad)
}
