import { auth } from "@/lib/auth/config"
import { UnauthorizedError, ForbiddenError } from "@/lib/utils/errors"
import { UserRole } from "@prisma/client"

export async function getSession() {
  const session = await auth()
  if (!session?.user) throw new UnauthorizedError()
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getSession()
  const role = session.user.role as UserRole
  if (!allowedRoles.includes(role)) throw new ForbiddenError()
  return session
}

export async function requireWorkspaceAccess(workspaceId: string) {
  const session = await getSession()
  if (session.user.workspaceId !== workspaceId && session.user.role !== "SUPER_ADMIN") {
    throw new ForbiddenError()
  }
  return session
}
