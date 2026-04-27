import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Redis sliding window (persiste entre deploys)
const redisLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "24 h"),
      prefix: "traffely:rl",
    })
  : null

// Fallback in-memory (dev local sin Redis configurado)
interface Window { count: number; resetAt: number }
const store = new Map<string, Window>()

function inMemoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  let win = store.get(key)
  if (!win || win.resetAt <= now) {
    win = { count: 0, resetAt: now + windowMs }
    store.set(key, win)
  }
  win.count++
  return {
    allowed: win.count <= limit,
    remaining: Math.max(0, limit - win.count),
    resetAt: win.resetAt,
  }
}

/**
 * @param key      Identificador único (ej: `ai_gen:workspaceId`)
 * @param limit    Máximo de llamadas en la ventana (solo usado en fallback in-memory)
 * @param windowMs Duración ventana en ms — default 24h (solo fallback)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs = 24 * 60 * 60 * 1000
): Promise<RateLimitResult> {
  if (redisLimiter) {
    const { success, remaining, reset } = await redisLimiter.limit(key)
    return { allowed: success, remaining, resetAt: reset }
  }
  return inMemoryLimit(key, limit, windowMs)
}
