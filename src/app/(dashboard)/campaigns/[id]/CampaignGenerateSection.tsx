"use client"

import { useState, useRef, useEffect } from "react"
import { SparklesIcon, CopyIcon, DownloadIcon, CheckIcon, AlertCircleIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = "idle" | "generating" | "done" | "error"

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
  const [status, setStatus] = useState<Status>(initialBrief ? "done" : "idle")
  const [output, setOutput] = useState(initialBrief ?? "")
  const [errorMsg, setErrorMsg] = useState("")
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialBrief) {
      setOutput(initialBrief)
      setStatus("done")
    }
  }, [initialBrief])

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

  // Render markdown-like output with basic formatting
  function renderOutput(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h3 key={i} className="text-sm font-bold text-foreground mt-4 mb-1 first:mt-0">{line.slice(3)}</h3>
      }
      if (line.startsWith("# ")) {
        return <h2 key={i} className="text-base font-bold text-foreground mt-5 mb-2 first:mt-0">{line.slice(2)}</h2>
      }
      if (line.startsWith("### ")) {
        return <h4 key={i} className="text-xs font-bold text-foreground uppercase tracking-wide mt-3 mb-1">{line.slice(4)}</h4>
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} className="text-sm text-foreground ml-4 list-disc">{line.slice(2)}</li>
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="text-sm font-semibold text-foreground">{line.slice(2, -2)}</p>
      }
      if (line.startsWith("---") || line.startsWith("===")) {
        return <hr key={i} className="border-border my-3" />
      }
      if (line.trim() === "") {
        return <div key={i} className="h-1.5" />
      }
      // Inline bold
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

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Brief creativo IA
          </h2>
          {status === "done" && generatedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Generado el {new Date(generatedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {status === "idle" && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Claude genera guiones, copys y estructura creativa completa.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "idle" || status === "error" ? (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <SparklesIcon className="w-4 h-4" />
              {status === "error" ? "Reintentar" : "Generar"}
            </button>
          ) : status === "generating" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="w-4 h-4 animate-spin" />
              Generando…
            </div>
          ) : (
            <>
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
                title="Regenerar"
              >
                <RefreshCwIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
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
          <div
            ref={outputRef}
            className={cn(
              "p-5 overflow-auto",
              status === "done" ? "max-h-[60vh]" : "max-h-[70vh]"
            )}
          >
            {renderOutput(output)}
            {status === "generating" && (
              <span className="inline-block w-0.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />
            )}
          </div>
          {status === "done" && (
            <div className="px-5 py-2 border-t border-border text-xs text-muted-foreground">
              {output.length.toLocaleString("es-CO")} caracteres
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
        </div>
      )}
    </div>
  )
}
