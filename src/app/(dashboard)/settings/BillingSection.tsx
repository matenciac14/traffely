import { CreditCardIcon, CalendarIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const BILLING_STATUS_STYLE: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  paid:    { label: "Al día",    icon: CheckCircleIcon,  color: "text-emerald-600" },
  pending: { label: "Pendiente", icon: ClockIcon,        color: "text-amber-600" },
  overdue: { label: "Vencido",   icon: AlertCircleIcon,  color: "text-red-600" },
}

interface Props {
  plan: string
  billingStatus: string
  monthlyFee: number
  setupFee: number
  billingPlan: string | null
  billingCycle: string | null
  nextBillingDate: Date | null
}

export default function BillingSection({
  plan, billingStatus, monthlyFee, setupFee, billingPlan, billingCycle, nextBillingDate,
}: Props) {
  const st = BILLING_STATUS_STYLE[billingStatus] ?? BILLING_STATUS_STYLE.pending
  const StatusIcon = st.icon

  return (
    <div className="space-y-4">

      {/* Plan actual */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Plan actual</p>
            <p className="text-lg font-bold text-foreground capitalize">{billingPlan ?? plan}</p>
            {billingCycle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Facturación {billingCycle === "annual" ? "anual" : "mensual"}
              </p>
            )}
          </div>
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", st.color)}>
            <StatusIcon className="w-4 h-4" />
            {st.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mensualidad</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {monthlyFee > 0 ? `$${monthlyFee.toLocaleString("es-CO")}` : "—"}
              {monthlyFee > 0 && <span className="text-sm font-normal text-muted-foreground"> /mes</span>}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Setup fee</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {setupFee > 0 ? `$${setupFee.toLocaleString("es-CO")}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Próximo cobro */}
      {nextBillingDate && (
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Próximo cobro</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {new Date(nextBillingDate).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      )}

      {/* CTA contacto */}
      <div className="bg-muted/40 rounded-xl border border-border p-4 text-sm text-muted-foreground">
        <p>
          Para cambios en tu plan, facturación o forma de pago, contacta al equipo de Traffely.
          En una versión próxima podrás gestionar tu suscripción desde aquí directamente (Stripe self-serve).
        </p>
      </div>

    </div>
  )
}
