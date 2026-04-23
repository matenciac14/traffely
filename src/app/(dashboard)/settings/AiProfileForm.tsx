"use client"

import { useState } from "react"
import { SparklesIcon, SaveIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const FIELDS = [
  {
    key: "descripcionEmpresa",
    label: "Descripción de la empresa",
    placeholder: "Ej: Somos una marca colombiana de calzado deportivo enfocada en mujeres activas de 25-45 años. Vendemos en línea y en puntos físicos en Bogotá, Medellín y Cali.",
    hint: "Contexto base que Claude usa para entender tu negocio.",
    rows: 3,
  },
  {
    key: "publicoObjetivo",
    label: "Público objetivo detallado",
    placeholder: "Ej: Mujeres 25-45 años, NSE 3-5, en ciudades principales de Colombia. Apasionadas por el fitness, preocupadas por el estilo pero valoran la funcionalidad. Compran principalmente vía Instagram y WhatsApp.",
    hint: "Cuanto más específico, mejores los guiones y copys.",
    rows: 3,
  },
  {
    key: "tonoMarca",
    label: "Tono y voz de la marca",
    placeholder: "Ej: Cercano, empoderador, directo. Usamos tuteo. Evitamos el corporativismo. El tono es como el de una amiga que te recomienda con entusiasmo honesto.",
    hint: "Define cómo habla tu marca.",
    rows: 2,
  },
  {
    key: "propuestasValorFijas",
    label: "Propuestas de valor que siempre aplican",
    placeholder: "Ej: Envío gratis a todo Colombia en 24-48h, garantía de 30 días, cambio de talla sin costo, pago en cuotas sin interés con Nequi.",
    hint: "Claude las incluirá en todos los copys relevantes.",
    rows: 2,
  },
  {
    key: "palabrasProhibidas",
    label: "Palabras/frases que NUNCA usar",
    placeholder: "Ej: 'barato', 'liquidación', 'lo más económico', mencionar marcas competidoras.",
    hint: "Se suman a las restricciones legales ya configuradas.",
    rows: 2,
  },
  {
    key: "instruccionesExtra",
    label: "Instrucciones adicionales para Claude",
    placeholder: "Ej: Siempre terminar con un CTA que mencione WhatsApp. En videos, el precio debe aparecer en los primeros 5 segundos. Para Reels, usar música de tendencia.",
    hint: "Reglas específicas de tu marca que aplican a toda generación.",
    rows: 3,
  },
] as const

type ProfileKey = typeof FIELDS[number]["key"]

export default function AiProfileForm({
  initialProfile,
}: {
  initialProfile: Record<string, string> | null
}) {
  const [profile, setProfile] = useState<Record<string, string>>(
    initialProfile ?? {}
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/workspace/ai-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const hasContent = Object.values(profile).some((v) => v?.trim())

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Perfil de IA</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Claude usa este contexto al generar guiones y copys para tu workspace.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {saved
            ? <><CheckIcon className="w-4 h-4" /> Guardado</>
            : saving
            ? "Guardando…"
            : <><SaveIcon className="w-4 h-4" /> Guardar</>
          }
        </button>
      </div>

      <div className="p-5 space-y-5">
        {!hasContent && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary">
            <strong>Recomendado:</strong> completar el perfil de IA mejora significativamente la calidad de los guiones y copys generados.
          </div>
        )}

        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {field.label}
            </label>
            <textarea
              rows={field.rows}
              value={profile[field.key] ?? ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
