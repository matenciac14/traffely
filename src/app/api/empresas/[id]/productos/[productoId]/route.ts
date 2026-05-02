import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; productoId: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id: empresaId, productoId } = await params

  const producto = await db.producto.findFirst({
    where: { id: productoId, empresaId, empresa: { workspaceId: session.user.workspaceId } },
  })
  if (!producto) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const { nombre, sku, descripcion, precioActual, precioAntes, isActive } = await req.json()
    const updated = await db.producto.update({
      where: { id: productoId },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(sku !== undefined && { sku: sku?.trim() || null }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
        ...(precioActual !== undefined && { precioActual: precioActual ? parseFloat(precioActual) : null }),
        ...(precioAntes !== undefined && { precioAntes: precioAntes ? parseFloat(precioAntes) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    logger.error("PATCH /api/empresas/[id]/productos/[productoId]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; productoId: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id: empresaId, productoId } = await params

  const producto = await db.producto.findFirst({
    where: { id: productoId, empresaId, empresa: { workspaceId: session.user.workspaceId } },
  })
  if (!producto) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    await db.producto.update({ where: { id: productoId }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("DELETE /api/empresas/[id]/productos/[productoId]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
