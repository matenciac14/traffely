import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { getUploadUrl, buildKey } from "@/lib/s3/client"

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
  "application/pdf",
]

const MAX_SIZE_MB = 200

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const workspaceId = session.user.workspaceId

  const piece = await db.piece.findFirst({
    where: { id, adSet: { campaign: { workspaceId } } },
    select: {
      id: true,
      adSet: { select: { campaign: { select: { id: true } } } },
    },
  })
  if (!piece) return NextResponse.json({ error: "Pieza no encontrada" }, { status: 404 })

  const body = await req.json()
  const { filename, contentType, sizeBytes } = body

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename y contentType requeridos" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
  }

  if (sizeBytes && sizeBytes > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Archivo demasiado grande (máx ${MAX_SIZE_MB}MB)` }, { status: 400 })
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin"
  const safeFilename = `${Date.now()}.${ext}`
  const key = buildKey(workspaceId, piece.adSet.campaign.id, piece.id, safeFilename)

  const uploadUrl = await getUploadUrl(key, contentType)

  const bucket = process.env.AWS_S3_BUCKET!
  const region = process.env.AWS_REGION!
  const archivoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  return NextResponse.json({ uploadUrl, key, archivoUrl })
}
