"use client"

import { useState, useEffect } from "react"
import { useCampaignWizard } from "../../store/campaign-wizard"
import { generarPromptMaestro } from "../../lib/prompt-generator"
import { CopyIcon, CheckIcon, DownloadIcon } from "lucide-react"

export default function StepPromptOutput() {
  const state = useCampaignWizard()
  const [copied, setCopied] = useState(false)
  const prompt = generarPromptMaestro(state)

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([prompt], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prompt-${state.nombreCampana || "campaña"}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Prompt maestro generado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Copia este prompt y pégalo en Claude o en el modelo de tu preferencia.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-emerald-600" /> : <CopyIcon className="w-4 h-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          Descargar .md
        </button>
        <div className="ml-auto text-xs text-muted-foreground">
          {prompt.length.toLocaleString("es-CO")} caracteres
        </div>
      </div>

      {/* Prompt preview */}
      <div className="relative">
        <pre className="p-5 rounded-xl border border-border bg-card text-xs text-foreground font-mono leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">
          {prompt}
        </pre>
      </div>
    </div>
  )
}
