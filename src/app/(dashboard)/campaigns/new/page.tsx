"use client"

import { useState } from "react"
import { useCampaignWizard } from "@/features/campaigns/store/campaign-wizard"
import WizardLayout from "@/features/campaigns/components/wizard/WizardLayout"
import Step1Identificacion from "@/features/campaigns/components/wizard/steps/Step1Identificacion"
import Step2Brief from "@/features/campaigns/components/wizard/steps/Step2Brief"
import Step3Oferta from "@/features/campaigns/components/wizard/steps/Step3Oferta"
import Step4Modelos from "@/features/campaigns/components/wizard/steps/Step4Modelos"
import Step5Estructura from "@/features/campaigns/components/wizard/steps/Step5Estructura"
import Step6Presupuesto from "@/features/campaigns/components/wizard/steps/Step6Presupuesto"
import Step7Equipo from "@/features/campaigns/components/wizard/steps/Step7Equipo"
import StepPromptOutput from "@/features/campaigns/components/wizard/StepPromptOutput"

const STEPS = [
  Step1Identificacion,
  Step2Brief,
  Step3Oferta,
  Step4Modelos,
  Step5Estructura,
  Step6Presupuesto,
  Step7Equipo,
]

export default function NewCampaignPage() {
  const { currentStep } = useCampaignWizard()
  const [showPrompt, setShowPrompt] = useState(false)

  const CurrentStep = STEPS[currentStep - 1] ?? Step1Identificacion

  if (showPrompt) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <StepPromptOutput />
        </div>
      </div>
    )
  }

  return (
    <WizardLayout onFinish={() => setShowPrompt(true)}>
      <CurrentStep />
    </WizardLayout>
  )
}
