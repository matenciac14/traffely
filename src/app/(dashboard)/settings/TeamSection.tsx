import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import { RoleSelect, ToggleActive, RemoveMember } from "./TeamActions"
import InviteUserModal from "./InviteUserModal"

const ROLE_BADGE: Record<string, string> = {
  OWNER:      "bg-blue-50 text-blue-700",
  CREATIVO:   "bg-purple-50 text-purple-700",
  TRAFFICKER: "bg-amber-50 text-amber-700",
  VIEWER:     "bg-muted text-muted-foreground",
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ")
  const ini = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].substring(0, 2)
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary uppercase">{ini}</span>
    </div>
  )
}

export default async function TeamSection() {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  const members = await db.user.findMany({
    where: { workspaceId: session.user.workspaceId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const isOwner = ["OWNER", "SUPER_ADMIN"].includes(session.user.role ?? "")

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Equipo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {members.length} miembro{members.length !== 1 ? "s" : ""} en el workspace
          </p>
        </div>
        {isOwner && <InviteUserModal />}
      </div>

      <div className="divide-y divide-border">
        {members.map((m) => {
          const isSelf = m.id === session.user.id
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5",
                !m.isActive && "opacity-50"
              )}
            >
              <Initials name={m.name} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  {isSelf && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">Tú</span>
                  )}
                  {!m.isActive && (
                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Inactivo</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && !isSelf ? (
                  <RoleSelect userId={m.id} currentRole={m.role} />
                ) : (
                  <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", ROLE_BADGE[m.role] ?? ROLE_BADGE.VIEWER)}>
                    {m.role === "OWNER" ? "Propietario" : m.role === "CREATIVO" ? "Creativo" : m.role === "TRAFFICKER" ? "Trafficker" : "Viewer"}
                  </span>
                )}

                {isOwner && !isSelf && m.role !== "OWNER" && (
                  <div className="flex items-center gap-1">
                    <ToggleActive userId={m.id} isActive={m.isActive} />
                    <RemoveMember userId={m.id} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
