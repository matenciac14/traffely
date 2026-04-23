"use client"

import { signOut } from "next-auth/react"
import { LogOutIcon, ChevronDownIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import NotificationBell from "./NotificationBell"

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Propietario",
  CREATIVO: "Creativo",
  TRAFFICKER: "Trafficker",
  VIEWER: "Viewer",
}

interface Props {
  userName: string
  userEmail: string
  userRole: string
}

export default function DashboardTopbar({ userName, userEmail, userRole }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-end px-6 flex-shrink-0 relative gap-2">
      <NotificationBell />
      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-foreground leading-tight">{userName}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{ROLE_LABELS[userRole] ?? userRole}</p>
          </div>
          <ChevronDownIcon className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-52 bg-card rounded-xl border border-border shadow-lg z-20 py-1">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOutIcon className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
