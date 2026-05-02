"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  SparklesIcon, CheckIcon, AlertCircleIcon, Loader2Icon, RefreshCwIcon,
  ChevronDownIcon, ChevronUpIcon, CopyIcon, DownloadIcon, LayoutGridIcon, PrinterIcon,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Status = "idle" | "generating" | "done" | "error"

interface BriefResumen {
  objetivo: string
  insight: string
  estrategia: string
  totalPiezas: number
  totalCopys: number
}

interface BriefPieza {
  id: string
  modelo: string
  tipoPieza: string
  angulo: string
  hookTipo: string
  hookApertura: string
  framework: string
  registroVoz: string
  primaryText: string
  headline: string
  descripcion: string
  varianteB_primaryText?: string
  varianteB_headline?: string
  imageBrief?: string
  guionResumen: string
  justificacion: string
}

interface BriefData {
  resumen: BriefResumen
  piezas: BriefPieza[]
}

function parseBriefJson(text: string): BriefData | null {
  try {
    // Extract JSON from possible markdown code blocks
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim()
    const data = JSON.parse(clean)
    if (data?.resumen && Array.isArray(data?.piezas)) return data as BriefData
    return null
  } catch {
    return null
  }
}

function PiezaCard({ pieza, index }: { pieza: BriefPieza; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const [copied, setCopied] = useState<"a" | "b" | "brief" | null>(null)

  const TIPO_COLOR: Record<string, string> = {
    Video: "bg-violet-50 text-violet-700",
    Imagen: "bg-blue-50 text-blue-700",
    Carrusel: "bg-amber-50 text-amber-700",
  }
  const tipoColor = TIPO_COLOR[pieza.tipoPieza] ?? "bg-muted text-muted-foreground"

  async function copyText(text: string, key: "a" | "b" | "brief") {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <span className="text-xs font-mono font-bold text-muted-foreground w-16 flex-shrink-0">{pieza.id}</span>
        <span className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{pieza.modelo}</span>
          <span className="text-xs text-muted-foreground ml-2">{pieza.angulo}</span>
        </span>
        <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0", tipoColor)}>
          {pieza.tipoPieza}
        </span>
        <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">{pieza.framework}</span>
        {open ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-card space-y-4 border-t border-border">
          {/* Meta row */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { label: "Hook", value: pieza.hookTipo },
              { label: "Framework", value: pieza.framework },
              { label: "Voz", value: pieza.registroVoz },
            ].map(({ label, value }) => (
              <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs">
                <span className="font-semibold text-muted-foreground">{label}:</span>
                <span className="text-foreground">{value}</span>
              </span>
            ))}
          </div>

          {/* Hook apertura */}
          {pieza.hookApertura && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Apertura</p>
              <p className="text-sm font-medium text-foreground italic bg-muted/40 px-3 py-2 rounded-lg border-l-2 border-primary">
                &ldquo;{pieza.hookApertura}&rdquo;
              </p>
            </div>
          )}

          {/* Guión resumen */}
          {pieza.guionResumen && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {pieza.tipoPieza === "Video" ? "Guión" : "Brief visual"}
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{pieza.guionResumen}</p>
            </div>
          )}

          {/* Primary text — Variante A */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Primary Text{pieza.varianteB_primaryText ? " — Variante A" : ""}
              </p>
              <button
                onClick={() => copyText(pieza.primaryText, "a")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === "a" ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                {copied === "a" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 px-3 py-2.5 rounded-lg border border-border">
              {pieza.primaryText}
            </p>
          </div>

          {/* Headline + descripción — Variante A */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Headline</p>
              <p className="text-sm font-medium text-foreground">{pieza.headline}</p>
              {pieza.headline && (
                <p className={cn("text-[10px] mt-0.5", pieza.headline.length > 40 ? "text-red-500" : "text-muted-foreground")}>
                  {pieza.headline.length}/40 chars
                </p>
              )}
            </div>
            {pieza.descripcion && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-foreground">{pieza.descripcion}</p>
              </div>
            )}
          </div>

          {/* Variante B */}
          {(pieza.varianteB_primaryText || pieza.varianteB_headline) && (
            <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variante B</p>
                {pieza.varianteB_primaryText && (
                  <button
                    onClick={() => copyText(pieza.varianteB_primaryText!, "b")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied === "b" ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    {copied === "b" ? "Copiado" : "Copiar"}
                  </button>
                )}
              </div>
              {pieza.varianteB_primaryText && (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 px-3 py-2.5 rounded-lg border border-border">
                  {pieza.varianteB_primaryText}
                </p>
              )}
              {pieza.varianteB_headline && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Headline B</p>
                  <p className="text-sm font-medium text-foreground">{pieza.varianteB_headline}</p>
                  <p className={cn("text-[10px] mt-0.5", pieza.varianteB_headline.length > 40 ? "text-red-500" : "text-muted-foreground")}>
                    {pieza.varianteB_headline.length}/40 chars
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Image Generation Brief */}
          {pieza.imageBrief && (
            <div className="border border-dashed border-border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Image Generation Brief</p>
                <button
                  onClick={() => copyText(pieza.imageBrief!, "brief")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "brief" ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  {copied === "brief" ? "Copiado" : "Copiar prompt"}
                </button>
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{pieza.imageBrief}</p>
            </div>
          )}

          {/* Justificación */}
          {pieza.justificacion && (
            <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Por qué funciona</p>
              <p className="text-xs text-foreground leading-relaxed">{pieza.justificacion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BriefDashboard({
  data,
  onRegenerate,
  onDownload,
  generatedAt,
  raw,
  campaignId,
}: {
  data: BriefData
  onRegenerate: () => void
  onDownload: () => void
  generatedAt?: Date | null
  raw: string
  campaignId: string
}) {
  return (
    <div className="space-y-4 px-5 pb-5">
      {/* Resumen estratégico */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3 mt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumen estratégico</p>
          <div className="flex items-center gap-2">
            {generatedAt && (
              <span className="text-[11px] text-muted-foreground">
                {new Date(generatedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground">Piezas</p>
            <p className="text-2xl font-bold text-foreground">{data.resumen.totalPiezas}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground">Copys</p>
            <p className="text-2xl font-bold text-foreground">{data.resumen.totalCopys}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
            <p className="text-xs text-foreground leading-relaxed">{data.resumen.objetivo}</p>
          </div>
        </div>

        {data.resumen.insight && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Insight</p>
            <p className="text-sm text-foreground italic leading-relaxed">&ldquo;{data.resumen.insight}&rdquo;</p>
          </div>
        )}

        {data.resumen.estrategia && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Estrategia creativa</p>
            <p className="text-sm text-foreground leading-relaxed">{data.resumen.estrategia}</p>
          </div>
        )}
      </div>

      {/* Piezas */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Piezas ({data.piezas.length})
        </p>
        <div className="space-y-2">
          {data.piezas.map((pieza, i) => (
            <PiezaCard key={pieza.id ?? i} pieza={pieza} index={i} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Link
          href="/board"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <LayoutGridIcon className="w-3.5 h-3.5" />
          Ver piezas en board
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <PrinterIcon className="w-3.5 h-3.5" />
          Exportar PDF
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
          Exportar JSON
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" />
          Regenerar
        </button>
      </div>
    </div>
  )
}

// Legacy Markdown renderer (for old briefs)
function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} className="text-sm font-bold text-foreground mt-4 mb-1 first:mt-0">{line.slice(3)}</h3>
    if (line.startsWith("# ")) return <h2 key={i} className="text-base font-bold text-foreground mt-5 mb-2 first:mt-0">{line.slice(2)}</h2>
    if (line.startsWith("### ")) return <h4 key={i} className="text-xs font-bold text-foreground uppercase tracking-wide mt-3 mb-1">{line.slice(4)}</h4>
    if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="text-sm text-foreground ml-4 list-disc">{line.slice(2)}</li>
    if (line.startsWith("---") || line.startsWith("===")) return <hr key={i} className="border-border my-3" />
    if (line.trim() === "") return <div key={i} className="h-1.5" />
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i} className="text-sm text-foreground leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    )
  })
}

export default function CampaignGenerateSection({
  campaignId,
  campaignName,
  initialBrief,
  generatedAt,
}: {
  campaignId: string
  campaignName: string
  initialBrief?: string | null
  generatedAt?: Date | null
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(initialBrief ? "done" : "idle")
  const [rawOutput, setRawOutput] = useState(initialBrief ?? "")
  const [errorMsg, setErrorMsg] = useState("")
  const [genAt, setGenAt] = useState<Date | null | undefined>(generatedAt)

  useEffect(() => {
    if (initialBrief) {
      setRawOutput(initialBrief)
      setStatus("done")
    }
  }, [initialBrief])

  async function handleGenerate() {
    setStatus("generating")
    setRawOutput("")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/generate`, { method: "POST" })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? "Error al conectar con la API")
        setStatus("error")
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const payload = line.slice(6).trim()
          if (payload === "[DONE]") {
            setRawOutput(accumulated)
            setGenAt(new Date())
            setStatus("done")
            router.refresh()
            break
          }
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) {
              setErrorMsg(parsed.error)
              setStatus("error")
              break
            }
            if (parsed.text) {
              accumulated += parsed.text
            }
          } catch {
            // skip malformed line
          }
        }
      }

      // Use a ref-safe check: if still streaming after loop ends, mark done
      setStatus((prev) => (prev === "error" || prev === "done" ? prev : "done"))
    } catch {
      setErrorMsg("Error de red. Verifica tu conexión.")
      setStatus("error")
    }
  }

  function handleDownload() {
    const blob = new Blob([rawOutput], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brief-${campaignName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const briefData = rawOutput ? parseBriefJson(rawOutput) : null

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Brief creativo IA
          </h2>
          {status === "idle" && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Claude genera guiones, copys y estructura creativa por pieza.
            </p>
          )}
          {status === "generating" && (
            <p className="text-xs text-muted-foreground mt-0.5">Procesando el brief…</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(status === "idle" || status === "error") && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <SparklesIcon className="w-4 h-4" />
              {status === "error" ? "Reintentar" : "Generar"}
            </button>
          )}
          {status === "generating" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="w-4 h-4 animate-spin" />
              Generando…
            </div>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 px-5 py-3 bg-destructive/5 border-b border-destructive/20 text-sm text-destructive">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === "generating" && (
        <div className="px-5 py-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="relative">
            <SparklesIcon className="w-8 h-8 text-primary/20" />
            <Loader2Icon className="w-5 h-5 text-primary animate-spin absolute -bottom-1 -right-1" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Claude está elaborando la estrategia creativa</p>
            <p className="text-xs text-muted-foreground mt-0.5">Generando guiones, copys y justificaciones por pieza…</p>
          </div>
        </div>
      )}

      {status === "done" && briefData && (
        <BriefDashboard
          data={briefData}
          onRegenerate={handleGenerate}
          onDownload={handleDownload}
          generatedAt={genAt}
          raw={rawOutput}
          campaignId={campaignId}
        />
      )}

      {/* Legacy: brief is plain text (not JSON) */}
      {status === "done" && !briefData && rawOutput && (
        <div className="p-5 overflow-auto max-h-[60vh]">
          {renderMarkdown(rawOutput)}
          <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCwIcon className="w-3.5 h-3.5" />
              Regenerar con nuevo formato
            </button>
          </div>
        </div>
      )}

      {status === "idle" && (
        <div className="px-5 py-10 flex flex-col items-center justify-center text-center gap-2">
          <SparklesIcon className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Haz clic en <strong>Generar</strong> para que Claude escriba los guiones y copys de todas las piezas.
          </p>
        </div>
      )}
    </div>
  )
}
