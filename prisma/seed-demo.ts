import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  // ── Workspace: Serrano Group / Tennispremium ────────────────────────────
  let workspace = await db.workspace.findUnique({ where: { slug: "serrano-group" } })

  if (!workspace) {
    workspace = await db.workspace.create({
      data: {
        name: "Serrano Group",
        slug: "serrano-group",
        plan: "trial",
      },
    })
    console.log("✓ Workspace creado:", workspace.name)
  } else {
    console.log("✓ Workspace ya existe:", workspace.name)
  }

  // ── OWNER: dueño del negocio ────────────────────────────────────────────
  const ownerEmail = "admin@serranogroup.com"
  const ownerExists = await db.user.findUnique({ where: { email: ownerEmail } })

  if (!ownerExists) {
    await db.user.create({
      data: {
        name: "Carlos Serrano",
        email: ownerEmail,
        password: await bcrypt.hash("serrano2025!", 12),
        role: "OWNER",
        workspaceId: workspace.id,
      },
    })
    console.log("✓ OWNER creado:", ownerEmail, "/ serrano2025!")
  } else {
    console.log("✓ OWNER ya existe:", ownerEmail)
  }

  // ── CREATIVO ────────────────────────────────────────────────────────────
  const creativoEmail = "creativo@serranogroup.com"
  const creativoExists = await db.user.findUnique({ where: { email: creativoEmail } })

  if (!creativoExists) {
    await db.user.create({
      data: {
        name: "Laura Gómez",
        email: creativoEmail,
        password: await bcrypt.hash("serrano2025!", 12),
        role: "CREATIVO",
        workspaceId: workspace.id,
      },
    })
    console.log("✓ CREATIVO creado:", creativoEmail, "/ serrano2025!")
  } else {
    console.log("✓ CREATIVO ya existe:", creativoEmail)
  }

  // ── TRAFFICKER ──────────────────────────────────────────────────────────
  const traffickerEmail = "trafficker@serranogroup.com"
  const traffickerExists = await db.user.findUnique({ where: { email: traffickerEmail } })

  if (!traffickerExists) {
    await db.user.create({
      data: {
        name: "Andrés Mora",
        email: traffickerEmail,
        password: await bcrypt.hash("serrano2025!", 12),
        role: "TRAFFICKER",
        workspaceId: workspace.id,
      },
    })
    console.log("✓ TRAFFICKER creado:", traffickerEmail, "/ serrano2025!")
  } else {
    console.log("✓ TRAFFICKER ya existe:", traffickerEmail)
  }

  console.log("\n─── Credenciales demo ───────────────────────────────")
  console.log("OWNER     →", ownerEmail, "/ serrano2025!")
  console.log("CREATIVO  →", creativoEmail, "/ serrano2025!")
  console.log("TRAFFICKER→", traffickerEmail, "/ serrano2025!")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
