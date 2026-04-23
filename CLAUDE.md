# Traffely

## Qué es
SaaS multi-tenant para equipos de ecommerce — gestión de campañas Meta Ads con brief estructurado, generación de contenido con IA (Claude), board de tareas tipo Jira para el equipo creativo, y panel de administración por workspace.

## Stack
- Next.js 16 + TypeScript + App Router
- PostgreSQL (Neon) + Prisma v5
- Tailwind v4 + shadcn/ui
- Auth.js v5 (next-auth@beta) — credentials provider (Google OAuth eliminado)
- Zustand (estado UI wizard)
- AWS S3 bucket `traffely-creatives` (us-east-1) — archivos creativos ✅
- Anthropic SDK `claude-opus-4-6` (generación de brief + copys)
- pnpm

## Estructura
```
src/
├── app/
│   ├── (auth)/login              ← login page
│   ├── (dashboard)/              ← layout con sidebar + topbar + NotificationBell
│   │   ├── campaigns/            ← lista + wizard + detalle
│   │   ├── board/                ← Kanban de piezas + PieceDrawer
│   │   └── settings/             ← workspace info + equipo + perfil IA + billing + AI key
│   ├── admin/                    ← solo SUPER_ADMIN
│   │   ├── workspaces/           ← lista y detalle de clientes
│   │   ├── roadmap/              ← build tracker
│   │   └── ai-usage/             ← consumo IA por workspace
│   └── api/
│       ├── campaigns/            ← CRUD + autosave + generate (SSE)
│       ├── pieces/[id]/          ← GET + PATCH + comments + generate (SSE) + upload (S3)
│       ├── notifications/        ← GET (no leídas) + PATCH (marcar leídas)
│       ├── workspace/
│       │   ├── ai-profile/       ← GET + PATCH perfil IA
│       │   ├── ai-key/           ← GET + PATCH clave IA (AES-256-GCM)
│       │   └── members/          ← GET + POST + PATCH + DELETE miembros
│       └── admin/workspaces/     ← CRUD workspaces (SUPER_ADMIN)
├── features/
│   ├── campaigns/
│   │   ├── components/wizard/    ← Steps 1–7 + StepPromptOutput
│   │   └── hooks/useWizardDraft  ← autosave localStorage + DB
│   └── dashboard/components/     ← DashboardSidebar, DashboardTopbar, NotificationBell
├── lib/
│   ├── db/prisma.ts
│   ├── auth/config.ts
│   ├── ai/client.ts              ← Anthropic singleton + SYSTEM_PROMPT
│   ├── s3/client.ts              ← S3Client + presigned PUT/GET URLs + buildKey
│   └── utils/
│       ├── crypto.ts             ← AES-256-GCM encrypt/decrypt para API keys
│       └── logger.ts             ← logger estructurado con error IDs
└── proxy.ts                      ← middleware de protección de rutas (Next.js 16)
```

## Roles
| Rol | Acceso |
|-----|--------|
| `SUPER_ADMIN` | Panel `/admin` — gestión de todos los workspaces (Miguel) |
| `OWNER` | Dashboard completo — crea campañas, gestiona equipo, configura IA |
| `CREATIVO` | Board + sus piezas asignadas, sube archivos |
| `TRAFFICKER` | Ve piezas APROBADO, marca como PUBLICADO |
| `VIEWER` | Solo lectura |

## Jerarquía de datos
```
Workspace → User (rol)
Workspace → Campaign → AdSet → Piece
Workspace → AiUsage
```

## Estados de campaña
`DRAFT → REVIEW → APPROVED → LIVE → FINISHED`

## Estados de pieza (board)
`PENDIENTE → EN_PRODUCCION → EN_REVISION → APROBADO → PUBLICADO | RECHAZADO`

## Reglas duras de desarrollo
- **Multi-tenant**: siempre `where: { workspaceId: session.user.workspaceId }` — nunca confiar en workspaceId del body
- **Roles**: verificar `session.user.role` en cada ruta que lo requiera
- **API keys**: Anthropic y AWS solo en backend — nunca en cliente
- **Autosave**: debounce ≥ 2s — no saturar la DB
- **Rate limit**: 10 generaciones IA/24h por workspace (in-memory — migrar a Redis/Upstash)
- **Inputs**: Zod en todas las API routes críticas (members, workspaces, pieces, ai-profile, meta)
- **Passwords**: bcryptjs, nunca texto plano
- **S3**: bucket privado — usar siempre presigned URLs para upload (PUT, 15min) y preview (GET, 1hr)
- **API keys workspace**: cifrar con AES-256-GCM antes de guardar en DB (`lib/utils/crypto.ts`)

