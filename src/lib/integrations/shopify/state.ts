import { redis } from "@/lib/redis"

const TTL_SECONDS = 10 * 60 // 10 minutos

interface OAuthState {
  shop: string
  workspaceId: string
}

// Fallback in-memory para dev local
const localStore = new Map<string, OAuthState & { expiresAt: number }>()

export async function saveState(state: string, data: OAuthState): Promise<void> {
  if (redis) {
    await redis.set(`shopify:state:${state}`, JSON.stringify(data), { ex: TTL_SECONDS })
  } else {
    localStore.set(state, { ...data, expiresAt: Date.now() + TTL_SECONDS * 1000 })
  }
}

export async function getAndDeleteState(state: string): Promise<OAuthState | null> {
  if (redis) {
    const key = `shopify:state:${state}`
    const raw = await redis.get<string>(key)
    if (!raw) return null
    await redis.del(key)
    return typeof raw === "string" ? JSON.parse(raw) : raw as OAuthState
  }

  // Fallback in-memory
  const entry = localStore.get(state)
  localStore.delete(state)
  if (!entry || entry.expiresAt < Date.now()) return null
  return { shop: entry.shop, workspaceId: entry.workspaceId }
}
