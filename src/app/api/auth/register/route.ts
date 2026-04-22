import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener mínimo 8 caracteres" }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "OWNER",
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[REGISTER]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
