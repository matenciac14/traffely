import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"

// GET /api/empresas — listar empresas del workspace
export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const empresas = await db.empresa.findMany({
    where: { workspaceId: session.user.workspaceId, isActive: true },
    include: {
      identidad: true,
      _count: { select: { campaigns: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(empresas)
}

// POST /api/empresas — crear empresa + identidad vacía
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const role = session.user.role ?? ""
  if (!["OWNER", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const body = await req.json()
  const { nombre, industria, website, descripcion, logo } = body

  if (!nombre?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })

  const empresa = await db.empresa.create({
    data: {
      workspaceId: session.user.workspaceId,
      nombre: nombre.trim(),
      industria: industria?.trim() || null,
      website: website?.trim() || null,
      descripcion: descripcion?.trim() || null,
      logo: logo?.trim() || null,
      identidad: { create: {} }, // crea identidad vacía automáticamente
    },
    include: { identidad: true },
  })

  return NextResponse.json(empresa, { status: 201 })
}
