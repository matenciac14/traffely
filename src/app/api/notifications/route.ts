import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"

// GET — listar notificaciones no leídas
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return NextResponse.json(notifications)
}

// PATCH — marcar todas como leídas
export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
