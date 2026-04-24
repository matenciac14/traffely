import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"

// GET /api/empresas/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const empresa = await db.empresa.findUnique({
    where: { id, workspaceId: session.user.workspaceId },
    include: {
      identidad: true,
      _count: { select: { campaigns: true } },
      campaigns: {
        where: { isArchived: false },
        select: { id: true, name: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(empresa)
}

// PATCH /api/empresas/[id] — editar datos generales
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const role = session.user.role ?? ""
  if (!["OWNER", "SUPER_ADMIN"].includes(role)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { nombre, industria, website, descripcion, logo } = body

  const empresa = await db.empresa.findUnique({ where: { id, workspaceId: session.user.workspaceId } })
  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await db.empresa.update({
    where: { id },
    data: {
      nombre: nombre?.trim() || empresa.nombre,
      industria: industria !== undefined ? (industria?.trim() || null) : empresa.industria,
      website: website !== undefined ? (website?.trim() || null) : empresa.website,
      descripcion: descripcion !== undefined ? (descripcion?.trim() || null) : empresa.descripcion,
      logo: logo !== undefined ? (logo?.trim() || null) : empresa.logo,
    },
    include: { identidad: true },
  })

  return NextResponse.json(updated)
}

// DELETE /api/empresas/[id] — soft delete
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const role = session.user.role ?? ""
  if (!["OWNER", "SUPER_ADMIN"].includes(role)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params
  const empresa = await db.empresa.findUnique({ where: { id, workspaceId: session.user.workspaceId } })
  if (!empresa) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.empresa.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
