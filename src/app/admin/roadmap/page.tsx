"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

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
      { label: "Wizard 8 pasos con stepper horizontal (Fase 26 agregó paso Conceptos)", done: true },
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
      { label: "Rate limiting Redis (Upstash) para producción", done: true },
      { label: "Rate limiting en registro (anti-spam)", done: true },
      { label: "Verificación de email al crear usuario", done: false },
      { label: "Google OAuth con mapeo de usuario a workspace", done: false },
      { label: "Onboarding self-serve (registro OWNER)", done: true },
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
      { label: "Migrar ShopifyIntegration: mover de workspaceId → empresaId [BLOQUEADO — Fase 10 en hold]", done: false },
      { label: "Migrar aiProfile de Workspace → EmpresaIdentidad (legacy queda como fallback)", done: true },
      { label: "Campo empresasLimit en Workspace (sin enforcement aún — Fase 14)", done: false },
      { label: "GET /api/empresas → listar empresas del workspace", done: true },
      { label: "POST /api/empresas → crear empresa + EmpresaIdentidad vacía automáticamente", done: true },
      { label: "GET /api/empresas/[id] → detalle con identidad + campañas recientes", done: true },
      { label: "PATCH /api/empresas/[id] → editar datos generales inline", done: true },
      { label: "PATCH /api/empresas/[id]/identidad → upsert identidad de marca", done: true },
      { label: "DELETE /api/empresas/[id] → soft delete (isActive: false)", done: true },
      { label: "Actualizar /api/integrations/shopify/* para operar por empresaId [BLOQUEADO — Fase 10 en hold]", done: false },
      { label: "Página /empresas: listado con tarjetas, progress identidad IA, campañas", done: true },
      { label: "Página /empresas/nueva: wizard 2 pasos (datos generales + identidad con 'completar después')", done: true },
      { label: "Página /empresas/[id]: campos editables inline (click para editar), progress identidad IA", done: true },
      { label: "Empresas en sidebar (nav CLIENT_NAV)", done: true },
      { label: "Settings: mover tab 'Shopify' de workspace → dentro de /empresas/[id] [BLOQUEADO — Fase 10 en hold]", done: false },
      { label: "Step 1 wizard: selector visual de empresa con tarjetas (carga desde API)", done: true },
      { label: "Al seleccionar empresa: pre-cargar tono, público, propuestasValor en el brief", done: true },
      { label: "Guardar empresaId en Campaign al autosave y al completar wizard", done: true },
      { label: "Generate brief: usa EmpresaIdentidad si tiene empresaId, fallback a aiProfile del workspace", done: true },
      { label: "ShopifyProductPicker: operar con empresaId en lugar de workspaceId [BLOQUEADO — Fase 10 en hold]", done: false },
      { label: "Step 3 y Step 4: picker carga productos Shopify de la empresa seleccionada [BLOQUEADO — Fase 10 en hold]", done: false },
      // Catálogo de productos (no-Shopify)
      { label: "[DB] Modelo Producto: id, empresaId, nombre, precioActual, precioAntes, descripcion, sku, isActive", done: true },
      { label: "[API] GET /api/empresas/[id]/productos → listar productos activos de la empresa", done: true },
      { label: "[API] POST /api/empresas/[id]/productos → crear producto", done: true },
      { label: "[API] PATCH /api/empresas/[id]/productos/[pid] → editar producto", done: true },
      { label: "[API] DELETE /api/empresas/[id]/productos/[pid] → eliminar producto", done: true },
      { label: "[UI] Sección 'Catálogo' en /empresas/[id]: agregar y eliminar productos", done: true },
      { label: "[UI] Wizard Step 4: carga catálogo de la empresa seleccionada con checkboxes", done: true },
      { label: "[UI] Wizard Step 4: si Shopify conectado → muestra productos Shopify; si no → muestra catálogo interno", done: true },
      { label: "[UI] Wizard Step 4: precios pre-rellenados desde catálogo, ajustables por campaña", done: true },
      // Fase 22 — rename modelos → productos (restante)
      { label: "[DB] schema.prisma: Campaign.modelos → productos con @map('modelos') (sin migración)", done: true },
      { label: "[API] campaigns routes: .modelos → .productos en queries Prisma", done: true },
      { label: "[UI] ShopifyProductPicker: mode='modelos' → mode='productos'", done: true },
    ],
  },

  {
    fase: "Fase 13 — Wizard refactorizado (AI-First con identidad de empresa)",
    status: "done" as const,
    items: [
      { label: "Step de Equipo eliminado: wizard pasa de 8 a 7 pasos", done: true },
      { label: "Trigger 'Generar prompt' movido de step 8 → step 7 (Presupuesto)", done: true },
      { label: "CampaignTeamAssign: asignación de creativos desde detalle de campaña (reemplaza Step 8 eliminado)", done: true },
      { label: "Brief chips ya disponibles para objetivo, tono, CTA en Step 2", done: true },
      { label: "Público objetivo con chips de edad/género en Step 2", done: true },
      { label: "Reducir wizard a 5 pasos: Empresa + Brief + Oferta & Catálogo + Estructura + Presupuesto", done: true },
      { label: "Step 3 fusiona Oferta + Catálogo (misma pantalla, sección separada)", done: true },
      { label: "Step 4 fusiona Conceptos (opcional, colapsable) + Estructura de campañas", done: true },
      { label: "Validators remapeados de 8 casos a 5 (case 3 = oferta+catálogo, case 4 = estructura, case 5 = presupuesto)", done: true },
      { label: "Step 2 modo ligero: cuando hay empresa con identidad → muestra banner + solo campos campaign-specific + overrides colapsables", done: true },
      { label: "Prompt maestro: cuando hay empresaId, señaliza que identidad está en system prompt, solo incluye overrides de campaña", done: true },
      { label: "Opción 'Completar después': nota visual clara + todos los campos opcionales en ambos modos", done: true },
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
    status: "done" as const,
    items: [
      { label: "[DISEÑO] Definir JSON schema del brief: resumen (objetivo, insight, estrategia, totales) + piezas[]", done: true },
      { label: "[API] Eliminar instrucciones Word/docx del prompt maestro (200+ líneas legacy)", done: true },
      { label: "[API] Instruir a Claude a devolver JSON estructurado por pieza (hook, framework, primaryText, guionResumen, justificación)", done: true },
      { label: "[API] Parser SSE: acumular stream completo → parsear JSON al finalizar → persistir en briefGenerado", done: true },
      { label: "[UI] CampaignGenerateSection: spinner mientras genera, cards estructuradas al terminar", done: true },
      { label: "[UI] Tarjeta resumen estratégico: total piezas/copys, objetivo, insight, estrategia creativa", done: true },
      { label: "[UI] Acordeón por pieza: hook apertura, guión/brief visual, primary text copiable, headline con conteo de chars, justificación", done: true },
      { label: "[UI] Backward compat: brief anterior (texto plano) renderiza como Markdown con botón 'Regenerar con nuevo formato'", done: true },
      { label: "[UI] Exportar brief como JSON", done: true },
      { label: "[IA] Auto-populate: brief JSON → guion/copy/imageBrief copiados a cada Piece al generar (match por índice)", done: true },
      { label: "[UI] Sección 'Plan de trabajo': tabla piezas con prioridad sugerida y días estimados", done: true },
      { label: "[IA] POST /api/campaigns/[id]/work-plan → segundo call Claude: priority + days + justificación por pieza", done: true },
      { label: "[IA] PATCH action apply-work-plan: aplica priority + dueDate a todas las piezas con confirmación del OWNER", done: true },
      { label: "[UI] Tabla editable con confirm antes de aplicar (CampaignWorkPlan component)", done: true },
      { label: "[UI] Exportar brief a PDF desde browser (window.print + CSS print styles)", done: true },
      { label: "[DB] BriefVersion: guardar versiones anteriores al regenerar brief", done: false },
    ],
  },

  {
    fase: "Fase 17 — Board Pro (inspirado en ClickUp, adaptado a producción creativa)",
    status: "in-progress" as const,
    items: [
      // Board básico
      { label: "[BOARD] Prioridad visible en PieceCard: badge URGENTE/ALTA/MEDIA/BAJA con colores", done: true },
      { label: "[BOARD] Due date visible en PieceCard: badge con días restantes / vencida (rojo)", done: true },
      { label: "[BOARD] Filtro por prioridad en BoardKanban (ya existe el campo en DB)", done: false },
      { label: "[BOARD] Activity feed por pieza: historial de cambios de estado, asignaciones y comentarios en drawer", done: false },
      // Assignees múltiples
      { label: "[BOARD] Multiple assignees por pieza: campo assignees String[] en Piece + UI multi-select", done: false },
      { label: "[BOARD] Assign comments: marcar comentario como acción pendiente → notifica al asignado", done: false },
      // Workload view
      { label: "[WORKLOAD] Vista 'Carga del equipo': piezas agrupadas por creativo asignado con semáforo Alta/Media/Baja", done: true },
      { label: "[WORKLOAD] Toggle Kanban | Carga en header del board (icono kanban / icono users)", done: true },
      { label: "[WORKLOAD] Indicador de piezas vencidas por miembro en la workload view", done: true },
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
    status: "done" as const,
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
      { label: "[CREATIVE] Filtros por campaña y tipo de pieza + contador de resultados", done: true },
      { label: "[CREATIVE] Badge 'En Meta' en preview cuando adUrl presente", done: true },
      { label: "[CREATIVE] Badge performance por creativo (requiere metaCampaignId en schema — pendiente Fase 28)", done: false },
      { label: "[CREATIVE] Métricas individuales por creativo desde Meta (requiere metaCampaignId — pendiente Fase 28)", done: false },
      // ── Tab Analytics ──
      { label: "[ANALYTICS] Gráfico dual-axis: Daily Spend vs ROAS (Recharts)", done: true },
      { label: "[ANALYTICS] Gráfico barras ROAS por campaña con umbral de performance coloreado", done: true },
      { label: "[ANALYTICS] Comparativa período actual vs período anterior — KPIs Meta con delta ▲▼%", done: true },
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

  // ─────────────────────────────────────────────────────────────────────────────
  // ARQUITECTURA AI-FIRST — descoupling del prompt quemado
  // ─────────────────────────────────────────────────────────────────────────────

  {
    fase: "Fase 21 — AI Architecture: identidad de empresa como único contexto",
    status: "in-progress" as const,
    items: [
      // Desacoplar SYSTEM_PROMPT
      { label: "[AI] SYSTEM_PROMPT: verificar que es 100% genérico sin referencia a industria, país ni cliente específico", done: true },
      { label: "[AI] Eliminar de prompt-generator.ts: contexto Primatón hardcodeado, reglas legales de calzado/fashion, '24-72h ciudades principales'", done: true },
      { label: "[AI] Registros de voz: remover sesgo colombiano del prompt base — queda genérico, el tono específico va en EmpresaIdentidad.tono", done: true },
      // Expandir EmpresaIdentidad
      { label: "[DB] EmpresaIdentidad: campo 'contextoNegocio' (cómo funciona el negocio, ciclo de compra, diferenciadores)", done: true },
      { label: "[DB] EmpresaIdentidad: campo 'reglasLegales' (prohibiciones y cuidados específicos de la industria)", done: true },
      { label: "[DB] EmpresaIdentidad: campo 'eventosKey' (fechas comerciales relevantes para la empresa)", done: true },
      { label: "[UI] Formulario identidad empresa: sección 'Contexto avanzado' con contextoNegocio, reglasLegales, eventosKey", done: true },
      { label: "[API] identidad route PATCH: acepta y persiste los 3 campos nuevos", done: true },
      // Buildear prompt dinámicamente desde identidad
      { label: "[AI] campaigns/generate: sistema prompt incluye contextoNegocio, reglasLegales, eventosKey de la empresa", done: true },
      { label: "[AI] pieces/generate: sistema prompt incluye los mismos 3 campos nuevos", done: true },
      { label: "[AI] Validar con empresa de industria diferente (no calzado): el brief generado debe ser contextualmente correcto", done: true },
      // Preparación para generación de assets
      { label: "[AI] Definir estructura de prompt por pieza para generación de imágenes: objeto con escena, estilo, texto en imagen, dimensiones", done: false },
      { label: "[AI] Definir estructura de prompt por pieza para generación de video: storyboard, duración por escena, voz en off, música", done: false },
      { label: "[API] POST /api/pieces/[id]/generate-asset → placeholder: recibe tipo (image/video) + devuelve estructura del prompt listo para enviar a Replicate/Runway", done: false },
      { label: "[UI] Drawer de pieza: sección 'Generar asset' con selector imagen/video (deshabilitado hasta integrar proveedor)", done: false },
      // Proveedores de generación
      { label: "[AI] Integrar Replicate (imagen): FLUX o SDXL para generación de imágenes de anuncios", done: false },
      { label: "[AI] Integrar Runway o Kling (video): generación de videos cortos para Reels/Stories", done: false },
      { label: "[AI] Pipeline: guionGenerado → prompt imagen/video → asset generado → subir a S3 → asignar a Piece", done: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ARQUITECTURA AGNÓSTICA — producto para cualquier industria/agencia/marca
  // ─────────────────────────────────────────────────────────────────────────────

  {
    fase: "Fase 22 — Rename modelos → productos (industria agnóstico)",
    status: "done" as const,
    items: [
      { label: "[STORE] Renombrar modelosCustom → productosCustom en campaign-wizard.ts", done: true },
      { label: "[STORE] Renombrar modelosSeleccionados → productosSeleccionados en campaign-wizard.ts", done: true },
      { label: "[STORE] Renombrar preciosModelos → preciosProductos en campaign-wizard.ts", done: true },
      { label: "[STORE] Renombrar modelosDescripcion → productosDescripcion en campaign-wizard.ts", done: true },
      { label: "[TYPES] Actualizar CampaignWizardState con los nuevos nombres de campo", done: true },
      { label: "[STORE] Eliminar import de MODELOS_BASE de campaign-wizard.ts", done: true },
      { label: "[STORE] Actualizar getAllModelos() → getAllProductos()", done: true },
      { label: "[HOOK] useWizardDraft: actualizar mapeo campaignToWizardState para nuevos nombres", done: true },
      { label: "[UI] Step4: labels 'Modelos' → 'Productos' y 'modelo' → 'producto' en todas las strings", done: true },
      { label: "[UI] Step5: referencias a modelo en piezas actualizadas a producto", done: true },
      { label: "[UI] Roadmap y CLAUDE.md: documentar convención renombrada", done: true },
      { label: "[API] prompt-generator.ts: referencias a 'modelos' → 'productos' en el prompt maestro", done: true },
      { label: "[DATA] campaign-data.ts: eliminar MODELOS_BASE (array de calzado hardcodeado)", done: true },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INTEGRACIÓN CLAUDE-ADS — profesionalización del motor creativo
  // Inspirado en: github.com/AgriciDaniel/claude-ads
  // ─────────────────────────────────────────────────────────────────────────────

  {
    fase: "Fase 25 — Generación de Copy Profesional (claude-ads level)",
    status: "done" as const,
    items: [
      // Piece generate — mejoras de prompt (sin schema change)
      { label: "[AI] Piece generate: aplicar framework declarado (AIDA/PAS/BAB/4P/FAB/Storytelling/Star-Story)", done: true },
      { label: "[AI] Piece generate: char limits por plataforma (Primary Text 125 chars, Headline 40, Descripción 30)", done: true },
      { label: "[AI] Piece generate: generar Variante A + Variante B de primary text y headline para A/B testing", done: true },
      { label: "[AI] Piece generate: Image Generation Brief estructurado (composición, colores hex, safe zones, dimensiones)", done: true },
      { label: "[AI] Piece generate: hook word en primeras 3 palabras del headline (regla de calidad)", done: true },
      // Campaign generate — mejoras de prompt
      { label: "[AI] Campaign generate: agregar imageBrief por pieza en JSON output (safe zones + prompt de imagen)", done: true },
      { label: "[AI] Campaign generate: agregar varianteB_primaryText y varianteB_headline por pieza en JSON", done: true },
      { label: "[AI] Campaign generate: remover sesgo colombiano del prompt ('Tono colombiano')", done: true },
      { label: "[AI] Campaign generate: agregar Star-Story-Solution como framework disponible", done: true },
      // DB + UI (requieren trabajo adicional)
      { label: "[DB] Piece: campo imageBriefGenerado (Text?) para guardar brief de asset estructurado", done: true },
      { label: "[UI] PieceDrawer: sección 'Brief de Asset' con imageBriefGenerado copiable y listo para Replicate/Runway", done: true },
      { label: "[UI] PieceDrawer: mostrar Variante A y Variante B de copy con switch para elegir cual publicar", done: true },
      { label: "[UI] CampaignGenerateSection: mostrar imageBrief por pieza en el acordeón", done: true },
    ],
  },

  {
    fase: "Fase 26 — Pipeline de Conceptos Creativos (pre-estructuración)",
    status: "done" as const,
    items: [
      { label: "[DB] Modelo Concepto: id, campaignId, nombre, hipotesis, anguloMensajeria, frameworkCopy, direccionVisual, isSelected, orden", done: true },
      { label: "[API] POST /api/campaigns/generate-concepts → Claude genera 3-5 conceptos basado en EmpresaIdentidad + brief", done: true },
      { label: "[UI] Paso 'Conceptos' integrado en wizard como Step 4 (entre Oferta y Estructura) — wizard ahora 6 pasos", done: true },
      { label: "[UI] Cards de concepto: nombre, hipótesis, ángulo badge, framework badge, dirección visual — elegir con checkbox", done: true },
      { label: "[UI] Botón 'Regenerar conceptos' con loader — paso opcional (se puede saltar)", done: true },
      { label: "[AI] Piece generate: incluir conceptos seleccionados en el prompt de cada pieza", done: true },
      { label: "[AI] Concepto generation: hipótesis (por qué va a funcionar) + ángulo + framework recomendado + dirección visual", done: true },
      { label: "[DB] Conceptos guardados en DB al crear campaña via POST /api/campaigns", done: true },
    ],
  },

  {
    fase: "Fase 29 — Fixes y Potenciación del Motor Creativo",
    status: "done" as const,
    items: [
      { label: "[BUG] prompt-generator.ts: Headlines ≤27 chars → corregido a ≤40 (límite real Meta Ads)", done: true },
      { label: "[BUG] Wizard Step Conceptos en posición incorrecta → movido después de Catálogo (Brief→Oferta→Catálogo→Conceptos→Estructura)", done: true },
      { label: "[ARCH] Unificar dos pipelines de generación: campaign brief JSON → auto-popular guionGenerado + copyGenerado + imageBriefGenerado en cada Piece de DB", done: true },
      { label: "[API] campaigns/[id]/generate: parsea JSON post-generación y actualiza cada Piece en DB con copy + guión + imageBrief (match posicional por adSet.orden + piece.orden)", done: true },
      { label: "[UI] Board: Piece con aiGeneratedAt ya muestra 'Regenerar' en vez de 'Generar con IA' — aprovecha el auto-populate del brief", done: true },
      { label: "[UX] Brief Step 2: auto-completa publicoObjetivo, tonoYestilo, propuestasValor, queNOhacer desde EmpresaIdentidad al montar (solo si campos vacíos)", done: true },
      { label: "[UX] Brief Step 2: botón 'Cargar perfil' para recargar identidad de empresa en cualquier momento", done: true },
      { label: "[INFRA] Rate limit separado: campaign brief = 3/día (key ai_brief:wid), piece generate = 30/día (key ai_piece:wid)", done: true },
      { label: "[UX] Wizard Step Presupuesto: warning si budget por ad set < COP 60.000/día en ABO (Meta best practice ≥$15 USD/ad set/día)", done: true },
    ],
  },

  {
    fase: "Fase 27 — Detección de Fatiga Creativa",
    status: "pending" as const,
    items: [
      { label: "[DB] Piece: campo fatigaDetectadaAt (DateTime?) para registrar cuándo se detectó fatiga", done: false },
      { label: "[API] Algoritmo fatiga: pieza PUBLICADO con CTR caída >20% en 14 días vs baseline → marcar fatigaDetectadaAt", done: false },
      { label: "[API] POST /api/empresas/[id]/fatigue-check → corre el algoritmo para todas las piezas de la empresa", done: false },
      { label: "[UI] Badge 'Fatiga' en PieceCard del board (naranja) cuando fatigaDetectadaAt != null", done: false },
      { label: "[UI] Panel en /metrics/empresa/[id] Tab Creativos: lista de piezas con fatiga detectada + días activa", done: false },
      { label: "[NOTIF] Notificación in-app al OWNER cuando una pieza entra en estado de fatiga", done: false },
      { label: "[UI] Botón 'Crear renovación' en pieza con fatiga → crea nueva pieza basada en la fatigada con badge 'Refresh'", done: false },
    ],
  },

  {
    fase: "Fase 28 — Meta Ads Health Score + Auditoría de Cuenta",
    status: "pending" as const,
    items: [
      { label: "[DB] Modelo AuditResult: id, empresaId, score (Int), checks (Json), quickWins (Json), createdAt", done: false },
      { label: "[API] POST /api/empresas/[id]/audit → corre checks automáticos + Claude genera Quick Wins, guarda resultado", done: false },
      { label: "[AI] Checks automáticos (50): formato diversity, creative fatigue %, learning limited %, CAPI conectado, frequency cap, budget sufficiency, CTR vs benchmark", done: false },
      { label: "[AI] Claude genera Quick Wins priorizados por impacto basado en checks fallidos", done: false },
      { label: "[UI] Tab 'Auditoría' en /metrics/empresa/[id]: Health Score 0-100, tabla PASS/WARNING/FAIL por check", done: false },
      { label: "[UI] Quick Wins section: lista ordenada por impacto estimado con acción sugerida", done: false },
      { label: "[UI] Badge de score (0-100) en card de empresa en /metrics con semáforo de color", done: false },
      { label: "[UI] Botón 'Re-auditar' con timestamp del último audit", done: false },
      { label: "[UI] Comparativa: score actual vs score período anterior", done: false },
    ],
  },

  {
    fase: "Fase 30 — Fixes Ciclo de Vida de Conceptos + Calidad de Pipeline",
    status: "done" as const,
    items: [
      // 🔴 Críticos — Fase 26 rota end-to-end
      { label: "[BUG] Conceptos NO entran en campaign brief generation: generate route no selecciona conceptos de DB ni los inyecta en el prompt", done: true },
      { label: "[BUG] promptMaestro no incluye conceptos seleccionados: prompt-generator.ts ignora state.conceptos aunque está disponible", done: true },
      { label: "[BUG] PATCH action:complete no guarda conceptos a DB (solo POST /api/campaigns lo hace)", done: true },
      { label: "[BUG] campaignToWizardState no mapea conceptos al restaurar draft desde DB → siempre vacíos", done: true },
      { label: "[BUG] GET /api/campaigns/[id] no incluía conceptos → restauración desde DB fallaba silenciosamente", done: true },
      { label: "[BUG] Autosave DB (action:autosave) no persiste conceptos → corregido currentStep a Math.min(..., 8)", done: true },
      // 🟡 Altos
      { label: "[SEC] Sin rate limit en POST /api/campaigns/generate-concepts → llamadas ilimitadas a Claude", done: true },
      { label: "[TRACK] Sin AiUsage tracking en generate-concepts → costo de tokens no registrado", done: true },
      // 🟠 Medios
      { label: "[BUG] currentStep hardcodeado a 7 en PATCH action:complete → corregido a 8", done: true },
      { label: "[BUG] campaignToWizardState clampea currentStep a 7 → corregido a 8", done: true },
      { label: "[PERF] useEffect sin dep array en useWizardDraft → agregado eslint-disable comment (comportamiento intencional)", done: true },
      { label: "[UX] Validador Step 1 solo verifica texto empresa, no empresaId → EmpresaIdentidad nunca carga si no hay selección real", done: true },
    ],
  },

  {
    fase: "Fase 23 — AI Core SuperAdmin (corazón configurable de la IA)",
    status: "done" as const,
    items: [
      { label: "[DB] Modelo AiCore: id, systemPrompt (Text), version (Int), isActive, createdAt, updatedAt", done: true },
      { label: "[DB] Modelo AiCoreVersion: id, aiCoreId, systemPrompt, version, createdAt (historial)", done: true },
      { label: "[API] GET /api/admin/ai-core → obtiene AiCore activo con historial (solo SUPER_ADMIN)", done: true },
      { label: "[API] PATCH /api/admin/ai-core → actualiza systemPrompt → crea versión anterior automáticamente", done: true },
      { label: "[API] POST /api/admin/ai-core/versions/[v]/restore → restaura versión anterior como activa", done: true },
      { label: "[UI] Página /admin/ai-core: editor de SYSTEM_PROMPT con textarea + historial expandible", done: true },
      { label: "[UI] Historial: versión, fecha, preview 80 chars, botón restaurar", done: true },
      { label: "[AI] generate routes (campaign + piece): cargan SYSTEM_PROMPT desde DB con cache 60s", done: true },
      { label: "[AI] Fallback: si no hay AiCore en DB, usa SYSTEM_PROMPT hardcoded en lib/ai/client.ts", done: true },
      { label: "[AI] invalidateSystemPromptCache() llamado al guardar/restaurar AiCore", done: true },
      { label: "[NAV] Link 'AI Core' en sidebar admin", done: true },
      { label: "[DB] AiCoreRule: CRUD de reglas de comportamiento por industria/rol", done: false },
      { label: "[SEED] Crear registro inicial AiCore con SYSTEM_PROMPT genérico actual", done: true },
    ],
  },

  {
    fase: "Fase 31 — Performance + Deuda técnica DB (2026-04-30)",
    status: "done" as const,
    items: [
      { label: "[PERF] N+1 en POST /api/campaigns: adSet+pieces creados en loop secuencial → Promise.all + nested createMany", done: true },
      { label: "[PERF] N+1 en PATCH action:complete: mismo patrón → Promise.all + nested createMany", done: true },
      { label: "[PERF] concepto.create loop → concepto.createMany (batch en ambas rutas)", done: true },
      { label: "[PERF] existingAdSets findMany → count (solo necesitamos saber si hay, no los IDs)", done: true },
      { label: "[ATOM] action:status: campaign.update + auditLog.create → db.$transaction([])", done: true },
      { label: "[ATOM] action:archive: mismo patrón → db.$transaction([])", done: true },
      { label: "[SEC] auditLogs sin take limit en GET /api/campaigns/[id] → take: 50", done: true },
      { label: "[PERF] Board: filtro CREATIVO en memoria JS → WHERE assigneeId en DB query", done: true },
      { label: "[PERF] Board: no filtraba campañas archivadas → isArchived: false en WHERE", done: true },
      { label: "[PERF] Empresa PATCH: findUnique + update (2 queries) → update con workspaceId-scoped WHERE + catch P2025", done: true },
      { label: "[DB] Migración tabla Producto: npx prisma db push (tabla productos en Neon)", done: true },
      // Fase 22 — catálogo de productos
      { label: "[FEAT] Modelo Producto en Prisma + tabla products en Neon", done: true },
      { label: "[FEAT] Step 4 Modelos → Productos: carga catálogo desde /api/empresas/[id]/productos", done: true },
      { label: "[FEAT] Step 4: checkboxes del catálogo con pre-fill de precios desde DB", done: true },
      { label: "[FEAT] /empresas/[id]: sección Catálogo de productos con add/delete UI", done: true },
    ],
  },

  {
    fase: "Fase 24 — EmpresaIdentidad expandida (contexto profundo para IA)",
    status: "done" as const,
    items: [
      { label: "[DB] EmpresaIdentidad: campo industria (String?) — descripción de industria para IA", done: true },
      { label: "[DB] EmpresaIdentidad: campo modeloNegocio (String?) — B2B, B2C, marketplace, suscripción, etc.", done: true },
      { label: "[DB] EmpresaIdentidad: campo ticketPromedio (String?) — rango de precio promedio por venta", done: true },
      { label: "[DB] EmpresaIdentidad: campo cicloVenta (String?) — tiempo promedio desde interés hasta compra", done: true },
      { label: "[DB] EmpresaIdentidad: campo temporadasClave (String?) — meses o eventos de mayor venta", done: true },
      { label: "[DB] EmpresaIdentidad: campo equipoCreativo (String?) — roles disponibles en el equipo interno", done: true },
      { label: "[DB] EmpresaIdentidad: campo metaPrincipal (String?) — objetivo principal de las campañas (ventas, leads, awareness)", done: true },
      { label: "[API] PATCH /api/empresas/[id]/identidad: acepta y persiste los 7 campos nuevos", done: true },
      { label: "[UI] Formulario /empresas/[id]: nueva sección 'Contexto de negocio' con los 7 campos", done: true },
      { label: "[UI] Formulario /empresas/nueva: preguntar industria y modeloNegocio en paso 1", done: false },
      { label: "[AI] campaigns/generate: incluir los 7 campos nuevos en el contexto de empresa del system prompt", done: true },
      { label: "[AI] pieces/generate: incluir los 7 campos nuevos en el contexto de empresa", done: true },
      { label: "[AI] Validar con 3 industrias distintas: brief generado debe ser contextualmente preciso", done: false },
    ],
  },
]

const STATUS_STYLE = {
  done: { bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", label: "Completado", dot: "bg-emerald-500" },
  "in-progress": { bg: "bg-primary/5 border-primary/20", badge: "bg-primary/10 text-primary", label: "En progreso", dot: "bg-primary animate-pulse" },
  pending: { bg: "bg-card border-border", badge: "bg-muted text-muted-foreground", label: "Pendiente", dot: "bg-muted-foreground/30" },
}

function FaseAccordion({ fase }: { fase: typeof ROADMAP[0] }) {
  const st = STATUS_STYLE[fase.status]
  const doneCount = fase.items.filter(i => i.done).length
  const [open, setOpen] = useState(fase.status === "in-progress")

  return (
    <div className={`rounded-2xl border overflow-hidden ${st.bg}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03]"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
        <span className="flex-1 text-sm font-semibold text-foreground">{fase.fase}</span>
        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0 ${st.badge}`}>{st.label}</span>
        <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-10 text-right">{doneCount}/{fase.items.length}</span>
        {open
          ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-5 pb-4 pt-1 border-t border-black/5">
          <ul className="space-y-2 pt-2">
            {fase.items.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${item.done ? "bg-emerald-500 text-white" : "border-2 border-border bg-background"}`}>
                  {item.done ? "✓" : ""}
                </span>
                <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function RoadmapPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Estado del desarrollo de Traffely</p>
      </div>

      <div className="space-y-2">
        {ROADMAP.map((fase) => (
          <FaseAccordion key={fase.fase} fase={fase} />
        ))}
      </div>
    </div>
  )
}
