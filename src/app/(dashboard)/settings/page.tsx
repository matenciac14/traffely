import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import AiProfileForm from "./AiProfileForm"
import AiKeyForm from "./AiKeyForm"
import BillingSection from "./BillingSection"
import TeamSection from "./TeamSection"
import MetaAccountForm from "./MetaAccountForm"
import ShopifySettings from "./ShopifySettings"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Suspense } from "react"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  const { tab = "workspace" } = await searchParams

  const workspace = await db.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: {
      name: true, slug: true, plan: true, aiProfile: true,
      metaAdAccountId: true, metaEnabled: true,
      monthlyFee: true, setupFee: true, billingStatus: true,
      billingPlan: true, billingCycle: true, nextBillingDate: true,
    },
  })

  const isOwner = ["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")

  const tabs = [
    { key: "workspace", label: "Workspace" },
    { key: "equipo",    label: "Equipo" },
    { key: "ia",        label: "Perfil IA" },
    ...(isOwner ? [{ key: "api-keys", label: "API Keys" }] : []),
    ...(isOwner ? [{ key: "billing",  label: "Facturación" }] : []),
    ...(workspace?.metaEnabled ? [{ key: "meta", label: "Meta Ads" }] : []),
    ...(isOwner ? [{ key: "shopify", label: "Shopify" }] : []),
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{workspace?.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/settings?tab=${t.key}`}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab: Workspace */}
      {tab === "workspace" && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Información del workspace</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</p>
              <p className="mt-0.5 text-foreground">{workspace?.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slug</p>
              <p className="mt-0.5 text-foreground font-mono">{workspace?.slug}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</p>
              <p className="mt-0.5 text-foreground capitalize">{workspace?.plan}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tu rol</p>
              <p className="mt-0.5 text-foreground">{session.user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Equipo */}
      {tab === "equipo" && <TeamSection />}

      {/* Tab: Perfil IA */}
      {tab === "ia" && (
        isOwner
          ? <AiProfileForm initialProfile={workspace?.aiProfile as Record<string, string> | null} />
          : <div className="bg-muted/40 rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
              Solo el propietario del workspace puede configurar el perfil de IA.
            </div>
      )}

      {/* Tab: API Keys */}
      {tab === "api-keys" && (
        isOwner
          ? <AiKeyForm />
          : <div className="bg-muted/40 rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
              Solo el propietario puede configurar las API keys.
            </div>
      )}

      {/* Tab: Facturación */}
      {tab === "billing" && (
        isOwner
          ? <BillingSection
              plan={workspace?.plan ?? "trial"}
              billingStatus={workspace?.billingStatus ?? "pending"}
              monthlyFee={workspace?.monthlyFee ?? 0}
              setupFee={workspace?.setupFee ?? 0}
              billingPlan={workspace?.billingPlan ?? null}
              billingCycle={workspace?.billingCycle ?? null}
              nextBillingDate={workspace?.nextBillingDate ?? null}
            />
          : <div className="bg-muted/40 rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
              Solo el propietario puede ver la facturación.
            </div>
      )}

      {/* Tab: Meta Ads */}
      {tab === "meta" && (
        isOwner
          ? <MetaAccountForm initialAccountId={workspace?.metaAdAccountId ?? null} />
          : <div className="bg-muted/40 rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
              Solo el propietario puede configurar la integración con Meta.
            </div>
      )}

      {/* Tab: Shopify */}
      {tab === "shopify" && (
        isOwner
          ? <Suspense fallback={<div className="text-sm text-muted-foreground p-5 animate-pulse">Cargando…</div>}>
              <ShopifySettings />
            </Suspense>
          : <div className="bg-muted/40 rounded-2xl border border-border p-5 text-center text-sm text-muted-foreground">
              Solo el propietario puede configurar integraciones.
            </div>
      )}
    </div>
  )
}
