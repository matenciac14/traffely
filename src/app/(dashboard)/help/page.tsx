import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MegaphoneIcon, KanbanIcon, SparklesIcon, UsersIcon,
  ArrowRightIcon, CheckCircleIcon, SettingsIcon, LinkIcon,
  ClipboardListIcon, MessageSquareIcon, AlertCircleIcon,
} from "lucide-react"

// ─── Tipos ─────────────────────────────────────────────────────────────────

type Section = {
  icon: React.ElementType
  title: string
  color: string
  steps: { label: string; desc: string }[]
}

// ─── Contenido por rol ─────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  CREATIVO: "Creativo",
  TRAFFICKER: "Trafficker",
  VIEWER: "Viewer",
  SUPER_ADMIN: "Super Admin",
}

const ROLE_DESC: Record<string, string> = {
  OWNER: "Tienes acceso completo: campañas, equipo, configuración de IA y visualización del board.",
  CREATIVO: "Ves y gestionas las piezas que te han asignado. Tu trabajo mueve el contenido de Pendiente a Aprobado.",
  TRAFFICKER: "Recibes las piezas ya aprobadas y te encargas de publicarlas en Meta Ads.",
  VIEWER: "Tienes acceso de lectura a campañas y board. Puedes comentar en las piezas.",
  SUPER_ADMIN: "Gestionas todos los workspaces de Traffely desde el panel de administración.",
}

const CAMPAIGN_STATUSES = [
  { status: "Borrador", desc: "La campaña fue creada pero aún no está lista para revisión.", color: "bg-muted text-muted-foreground" },
  { status: "En revisión", desc: "El equipo creativo está trabajando. El owner revisa el avance.", color: "bg-amber-100 text-amber-700" },
  { status: "Aprobada", desc: "Campaña aprobada. Las piezas pasan a producción activa.", color: "bg-blue-100 text-blue-700" },
  { status: "En vivo", desc: "Anuncios publicados en Meta. El trafficker gestiona la pauta.", color: "bg-emerald-100 text-emerald-700" },
  { status: "Finalizada", desc: "Campaña concluida. Todo queda en modo lectura para análisis.", color: "bg-purple-100 text-purple-700" },
]

const PIECE_STATUSES = [
  { status: "Pendiente", desc: "Pieza recién creada, sin asignar o sin empezar.", color: "bg-muted text-muted-foreground" },
  { status: "En producción", desc: "El creativo está trabajando activamente en ella.", color: "bg-blue-100 text-blue-700" },
  { status: "En revisión", desc: "El creativo terminó y está esperando aprobación.", color: "bg-amber-100 text-amber-700" },
  { status: "Aprobado", desc: "Listo para que el trafficker lo publique en Meta.", color: "bg-emerald-100 text-emerald-700" },
  { status: "Publicado", desc: "El anuncio está activo en Meta Ads.", color: "bg-purple-100 text-purple-700" },
  { status: "Rechazado", desc: "Requiere correcciones. El creativo debe volver a producción.", color: "bg-red-100 text-red-700" },
]

