import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, country, city, plan, setupFee, monthlyFee, notes, ownerName, ownerEmail, ownerPassword } = body

    if (!name || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const existingEmail = await db.user.findUnique({ where: { email: ownerEmail } })
    if (existingEmail) {
      return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 })
    }

    // Generate unique slug
    let slug = slugify(name)
    const slugExists = await db.workspace.findUnique({ where: { slug } })
    if (slugExists) slug = `${slug}-${Date.now()}`

    const workspace = await db.workspace.create({
      data: {
        name,
        slug,
        country: country || null,
        city: city || null,
        plan: plan || "trial",
        setupFee: Number(setupFee) || 0,
        monthlyFee: Number(monthlyFee) || 0,
        notes: notes || null,
      },
    })

    const hashed = await bcrypt.hash(ownerPassword, 12)
    await db.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        password: hashed,
        role: "OWNER",
        workspaceId: workspace.id,
      },
    })

    return NextResponse.json({ id: workspace.id })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ADMIN/WORKSPACES POST]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
