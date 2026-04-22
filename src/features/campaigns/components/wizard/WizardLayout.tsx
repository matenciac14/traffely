"use client"

import { type ReactNode, useState } from "react"
import { useCampaignWizard } from "../../store/campaign-wizard"
import WizardProgress from "./WizardProgress"

const PASOS = [
  { n: 1, label: "Identificación" },
  { n: 2, label: "Brief" },
  { n: 3, label: "Oferta" },
  { n: 4, label: "Catálogo" },
  { n: 5, label: "Estructura" },
  { n: 6, label: "Presupuesto" },
  { n: 7, label: "Equipo" },
]

interface Props {
  children: ReactNode
  onFinish?: () => void
}

export default function WizardLayout({ children, onFinish }: Props) {
  const {
    currentStep,
    empresa,
    nombreCampana,
    _avisoReservaMostrado,
    goNext,
    goBack,
    setField,
  } = useCampaignWizard()

  const [error, setError] = useState<string | null>(null)
  const [isWarning, setIsWarning] = useState(false)

  function handleNext() {
    // Second click after warning → set flag and try again
    if (isWarning && !_avisoReservaMostrado) {
      setField("_avisoReservaMostrado", true)
    }

    const result = goNext()
    if (!result.ok) {
      setError(result.error)
      setIsWarning(result.isWarning ?? false)
    } else {
      setError(null)
      setIsWarning(false)
      if (currentStep === 7 && onFinish) {
        // goNext already advanced to step 8 — call onFinish
        onFinish()
      }
    }
  }

  function handleBack() {
    setError(null)
    setIsWarning(false)
    goBack()
  }

  const nextLabel = currentStep === 7 ? "Generar prompt" : isWarning ? "Continuar" : "Siguiente →"

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40 mb-2">
            Traffely
          </p>
          <p className="text-sm font-semibold text-sidebar-foreground leading-tight truncate">
            {empresa || "Nueva campaña"}
          </p>
          {nombreCampana && (
            <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">{nombreCampana}</p>
          )}
        </div>

        <WizardProgress steps={PASOS} current={currentStep} />

        <div className="mt-auto px-5 pb-5">
          <div className="text-[11px] text-sidebar-foreground/30 text-center">
            {Math.min(currentStep, 7)} / 7
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border bg-card flex items-center px-8 flex-shrink-0">
          <span className="text-sm font-medium text-foreground">
            {PASOS[Math.min(currentStep, 7) - 1]?.label}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-10">{children}</div>
        </main>

        <footer className="h-16 border-t border-border bg-card flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            {error && (
              <p className={`text-sm truncate ${isWarning ? "text-amber-600" : "text-destructive"}`}>
                {error}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="h-9 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Atrás
              </button>
            )}
            <button
              onClick={handleNext}
              className="h-9 px-5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              {nextLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
