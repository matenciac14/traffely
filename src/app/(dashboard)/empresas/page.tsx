import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { PlusIcon, BuildingIcon, MegaphoneIcon, GlobeIcon, CheckCircleIcon } from "lucide-react"

const INDUSTRIAS: Record<string, string> = {
  ecommerce: "E-commerce",
  moda: "Moda",
  belleza: "Belleza",
  tecnologia: "Tecnología",
  restaurantes: "Restaurantes",
  salud: "Salud",
  educacion: "Educación",
  inmobiliaria: "Inmobiliaria",
  servicios: "Servicios",
  otro: "Otro",
}

export default async function EmpresasPage() {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  const empresas = await db.empresa.findMany({
    where: { workspaceId: session.user.workspaceId, isActive: true },
    include: {
      identidad: true,
      _count: { select: { campaigns: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const canManage = ["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {empresas.length === 0
              ? "Aún no tienes empresas. Crea una para empezar."
              : `${empresas.length} empresa${empresas.length === 1 ? "" : "s"} registrada${empresas.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {canManage && (
          <Link
            href="/empresas/nueva"
            className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva empresa
          </Link>
        )}
      </div>

      {/* Empty state */}
      {empresas.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center">
          <BuildingIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Sin empresas</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Crea tu primera empresa para organizar las campañas por cliente o marca.
          </p>
          {canManage && (
            <Link
              href="/empresas/nueva"
              className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-4 h-4" />
              Crear empresa
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {empresas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas.map((emp) => {
            const identidadCompleta = !!(
              emp.identidad?.tono &&
              emp.identidad?.publicoObjetivo &&
              emp.identidad?.propuestasValor
            )
            return (
              <Link
                key={emp.id}
                href={`/empresas/${emp.id}`}
                className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                {/* Logo / inicial */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {emp.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={emp.logo} alt={emp.nombre} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {identidadCompleta && (
                    <div title="Identidad completa">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {emp.nombre}
                </h3>

                {emp.industria && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {INDUSTRIAS[emp.industria] ?? emp.industria}
                  </p>
                )}

                {emp.descripcion && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{emp.descripcion}</p>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MegaphoneIcon className="w-3.5 h-3.5" />
                    {emp._count.campaigns} campaña{emp._count.campaigns !== 1 ? "s" : ""}
                  </div>
                  {emp.website && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                      <GlobeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{emp.website.replace(/^https?:\/\//, "")}</span>
                    </div>
                  )}
                </div>

                {/* Identidad progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Identidad IA</span>
                    <span className="text-[10px] text-muted-foreground">
                      {[
                        emp.identidad?.tono,
                        emp.identidad?.publicoObjetivo,
                        emp.identidad?.propuestasValor,
                        emp.identidad?.palabrasProhibidas,
                        emp.identidad?.instruccionesExtra,
                      ].filter(Boolean).length}/5 campos
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${([
                          emp.identidad?.tono,
                          emp.identidad?.publicoObjetivo,
                          emp.identidad?.propuestasValor,
                          emp.identidad?.palabrasProhibidas,
                          emp.identidad?.instruccionesExtra,
                        ].filter(Boolean).length / 5) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
