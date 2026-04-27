import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

// ─── Contraseñas demo ──────────────────────────────────────────────────────
const PASSWORDS = {
  miguel:   "traffely2025!",
  serrano:  "serrano2025!",
  wca:      "withcoffee2025!",
}

// ─── IDs fijos de workspaces demo ─────────────────────────────────────────
const SERRANO_WS_ID = "cmoaka4nq0000tw6g9d4onwup"
const WCA_WS_ID     = "cmoc4vfre0000ev8mabekhajl"

async function upsertUser(data: {
  email: string
  name: string
  password: string
  role: "SUPER_ADMIN" | "OWNER" | "CREATIVO" | "TRAFFICKER" | "VIEWER"
  workspaceId?: string
}) {
  const hashed = await bcrypt.hash(data.password, 12)
  const existing = await db.user.findUnique({ where: { email: data.email } })

  if (existing) {
    await db.user.update({
      where: { email: data.email },
      data: { password: hashed, name: data.name, role: data.role },
    })
    console.log(`  ↺ actualizado: ${data.email} (${data.name})`)
  } else {
    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        workspaceId: data.workspaceId ?? null,
      },
    })
    console.log(`  + creado: ${data.email} (${data.name})`)
  }
}

async function upsertEmpresa(data: {
  workspaceId: string
  nombre: string
  industria: string
  descripcion: string
  website?: string
  identidad: {
    tono: string
    publicoObjetivo: string
    propuestasValor: string
    palabrasProhibidas: string
    instruccionesExtra: string
  }
}) {
  const existing = await db.empresa.findFirst({
    where: { workspaceId: data.workspaceId, nombre: data.nombre },
  })

  if (existing) {
    await db.empresa.update({
      where: { id: existing.id },
      data: {
        industria: data.industria,
        descripcion: data.descripcion,
        website: data.website ?? null,
        isActive: true,
        identidad: {
          upsert: {
            create: data.identidad,
            update: data.identidad,
          },
        },
      },
    })
    console.log(`  ↺ empresa actualizada: ${data.nombre}`)
  } else {
    await db.empresa.create({
      data: {
        workspaceId: data.workspaceId,
        nombre: data.nombre,
        industria: data.industria,
        descripcion: data.descripcion,
        website: data.website ?? null,
        isActive: true,
        identidad: { create: data.identidad },
      },
    })
    console.log(`  + empresa creada: ${data.nombre}`)
  }
}

async function main() {
  console.log("🌱 Seeding usuarios y empresas demo…\n")

  // ── Usuarios ───────────────────────────────────────────────────────────────

  await upsertUser({
    email: "miguel@traffely.com",
    name: "Miguel Atencia",
    password: PASSWORDS.miguel,
    role: "SUPER_ADMIN",
  })

  await upsertUser({
    email: "admin@serranogroup.com",
    name: "Juan Serrano",
    password: PASSWORDS.serrano,
    role: "OWNER",
    workspaceId: SERRANO_WS_ID,
  })
  await upsertUser({
    email: "creativo@serranogroup.com",
    name: "Laura Gómez",
    password: PASSWORDS.serrano,
    role: "CREATIVO",
    workspaceId: SERRANO_WS_ID,
  })
  await upsertUser({
    email: "trafficker@serranogroup.com",
    name: "Andrés Mora",
    password: PASSWORDS.serrano,
    role: "TRAFFICKER",
    workspaceId: SERRANO_WS_ID,
  })

  await upsertUser({
    email: "admin@withcoffeeai.com",
    name: "WithCoffeeAI Admin",
    password: PASSWORDS.wca,
    role: "OWNER",
    workspaceId: WCA_WS_ID,
  })

  // ── Empresa: Serrano Group Calzado ─────────────────────────────────────────
  // La identidad de calzado que antes estaba hardcodeada en SYSTEM_PROMPT
  // ahora vive aquí como EmpresaIdentidad en DB.

  console.log("")
  await upsertEmpresa({
    workspaceId: SERRANO_WS_ID,
    nombre: "Serrano Group",
    industria: "moda",
    descripcion: "Marca colombiana de calzado premium para hombre y mujer. Distribución nacional con enfoque en ecommerce.",
    website: "tennispremium.com",
    identidad: {
      tono: "Cercano, aspiracional y directo. Lenguaje colombiano natural — cálido pero no forzado. Evitar corporativismo. Registros que funcionan: coloquial cálido (30-50 años), emotivo directo, cómplice/amiga para mujeres.",
      publicoObjetivo: "Hombres y mujeres colombianos de 25 a 55 años con capacidad de compra media-alta. Valoran la calidad sobre el precio, compran por WhatsApp e Instagram. Ocasiones clave: temporadas escolares, día de la madre/padre, Navidad, primas legales (junio y diciembre).",
      propuestasValor: "Calidad garantizada en cada par. Materiales premium y construcción duradera. Entregas en 24-72h en ciudades principales. Cambios sin complicaciones. Variedad de tallas y modelos. Precio justo por la calidad.",
      palabrasProhibidas: "original, originales, triple A, AAA, importado, importados, réplica, imitación, copia, fake. Tampoco mencionar marcas competidoras ni inventar cifras o reviews.",
      instruccionesExtra: "Siempre matizar tiempos de entrega (24-72h en ciudades principales, no prometer tiempos absolutos nacionales). Para la Primatón (junio y diciembre): conectar con liquidez extra, darse el gusto merecido, aprovechar la prima. Un anuncio = una idea. Mostrar el producto como protagonista en piezas de ventas. Especificidad vende más que generalidades.",
    },
  })

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completado\n")
  console.log("┌─────────────────────────────────────────────────────────┐")
  console.log("│  USUARIOS DEMO                                          │")
  console.log("├──────────────────────────────────┬──────────────────────┤")
  console.log("│  Email                           │  Password            │")
  console.log("├──────────────────────────────────┼──────────────────────┤")
  console.log(`│  miguel@traffely.com             │  ${PASSWORDS.miguel.padEnd(20)} │`)
  console.log(`│  admin@serranogroup.com          │  ${PASSWORDS.serrano.padEnd(20)} │`)
  console.log(`│  creativo@serranogroup.com       │  ${PASSWORDS.serrano.padEnd(20)} │`)
  console.log(`│  trafficker@serranogroup.com     │  ${PASSWORDS.serrano.padEnd(20)} │`)
  console.log(`│  admin@withcoffeeai.com          │  ${PASSWORDS.wca.padEnd(20)} │`)
  console.log("└──────────────────────────────────┴──────────────────────┘")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