## Integración Shopify (Fase 10)
- **Objetivo**: catálogo read-only para importar productos/variantes en el wizard
- **Modelo DB**: `ShopifyIntegration` (workspaceId unique, shop, accessToken cifrado AES-256-GCM, scope, isActive)
- **OAuth**: `POST /api/integrations/shopify/connect` → URL → Shopify → `GET /api/integrations/shopify/callback`
- **Estado/desconectar**: `GET|DELETE /api/integrations/shopify`
- **Productos on-demand**: `GET /api/integrations/shopify/products` → llama API Shopify en tiempo real
- **Scope**: `read_products` únicamente — sin acceso a pedidos, clientes ni escritura
- **Env vars**: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` (crear App privada en Shopify Partners)
- **State OAuth**: in-memory Map con TTL 10min (MVP — migrar a Redis si hay multi-instancia)
- **Uso en wizard**:
  - Step 3 Oferta: `ShopifyProductPicker` → pre-fill `contextoOferta` con nombre + precio
  - Step 4 Modelos: `ShopifyProductPicker` → importa variantes como modelos con precios
- **UI Settings**: tab "Shopify" en `/settings?tab=shopify` — solo OWNER/SUPER_ADMIN
- **Sin sync en background**: los productos se leen en tiempo real, no se guardan en DB

## IA — Generación de brief
- Endpoint: `POST /api/campaigns/[id]/generate` → SSE stream
- Modelo: `claude-opus-4-6`, `max_tokens: 16000`
- Sistema: `SYSTEM_PROMPT` + perfil IA del workspace (`aiProfile` en Workspace)
- Fallback: mock stream si no hay `ANTHROPIC_API_KEY` o falla auth
- Tracking: `AiUsage` — $5/1M input, $25/1M output

## Gestión de equipo (Workspace)
- OWNER puede invitar, cambiar rol y desactivar miembros
- Roles disponibles al invitar: CREATIVO, TRAFFICKER, VIEWER
- No se puede cambiar el propio rol ni modificar otro OWNER
- API: `/api/workspace/members` (GET/POST) y `/api/workspace/members/[id]` (PATCH/DELETE)

## Board — Módulo de gestión de tareas

### Arquitectura
- `board/page.tsx` (server) → fetch pieces + members → pasa a `BoardKanban`
- `board/BoardKanban.tsx` (client) → estado del drawer, filtros, renderiza columnas
- `board/PieceDrawer.tsx` (client) → panel lateral tipo Jira, fetch on open
- `board/PieceCard.tsx` → integrado en BoardKanban

### Flujo de trabajo
```
PENDIENTE → EN_PRODUCCION → EN_REVISION → APROBADO → PUBLICADO
                                        ↘ RECHAZADO → EN_PRODUCCION
