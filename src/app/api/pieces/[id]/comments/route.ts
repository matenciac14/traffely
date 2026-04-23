import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"

async function verifyAccess(pieceId: string, workspaceId: string) {
  return db.piece.findFirst({
    where: { id: pieceId, adSet: { campaign: { workspaceId } } },
    select: { id: true },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  if (!await verifyAccess(id, session.user.workspaceId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const comments = await db.comment.findMany({
    where: { pieceId: id },
    select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(comments)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  if (!await verifyAccess(id, session.user.workspaceId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Contenido requerido" }, { status: 400 })

  const comment = await db.comment.create({
    data: { pieceId: id, userId: session.user.id, content: content.trim() },
    select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
