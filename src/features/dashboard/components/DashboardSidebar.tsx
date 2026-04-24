"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MegaphoneIcon, KanbanIcon, SettingsIcon,
  LayoutDashboardIcon, BuildingIcon, BrainCircuitIcon, MapIcon, BookOpenIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean }

const CLIENT_NAV: NavItem[] = [
  { href: "/empresas", label: "Empresas", icon: BuildingIcon },
  { href: "/campaigns", label: "Campañas", icon: MegaphoneIcon },
  { href: "/board", label: "Board", icon: KanbanIcon },
  { href: "/settings", label: "Configuración", icon: SettingsIcon },
  { href: "/help", label: "Ayuda", icon: BookOpenIcon },
]

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/workspaces", label: "Empresas", icon: BuildingIcon },
  { href: "/admin/roadmap", label: "Roadmap", icon: MapIcon },
  { href: "/admin/ai-usage", label: "Uso de IA", icon: BrainCircuitIcon },
]

interface Props {
  role: string
}

export default function DashboardSidebar({ role }: Props) {
  const pathname = usePathname()
  const isSuperAdmin = role === "SUPER_ADMIN"
  const nav = isSuperAdmin ? ADMIN_NAV : CLIENT_NAV

  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <p className="text-base font-bold text-sidebar-foreground tracking-tight">Traffely</p>
        <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 uppercase tracking-widest">
          {isSuperAdmin ? "SaaS Admin" : "Campaign OS"}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/25 text-center uppercase tracking-widest">
          v0.1.0 · beta
        </p>
      </div>
    </aside>
  )
}
