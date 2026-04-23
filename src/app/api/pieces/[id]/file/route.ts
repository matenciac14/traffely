import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { deleteFile } from "@/lib/s3/client"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const allowedRoles = ["OWNER", "SUPER_ADMIN"]
  if (!allowedRoles.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params

  const piece = await db.piece.findFirst({
    where: { id, adSet: { campaign: { workspaceId: session.user.workspaceId } } },
    select: { id: true, archivoKey: true },
  })
  if (!piece) return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 })
  if (!piece.archivoKey) return NextResponse.json({ error: "Sin archivo" }, { status: 400 })

  await deleteFile(piece.archivoKey)
  await db.piece.update({
    where: { id },
    data: { archivoUrl: null, archivoKey: null },
  })

  return NextResponse.json({ ok: true })
}
