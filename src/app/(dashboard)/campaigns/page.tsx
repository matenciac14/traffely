import Link from "next/link"
import { PlusIcon } from "lucide-react"

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Campañas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gestiona y crea campañas Meta Ads</p>
          </div>
          <Link
            href="/campaigns/new"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva campaña
          </Link>
        </div>
      </div>

      {/* Empty state */}
      <div className="max-w-6xl mx-auto px-8 py-20 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">Todavía no hay campañas</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Crea tu primera campaña usando el wizard de 7 pasos.
        </p>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          Crear primera campaña
        </Link>
      </div>
    </div>
  )
}
