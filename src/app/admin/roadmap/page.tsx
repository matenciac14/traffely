const ROADMAP: { fase: string; status: "done" | "in-progress" | "pending"; items: { label: string; done: boolean }[] }[] = [
  {
    fase: "Fase 1 — MVP Auth + Admin SaaS",
    status: "done" as const,
    items: [
      { label: "Auth.js v5 con credentials", done: true },
      { label: "Schema Prisma multi-tenant", done: true },
      { label: "Dashboard sidebar por rol", done: true },
      { label: "Panel admin SUPER_ADMIN: KPIs + workspace list", done: true },
      { label: "Gestión manual de clientes (crear / activar / billing)", done: true },
      { label: "Admin: Roadmap + AI Usage por workspace", done: true },
      { label: "Seed de usuario demo (Serrano Group)", done: true },
    ],
  },
  {
    fase: "Fase 2 — Wizard de campañas",
    status: "done" as const,
    items: [
      { label: "Wizard 7 pasos con stepper horizontal", done: true },
      { label: "Zustand store con validación por paso", done: true },
      { label: "Step 1–7 completos (brief, oferta, modelos, estructura, presupuesto, equipo)", done: true },
      { label: "Prompt maestro generado en servidor", done: true },
      { label: "Autosave wizard a localStorage + DB (debounce)", done: true },
      { label: "Restauración de borrador al recargar", done: true },
    ],
  },
  {
    fase: "Fase 3 — IA + Generación de brief",
    status: "done" as const,
    items: [
      { label: "Streaming SSE con Claude API (claude-opus-4-6)", done: true },
      { label: "Fallback mock cuando no hay API key", done: true },
      { label: "Tracking de tokens y costo por workspace (AiUsage)", done: true },
      { label: "Perfil de IA configurable por OWNER (brand voice, público, restricciones)", done: true },
      { label: "Sistema de prompt con contexto de empresa", done: true },
    ],
  },
  {
    fase: "Fase 4 — Board + Gestión de equipo",
    status: "done" as const,
    items: [
      { label: "Board Kanban para piezas (6 estados)", done: true },
      { label: "Materialización de AdSets y Pieces desde wizard", done: true },
      { label: "Cambio de estado de pieza con botones avanzar/retroceder", done: true },
      { label: "Asignación de piezas a usuarios desde el board", done: true },
      { label: "Filtros: por campaña, miembro, estado (activa/reserva)", done: true },
      { label: "Drawer de pieza tipo Jira (detalles + comentarios)", done: true },
      { label: "Comentarios por pieza con hilo de conversación", done: true },
      { label: "Vista por rol: CREATIVO ve solo sus piezas", done: true },
      { label: "Gestión de miembros del workspace (OWNER)", done: true },
      { label: "Invitar usuarios al workspace (crear cuenta)", done: true },
      { label: "Cambio de rol y activar/desactivar miembros", done: true },
    ],
  },
  {
    fase: "Fase 5 — Archivos + Copys por pieza",
    status: "done" as const,
    items: [
      { label: "Generación de guión/copy por pieza individual con Claude (SSE)", done: true },
      { label: "Link del ad en Meta al marcar como PUBLICADO", done: true },
      { label: "Prioridad y fecha límite por pieza (schema + API)", done: true },
      { label: "Subida de archivos creativos a S3 desde el drawer", done: true },
      { label: "Preview de archivos en drawer de pieza", done: true },
      { label: "Notificaciones in-app al cambiar estado de pieza asignada", done: true },
    ],
  },
  {
    fase: "Fase 6 — Seguridad + Producción",
    status: "in-progress" as const,
    items: [
      { label: "Security headers (CSP, X-Frame-Options, nosniff)", done: true },
      { label: "Rate limiting IA por workspace (10/24h, in-memory)", done: true },
      { label: "AI profile GET restringido a OWNER/SUPER_ADMIN", done: true },
      { label: "Validación de inputs con Zod en API routes (members, workspace)", done: true },
      { label: "Sanitizar inputs de usuario en prompts IA (escape markdown)", done: true },
      { label: "Audit log para acciones críticas (roles, billing, delete workspace)", done: true },
      { label: "Soft delete en workspaces (isDeleted + deletedAt)", done: true },
      { label: "Configuración explícita de sesión (maxAge 30d, cookies secure)", done: true },
      { label: "Logging estructurado con error IDs (reemplazar console.error)", done: true },
      { label: "Fix CSP: remover unsafe-inline y unsafe-eval", done: false },
      { label: "CSRF tokens en formularios POST", done: false },
      { label: "Índices de DB (@@index en workspaceId, campaignId, assigneeId)", done: true },
      { label: "Fix as any en auth config (role/workspaceId tipados)", done: true },
      { label: "Zod en todas las API routes (ai-profile, admin/workspaces, meta)", done: true },
      { label: "Rate limiting Redis (Upstash) para producción", done: false },
      { label: "Rate limiting en registro (anti-spam)", done: false },
      { label: "Verificación de email al crear usuario", done: false },
      { label: "Google OAuth con mapeo de usuario a workspace", done: false },
      { label: "Onboarding self-serve (registro OWNER)", done: false },
      { label: "Notificaciones por email (invitación, cambio estado)", done: false },
      { label: "Sentry o similar para error tracking en producción", done: false },
      { label: "Deploy Vercel + Neon producción (traffely.com live)", done: true },
      { label: "DNS Route 53 → Vercel (A record + CNAME actualizados)", done: true },
      { label: "Google OAuth eliminado (no se usa, causaba crash en edge)", done: true },
    ],
  },
  {
    fase: "Fase 7 — Integración Meta Ads",
    status: "pending" as const,
    items: [
      { label: "OAuth Meta Business Login (conexión de cuenta)", done: false },
      { label: "Guardar Ad Account ID por workspace (campo listo en settings)", done: true },
      { label: "Mapear Campaign → Meta Campaign (objetivo, status, nombre)", done: false },
      { label: "Mapear AdSet → Meta Ad Set (targeting, presupuesto ABO/CBO, fechas)", done: false },
      { label: "Mapear Piece → Meta Ad (creative, copy, CTA)", done: false },
      { label: "Botón 'Publicar en Meta' desde detalle de campaña (APPROVED)", done: false },
      { label: "Subir creativos a Meta desde archivoUrl de piezas", done: false },
      { label: "Sincronizar estado de anuncios desde Meta (scheduled job)", done: false },
      { label: "Pull de métricas Meta Insights (ROAS, CPC, CPM, conversiones)", done: false },
      { label: "Dashboard de rendimiento por campaña con métricas Meta", done: false },
      { label: "Pausar / reactivar / eliminar desde Traffely via API Meta", done: false },
    ],
  },
  {
    fase: "Fase 8 — Billing self-serve + AI Keys por workspace",
    status: "in-progress" as const,
    items: [
      { label: "Vista de billing para OWNER en settings (plan, estado, próximo cobro)", done: true },
      { label: "API key de IA configurable por OWNER (Anthropic, OpenAI, Gemini)", done: true },
      { label: "Generate endpoints usan API key del workspace si está configurada", done: true },
      { label: "Toggle Meta Ads habilitado por SUPER_ADMIN por workspace", done: true },
      { label: "Toggle IA global (globalAiEnabled) por SUPER_ADMIN por workspace", done: true },
      { label: "Encriptación de API keys en DB (AES-256-GCM)", done: true },
      { label: "Stripe integration para billing automático (suscripciones)", done: false },
      { label: "Webhooks Stripe para activar/desactivar workspaces automáticamente", done: false },
      { label: "Portal de billing self-serve (Stripe Customer Portal)", done: false },
    ],
  },
  {
    fase: "Fase 9 — Wizard AI-First + Vista de campaña",
    status: "in-progress" as const,
    items: [
      { label: "Brief generado por IA persiste en DB y se muestra inline (briefGenerado)", done: true },
      { label: "Vista de campaña: sección 'Tareas del equipo' con assignee, prioridad, dueDate", done: true },
      { label: "KPI 'Con IA': cuenta piezas con guión/copy generado", done: true },
      { label: "Botón 'Continuar editando' en detalle de campaña DRAFT sin promptMaestro", done: true },
      { label: "Restaurar draft desde DB vía ?resume={id} (campaignToWizardState)", done: true },
      { label: "Fix: clamp currentStep al restaurar draft (evita step > 7)", done: true },
      { label: "Campos del brief estratégico en wizard Step 2 (objetivo, público, insight, tono, CTA…)", done: true },
      { label: "Guardar campo 'empresa' en autosave a DB", done: true },
      { label: "Indicador de completitud del brief (X/8 campos) antes de generar", done: true },
      { label: "StepPromptOutput: CTA actualizado — generar brief IA inline, no en Claude.ai", done: true },
      { label: "Step 7 Equipo: clarificar que es para el prompt, no invita usuarios reales", done: true },
      { label: "Piezas auto-creadas en Step 5 heredan modelo seleccionado en Step 4", done: true },
    ],
  },
]

const STATUS_STYLE = {
  done: { bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", label: "Completado" },
  "in-progress": { bg: "bg-primary/5 border-primary/20", badge: "bg-primary/10 text-primary", label: "En progreso" },
  pending: { bg: "bg-card border-border", badge: "bg-muted text-muted-foreground", label: "Pendiente" },
}

export default function RoadmapPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Estado del desarrollo de Traffely</p>
      </div>

      <div className="space-y-4">
        {ROADMAP.map((fase) => {
          const st = STATUS_STYLE[fase.status]
          const done = fase.items.filter(i => i.done).length
          return (
            <div key={fase.fase} className={`rounded-2xl border p-5 ${st.bg}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground">{fase.fase}</h2>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${st.badge}`}>{st.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{done}/{fase.items.length}</span>
              </div>
              <ul className="space-y-2">
                {fase.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-2.5 text-sm">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${item.done ? "bg-emerald-500 text-white" : "border-2 border-border bg-background"}`}>
                      {item.done ? "✓" : ""}
                    </span>
                    <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
