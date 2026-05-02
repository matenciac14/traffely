"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const email = form.get("email") as string
    const password = form.get("password") as string
    const workspaceName = form.get("workspaceName") as string

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, workspaceName }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Error al crear cuenta")
      setLoading(false)
      return
    }

    // Auto-login tras registro exitoso
    const login = await signIn("credentials", { email, password, redirect: false })
    if (login?.error) {
      setError("Cuenta creada, pero no se pudo iniciar sesión. Ingresa manualmente.")
      setLoading(false)
      return
    }

    router.push("/campaigns")
    router.refresh()
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Empieza gratis — sin tarjeta de crédito
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Nombre de tu agencia o empresa
          </label>
          <input
            name="workspaceName"
            type="text"
            required
            autoFocus
            placeholder="Ej. Agencia Creativa Norte"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Tu nombre</label>
          <input
            name="name"
            type="text"
            required
            placeholder="María García"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="maria@agencia.com"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Contraseña</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Creando cuenta…" : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
