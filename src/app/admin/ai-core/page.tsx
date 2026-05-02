"use client"

import { useEffect, useState } from "react"
import { SaveIcon, RotateCcwIcon, ChevronDownIcon } from "lucide-react"

interface AiCoreVersion {
  id: string
  version: number
  systemPrompt: string
  createdAt: string
}

interface AiCore {
  id: string | null
  systemPrompt: string
  version: number
  versions: AiCoreVersion[]
  isFallback?: boolean
}

export default function AiCorePage() {
  const [aiCore, setAiCore] = useState<AiCore | null>(null)
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/ai-core")
      .then((r) => r.ok ? r.json() : null)
      .then((data: AiCore | null) => {
        setAiCore(data)
        setDraft(data?.systemPrompt ?? "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!draft.trim() || saving) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/ai-core", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: draft }),
      })
      if (res.ok) {
        const updated: AiCore = await res.json()
        setAiCore(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore(version: number) {
    if (restoringVersion !== null) return
    setRestoringVersion(version)
    try {
      const res = await fetch(`/api/admin/ai-core/versions/${version}/restore`, { method: "POST" })
      if (res.ok) {
        const updated: AiCore = await res.json()
        setAiCore(updated)
        setDraft(updated.systemPrompt)
      }
    } finally {
      setRestoringVersion(null)
    }
  }

  const isDirty = draft !== (aiCore?.systemPrompt ?? "")

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Cargando AI Core…</div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">AI Core</h1>
        <p className="text-sm text-muted-foreground mt-1">
          SYSTEM_PROMPT base del sistema. Aplica a todos los workspaces. No incluir industria ni cliente específico.
        </p>
        {aiCore && !aiCore.isFallback && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Versión actual: <span className="font-mono font-semibold">v{aiCore.version}</span>
          </p>
        )}
        {aiCore?.isFallback && (
          <p className="text-xs text-amber-600 mt-0.5">
            Usando prompt hardcodeado — guarda para crear el primer registro en DB
          </p>
        )}
      </div>

      {/* Editor */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            SYSTEM_PROMPT
          </span>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-emerald-600 font-medium">Guardado ✓</span>
            )}
            {isDirty && !saved && (
              <span className="text-xs text-amber-600">Sin guardar</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
            >
              <SaveIcon className="w-3.5 h-3.5" />
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={16}
          className="w-full px-4 py-4 font-mono text-sm text-foreground bg-card focus:outline-none resize-none"
          placeholder="Eres un copywriter senior y director creativo especializado en publicidad digital para el mercado latinoamericano…"
          spellCheck={false}
        />
        <div className="border-t border-border px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{draft.length} caracteres</span>
          {!aiCore && (
            <span className="text-xs text-amber-600">Sin registro en DB — se creará al guardar</span>
          )}
        </div>
      </div>

      {/* Historial */}
      {aiCore && aiCore.versions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Historial de versiones ({aiCore.versions.length})
          </h2>
          <div className="space-y-2">
            {aiCore.versions.map((v) => (
              <div key={v.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedVersion(expandedVersion === v.version ? null : v.version)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs font-mono font-semibold text-muted-foreground w-8">
                    v{v.version}
                  </span>
                  <span className="text-xs text-muted-foreground flex-1">
                    {new Date(v.createdAt).toLocaleString("es-CO")}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-xs hidden sm:block">
                    {v.systemPrompt.substring(0, 80)}…
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRestore(v.version) }}
                    disabled={restoringVersion !== null}
                    className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    <RotateCcwIcon className="w-3 h-3" />
                    {restoringVersion === v.version ? "Restaurando…" : "Restaurar"}
                  </button>
                  <ChevronDownIcon className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expandedVersion === v.version ? "rotate-180" : ""}`} />
                </button>

                {expandedVersion === v.version && (
                  <div className="border-t border-border px-4 py-3">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {v.systemPrompt}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
