export function formatMoney(num: string | number | undefined): string {
  if (!num) return "0"
  return new Intl.NumberFormat("es-CO").format(parseInt(String(num)))
}

export function parseMoney(str: string): string {
  return String(str).replace(/[^\d]/g, "")
}
