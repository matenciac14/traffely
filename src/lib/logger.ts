// Structured logger — replaces console.error across API routes

const isDev = process.env.NODE_ENV === "development"

function log(level: "info" | "warn" | "error", context: string, message: unknown, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    ctx: context,
    msg: message instanceof Error ? message.message : String(message),
    ...(message instanceof Error && isDev ? { stack: message.stack } : {}),
    ...meta,
  }
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  fn(JSON.stringify(entry))
}

export const logger = {
  info: (ctx: string, msg: unknown, meta?: Record<string, unknown>) => log("info", ctx, msg, meta),
  warn: (ctx: string, msg: unknown, meta?: Record<string, unknown>) => log("warn", ctx, msg, meta),
  error: (ctx: string, msg: unknown, meta?: Record<string, unknown>) => log("error", ctx, msg, meta),
}
