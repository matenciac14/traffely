import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/config"
import DashboardSidebar from "@/features/dashboard/components/DashboardSidebar"
import DashboardTopbar from "@/features/dashboard/components/DashboardTopbar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect("/login")

  const role = session.user.role ?? ""

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopbar
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          userRole={role}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
