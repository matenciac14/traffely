"use client"

import { useEffect, useState } from "react"
import { BellIcon } from "lucide-react"

interface Notification {
  id: string
  title: string
  body: string
  createdAt: string
  pieceId?: string | null
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : [])
      .then(setNotifications)
      .catch(() => {})
  }, [])

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifications([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
      >
        <BellIcon className="w-4 h-4 text-muted-foreground" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-xs font-semibold text-foreground">Notificaciones</span>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">
                  Marcar todas como leídas
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                Sin notificaciones nuevas
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
