"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart2Icon, SparklesIcon, ShoppingBagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  workspaceId: string
  metaEnabled: boolean
  globalAiEnabled: boolean
  shopifyEnabled: boolean
}

type FeatureAction = "meta" | "globalAi" | "shopify"

function FeatureToggle({
  label, description, icon: Icon, enabled, color, onToggle, loading,
}: {
  label: string
  description: string
  icon: React.ElementType
  enabled: boolean
  color: string
  onToggle: () => void
  loading: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", enabled ? color : "bg-muted")}>
          <Icon className={cn("w-4 h-4", enabled ? "text-white" : "text-muted-foreground")} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={loading}
        aria-label={`Toggle ${label}`}
        className={cn(
          "relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 cursor-pointer",
          enabled ? "bg-primary" : "bg-muted"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
          enabled ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  )
}

export default function WorkspaceFeatureFlags({ workspaceId, metaEnabled, globalAiEnabled, shopifyEnabled }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState<FeatureAction | null>(null)

  async function toggle(action: FeatureAction) {
    setToggling(action)
    await fetch(`/api/admin/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setToggling(null)
    router.refresh()
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Features habilitadas</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Activa o desactiva módulos para este workspace</p>
      </div>
      <div className="p-4 space-y-3">
        <FeatureToggle
          label="Meta Ads"
          description="Conectar cuenta publicitaria y ver métricas"
          icon={BarChart2Icon}
          enabled={metaEnabled}
          color="bg-blue-500"
          onToggle={() => toggle("meta")}
          loading={toggling === "meta"}
        />
        <FeatureToggle
          label="IA Global"
          description="Usa la API key de la plataforma (Anthropic)"
          icon={SparklesIcon}
          enabled={globalAiEnabled}
          color="bg-violet-500"
          onToggle={() => toggle("globalAi")}
          loading={toggling === "globalAi"}
        />
        <FeatureToggle
          label="Shopify"
          description="Importar productos del catálogo en el wizard"
          icon={ShoppingBagIcon}
          enabled={shopifyEnabled}
          color="bg-green-500"
          onToggle={() => toggle("shopify")}
          loading={toggling === "shopify"}
        />
      </div>
    </div>
  )
}
