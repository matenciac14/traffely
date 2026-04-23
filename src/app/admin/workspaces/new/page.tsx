"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

const PLANS = ["trial", "starter", "pro", "enterprise"]

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/admin/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        country: form.get("country"),
        city: form.get("city"),
        plan: form.get("plan"),
        setupFee: Number(form.get("setupFee") || 0),
        monthlyFee: Number(form.get("monthlyFee") || 0),
        notes: form.get("notes"),
        ownerName: form.get("ownerName"),
        ownerEmail: form.get("ownerEmail"),
        ownerPassword: form.get("ownerPassword"),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Error al crear el cliente")
      return
    }

    router.push(`/admin/workspaces/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Registrar nuevo cliente</h1>
          <p className="text-sm text-muted-foreground">Crea el workspace y el usuario dueño del negocio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Empresa */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Datos de la empresa</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre de la empresa *</label>
              <input name="name" required placeholder="Ej. Serrano Group" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">País</label>
              <input name="country" placeholder="Colombia" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ciudad</label>
              <input name="city" placeholder="Cali" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Plan y billing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</label>
              <select name="plan" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {PLANS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Setup fee (COP)</label>
              <input name="setupFee" type="number" min="0" placeholder="0" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mensualidad (COP)</label>
              <input name="monthlyFee" type="number" min="0" placeholder="0" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas internas</label>
            <textarea name="notes" rows={2} placeholder="Observaciones sobre este cliente..." className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>

        {/* Owner */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Usuario propietario (OWNER)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre *</label>
              <input name="ownerName" required placeholder="Nombre completo" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email *</label>
              <input name="ownerEmail" type="email" required placeholder="email@empresa.com" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contraseña temporal *</label>
              <input name="ownerPassword" type="text" required placeholder="Mínimo 8 caracteres" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground">El cliente deberá cambiarla en su primer acceso.</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Link href="/admin" className="h-10 px-5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Creando…" : "Crear cliente"}
          </button>
        </div>
      </form>
    </div>
  )
}
