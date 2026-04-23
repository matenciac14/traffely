import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { metaAdAccountId } = await req.json()
    await db.workspace.update({
      where: { id: session.user.workspaceId },
      data: { metaAdAccountId: metaAdAccountId ?? null },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.workspaceId || !["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const workspace = await db.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: { metaAdAccountId: true },
  })
  return NextResponse.json(workspace)
}
