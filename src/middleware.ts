import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth"]
const SUPER_ADMIN_ROUTES = ["/admin"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  if (isPublic) return NextResponse.next()

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = req.auth.user?.role

  if (SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/campaigns", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