```

### Permisos en el board
| Acción | OWNER | CREATIVO | TRAFFICKER | VIEWER |
|--------|-------|----------|------------|--------|
| Ver todas las piezas | ✓ | Solo asignadas | ✓ | ✓ |
| Avanzar/retroceder estado | ✓ | ✓ | ✓ | ✗ |
| Asignar piezas | ✓ | ✗ | ✗ | ✗ |
| Comentar | ✓ | ✓ | ✓ | ✓ |

### APIs
- `GET /api/pieces/[id]` — detalles + genera `archivoSignedUrl` (presigned GET S3, 1hr) si hay archivo
- `PATCH /api/pieces/[id]` — cambio de estado/assignee/prioridad/dueDate/archivoUrl+Key/adUrl
- `GET/POST /api/pieces/[id]/comments` — comentarios por pieza
- `POST /api/pieces/[id]/generate` — genera guión+copy con Claude (SSE stream)
- `POST /api/pieces/[id]/upload` — genera presigned PUT URL para S3 (15min)

### Materialización de piezas
Cuando el wizard completa (action: "complete" en PATCH /api/campaigns/[id]):
- Itera `wizardState.campanas[].conjuntos[]` → crea AdSet
- Itera `conjunto.piezas[]` → crea Piece con taskStatus: PENDIENTE
- No recrea si ya existen adSets para esa campaña

## Perfil de IA (por workspace)
Campos en `aiProfile Json?` de Workspace:
- `descripcionEmpresa` — contexto de negocio
- `publicoObjetivo` — audiencia detallada
- `tonoMarca` — voz y estilo
- `propuestasValorFijas` — siempre incluir en copys
- `palabrasProhibidas` — nunca usar
- `instruccionesExtra` — reglas adicionales

## Usuarios demo (seed)
| Email | Password | Rol |
|-------|----------|-----|
| miguel@traffely.com | traffely2024 | SUPER_ADMIN |
| admin@serranogroup.com | serrano2024 | OWNER |
| creativo@serranogroup.com | serrano2024 | CREATIVO |
| trafficker@serranogroup.com | serrano2024 | TRAFFICKER |

## IA — Generación por pieza
- Endpoint: `POST /api/pieces/[id]/generate` → SSE stream
- Genera guión + copy para la pieza individual, contexto = campos de la pieza + aiProfile
- Sanitiza inputs antes de incluirlos en el prompt (escape markdown)
- Guarda `guionGenerado`, `copyGenerado`, `aiGeneratedAt` en Piece
- Tracking: `AiUsage` con `action: "piece_generate"`
- Rate limit compartido con generación de brief: 10/24h por workspace

## Pieza — campos
- `priority String?` — BAJA | MEDIA | ALTA | URGENTE
- `dueDate DateTime?` — fecha límite
- `adUrl String?` — link del ad en Meta (aparece en drawer cuando status=PUBLICADO)
- `archivoUrl String?` — URL base S3 (no usar directamente — bucket privado)
- `archivoKey String?` — key S3 del archivo (`workspaces/{id}/campaigns/{id}/pieces/{id}/{filename}`)
- `guionGenerado String?` / `copyGenerado String?` / `aiGeneratedAt DateTime?` — contenido IA

## Notificaciones in-app
- Modelo `Notification` en DB: userId, workspaceId, type, title, body, read, pieceId
- Se crea automáticamente en `PATCH /api/pieces/[id]` cuando cambia el taskStatus y la pieza tiene assignee ≠ actor
- `GET /api/notifications` → lista no leídas del usuario actual (max 20)
- `PATCH /api/notifications` → marca todas como leídas
- `NotificationBell` en `DashboardTopbar` — polling al montar, dropdown con lista + "marcar todas como leídas"

## S3 — Archivos creativos
- Bucket: `traffely-creatives` (us-east-1) — **privado**
- Flujo upload: `POST /api/pieces/[id]/upload` → presigned PUT URL (15min) → browser sube directo a S3 → `PATCH /api/pieces/[id]` guarda archivoUrl + archivoKey
- Flujo preview: `GET /api/pieces/[id]` genera presigned GET URL (1hr) → drawer usa `archivoSignedUrl`
- Key format: `workspaces/{workspaceId}/campaigns/{campaignId}/pieces/{pieceId}/{timestamp}.{ext}`

## Billing + AI Keys (Fase 8 parcial)
- OWNER ve billing en settings: plan, estado, próximo cobro (datos del workspace, editados por SUPER_ADMIN)
- OWNER puede configurar su propia API key de IA (Anthropic/OpenAI/Gemini)
- AI key cifrada con AES-256-GCM usando `ENCRYPTION_KEY` (64 hex chars en env)
- Los endpoints de generación usan la key del workspace si está configurada, sino la global

## Seguridad — implementado
- Security headers (CSP, X-Frame-Options, nosniff, Referrer-Policy)
- Rate limiting IA in-memory 10/24h por workspace
- AI profile GET restringido a OWNER/SUPER_ADMIN
- Zod en members routes (POST invite, PATCH role/isActive) y otras rutas críticas
- Sanitización de inputs en prompts IA (escape markdown, máx 2000 chars)
- Audit log en: member.invite, member.update, member.remove, workspace.activate/deactivate, workspace.billing, workspace.delete
- Soft delete en workspaces (isDeleted + deletedAt)
- Sesión: maxAge 30d, cookies httpOnly + secure en prod
- Logger estructurado (`src/lib/logger.ts`) reemplazando console.error
- Encriptación AES-256-GCM para API keys de workspace (`lib/utils/crypto.ts`)
- S3 key validation en PATCH pieces (prefijo debe ser `workspaces/{workspaceId}/`)
- Índices DB: Campaign (workspaceId, createdById, status), AdSet (campaignId), Piece (adSetId, assigneeId, taskStatus), Notification (userId+read)
- Deploy en Vercel + Neon (traffely.com live) ✅

## Seguridad — pendiente
- Rate limiting en registro (anti-spam)
- Verificación de email al invitar usuarios
- Google OAuth (requiere credenciales — eliminado por ahora)
- Notificaciones por email (invitación, cambio estado)
- Rate limiting Redis/Upstash para producción (reemplazar in-memory)
- Fix CSP (remover unsafe-inline/eval)
- CSRF tokens en formularios POST

## Ver también
~/.claude/CLAUDE.md para reglas globales de Miguel
