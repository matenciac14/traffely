"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Email o contraseña incorrectos")
    } else {
      router.push("/campaigns")
      router.refresh()
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
      <h1 className="text-lg font-semibold text-foreground mb-6">Iniciar sesión</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            name="email"
            type="email"
            required
            autoFocus
            placeholder="tu@empresa.com"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Contraseña</label>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
