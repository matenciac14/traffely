import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { z } from "zod"

const aiProfileSchema = z.object({
  descripcionEmpresa: z.string().max(2000).optional(),
  publicoObjetivo: z.string().max(2000).optional(),
  tonoMarca: z.string().max(1000).optional(),
  propuestasValorFijas: z.string().max(2000).optional(),
  palabrasProhibidas: z.string().max(1000).optional(),
  instruccionesExtra: z.string().max(2000).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const workspace = await db.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: { aiProfile: true, name: true },
  })

  return NextResponse.json(workspace)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const result = aiProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Datos inválidos", details: result.error.flatten() }, { status: 400 })
    }
    await db.workspace.update({
      where: { id: session.user.workspaceId },
      data: { aiProfile: result.data },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
