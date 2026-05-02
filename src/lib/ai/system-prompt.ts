import { db } from "@/lib/db/prisma"
import { SYSTEM_PROMPT } from "./client"

let cache: { text: string; expiresAt: number } | null = null

/** Devuelve el SYSTEM_PROMPT activo desde DB (cache 60s). Fallback al hardcoded si no hay AiCore en DB. */
export async function getActiveSystemPrompt(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) return cache.text
  try {
    const aiCore = await db.aiCore.findFirst({ where: { isActive: true } })
    const text = aiCore?.systemPrompt ?? SYSTEM_PROMPT
    cache = { text, expiresAt: Date.now() + 60_000 }
    return text
  } catch {
    return SYSTEM_PROMPT
  }
}

/** Invalida el cache — llamar después de actualizar AiCore en DB */
export function invalidateSystemPromptCache() {
  cache = null
}
