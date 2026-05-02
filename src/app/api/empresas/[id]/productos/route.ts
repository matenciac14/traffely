import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id: empresaId } = await params

  const empresa = await db.empresa.findUnique({
    where: { id: empresaId, workspaceId: session.user.workspaceId },
    select: { id: true },
  })
  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const productos = await db.producto.findMany({
    where: { empresaId, isActive: true },
    orderBy: { nombre: "asc" },
  })
  return NextResponse.json({ productos })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id: empresaId } = await params

  const empresa = await db.empresa.findUnique({
    where: { id: empresaId, workspaceId: session.user.workspaceId },
    select: { id: true },
  })
  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { nombre, sku, descripcion, precioActual, precioAntes } = await req.json()
    if (!nombre?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })

    const producto = await db.producto.create({
      data: {
        empresaId,
        nombre: nombre.trim(),
        sku: sku?.trim() || null,
        descripcion: descripcion?.trim() || null,
        precioActual: precioActual ? parseFloat(precioActual) : null,
        precioAntes: precioAntes ? parseFloat(precioAntes) : null,
      },
    })
    return NextResponse.json(producto, { status: 201 })
  } catch (err) {
    logger.error("POST /api/empresas/[id]/productos", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
