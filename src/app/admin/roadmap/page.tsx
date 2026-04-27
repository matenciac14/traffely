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
    status: "done" as const,
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
  {
    fase: "Fase 10 — Integración Shopify (catálogo read-only)",
    status: "in-progress" as const,
    items: [
      { label: "Modelo ShopifyIntegration en Prisma (workspaceId, shop, accessToken cifrado)", done: true },
      { label: "OAuth flow: connect (POST) + callback (GET) con HMAC validation", done: true },
      { label: "API status GET + disconnect DELETE (/api/integrations/shopify)", done: true },
      { label: "API productos on-demand GET (/api/integrations/shopify/products)", done: true },
      { label: "Lib Shopify: client (paginación REST) + hmac validation", done: true },
      { label: "Settings tab 'Shopify': conectar, ver estado, desconectar", done: true },
      { label: "ShopifyProductPicker: componente reutilizable con búsqueda", done: true },
      { label: "Step 3 Oferta: importar producto Shopify → pre-fill contextoOferta", done: true },
      { label: "Step 4 Modelos: importar variantes Shopify → modelos con precios", done: true },
      { label: "Crear app 'Traffely' en Shopify Partners (separada de WCA)", done: false },
      { label: "Configurar redirect URIs en Partners: traffely.com + localhost", done: false },
      { label: "Copiar SHOPIFY_API_KEY + SHOPIFY_API_SECRET a .env.local y Vercel", done: false },
      { label: "Probar OAuth end-to-end con tienda de desarrollo Shopify", done: false },
    ],
  },
  {
    fase: "Fase 11 — Shopify App Review (distribución pública)",
    status: "pending" as const,
    items: [
      { label: "[CÓDIGO] Webhook app/uninstalled → POST /api/webhooks/shopify/uninstalled → marca isActive:false en ShopifyIntegration", done: false },
      { label: "[CÓDIGO] Validar HMAC del webhook con X-Shopify-Hmac-Sha256 (mismo patrón que OAuth)", done: false },
      { label: "[CÓDIGO] Registrar el webhook automáticamente al completar OAuth callback", done: false },
      { label: "[SHOPIFY] En Partners → App → Distribution → seleccionar 'Custom' (unlisted, no App Store)", done: false },
      { label: "[SHOPIFY] En Partners → App → Configuration → declarar scope 'read_products' y webhook app/uninstalled", done: false },
      { label: "[SHOPIFY] Subir app icon 1200×628px con logo Traffely", done: false },
      { label: "[SHOPIFY] Completar App listing: descripción, screenshots del wizard con Shopify conectado", done: false },
      { label: "[WEB] Crear página /privacy en traffely.com (Privacy Policy) — requerida por Shopify para el review", done: false },
      { label: "[WEB] Crear página /terms en traffely.com (Terms of Service) — recomendada", done: false },
      { label: "[SHOPIFY] Enviar app a App Review desde Partners dashboard (tiempo estimado: 2–5 días hábiles)", done: false },
      { label: "[SHOPIFY] Responder feedback del reviewer si lo hay y re-enviar", done: false },
      { label: "[SHOPIFY] App aprobada → cualquier cliente puede conectar su tienda desde Traffely Settings", done: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    fase: "Fase 12 — Multi-Empresa (clientes/marcas por workspace)",
    status: "in-progress" as const,
    items: [
      { label: "Modelo Empresa en Prisma: id, workspaceId, nombre, logo, industria, website, descripcion, isActive", done: true },
      { label: "Modelo EmpresaIdentidad: tono, publicoObjetivo, propuestasValor, palabrasProhibidas, instruccionesExtra, colores, tipografias", done: true },
      { label: "Migrar Campaign: agregar empresaId (FK opcional → campañas existentes sin empresa)", done: true },
      { label: "Migrar ShopifyIntegration: mover de workspaceId → empresaId (pendiente Fase 12 avanzada)", done: false },
      { label: "Migrar aiProfile de Workspace → EmpresaIdentidad (legacy queda como fallback)", done: true },
      { label: "Campo empresasLimit en Workspace (sin enforcement aún — Fase 14)", done: false },
      { label: "GET /api/empresas → listar empresas del workspace", done: true },
      { label: "POST /api/empresas → crear empresa + EmpresaIdentidad vacía automáticamente", done: true },
      { label: "GET /api/empresas/[id] → detalle con identidad + campañas recientes", done: true },
      { label: "PATCH /api/empresas/[id] → editar datos generales inline", done: true },
      { label: "PATCH /api/empresas/[id]/identidad → upsert identidad de marca", done: true },
      { label: "DELETE /api/empresas/[id] → soft delete (isActive: false)", done: true },
      { label: "Actualizar /api/integrations/shopify/* para operar por empresaId", done: false },
      { label: "Página /empresas: listado con tarjetas, progress identidad IA, campañas", done: true },
      { label: "Página /empresas/nueva: wizard 2 pasos (datos generales + identidad con 'completar después')", done: true },
      { label: "Página /empresas/[id]: campos editables inline (click para editar), progress identidad IA", done: true },
      { label: "Empresas en sidebar (nav CLIENT_NAV)", done: true },
      { label: "Settings: mover tab 'Shopify' de workspace → dentro de /empresas/[id]", done: false },
      { label: "Step 1 wizard: selector visual de empresa con tarjetas (carga desde API)", done: true },
      { label: "Al seleccionar empresa: pre-cargar tono, público, propuestasValor en el brief", done: true },
      { label: "Guardar empresaId en Campaign al autosave y al completar wizard", done: true },
      { label: "Generate brief: usa EmpresaIdentidad si tiene empresaId, fallback a aiProfile del workspace", done: true },
      { label: "ShopifyProductPicker: operar con empresaId en lugar de workspaceId", done: false },
      { label: "Step 3 y Step 4: picker carga productos de la empresa seleccionada en Step 1", done: false },
    ],
  },

  {
    fase: "Fase 13 — Wizard refactorizado (AI-First con identidad de empresa)",
    status: "pending" as const,
    items: [
      { label: "Reducir wizard a 5 pasos: Empresa + Brief rápido + Oferta + Estructura + Revisión", done: false },
      { label: "Step 1 nuevo: selección de empresa (carga identidad) — ya no pide datos de marca en el wizard", done: false },
      { label: "Step 2 nuevo: Brief campaña ligero — solo objetivo, contexto, fechas (tono/CTA vienen de empresa)", done: false },
      { label: "Brief chips ya disponibles para objetivo, tono, CTA en Step 2", done: true },
      { label: "Público objetivo con chips de edad/género en Step 2", done: true },
      { label: "Step de Equipo: eliminar (se asigna desde el board después)", done: false },
      { label: "Prompt maestro: combinar identidad empresa + brief campaña → output más preciso", done: false },
      { label: "Opción 'Completar después' en brief opcional (avanzar sin brief completo, IA genera con lo que hay)", done: false },
    ],
  },

  {
    fase: "Fase 14 — Billing enforcement + planes",
    status: "pending" as const,
    items: [
      { label: "Definir planes: Starter (1 empresa, 3 campañas, 20 gen/mes), Pro (5 empresas, ilimitadas, 100 gen/mes), Agency (todo ilimitado)", done: false },
      { label: "Campo plan en Workspace: STARTER | PRO | AGENCY (default STARTER)", done: false },
      { label: "Middleware de límites: verificar empresasLimit antes de crear empresa", done: false },
      { label: "Middleware de límites: verificar campaignLimit en campañas activas", done: false },
      { label: "Middleware de límites: verificar aiGenerationsLimit en generación IA", done: false },
      { label: "UI upgrade prompt: modal cuando se alcanza el límite de empresas", done: false },
      { label: "UI upgrade prompt: banner cuando se alcanza el 80% de generaciones IA", done: false },
      { label: "Panel admin SUPER_ADMIN: cambiar plan de workspace manualmente", done: false },
      { label: "Stripe integration (suscripciones) — reemplaza billing manual", done: false },
      { label: "Webhooks Stripe → activar plan automáticamente al pagar", done: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ANÁLISIS TÉCNICO + INSPIRACIÓN CLICKUP 2026-04-27
  // ─────────────────────────────────────────────────────────────────────────────

  {
    fase: "Fase 15 — Deuda técnica crítica (fixes de producción)",
    status: "in-progress" as const,
    items: [
      { label: "[P1] Rate limiting: migrar in-memory Map → Upstash Redis (persiste entre deploys)", done: true },
      { label: "[P1] Shopify OAuth state: migrar in-memory Map → Upstash Redis (multi-instancia)", done: true },
      { label: "[P2] Fix pieces/[id]/generate: usar EmpresaIdentidad cuando campaña tiene empresaId", done: true },
      { label: "[P2] Fix campaigns/[id]/generate: ya usa EmpresaIdentidad correctamente (verificado)", done: true },
      { label: "[P3] Eliminar SYSTEM_PROMPT hardcodeado de lib/ai/client.ts (era específico de calzado)", done: true },
      { label: "[P3] SYSTEM_PROMPT genérico: agencia marketing LatAm, sin industria fija, sin cliente específico", done: true },
      { label: "[P3] Seed: crear empresa 'Serrano Group' con identidad completa como EmpresaIdentidad en DB", done: true },
      { label: "[P3] Verificar backward compat: campañas sin empresaId siguen usando aiProfile workspace", done: true },
      { label: "[P4] Feature flag SHOPIFY_ENABLED: campo en Workspace + toggle por SUPER_ADMIN", done: true },
      { label: "[P4] Settings tab 'Shopify' visible solo si shopifyEnabled activo en workspace", done: true },
      { label: "[P4] API /integrations/shopify/* retorna 503 con mensaje claro si flag desactivado", done: true },
      { label: "[P4] ShopifyProductPicker: oculto si empresa sin Shopify conectado o flag desactivado", done: true },
      { label: "[BUG FIX] workspace.aiApiKey se guardaba encriptado y los generate routes lo usaban sin decrypt() → Anthropic rechazaba con 401 y caía silenciosamente al mock stream", done: true },
      { label: "[P5] Integrar Resend: email bienvenida al invitar miembro al workspace", done: false },
      { label: "[P5] Email: asignación de pieza (notifica al asignado)", done: false },
      { label: "[P5] Email: cambio de estado de pieza asignada", done: false },
    ],
  },

  {
    fase: "Fase 16 — Brief nativo en plataforma (reemplaza texto plano / Word)",
    status: "pending" as const,
    items: [
      { label: "[DISEÑO] Definir JSON schema de secciones del brief: resumen, público, oferta, piezas, plan", done: false },
      { label: "[DISEÑO] Flujo: wizard → Claude genera secciones JSON → persiste en Campaign.briefData", done: false },
      { label: "[DB] Campo briefData Json? en Campaign (secciones parseadas del brief)", done: false },
      { label: "[API] Cambiar promptMaestro para instruir a Claude a devolver JSON estructurado por secciones", done: false },
      { label: "[API] Parser SSE: acumular → extraer JSON → guardar briefData al finalizar stream", done: false },
      { label: "[UI] Vista brief en /campaigns/[id]: secciones con diseño nativo (no <pre> de texto)", done: false },
      { label: "[UI] Sección 'Resumen ejecutivo': tabla con campaña, empresa, objetivo, presupuesto", done: false },
      { label: "[UI] Sección 'Guiones y copys': acordeón por pieza con guión formateado + copy del ad", done: false },
      { label: "[UI] Sección 'Plan de trabajo': tabla piezas con prioridad sugerida y timeline estimado", done: false },
      { label: "[IA] Segundo call post-brief: genera plan de trabajo JSON (pieza → prioridad → fecha sugerida)", done: false },
      { label: "[IA] Plan de trabajo actualiza dueDate y priority en Piece con confirmación del OWNER", done: false },
      { label: "[UI] Modal preview del plan antes de aplicar: tabla editable → confirmar → guarda en DB", done: false },
      { label: "[UI] Exportar brief a PDF desde browser (window.print + CSS print styles)", done: false },
      { label: "[DB] BriefVersion: guardar versiones anteriores al regenerar brief", done: false },
    ],
  },

  {
    fase: "Fase 17 — Board Pro (inspirado en ClickUp, adaptado a producción creativa)",
    status: "pending" as const,
    items: [
      // Board básico
      { label: "[BOARD] Prioridad visible en PieceCard: badge URGENTE/ALTA/MEDIA/BAJA con colores", done: false },
      { label: "[BOARD] Due date visible en PieceCard: badge con días restantes / vencida (rojo)", done: false },
      { label: "[BOARD] Filtro por prioridad en BoardKanban (ya existe el campo en DB)", done: false },
      { label: "[BOARD] Activity feed por pieza: historial de cambios de estado, asignaciones y comentarios en drawer", done: false },
      // Assignees múltiples
      { label: "[BOARD] Multiple assignees por pieza: campo assignees String[] en Piece + UI multi-select", done: false },
      { label: "[BOARD] Assign comments: marcar comentario como acción pendiente → notifica al asignado", done: false },
      // Workload view
      { label: "[WORKLOAD] Vista 'Carga del equipo': piezas agrupadas por creativo asignado", done: false },
      { label: "[WORKLOAD] Indicador de carga: conteo de piezas activas por miembro con semáforo visual", done: false },
      { label: "[WORKLOAD] Filtro rápido 'mis piezas' vs 'todo el equipo' en board y workload", done: false },
      // Timeline / Gantt ligero
      { label: "[TIMELINE] Vista timeline de campaña: piezas en eje de tiempo por dueDate de publicación", done: false },
      { label: "[TIMELINE] Drag-and-drop en timeline para mover fechas de piezas", done: false },
      { label: "[TIMELINE] Indicador de hoy + rango de la campaña (fechaInicio → fechaFin)", done: false },
      // Dashboard por campaña
      { label: "[DASHBOARD] Widget 'Progreso de campaña': % piezas por estado (anillo/barra)", done: false },
      { label: "[DASHBOARD] Widget 'IA generada': X/Y piezas con guión+copy generado", done: false },
      { label: "[DASHBOARD] Widget 'Días al lanzamiento': countdown basado en fechaInicio de la campaña", done: false },
      { label: "[DASHBOARD] Widget 'Carga del equipo': resumen de piezas asignadas por miembro", done: false },
      // Goals / KPIs
      { label: "[GOALS] KPIs por campaña: ROAS objetivo, CPA objetivo, presupuesto vs ejecutado", done: false },
      { label: "[GOALS] Vincular KPIs a piezas PUBLICADO: el trafficker ingresa métricas reales de Meta", done: false },
      { label: "[GOALS] Vista de rendimiento por campaña: KPI objetivo vs real con semáforo", done: false },
      // Checklist y subpiezas
      { label: "[PIEZA] Checklist interno por pieza: lista de verificación antes de marcar APROBADO", done: false },
      { label: "[PIEZA] Templates de checklist por tipo de pieza (video UGC, carrusel, imagen estática)", done: false },
      { label: "[PIEZA] Subpiezas: variantes de un mismo ad (ej. mismo guión, distintos formatos)", done: false },
      // Piezas recurrentes
      { label: "[PIEZA] Piezas recurrentes/evergreen: frecuencia (semanal/mensual) → se clonan automáticamente", done: false },
      // Real-time colaboración
      { label: "[REALTIME] Board en tiempo real: polling cada 30s o SSE para reflejar cambios de otros usuarios", done: false },
      { label: "[REALTIME] Indicador 'X personas viendo' en board y en drawer de pieza", done: false },
    ],
  },

  {
    fase: "Fase 18 — Intake público (formulario de brief para clientes)",
    status: "pending" as const,
    items: [
      { label: "[FORM] Formulario público /brief/[workspaceSlug]: cliente completa brief sin login", done: false },
      { label: "[FORM] Campos del form: empresa, tipo campaña, objetivo, presupuesto, fecha, contacto", done: false },
      { label: "[API] POST /api/public/brief → crea Campaign en DRAFT + notifica al OWNER por email", done: false },
      { label: "[UI] Página de confirmación post-envío: 'Tu brief fue recibido, te contactamos en 24h'", done: false },
      { label: "[UI] OWNER ve solicitudes de brief entrantes en panel: nuevo tab en /campaigns", done: false },
      { label: "[UI] OWNER puede rechazar, aprobar o convertir el intake en campaña real con un click", done: false },
      { label: "[BRANDING] Form con logo y colores del workspace — white-label por cliente", done: false },
    ],
  },

  {
    fase: "Fase 19 — Dashboard de métricas + Meta Ads por empresa",
    status: "in-progress" as const,
    items: [
      // ── Meta por empresa (prerrequisito del dashboard) ──
      { label: "[DB] Campos en Empresa: metaAdAccountId, metaAccessToken (AES-256-GCM), metaTokenExpiresAt, metaEnabled", done: true },
      { label: "[API] POST /api/empresas/[id]/meta → guardar/actualizar token + probar conexión con Meta Graph API", done: true },
      { label: "[API] DELETE /api/empresas/[id]/meta → desconectar Meta (limpia token en DB)", done: true },
      { label: "[API] lib/meta-api.ts → cliente server-side con token por empresa (hit graph.facebook.com/v21.0)", done: true },
      { label: "[UI] Sección 'Meta Ads' en /empresas/[id]: pegar token, probar conexión, ver nombre de cuenta, desconectar", done: true },
      { label: "[UI] Badge 'Meta ✓' en card de empresa en /metrics cuando metaEnabled=true", done: true },
      // ── Infraestructura dashboard ──
      { label: "[RUTA] /metrics → página OWNER/SUPER_ADMIN con KPIs globales y cards por empresa", done: true },
      { label: "[RUTA] /metrics/empresa/[id] → dashboard por empresa con tabs (Producción, Meta Ads, Audiencias)", done: true },
      { label: "[NAV] Enlace 'Métricas' en sidebar (solo OWNER — ownerOnly flag)", done: true },
      { label: "[UI] Selector de rango de fechas: 7d / 30d / 90d con refresh manual", done: true },
      { label: "[UI] Loading states durante fetch de métricas", done: true },
      // ── Tab Producción (siempre disponible, no requiere Meta) ──
      { label: "[PROD] Cards KPIs: campañas activas, piezas totales, con IA, con retraso", done: true },
      { label: "[PROD] Barra por estado de piezas con conteo y % visual", done: true },
      { label: "[PROD] On-time rate: % piezas entregadas con alertas de retraso", done: true },
      { label: "[PROD] Workload table: piezas activas por miembro del equipo con semáforo (Alta/Media/Baja)", done: true },
      { label: "[PROD] Actividad reciente: últimos 10 cambios de estado con actor y timestamp", done: true },
      { label: "[PROD] Piezas con dueDate esta semana: lista de próximas entregas y alertas de retraso", done: true },
      // ── Tab Campañas Meta ──
      { label: "[CAMP] Tabla campañas Meta: Spend, Impressions, Clicks, CTR, CPC, ROAS por campaña", done: true },
      { label: "[CAMP] Badge ROAS: Top Performer (≥4x verde), Promedio (2-4x ámbar), Bajo rendimiento (<2x rojo)", done: true },
      { label: "[CAMP] Account-level KPI cards: gasto total, impresiones, clicks, ROAS, CTR, CPC", done: true },
      // ── Tab Audiencias ──
      { label: "[AUDIENCE] Tabla age/gender: edad, género, gasto, impresiones, clicks", done: true },
      { label: "[AUDIENCE] Barras de dispositivos: distribución % de impresiones por plataforma", done: true },
      { label: "[AUDIENCE] Placement performance: Facebook Feed, Instagram Feed, Stories, Reels, Audience Network", done: true },
      { label: "[AUDIENCE] Top 10 países: tabla con Spend, Impressions, Clicks, ROAS", done: true },
      // ── Tab Creativos ──
      { label: "[CREATIVE] Grid de piezas PUBLICADO: preview archivo S3, tipo, asignee, campaña", done: true },
      { label: "[CREATIVE] Badge performance Meta: Top Performer (ROAS >4x), Promedio (2-4x), Bajo rendimiento (<2x)", done: false },
      { label: "[CREATIVE] Métricas por creativo (si Meta conectado): Spend, Impressions, CTR, ROAS", done: false },
      { label: "[CREATIVE] Filtros: por campaña, por performance tier, por tipo de pieza", done: false },
      // ── Tab Analytics ──
      { label: "[ANALYTICS] Gráfico dual-axis: Daily Spend vs ROAS (Recharts)", done: true },
      { label: "[ANALYTICS] Gráfico barras ROAS por campaña con umbral de performance coloreado", done: true },
      { label: "[ANALYTICS] Comparativa período actual vs período anterior para KPIs principales", done: false },
      // ── Export ──
      { label: "[EXPORT] Exportar métricas de campaña a CSV para reportes al cliente", done: true },
    ],
  },

  {
    fase: "Fase 20 — Chat de equipo (scope mínimo: por campaña)",
    status: "pending" as const,
    items: [
      // Nota de diseño: chat contextual por campaña, no Slack completo
      // Decisión: implementar solo si clientes lo piden explícitamente
      // Schema
      { label: "[DB] Modelo Channel: id, workspaceId, type (general | campaign), campaignId?, name", done: false },
      { label: "[DB] Modelo ChatMessage: id, channelId, userId, content, createdAt (sin editar ni borrar en MVP)", done: false },
      { label: "[DB] Canal #general creado automáticamente al crear workspace", done: false },
      { label: "[DB] Canal por campaña creado al materializar piezas (completar wizard)", done: false },
      // API
      { label: "[API] GET /api/chat/[channelId]/messages → últimos 50 mensajes con paginación (cursor)", done: false },
      { label: "[API] POST /api/chat/[channelId]/messages → crear mensaje (validación Zod, max 2000 chars)", done: false },
      // UI
      { label: "[UI] Sección 'Chat' en sidebar: lista de canales con badge de no leídos", done: false },
      { label: "[UI] Vista de canal: burbujas de mensajes, avatar, timestamp relativo (hace X min)", done: false },
      { label: "[UI] Input de mensaje: textarea con Cmd+Enter para enviar, bloqueo al enviar", done: false },
      { label: "[UI] Scroll automático al último mensaje al abrir canal", done: false },
      // Real-time
      { label: "[REALTIME] Polling cada 10s para nuevos mensajes (sin Pusher/WebSocket en MVP)", done: false },
      { label: "[REALTIME] Badge de no leídos en sidebar actualizado al marcar canal como visto", done: false },
      // Menciones
      { label: "[MENCIONES] @usuario en mensaje → notificación in-app al mencionado", done: false },
      // Contextual links
      { label: "[CONTEXTO] Comando /pieza [nombre] → inserta link clickeable a Piece con preview inline", done: false },
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