const OWNER_SECTIONS: Section[] = [
  {
    icon: MegaphoneIcon,
    title: "Campañas",
    color: "text-primary",
    steps: [
      { label: "Crear campaña", desc: "Haz clic en 'Nueva campaña'. El wizard de 7 pasos captura brief, oferta, modelos creativos, estructura de ad sets, presupuesto, equipo y objetivos." },
      { label: "Generar brief con IA", desc: "Al terminar el wizard se genera un prompt maestro. Desde el detalle de campaña usa 'Generar con IA' para que Claude redacte el brief completo usando el perfil de marca de tu workspace." },
      { label: "Avanzar el estado", desc: "Usa los botones en el detalle de campaña: Borrador → En revisión → Aprobada → En vivo → Finalizada. También puedes retroceder si algo no está listo." },
      { label: "Archivar o duplicar", desc: "Desde el menú de tres puntos en la lista de campañas puedes archivar campañas terminadas o duplicar una campaña como nuevo borrador." },
    ],
  },
  {
    icon: KanbanIcon,
    title: "Board de piezas",
    color: "text-blue-600",
    steps: [
      { label: "Qué es el board", desc: "Vista Kanban con todas las piezas de tus campañas activas. Cada columna representa un estado del proceso creativo." },
      { label: "Asignar piezas", desc: "Solo los OWNER pueden asignar piezas a un miembro del equipo. Abre el drawer de la pieza y selecciona el asignado desde el dropdown." },
      { label: "Filtros disponibles", desc: "Filtra por campaña, miembro del equipo y estado. Útil para ver qué tiene cada creativo o qué piezas están bloqueadas." },
      { label: "Aprobar o rechazar", desc: "Cuando una pieza está 'En revisión' puedes aprobarla o rechazarla desde el drawer. Si la rechazas, el creativo la verá de vuelta en producción." },
    ],
  },
  {
    icon: SparklesIcon,
    title: "IA por pieza",
    color: "text-violet-600",
    steps: [
      { label: "Generar guión y copy", desc: "Abre el drawer de cualquier pieza y haz clic en 'Generar con IA'. Claude crea un guión y copy adaptado al formato (Reel, Story, Carrusel, etc.) y al modelo creativo." },
      { label: "Contexto automático", desc: "La IA usa el brief de la campaña, el perfil de marca configurado en Ajustes → Perfil IA, el tipo de pieza, el modelo y el ad set para personalizar la generación." },
      { label: "Límite de uso", desc: "Cada workspace tiene un límite de 10 generaciones de IA cada 24 horas (compartido entre brief y piezas). Puedes ver el consumo en el panel admin." },
    ],
  },
  {
    icon: UsersIcon,
    title: "Equipo y configuración",
    color: "text-emerald-600",
    steps: [
      { label: "Invitar miembros", desc: "Ve a Ajustes → Equipo → Invitar usuario. Elige el rol: Creativo (produce piezas), Trafficker (publica en Meta) o Viewer (solo lectura)." },
      { label: "Cambiar roles", desc: "Desde la tabla de equipo puedes cambiar el rol de cualquier miembro o desactivarlo temporalmente sin eliminar su cuenta." },
      { label: "Perfil de IA", desc: "En Ajustes → Perfil IA configura la voz de marca: descripción de la empresa, público objetivo, tono, propuestas de valor fijas y palabras prohibidas." },
      { label: "Meta Ads", desc: "En Ajustes → Meta Ads registra tu Ad Account ID (act_XXXXXXXXX). La integración completa con Meta (publicar campañas directamente) llegará en la Fase 7." },
    ],
  },
]

const CREATIVO_SECTIONS: Section[] = [
  {
    icon: KanbanIcon,
    title: "Tu board",
    color: "text-blue-600",
    steps: [
      { label: "Solo tus piezas", desc: "El board filtra automáticamente para mostrarte únicamente las piezas que te han asignado. No ves las de otros creativos." },
      { label: "Flujo de trabajo", desc: "Cuando empieces una pieza muévela a 'En producción'. Al terminar, pásala a 'En revisión' para que el owner la apruebe." },
      { label: "Pieza rechazada", desc: "Si el owner rechaza tu trabajo, la pieza regresa a 'En producción'. Revisa los comentarios en el drawer para saber qué corregir." },
    ],
  },
  {
    icon: SparklesIcon,
    title: "Generación con IA",
    color: "text-violet-600",
    steps: [
      { label: "Generar copy", desc: "Abre el drawer de cualquier pieza asignada y haz clic en 'Generar con IA'. El texto se genera en tiempo real con streaming." },
      { label: "Qué genera", desc: "Claude crea un guión de producción (indicaciones para grabar/diseñar) y un copy listo para el anuncio, adaptado al formato de la pieza." },
      { label: "Editar el resultado", desc: "El texto generado es un punto de partida. Puedes usarlo tal cual o adaptarlo según tu criterio creativo." },
    ],
  },
  {
    icon: MessageSquareIcon,
    title: "Comentarios",
    color: "text-amber-600",
    steps: [
      { label: "Hilo por pieza", desc: "Cada pieza tiene su propio hilo de comentarios. Úsalo para reportar avances, hacer preguntas o pedir aclaraciones al owner." },
      { label: "Quién puede comentar", desc: "Todos los roles pueden comentar: Owner, Creativo, Trafficker y Viewer." },
    ],
  },
]

