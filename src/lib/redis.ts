import { Redis } from "@upstash/redis"

/**
 * Redis client singleton (Upstash REST).
 * null cuando no hay env vars — permite fallback in-memory en dev local.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null
