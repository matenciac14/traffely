import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  n: number
  label: string
  icon?: string
}

interface Props {
  steps: Step[]
  current: number
}

export default function WizardProgress({ steps, current }: Props) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {steps.map((step) => {
        const done = step.n < current
        const active = step.n === current

        return (
          <div
            key={step.n}
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
              active && "bg-sidebar-accent text-sidebar-foreground",
              done && "text-sidebar-foreground/60",
              !active && !done && "text-sidebar-foreground/30"
            )}
          >
            {/* Step indicator */}
            <span
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary text-primary-foreground",
                !active && !done && "bg-sidebar-foreground/10 text-sidebar-foreground/30"
              )}
            >
              {done ? <CheckIcon className="w-3 h-3" /> : step.n}
            </span>
            <span className={cn("text-[13px] font-medium", active && "text-sidebar-foreground")}>
              {step.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
