# Traffely

## Qué es
SaaS multi-tenant para equipos de ecommerce — gestión de campañas Meta Ads con brief estructurado, generación de contenido con IA (Claude), board de tareas tipo Jira para el equipo creativo, y panel de administración por workspace.

## Stack
- Next.js 16 + TypeScript + App Router
- PostgreSQL (Neon) + Prisma v7
- Tailwind v4 + shadcn/ui
- Auth.js v5 (next-auth@beta) — credentials provider
- Zustand (estado UI wizard)
- AWS S3 (archivos creativos — pendiente)
- Anthropic SDK `claude-opus-4-6` (generación de brief + copys)
- pnpm

## Estructura
```
src/
├── app/
│   ├── (auth)/login              ← login page
│   ├── (dashboard)/              ← layout con sidebar + topbar
│   │   ├── campaigns/            ← lista + wizard + detalle
│   │   ├── board/                ← Kanban de piezas
│   │   └── settings/             ← workspace info + equipo + perfil IA
│   ├── admin/                    ← solo SUPER_ADMIN
│   │   ├── workspaces/           ← lista y detalle de clientes
│   │   ├── roadmap/              ← build tracker
│   │   └── ai-usage/             ← consumo IA por workspace
│   └── api/
│       ├── campaigns/            ← CRUD + autosave + generate (SSE)
│       ├── workspace/
│       │   ├── ai-profile/       ← GET + PATCH perfil IA
│       │   └── members/          ← GET + POST + PATCH + DELETE miembros
│       └── admin/workspaces/     ← CRUD workspaces (SUPER_ADMIN)
├── features/
│   ├── campaigns/
│   │   ├── components/wizard/    ← Steps 1–7 + StepPromptOutput
│   │   └── hooks/useWizardDraft  ← autosave localStorage + DB
│   └── dashboard/components/     ← DashboardSidebar, DashboardTopbar
├── lib/
│   ├── db/prisma.ts
│   ├── auth/config.ts
│   ├── ai/client.ts              ← Anthropic singleton + SYSTEM_PROMPT
│   └── utils/
└── middleware.ts                 ← protección de rutas
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
- **Rate limit**: máx 5 generaciones IA simultáneas por workspace (pendiente implementar)
- **Inputs**: validar con Zod en API routes (pendiente — actualmente `req.json()` raw)
- **Passwords**: bcryptjs, nunca texto plano

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
- `GET/PATCH /api/pieces/[id]` — detalles + cambio de estado/assignee
- `GET/POST /api/pieces/[id]/comments` — comentarios por pieza

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

## Pieza — campos adicionales
- `priority String?` — BAJA | MEDIA | ALTA | URGENTE
- `dueDate DateTime?` — fecha límite
- `adUrl String?` — link del ad en Meta (aparece en drawer cuando status=PUBLICADO)

## Seguridad — implementado
- Security headers (CSP, X-Frame-Options, nosniff, Referrer-Policy)
- Rate limiting IA in-memory 10/24h por workspace
- AI profile GET restringido a OWNER/SUPER_ADMIN
- Zod en members routes (POST invite, PATCH role/isActive)
- Sanitización de inputs en prompts IA (escape markdown, máx 2000 chars)
- Audit log en: member.invite, member.update, member.remove, workspace.activate/deactivate, workspace.billing, workspace.delete
- Soft delete en workspaces (isDeleted + deletedAt, hard delete reemplazado)
- Sesión: maxAge 30d, cookies httpOnly + secure en prod
- Logger estructurado (`src/lib/logger.ts`) reemplazando console.error

## Seguridad — pendiente
- Rate limiting en registro (anti-spam)
- Verificación de email al invitar usuarios
- Google OAuth (requiere credenciales)
- Notificaciones por email
- Rate limiting Redis/Upstash para producción
- Deploy Vercel + Neon producción

## Ver también
~/.claude/CLAUDE.md para reglas globales de Miguel
