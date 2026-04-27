const META_API_BASE = "https://graph.facebook.com/v21.0"

export interface MetaAccountInfo {
  id: string
  name: string
  currency: string
  timezone_name: string
}

export interface MetaInsights {
  spend: string
  impressions: string
  clicks: string
  ctr: string
  cpc: string
  purchase_roas?: { action_type: string; value: string }[]
  date_start: string
  date_stop: string
}

export interface MetaCampaignInsights {
  campaign_id: string
  campaign_name: string
  status?: string
  spend: string
  impressions: string
  clicks: string
  ctr: string
  cpc: string
  purchase_roas?: { action_type: string; value: string }[]
}

export interface DateRange {
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
}

async function metaFetch(path: string, params: Record<string, string>, token: string) {
  const url = new URL(`${META_API_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set("access_token", token)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = await res.json() as { error?: { message: string }; data?: unknown }

  if (data.error) {
    throw new Error(data.error.message ?? "Meta API error")
  }

  return data
}

function normalizeAccountId(adAccountId: string): string {
  return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`
}

export async function testMetaConnection(adAccountId: string, accessToken: string): Promise<MetaAccountInfo> {
  const accountId = normalizeAccountId(adAccountId)
  const data = await metaFetch(`/${accountId}`, {
    fields: "id,name,currency,timezone_name",
  }, accessToken)
  return data as unknown as MetaAccountInfo
}

export async function getAccountInsights(
  adAccountId: string,
  accessToken: string,
  dateRange: DateRange,
): Promise<MetaInsights | null> {
  const accountId = normalizeAccountId(adAccountId)
  try {
    const data = await metaFetch(`/${accountId}/insights`, {
      fields: "spend,impressions,clicks,ctr,cpc,purchase_roas",
      time_range: JSON.stringify(dateRange),
      level: "account",
    }, accessToken) as { data?: MetaInsights[] }
    return data.data?.[0] ?? null
  } catch {
    return null
  }
}

export async function getCampaignsInsights(
  adAccountId: string,
  accessToken: string,
  dateRange: DateRange,
): Promise<MetaCampaignInsights[]> {
  const accountId = normalizeAccountId(adAccountId)
  try {
    const data = await metaFetch(`/${accountId}/insights`, {
      fields: "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,purchase_roas",
      time_range: JSON.stringify(dateRange),
      level: "campaign",
      limit: "50",
    }, accessToken) as { data?: MetaCampaignInsights[] }
    return data.data ?? []
  } catch {
    return []
  }
}

export interface AudienceBreakdownRow {
  spend: string
  impressions: string
  clicks: string
  [key: string]: string
}

export interface DailyInsightsRow {
  date_start: string
  spend: string
  impressions: string
  clicks: string
  purchase_roas?: { action_type: string; value: string }[]
}

export async function getDailyInsights(
  adAccountId: string,
  accessToken: string,
  dateRange: DateRange,
): Promise<DailyInsightsRow[]> {
  const accountId = normalizeAccountId(adAccountId)
  try {
    const data = await metaFetch(`/${accountId}/insights`, {
      fields: "spend,impressions,clicks,purchase_roas",
      time_range: JSON.stringify(dateRange),
      time_increment: "1",
      level: "account",
      limit: "90",
    }, accessToken) as { data?: DailyInsightsRow[] }
    return data.data ?? []
  } catch {
    return []
  }
}

export async function getAudienceBreakdown(
  adAccountId: string,
  accessToken: string,
  dateRange: DateRange,
  breakdown: "age,gender" | "device_platform" | "country" | "publisher_platform,platform_position",
): Promise<AudienceBreakdownRow[]> {
  const accountId = normalizeAccountId(adAccountId)
  try {
    const data = await metaFetch(`/${accountId}/insights`, {
      fields: "spend,impressions,clicks",
      time_range: JSON.stringify(dateRange),
      breakdowns: breakdown,
      level: "account",
      limit: "100",
    }, accessToken) as { data?: AudienceBreakdownRow[] }
    return data.data ?? []
  } catch {
    return []
  }
}

export function extractROAS(purchase_roas?: { action_type: string; value: string }[]): string {
  if (!purchase_roas?.length) return "—"
  const entry = purchase_roas.find(r => r.action_type === "omni_purchase") ?? purchase_roas[0]
  return entry ? `${parseFloat(entry.value).toFixed(2)}x` : "—"
}

export function fmtCurrency(value: string, currency = "USD"): string {
  const n = parseFloat(value || "0")
  if (isNaN(n)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
}

export function fmtNumber(value: string): string {
  const n = parseFloat(value || "0")
  if (isNaN(n)) return "—"
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)
}
