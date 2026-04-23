import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db/prisma"
import { KanbanIcon } from "lucide-react"
import BoardKanban from "./BoardKanban"

export default async function BoardPage() {
  const session = await auth()
  if (!session?.user?.workspaceId) redirect("/login")

  const role = session.user.role ?? "VIEWER"

  const [pieces, members] = await Promise.all([
    db.piece.findMany({
      where: { adSet: { campaign: { workspaceId: session.user.workspaceId } } },
      select: {
        id: true,
        modelo: true,
        tipoPieza: true,
        formato: true,
        taskStatus: true,
        estado: true,
        adSet: {
          select: {
            nombre: true,
            campaign: { select: { id: true, name: true } },
          },
        },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { orden: "asc" },
    }),
    db.user.findMany({
      where: { workspaceId: session.user.workspaceId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ])

  // CREATIVO: solo sus piezas asignadas
  const visiblePieces = role === "CREATIVO"
    ? pieces.filter((p) => p.assignee?.id === session.user.id)
    : pieces

  if (visiblePieces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center px-8">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <KanbanIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-1">
          {role === "CREATIVO" ? "Sin piezas asignadas" : "Board vacío"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {role === "CREATIVO"
            ? "Cuando te asignen una pieza aparecerá aquí."
            : "Las piezas aparecerán aquí cuando se genere el brief de una campaña."}
        </p>
      </div>
    )
  }

  return (
    <BoardKanban
      pieces={visiblePieces}
      members={members}
      currentUserId={session.user.id!}
      currentUserRole={role}
    />
  )
}
