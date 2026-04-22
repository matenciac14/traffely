import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const email = "miguel@traffely.com"
  const existing = await db.user.findUnique({ where: { email } })

  if (existing) {
    console.log("✓ SUPER_ADMIN ya existe")
    return
  }

  const password = await bcrypt.hash("traffely2025!", 12)

  await db.user.create({
    data: {
      name: "Miguel Atencia",
      email,
      password,
      role: "SUPER_ADMIN",
    },
  })

  console.log("✓ SUPER_ADMIN creado:", email)
  console.log("  Password: traffely2025!")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
