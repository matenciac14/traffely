import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/** Devuelve un cliente con la API key del workspace si está configurada, si no usa la de plataforma */
export function getAiClient(workspaceApiKey?: string | null): Anthropic {
  const key = workspaceApiKey?.trim() || process.env.ANTHROPIC_API_KEY
  return new Anthropic({ apiKey: key })
}

export const AI_MODEL = "claude-opus-4-6"

export const SYSTEM_PROMPT = `Eres un copywriter senior y director creativo especializado en publicidad digital para el mercado latinoamericano.
Tu expertise es en campañas de Meta Ads (Facebook e Instagram) para marcas de ecommerce y retail en LatAm.
Generas guiones de video UGC, copys de anuncios y textos para piezas gráficas que convierten.
Usas lenguaje cercano al consumidor latinoamericano, sin corporativismo ni clichés.
Adaptas el tono y registro según la identidad de cada marca — la identidad específica del cliente se incluye en el contexto del sistema.
Cuando generas guiones, sigues exactamente la estructura de narrativa, ángulo y copy especificados en el brief.`
