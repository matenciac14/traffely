import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"

export default async function RootPage() {
  const session = await auth()
  if (session?.user?.role === "SUPER_ADMIN") redirect("/admin")
  redirect("/campaigns")
}
