"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckIcon, RotateCcwIcon, XIcon } from "lucide-react"
import { useCampaignWizard } from "@/features/campaigns/store/campaign-wizard"
import { useWizardDraft } from "@/features/campaigns/hooks/useWizardDraft"
import Step1Identificacion from "@/features/campaigns/components/wizard/steps/Step1Identificacion"
import Step2Brief from "@/features/campaigns/components/wizard/steps/Step2Brief"
import Step3Oferta from "@/features/campaigns/components/wizard/steps/Step3Oferta"
import Step4Modelos from "@/features/campaigns/components/wizard/steps/Step4Modelos"
import Step5Estructura from "@/features/campaigns/components/wizard/steps/Step5Estructura"
import Step6Presupuesto from "@/features/campaigns/components/wizard/steps/Step6Presupuesto"
import Step7Equipo from "@/features/campaigns/components/wizard/steps/Step7Equipo"
import StepPromptOutput from "@/features/campaigns/components/wizard/StepPromptOutput"
import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "Identificación", component: Step1Identificacion },
  { n: 2, label: "Brief", component: Step2Brief },
  { n: 3, label: "Oferta", component: Step3Oferta },
  { n: 4, label: "Catálogo", component: Step4Modelos },
  { n: 5, label: "Estructura", component: Step5Estructura },
  { n: 6, label: "Presupuesto", component: Step6Presupuesto },
  { n: 7, label: "Equipo", component: Step7Equipo },
]

function WizardContent() {
  const searchParams = useSearchParams()
  const resumeId = searchParams.get("resume")

  const {
    currentStep, goNext, goBack,
    _avisoReservaMostrado, setField, reset,
  } = useCampaignWizard()

  const { draftRestored, draftId, clearDraft, dismissRestoredBanner } = useWizardDraft(resumeId)

  const [error, setError] = useState<string | null>(null)
  const [isWarning, setIsWarning] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  function handleNext() {
    if (isWarning && !_avisoReservaMostrado) {
      setField("_avisoReservaMostrado", true)
    }
    const result = goNext()
    if (!result.ok) {
      setError(result.error)
      setIsWarning(result.isWarning ?? false)
      if (currentStep === 5) {
        document.getElementById("step5-try-next")?.click()
      }
    } else {
      setError(null)
      setIsWarning(false)
      if (currentStep === 7) setShowPrompt(true)
    }
  }

  function handleBack() {
    setError(null)
    setIsWarning(false)
    goBack()
  }

  function handleDiscardDraft() {
    clearDraft()
    reset()
    dismissRestoredBanner()
  }

  if (showPrompt) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            <StepPromptOutput draftId={draftId} onComplete={clearDraft} />
          </div>
        </div>
      </div>
    )
  }

  const CurrentStep = STEPS[currentStep - 1]?.component ?? Step1Identificacion

  return (
    <div className="flex flex-col h-full">

      {/* ── Draft restored banner ───────────────────────────────── */}
      {draftRestored && (
        <div className="border-b border-amber-200 bg-amber-50 px-8 py-2.5 flex items-center gap-3 flex-shrink-0">
          <RotateCcwIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 flex-1">
            <strong>Borrador restaurado.</strong> Continuaste donde lo dejaste.
          </p>
          <button
            onClick={handleDiscardDraft}
            className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2 font-medium"
          >
            Descartar y empezar nuevo
          </button>
          <button onClick={dismissRestoredBanner} className="text-amber-600 hover:text-amber-800 ml-1">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Stepper horizontal ─────────────────────────────────── */}
      <div className="border-b border-border bg-card px-8 py-4 flex-shrink-0">
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done = step.n < currentStep
            const active = step.n === currentStep

            return (
              <div key={step.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}>
                    {done ? <CheckIcon className="w-3.5 h-3.5" /> : step.n}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block transition-colors",
                    active && "text-foreground",
                    done && "text-muted-foreground",
                    !done && !active && "text-muted-foreground/50"
                  )}>
                    {step.label}
                  </span>
                </div>

                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-px mx-3 transition-colors",
                    done ? "bg-primary/40" : "bg-border"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Step content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <CurrentStep />
        </div>
      </div>

      {/* ── Footer nav ─────────────────────────────────────────── */}
      <div className="border-t border-border bg-card px-8 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          {error && (
            <p className={cn("text-sm truncate", isWarning ? "text-amber-600" : "text-destructive")}>
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
            {currentStep === 7
              ? "Generar prompt"
              : isWarning && !_avisoReservaMostrado
                ? "Continuar de todas formas"
                : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Cargando…</div>}>
      <WizardContent />
    </Suspense>
  )
}
