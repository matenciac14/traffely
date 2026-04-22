# Traffely

## Qué es
SaaS multi-tenant para equipos de ecommerce — gestión de campañas Meta Ads con brief estructurado, generación de contenido con IA, y board de tareas tipo Jira/Notion para el equipo creativo.

## Stack
- Next.js 16 + TypeScript + App Router
- PostgreSQL + Prisma v7
- Tailwind v4 + shadcn/ui
- Auth.js v5 (next-auth@beta)
- Zustand (estado UI)
- AWS S3 (archivos creativos)
- Anthropic SDK (generación de guiones y copys)
- pnpm

## Estructura
```
src/
├── app/
│   ├── (auth)/login|register
│   ├── (dashboard)/campaigns|board|settings
│   ├── admin/              ← solo SUPER_ADMIN
│   └── api/                ← API routes
├── features/               ← lógica por dominio
│   ├── auth/
│   ├── campaigns/          ← wizard 7 pasos + prompt maestro
│   ├── board/              ← Kanban de piezas
│   ├── workspace/
│   └── admin/
├── lib/
│   ├── db/prisma.ts        ← cliente Prisma singleton
│   ├── auth/config.ts      ← Auth.js config
│   ├── auth/session.ts     ← helpers de sesión
│   ├── s3/client.ts        ← presigned URLs
│   ├── ai/client.ts        ← Anthropic client
│   └── utils/errors.ts     ← AppError clases
└── middleware.ts            ← protección de rutas
```

## Roles
- `SUPER_ADMIN` — dueño del SaaS (Miguel), accede a /admin
- `OWNER` — dueño del workspace, crea campañas, aprueba piezas
- `CREATIVO` — ve sus tareas asignadas, sube archivos a S3
- `TRAFFICKER` — ve piezas aprobadas, marca como publicadas
- `VIEWER` — solo lectura

## Reglas duras
- Multi-tenant desde el día 1: **siempre** `where: { workspaceId }` en queries
- API keys de Anthropic y AWS **nunca** en el cliente — solo backend
- Auth: nunca confiar en `workspaceId` del body — siempre usar `session.user.workspaceId`
- Autosave: debounce 2-3s al backend, no 500ms
- Rate limit: máx 5 generaciones IA simultáneas por workspace

## Jerarquía de datos
```
Workspace → Campaign → AdSet → Piece
```

## Estados de campaña
DRAFT → REVIEW → APPROVED → LIVE → FINISHED

## Estados de pieza (board)
PENDIENTE → EN_PRODUCCION → EN_REVISION → APROBADO → PUBLICADO | RECHAZADO

## Prompt maestro
- Estructura fija en Markdown (mismo orden siempre)
- `promptVersion` explícito en campaigns
- Generado en el servidor, nunca en el cliente

## Paleta (Serrano Group / Tennispremium)
- cream: #FAFAF9
- carbon: #4B4441
- graphite: #333
- gold (CTAs): acento dorado

## Ver también
~/.claude/CLAUDE.md para reglas globales
