import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/ratelimit"

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  workspaceName: z.string().min(2).max(100).trim(),
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50)
}

async function uniqueSlug(base: string): Promise<string> {
  const existing = await db.workspace.findUnique({ where: { slug: base } })
  if (!existing) return base
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 registros por IP cada 24h
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon"
  const rl = await rateLimit(`register:${ip}`, 5)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo mañana." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { name, email, password, workspaceName } = parsed.data

  try {
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      )
    }

    const [hashed, slug] = await Promise.all([
      bcrypt.hash(password, 10),
      uniqueSlug(slugify(workspaceName)),
    ])

    // Workspace + OWNER creados en una sola transacción
    const { user } = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          plan: "trial",
          isActive: true,
        },
      })

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: "OWNER",
          workspaceId: workspace.id,
          isActive: true,
        },
        select: { id: true, name: true, email: true, role: true },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "workspace.register",
          diff: { workspaceId: workspace.id, workspaceName, plan: "trial" },
        },
      })

      return { workspace, user }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    logger.error("auth/register POST", err)
    return NextResponse.json({ error: "Error interno al crear la cuenta" }, { status: 500 })
  }
}
