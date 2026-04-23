"use client"

import { useState, useRef } from "react"
import { SparklesIcon, CopyIcon, DownloadIcon, CheckIcon, AlertCircleIcon, Loader2Icon } from "lucide-react"

type Status = "idle" | "generating" | "done" | "error"

export default function CampaignGenerateSection({
  campaignId,
  campaignName,
}: {
  campaignId: string
  campaignName: string
}) {
  const [status, setStatus] = useState<Status>("idle")
  const [output, setOutput] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLPreElement>(null)

  async function handleGenerate() {
    setStatus("generating")
    setOutput("")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? "Error al conectar con la API")
        setStatus("error")
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

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
            setStatus("done")
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
              setOutput((prev) => {
                const next = prev + parsed.text
                // Auto-scroll
                setTimeout(() => {
                  outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" })
                }, 0)
                return next
              })
            }
          } catch {
            // skip malformed line
          }
        }
      }

      if (status !== "error") setStatus("done")
    } catch {
      setErrorMsg("Error de red. Verifica tu conexión.")
      setStatus("error")
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brief-${campaignName}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Generar brief con Claude
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Claude genera los guiones, copys y estructura creativa completa en base al brief.
          </p>
        </div>

        {status === "idle" || status === "error" ? (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <SparklesIcon className="w-4 h-4" />
            {status === "error" ? "Reintentar" : "Generar"}
          </button>
        ) : status === "generating" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            <Loader2Icon className="w-4 h-4 animate-spin" />
            Generando…
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              .md
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Regenerar
            </button>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 px-5 py-3 bg-destructive/5 border-b border-destructive/20 text-sm text-destructive">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {(status === "generating" || status === "done") && output && (
        <div className="relative">
          {status === "generating" && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-card px-2 py-1 rounded-md border border-border z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              En vivo
            </div>
          )}
          <pre
            ref={outputRef}
            className="p-5 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words overflow-auto max-h-[70vh]"
          >
            {output}
            {status === "generating" && (
              <span className="inline-block w-0.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
          {status === "done" && (
            <div className="px-5 py-2 border-t border-border text-xs text-muted-foreground">
              {output.length.toLocaleString("es-CO")} caracteres generados
            </div>
          )}
        </div>
      )}

      {status === "idle" && (
        <div className="px-5 py-10 flex flex-col items-center justify-center text-center gap-2">
          <SparklesIcon className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Haz clic en <strong>Generar</strong> para que Claude escriba los guiones y copys de todas las piezas.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Requiere <code className="font-mono">ANTHROPIC_API_KEY</code> configurada en el servidor.
          </p>
        </div>
      )}
    </div>
  )
}
