import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role?: string
    workspaceId?: string | null
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      workspaceId: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    workspaceId?: string | null
  }
}
