import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import DashboardSidebar from "@/features/dashboard/components/DashboardSidebar"
import DashboardTopbar from "@/features/dashboard/components/DashboardTopbar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect("/login")
  if (session.user.role !== "SUPER_ADMIN") redirect("/campaigns")

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar role={session.user.role ?? ""} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopbar
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          userRole={session.user.role ?? ""}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
