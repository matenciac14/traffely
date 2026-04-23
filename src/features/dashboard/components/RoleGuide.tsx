"use client"

import { useState, useEffect } from "react"
import { XIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const GUIDE_KEY = "role_guide_dismissed_v1"

type Step = { step: string; desc: string }

const GUIDES: Record<string, { title: string; subtitle: string; steps: Step[] }> = {
  OWNER: {
    title: "Cómo funciona Traffely",
    subtitle: "Guía rápida para el administrador del workspace",
    steps: [
      { step: "1. Crea una campaña", desc: "Ve a Campañas → Nueva campaña. El wizard de 7 pasos captura el brief, oferta, modelos, estructura, presupuesto y equipo. Al finalizar genera el prompt maestro con IA." },
      { step: "2. Genera el brief con IA", desc: "Dentro del detalle de campaña, usa 'Generar con IA' para que Claude redacte el brief completo basado en tu prompt maestro y el perfil de marca configurado en Ajustes." },
      { step: "3. Avanza el estado", desc: "Cada campaña pasa por: Borrador → En revisión → Aprobada → En vivo → Finalizada. Usa los botones en el detalle de campaña para avanzar o retroceder." },
      { step: "4. Gestiona las piezas en el Board", desc: "El board Kanban muestra todas las piezas de la campaña. Asigna cada pieza a un creativo. Los creativos avanzan desde Pendiente hasta Aprobado." },
      { step: "5. El trafficker publica", desc: "Cuando una pieza está Aprobada, el Trafficker la marca como Publicada y registra el link del anuncio en Meta." },
      { step: "6. Configura tu equipo", desc: "En Ajustes → Equipo puedes invitar colaboradores con rol Creativo, Trafficker o Viewer. En Ajustes → Perfil IA ajusta el tono y restricciones de la marca." },
    ],
  },
  CREATIVO: {
    title: "Tu flujo como Creativo",
    subtitle: "Solo ves las piezas que te han asignado",
    steps: [
      { step: "1. Revisa tu board", desc: "En el Board verás únicamente las piezas asignadas a ti. Cada columna representa el estado de producción." },
      { step: "2. Avanza el estado", desc: "Cuando empieces a trabajar, mueve la pieza a 'En producción'. Al terminar, pásala a 'En revisión' para que el OWNER la apruebe." },
      { step: "3. Genera copy con IA", desc: "Abre el drawer de cualquier pieza y usa el botón 'Generar con IA' para que Claude cree un guión y copy adaptado al formato y modelo." },
      { step: "4. Comenta y colabora", desc: "Puedes dejar comentarios en cada pieza para reportar avances, pedir feedback o aclarar instrucciones." },
      { step: "5. Si te rechazan", desc: "Una pieza rechazada vuelve a 'En producción'. Revisa los comentarios del owner para saber qué corregir." },
    ],
  },
  TRAFFICKER: {
    title: "Tu flujo como Trafficker",
    subtitle: "Gestionas la pauta una vez las piezas están aprobadas",
    steps: [
      { step: "1. Filtra por Aprobado", desc: "En el Board usa el filtro de estado para ver solo las piezas en estado 'Aprobado' — esas están listas para publicar." },
      { step: "2. Publica el anuncio", desc: "Sube el creativo a Meta Ads según la campaña y el ad set correspondiente. Usa los detalles de la pieza (modelo, formato, copy) como referencia." },
      { step: "3. Registra el link", desc: "Abre el drawer de la pieza, pega el link del anuncio en Meta y marca la pieza como 'Publicado'. Esto notifica al equipo." },
      { step: "4. Comenta si hay problemas", desc: "Si Meta rechaza un creativo o hay un issue de pauta, deja un comentario en la pieza para que el equipo lo vea." },
    ],
  },
  VIEWER: {
    title: "Acceso de lectura",
    subtitle: "Puedes ver campañas y el board sin modificar nada",
    steps: [
      { step: "Campañas", desc: "En Campañas puedes ver el listado completo, el detalle de cada campaña y el brief generado." },
      { step: "Board", desc: "En el Board ves todas las piezas y su estado actual. Puedes dejar comentarios en cada pieza." },
    ],
  },
}

export default function RoleGuide({ role }: { role: string }) {
  const [dismissed, setDismissed] = useState(true) // inicia true para evitar flash
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const val = localStorage.getItem(GUIDE_KEY)
    if (!val) setDismissed(false)
  }, [])

  const guide = GUIDES[role]
  if (!guide || dismissed) return null

  function dismiss() {
    localStorage.setItem(GUIDE_KEY, "1")
    setDismissed(true)
  }

  return (
    <div className="mx-6 mt-4 rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{guide.title}</p>
            <p className="text-xs text-muted-foreground">{guide.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors"
          >
            {collapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground transition-colors"
            title="No mostrar de nuevo"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-primary/10 pt-3">
          {guide.steps.map((s) => (
            <div key={s.step} className="flex gap-2.5">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">{s.step}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
