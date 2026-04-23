import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getDownloadUrl } from "@/lib/s3/client"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const piece = await db.piece.findFirst({
    where: { id, adSet: { campaign: { workspaceId: session.user.workspaceId } } },
    select: {
      id: true,
      modelo: true, tipoPieza: true, formato: true, duracion: true,
      angulo: true, trafico: true, conciencia: true, motivo: true, narrativa: true,
      estructuraCopy: true, estado: true, taskStatus: true,
      guionGenerado: true, copyGenerado: true, aiGeneratedAt: true,
      archivoUrl: true, archivoKey: true,
      priority: true, dueDate: true, adUrl: true,
      createdAt: true, updatedAt: true,
      adSet: { select: { nombre: true, campaign: { select: { id: true, name: true } } } },
      assignee: { select: { id: true, name: true } },
      comments: {
        select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!piece) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Generate presigned URL for private S3 files
  let archivoSignedUrl: string | null = null
  if (piece.archivoKey) {
    try {
      archivoSignedUrl = await getDownloadUrl(piece.archivoKey)
    } catch { /* ignore */ }
  }

  return NextResponse.json({ ...piece, archivoSignedUrl })
}

const TASK_STATUSES = ["PENDIENTE", "EN_PRODUCCION", "EN_REVISION", "APROBADO", "PUBLICADO", "RECHAZADO"] as const

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  // Verify piece belongs to workspace
  const piece = await db.piece.findFirst({
    where: { id, adSet: { campaign: { workspaceId: session.user.workspaceId } } },
    select: { id: true, taskStatus: true, assigneeId: true },
  })
  if (!piece) return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.taskStatus !== undefined) {
    if (!TASK_STATUSES.includes(body.taskStatus)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }
    data.taskStatus = body.taskStatus
  }

  if (body.adUrl !== undefined) {
    data.adUrl = body.adUrl ? String(body.adUrl).slice(0, 2048) : null
  }

  if (body.priority !== undefined) {
    const validPriorities = ["BAJA", "MEDIA", "ALTA", "URGENTE"]
    if (body.priority !== null && !validPriorities.includes(body.priority)) {
      return NextResponse.json({ error: "Prioridad inválida" }, { status: 400 })
    }
    data.priority = body.priority
  }

  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  }

  if (body.archivoUrl !== undefined && body.archivoKey !== undefined) {
    const expectedPrefix = `workspaces/${session.user.workspaceId}/`
    if (body.archivoKey && !String(body.archivoKey).startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Key inválida" }, { status: 400 })
    }
    data.archivoUrl = body.archivoUrl ?? null
    data.archivoKey = body.archivoKey ?? null
  }

  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null) {
      data.assigneeId = null
    } else {
      // Verify assignee belongs to same workspace
      const assignee = await db.user.findFirst({
        where: { id: body.assigneeId, workspaceId: session.user.workspaceId },
        select: { id: true },
      })
      if (!assignee) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 })
      data.assigneeId = body.assigneeId
    }
  }

  const updated = await db.piece.update({
    where: { id },
    data,
    select: { id: true, taskStatus: true, assigneeId: true, assignee: { select: { id: true, name: true } } },
  })

  // Notificar al assignee si cambia el estado
  if (data.taskStatus && piece.assigneeId && piece.assigneeId !== session.user.id) {
    const statusLabels: Record<string, string> = {
      EN_PRODUCCION: "En producción",
      EN_REVISION: "En revisión",
      APROBADO: "Aprobado",
      PUBLICADO: "Publicado",
      RECHAZADO: "Rechazado",
      PENDIENTE: "Pendiente",
    }
    await db.notification.create({
      data: {
        userId: piece.assigneeId,
        workspaceId: session.user.workspaceId!,
        type: "piece_status_changed",
        title: "Estado de pieza actualizado",
        body: `Tu pieza pasó a "${statusLabels[data.taskStatus as string] ?? data.taskStatus}"`,
        pieceId: piece.id,
      },
    })
  }

  return NextResponse.json(updated)
}
