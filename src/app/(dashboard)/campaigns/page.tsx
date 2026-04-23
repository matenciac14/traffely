import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PlusIcon, MegaphoneIcon } from "lucide-react"
import CampaignList from "./CampaignList"

export default async function CampaignsPage() {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  // Traemos todas — activas y archivadas
  const campaigns = await db.campaign.findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      tipo: true,
      eventoEstacional: true,
      status: true,
      isArchived: true,
      createdAt: true,
      presupuesto: true,
      adSets: {
        select: {
          pieces: { select: { taskStatus: true } },
        },
      },
      createdBy: { select: { name: true } },
    },
  })

  const role = session.user.role ?? "VIEWER"
  const active = campaigns.filter((c) => !c.isArchived)
  const archived = campaigns.filter((c) => c.isArchived)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campañas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} activa{active.length !== 1 ? "s" : ""}
            {archived.length > 0 ? ` · ${archived.length} archivada${archived.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        {["OWNER", "SUPER_ADMIN"].includes(role) && (
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva campaña
          </Link>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <MegaphoneIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Sin campañas todavía</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Crea tu primera campaña con el wizard de 7 pasos y genera el brief completo con IA.
          </p>
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Crear campaña
          </Link>
        </div>
      ) : (
        <CampaignList
          campaigns={campaigns}
          role={role}
          archivedCount={archived.length}
        />
      )}
    </div>
  )
}