const TRAFFICKER_SECTIONS: Section[] = [
  {
    icon: ClipboardListIcon,
    title: "Tu flujo",
    color: "text-emerald-600",
    steps: [
      { label: "Filtrar por Aprobado", desc: "En el board usa el filtro de estado para ver solo las piezas en estado 'Aprobado'. Esas son las que están listas para subir a Meta." },
      { label: "Revisar los detalles", desc: "Abre el drawer de cada pieza para ver el modelo, formato, copy generado y cualquier instrucción del equipo creativo." },
      { label: "Publicar en Meta", desc: "Sube el creativo a Meta Ads Manager según los datos de la pieza (ad set, objetivo, formato). Usa el copy generado como punto de partida." },
      { label: "Registrar el link", desc: "Una vez publicado el anuncio en Meta, pega el link del ad en el campo correspondiente del drawer y marca la pieza como 'Publicado'." },
    ],
  },
  {
    icon: MessageSquareIcon,
    title: "Problemas de pauta",
    color: "text-amber-600",
    steps: [
      { label: "Rechazos de Meta", desc: "Si Meta rechaza un creativo, deja un comentario en la pieza explicando el motivo. El owner y el creativo serán notificados." },
      { label: "Cambios de presupuesto", desc: "Los cambios de presupuesto o targeting se coordinan con el owner desde los comentarios de la campaña." },
    ],
  },
]

const VIEWER_SECTIONS: Section[] = [
  {
    icon: MegaphoneIcon,
    title: "Campañas",
    color: "text-primary",
    steps: [
      { label: "Ver campañas", desc: "En Campañas puedes ver el listado completo con su estado, presupuesto y progreso de piezas." },
      { label: "Detalle de campaña", desc: "Accede al detalle para ver el brief completo, la estructura de ad sets y el prompt maestro generado con IA." },
    ],
  },
  {
    icon: KanbanIcon,
    title: "Board",
    color: "text-blue-600",
    steps: [
      { label: "Ver todas las piezas", desc: "Tienes visibilidad completa del board con todas las piezas y sus estados actuales." },
      { label: "Comentar", desc: "Puedes dejar comentarios en cualquier pieza aunque no puedas cambiar su estado ni asignación." },
    ],
  },
]

const SECTIONS_BY_ROLE: Record<string, Section[]> = {
  OWNER: OWNER_SECTIONS,
  CREATIVO: CREATIVO_SECTIONS,
  TRAFFICKER: TRAFFICKER_SECTIONS,
  VIEWER: VIEWER_SECTIONS,
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function HelpPage() {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  const role = session.user.role ?? "VIEWER"
  const sections = SECTIONS_BY_ROLE[role] ?? VIEWER_SECTIONS

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Centro de ayuda</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Documentación del flujo de trabajo según tu rol
        </p>
      </div>

      {/* Rol badge */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{ROLE_LABEL[role]?.[0] ?? "?"}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tu rol: {ROLE_LABEL[role] ?? role}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{ROLE_DESC[role]}</p>
          </div>
        </div>
      </div>

      {/* Secciones por rol */}
      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <Icon className={cn("w-4 h-4", section.color)} />
                <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {section.steps.map((step, i) => (
                  <div key={i} className="px-5 py-4 flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Estados de campaña */}
      {["OWNER", "VIEWER", "SUPER_ADMIN"].includes(role) && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Estados de campaña</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Flujo: Borrador → En revisión → Aprobada → En vivo → Finalizada</p>
          </div>
          <div className="divide-y divide-border">
            {CAMPAIGN_STATUSES.map((s) => (
              <div key={s.status} className="px-5 py-3 flex items-center gap-4">
                <span className={cn("px-2.5 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 w-28 text-center", s.color)}>
                  {s.status}
                </span>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estados de pieza */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Estados de pieza</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Flujo del board Kanban</p>
        </div>
        <div className="divide-y divide-border">
          {PIECE_STATUSES.map((s) => (
            <div key={s.status} className="px-5 py-3 flex items-center gap-4">
              <span className={cn("px-2.5 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 w-28 text-center", s.color)}>
                {s.status}
              </span>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Glosario de roles */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Roles del workspace</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { role: "Owner", desc: "Acceso completo. Crea campañas, gestiona equipo, configura IA y aprueba piezas." },
            { role: "Creativo", desc: "Gestiona sus piezas asignadas. Puede generar copy con IA, avanzar estados y comentar." },
            { role: "Trafficker", desc: "Ve piezas aprobadas y las marca como publicadas registrando el link del anuncio en Meta." },
            { role: "Viewer", desc: "Solo lectura. Puede ver campañas, el board y comentar en piezas." },
          ].map((r) => (
            <div key={r.role} className="px-5 py-3 flex items-start gap-4">
              <span className="text-xs font-semibold text-foreground flex-shrink-0 w-20">{r.role}</span>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
