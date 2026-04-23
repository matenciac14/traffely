/**
 * In-memory rate limiter por workspace.
 * Para producción: reemplazar con Redis (Upstash).
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key      Identificador único (ej: `ai_gen:workspaceId`)
 * @param limit    Máximo de llamadas permitidas en la ventana
 * @param windowMs Duración de la ventana en ms (default: 24h)
 */
export function rateLimit(key: string, limit: number, windowMs = 24 * 60 * 60 * 1000): RateLimitResult {
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
